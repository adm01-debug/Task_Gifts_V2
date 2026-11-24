/**
 * Verificação server-side de asserções WebAuthn (login por passkey).
 *
 * Por que existe
 * --------------
 * O login por biometria era decidido inteiramente no cliente: bastava achar a
 * credencial em `webauthn_credentials` e o código devolvia `success` — sem
 * conferir a assinatura, o challenge, a origem ou o RP ID. Quem conseguisse
 * injetar JS na página (ou usar um dispositivo com a credencial registrada)
 * passava pelo fluxo sem prova criptográfica nenhuma.
 *
 * Este módulo concentra a parte pura e determinística da checagem, para ser
 * testado isoladamente (ver `webauthn_test.ts`). Nada aqui depende de Deno:
 * usa somente WebCrypto.
 */

export interface ParsedClientData {
  type: string;
  challenge: string;
  origin: string;
}

export interface ParsedAuthenticatorData {
  rpIdHash: Uint8Array;
  userPresent: boolean;
  userVerified: boolean;
  counter: number;
}

export type AssertionFailure =
  | "payload_malformado"
  | "client_data_invalido"
  | "tipo_invalido"
  | "challenge_invalido"
  | "origem_nao_permitida"
  | "authenticator_data_invalido"
  | "rp_id_invalido"
  | "usuario_nao_presente"
  | "verificacao_do_usuario_ausente"
  | "chave_publica_invalida"
  | "assinatura_invalida";

export type AssertionCheck = { ok: true; counter: number } | { ok: false; reason: AssertionFailure };

export interface AssertionVerificationInput {
  /** `clientDataJSON` cru, como veio do autenticador. */
  clientDataJSON: Uint8Array;
  /** `authenticatorData` cru. */
  authenticatorData: Uint8Array;
  /** Assinatura (DER no caso de ES256, PKCS#1 v1.5 no caso de RS256). */
  signature: Uint8Array;
  /** Chave pública da credencial, codificada em SPKI DER. */
  publicKeySpki: Uint8Array;
  /** Challenge que o servidor emitiu e guardou. */
  expectedChallenge: string;
  /** RP ID esperado (domínio para o qual a credencial foi registrada). */
  rpId: string;
  /** Restrição adicional de origem; vazio significa "apenas o rpId manda". */
  allowedOrigins?: string[];
  /** Exige a flag de verificação do usuário (biometria/PIN). Padrão: true. */
  requireUserVerification?: boolean;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/** Codifica bytes em base64url sem padding, formato usado pelo WebAuthn. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

/** Decodifica base64url (com ou sem padding). Lança em entrada inválida. */
export function base64UrlToBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  const binary = atob(normalized + "=".repeat(padding));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * Copia para um `ArrayBuffer` próprio. O WebCrypto do Deno tipa `BufferSource`
 * como `ArrayBufferView<ArrayBuffer>`, então um `Uint8Array` genérico não passa
 * no type check; a cópia também evita depender do buffer de origem.
 */
function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", asBufferSource(data)));
}

/** Comparação sem vazamento de tempo (tamanho e conteúdo). */
export function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function timingSafeStringEquals(a: string, b: string): boolean {
  return constantTimeEquals(textEncoder.encode(a), textEncoder.encode(b));
}

export function parseClientDataJSON(bytes: Uint8Array): ParsedClientData | null {
  try {
    const parsed = JSON.parse(textDecoder.decode(bytes)) as Partial<ParsedClientData>;
    if (
      typeof parsed?.type !== "string" ||
      typeof parsed?.challenge !== "string" ||
      typeof parsed?.origin !== "string"
    ) {
      return null;
    }
    return { type: parsed.type, challenge: parsed.challenge, origin: parsed.origin };
  } catch {
    return null;
  }
}

/**
 * Layout: rpIdHash(32) | flags(1) | signCount(4) | ...
 * flags: bit0 = user present, bit2 = user verified.
 */
export function parseAuthenticatorData(bytes: Uint8Array): ParsedAuthenticatorData | null {
  if (bytes.length < 37) return null;
  const flags = bytes[32];
  return {
    rpIdHash: bytes.slice(0, 32),
    userPresent: (flags & 0x01) !== 0,
    userVerified: (flags & 0x04) !== 0,
    counter: new DataView(bytes.buffer, bytes.byteOffset + 33, 4).getUint32(0, false),
  };
}

/** Normaliza um inteiro DER para largura fixa (32 bytes no P-256). */
function normaliseInteger(bytes: Uint8Array, size: number): Uint8Array | null {
  let value = bytes;
  while (value.length > 1 && value[0] === 0) value = value.slice(1);
  if (value.length > size) return null;
  const out = new Uint8Array(size);
  out.set(value, size - value.length);
  return out;
}

/**
 * Converte a assinatura ECDSA de DER (formato que o autenticador entrega) para
 * o formato cru `r || s` (formato que o WebCrypto exige). Sem isso, toda
 * assinatura ES256 válida seria rejeitada.
 */
export function derToRawEcdsaSignature(der: Uint8Array): Uint8Array | null {
  if (der.length < 8 || der[0] !== 0x30 || der[1] === 0x00) return null;

  let offset = 2;
  if ((der[1] & 0x80) !== 0) {
    const lengthBytes = der[1] & 0x7f;
    if (lengthBytes > 2 || der.length < 2 + lengthBytes) return null;
    offset = 2 + lengthBytes;
  }
  if (der[offset] !== 0x02 || der.length < offset + 2) return null;

  const rLength = der[offset + 1];
  const r = der.slice(offset + 2, offset + 2 + rLength);
  const sOffset = offset + 2 + rLength;
  if (r.length !== rLength || der[sOffset] !== 0x02 || der.length < sOffset + 2) return null;

  const sLength = der[sOffset + 1];
  const s = der.slice(sOffset + 2, sOffset + 2 + sLength);
  if (s.length !== sLength) return null;

  const rawR = normaliseInteger(r, 32);
  const rawS = normaliseInteger(s, 32);
  if (!rawR || !rawS) return null;

  const raw = new Uint8Array(64);
  raw.set(rawR, 0);
  raw.set(rawS, 32);
  return raw;
}

type ImportedKey = { algorithm: "ecdsa" | "rsa"; key: CryptoKey | null };

async function importPublicKey(spki: Uint8Array): Promise<ImportedKey> {
  try {
    const key = await crypto.subtle.importKey(
      "spki",
      asBufferSource(spki),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    return { algorithm: "ecdsa", key };
  } catch {
    // Registro também aceita RS256 (alg -257); a chave decide o algoritmo.
  }

  try {
    const key = await crypto.subtle.importKey(
      "spki",
      asBufferSource(spki),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    return { algorithm: "rsa", key };
  } catch {
    return { algorithm: "ecdsa", key: null };
  }
}

/**
 * Verifica a assinatura sobre `authenticatorData || SHA-256(clientDataJSON)` —
 * exatamente o blob assinado pelo autenticador na especificação.
 */
export async function verifyAssertionSignature(input: {
  publicKeySpki: Uint8Array;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signature: Uint8Array;
}): Promise<boolean> {
  const { algorithm, key } = await importPublicKey(input.publicKeySpki);
  if (!key) return false;

  const signed = new Uint8Array(input.authenticatorData.length + 32);
  signed.set(input.authenticatorData, 0);
  signed.set(await sha256(input.clientDataJSON), input.authenticatorData.length);

  try {
    if (algorithm === "ecdsa") {
      const raw = derToRawEcdsaSignature(input.signature);
      if (!raw) return false;
      return await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        key,
        asBufferSource(raw),
        asBufferSource(signed),
      );
    }
    return await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      asBufferSource(input.signature),
      asBufferSource(signed),
    );
  } catch {
    return false;
  }
}

function matchesAllowedOrigin(origin: string, allowed: string): boolean {
  if (!allowed.includes("*")) return origin === allowed;
  // Curinga apenas em rótulo de host: `https://*.exemplo.com` não casa com
  // `https://a.b.exemplo.com` nem com outro esquema/porta.
  const pattern = `^${allowed.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+")}$`;
  return new RegExp(pattern).test(origin);
}

export function isOriginAllowed(origin: string, rpId: string, allowedOrigins: string[] = []): boolean {
  let host: string;
  try {
    host = new URL(origin).hostname.toLowerCase();
  } catch {
    return false;
  }

  // O vínculo criptográfico é com o RP ID (rpIdHash assinado pelo autenticador);
  // exigir o mesmo host impede que a asserção seja usada em outro domínio.
  if (host !== rpId.toLowerCase()) return false;

  const list = allowedOrigins.map((item) => item.trim().toLowerCase()).filter(Boolean);
  if (list.length === 0) return true;
  const target = origin.toLowerCase();
  return list.some((allowed) => matchesAllowedOrigin(target, allowed));
}

/** Só vale a checagem de contador quando o autenticador incrementa (≠ 0). */
export function isCounterAcceptable(storedCounter: number, receivedCounter: number): boolean {
  if (receivedCounter === 0) return true;
  return receivedCounter > storedCounter;
}

/** Checagem completa de uma asserção de autenticação. */
export async function verifyAssertion(input: AssertionVerificationInput): Promise<AssertionCheck> {
  const clientData = parseClientDataJSON(input.clientDataJSON);
  if (!clientData) return { ok: false, reason: "client_data_invalido" };
  if (clientData.type !== "webauthn.get") return { ok: false, reason: "tipo_invalido" };
  if (!timingSafeStringEquals(clientData.challenge, input.expectedChallenge)) {
    return { ok: false, reason: "challenge_invalido" };
  }
  if (!isOriginAllowed(clientData.origin, input.rpId, input.allowedOrigins)) {
    return { ok: false, reason: "origem_nao_permitida" };
  }

  const authData = parseAuthenticatorData(input.authenticatorData);
  if (!authData) return { ok: false, reason: "authenticator_data_invalido" };

  const expectedRpIdHash = await sha256(textEncoder.encode(input.rpId));
  if (!constantTimeEquals(authData.rpIdHash, expectedRpIdHash)) {
    return { ok: false, reason: "rp_id_invalido" };
  }
  if (!authData.userPresent) return { ok: false, reason: "usuario_nao_presente" };
  if (input.requireUserVerification !== false && !authData.userVerified) {
    return { ok: false, reason: "verificacao_do_usuario_ausente" };
  }

  const signatureOk = await verifyAssertionSignature({
    publicKeySpki: input.publicKeySpki,
    authenticatorData: input.authenticatorData,
    clientDataJSON: input.clientDataJSON,
    signature: input.signature,
  });
  if (!signatureOk) return { ok: false, reason: "assinatura_invalida" };

  return { ok: true, counter: authData.counter };
}