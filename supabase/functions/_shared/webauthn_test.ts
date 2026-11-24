// Testes Deno da verificação de asserção WebAuthn. Rodam no CI pelo workflow deno.yml
// ("Tipos e testes das Edge Functions"); local: `bun run test:edge`.
// O par de chaves é gerado em runtime pelo WebCrypto, então nenhum segredo entra no repo.
import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  derToRawEcdsaSignature,
  isCounterAcceptable,
  isOriginAllowed,
  parseAuthenticatorData,
  verifyAssertion,
} from "./webauthn.ts";

const RP_ID = "app.exemplo.com";
const ORIGIN = `https://${RP_ID}`;
const CHALLENGE = "Y2hhbGxlbmdlLWRlLXRlc3RlLTEyMzQ1Njc4OTA";

const encoder = new TextEncoder();

interface CredentialFixture {
  publicKeySpki: Uint8Array;
  authenticatorData: Uint8Array;
  clientDataJSON: Uint8Array;
  signature: Uint8Array;
}

function asBufferSource(bytes: Uint8Array): ArrayBuffer {
  const copy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(copy).set(bytes);
  return copy;
}

async function sha256Bytes(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", asBufferSource(data)));
}

function buildClientDataJSON(overrides: { challenge?: string; origin?: string; type?: string } = {}) {
  return encoder.encode(
    JSON.stringify({
      type: overrides.type ?? "webauthn.get",
      challenge: overrides.challenge ?? CHALLENGE,
      origin: overrides.origin ?? ORIGIN,
      crossOrigin: false,
    }),
  );
}

function buildAuthenticatorData(options: {
  rpId?: string;
  counter?: number;
  userPresent?: boolean;
  userVerified?: boolean;
} = {}): Promise<Uint8Array> {
  return (async () => {
    const rpIdHash = await sha256Bytes(encoder.encode(options.rpId ?? RP_ID));
    let flags = 0;
    if (options.userPresent !== false) flags |= 0x01;
    if (options.userVerified !== false) flags |= 0x04;
    const data = new Uint8Array(37);
    data.set(rpIdHash, 0);
    data[32] = flags;
    new DataView(data.buffer).setUint32(33, options.counter ?? 7, false);
    return data;
  })();
}

/** Converte o `r || s` que o WebCrypto devolve para DER (formato do autenticador). */
function rawToDer(raw: Uint8Array): Uint8Array {
  const encodeInteger = (bytes: Uint8Array) => {
    let value = bytes;
    while (value.length > 1 && value[0] === 0) value = value.slice(1);
    if ((value[0] & 0x80) !== 0) value = new Uint8Array([0, ...value]);
    return new Uint8Array([0x02, value.length, ...value]);
  };
  const body = new Uint8Array([...encodeInteger(raw.slice(0, 32)), ...encodeInteger(raw.slice(32, 64))]);
  return new Uint8Array([0x30, body.length, ...body]);
}

async function signPayload(
  privateKey: CryptoKey,
  algorithm: EcdsaParams | "RSASSA-PKCS1-v1_5",
  authenticatorData: Uint8Array,
  clientDataJSON: Uint8Array,
  toDer: boolean,
): Promise<Uint8Array> {
  const signed = new Uint8Array(authenticatorData.length + 32);
  signed.set(authenticatorData, 0);
  signed.set(await sha256Bytes(clientDataJSON), authenticatorData.length);
  const raw = new Uint8Array(await crypto.subtle.sign(algorithm, privateKey, asBufferSource(signed)));
  return toDer ? rawToDer(raw) : raw;
}

async function es256Fixture(overrides: {
  rpId?: string;
  counter?: number;
  userPresent?: boolean;
  userVerified?: boolean;
  clientData?: { challenge?: string; origin?: string; type?: string };
} = {}): Promise<CredentialFixture> {
  const keyPair = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, [
    "sign",
    "verify",
  ]);
  const publicKeySpki = new Uint8Array(await crypto.subtle.exportKey("spki", keyPair.publicKey));
  const clientDataJSON = buildClientDataJSON(overrides.clientData);
  const authenticatorData = await buildAuthenticatorData(overrides);
  const signature = await signPayload(
    keyPair.privateKey,
    { name: "ECDSA", hash: "SHA-256" },
    authenticatorData,
    clientDataJSON,
    true,
  );
  return { publicKeySpki, authenticatorData, clientDataJSON, signature };
}

function verify(fixture: CredentialFixture, extra: Record<string, unknown> = {}) {
  return verifyAssertion({
    clientDataJSON: fixture.clientDataJSON,
    authenticatorData: fixture.authenticatorData,
    signature: fixture.signature,
    publicKeySpki: fixture.publicKeySpki,
    expectedChallenge: CHALLENGE,
    rpId: RP_ID,
    ...extra,
  });
}

Deno.test("base64url preserva os bytes em ida e volta", () => {
  const bytes = new Uint8Array([0, 1, 250, 251, 252, 253, 254, 255]);
  assertEquals(Array.from(base64UrlToBytes(bytesToBase64Url(bytes))), Array.from(bytes));
});

Deno.test("base64url aceita entrada com padding", () => {
  assertEquals(bytesToBase64Url(base64UrlToBytes("YWJj")), "YWJj");
  assertEquals(bytesToBase64Url(base64UrlToBytes("YWI=")), "YWI");
});

Deno.test("parseAuthenticatorData extrai flags e contador", async () => {
  const parsed = parseAuthenticatorData(
    await buildAuthenticatorData({ counter: 4294967295, userPresent: true, userVerified: false }),
  );
  assertExists(parsed);
  assertEquals(parsed.userPresent, true);
  assertEquals(parsed.userVerified, false);
  assertEquals(parsed.counter, 4294967295);
});

Deno.test("parseAuthenticatorData rejeita buffer curto", () => {
  assertEquals(parseAuthenticatorData(new Uint8Array(36)), null);
});

Deno.test("derToRawEcdsaSignature normaliza inteiros com padding", () => {
  const r = new Uint8Array(32).fill(0x11);
  const s = new Uint8Array(32).fill(0x22);
  const raw = new Uint8Array([...r, ...s]);
  const der = rawToDer(raw);
  const back = derToRawEcdsaSignature(der);
  assertExists(back);
  assertEquals(Array.from(back), Array.from(raw));
});

Deno.test("derToRawEcdsaSignature rejeita DER malformado", () => {
  assertEquals(derToRawEcdsaSignature(new Uint8Array([0x31, 0x00])), null);
  assertEquals(derToRawEcdsaSignature(new Uint8Array([0x30, 0xff])), null);
});

Deno.test("isCounterAcceptable aceita incremento e rejeita replay", () => {
  assertEquals(isCounterAcceptable(3, 4), true);
  assertEquals(isCounterAcceptable(3, 3), false);
  assertEquals(isCounterAcceptable(3, 2), false);
  assertEquals(isCounterAcceptable(0, 0), true);
});

Deno.test("isOriginAllowed exige o host do RP ID", () => {
  assertEquals(isOriginAllowed(ORIGIN, RP_ID), true);
  assertEquals(isOriginAllowed("https://malicioso.com", RP_ID), false);
  assertEquals(isOriginAllowed("https://sub.app.exemplo.com", RP_ID), false);
  assertEquals(isOriginAllowed(ORIGIN, RP_ID, ["https://outro.com"]), false);
  assertEquals(isOriginAllowed(ORIGIN, RP_ID, [ORIGIN]), true);
  assertEquals(isOriginAllowed(ORIGIN, RP_ID, ["https://*.exemplo.com"]), true);
  assertEquals(isOriginAllowed(ORIGIN, RP_ID, ["https://*.outro.com"]), false);
  assertEquals(isOriginAllowed("https://a.b.exemplo.com", "a.b.exemplo.com", ["https://*.exemplo.com"]), false);
  assertEquals(isOriginAllowed("https://preview.exemplo.com", "preview.exemplo.com", ["https://*.exemplo.com"]), true);
});

Deno.test("aceita asserção ES256 válida", async () => {
  const result = await verify(await es256Fixture());
  assertEquals(result, { ok: true, counter: 7 });
});

Deno.test("aceita asserção ES256 de contador zero (autenticador sem contador)", async () => {
  const result = await verify(await es256Fixture({ counter: 0 }));
  assertEquals(result, { ok: true, counter: 0 });
});

Deno.test("aceita asserção RS256 válida", async () => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const clientDataJSON = buildClientDataJSON();
  const authenticatorData = await buildAuthenticatorData();
  const signature = await signPayload(
    keyPair.privateKey,
    "RSASSA-PKCS1-v1_5",
    authenticatorData,
    clientDataJSON,
    false,
  );
  const result = await verify({
    publicKeySpki: new Uint8Array(await crypto.subtle.exportKey("spki", keyPair.publicKey)),
    authenticatorData,
    clientDataJSON,
    signature,
  });
  assertEquals(result, { ok: true, counter: 7 });
});

Deno.test("rejeita assinatura alterada", async () => {
  const fixture = await es256Fixture();
  fixture.signature[10] ^= 0xff;
  assertEquals(await verify(fixture), { ok: false, reason: "assinatura_invalida" });
});

Deno.test("rejeita chave pública de outra credencial", async () => {
  const fixture = await es256Fixture();
  const impostor = await es256Fixture();
  assertEquals(await verify({ ...fixture, publicKeySpki: impostor.publicKeySpki }), {
    ok: false,
    reason: "assinatura_invalida",
  });
});

Deno.test("rejeita chave pública corrompida", async () => {
  const fixture = await es256Fixture();
  assertEquals(await verify({ ...fixture, publicKeySpki: new Uint8Array([1, 2, 3]) }), {
    ok: false,
    reason: "assinatura_invalida",
  });
});

Deno.test("rejeita challenge que não é o emitido", async () => {
  const fixture = await es256Fixture({ clientData: { challenge: "b3V0cm8tY2hhbGxlbmdl" } });
  assertEquals(await verify(fixture), { ok: false, reason: "challenge_invalido" });
});

Deno.test("rejeita origem de outro domínio", async () => {
  const fixture = await es256Fixture({ clientData: { origin: "https://malicioso.com" } });
  assertEquals(await verify(fixture), { ok: false, reason: "origem_nao_permitida" });
});

Deno.test("rejeita tipo diferente de webauthn.get", async () => {
  const fixture = await es256Fixture({ clientData: { type: "webauthn.create" } });
  assertEquals(await verify(fixture), { ok: false, reason: "tipo_invalido" });
});

Deno.test("rejeita asserção para outro RP ID", async () => {
  const fixture = await es256Fixture({ rpId: "outro.exemplo.com" });
  assertEquals(await verify(fixture), { ok: false, reason: "rp_id_invalido" });
});

Deno.test("rejeita quando a flag de verificação do usuário está ausente", async () => {
  const fixture = await es256Fixture({ userVerified: false });
  assertEquals(await verify(fixture), { ok: false, reason: "verificacao_do_usuario_ausente" });
});

Deno.test("aceita sem verificação do usuário quando não é exigida", async () => {
  const fixture = await es256Fixture({ userVerified: false });
  const result = await verify(fixture, { requireUserVerification: false });
  assertEquals(result.ok, true);
});

Deno.test("rejeita quando o usuário não está presente", async () => {
  const fixture = await es256Fixture({ userPresent: false });
  assertEquals(await verify(fixture), { ok: false, reason: "usuario_nao_presente" });
});

Deno.test("rejeita authenticatorData truncado", async () => {
  const fixture = await es256Fixture();
  assertEquals(await verify({ ...fixture, authenticatorData: fixture.authenticatorData.slice(0, 20) }), {
    ok: false,
    reason: "authenticator_data_invalido",
  });
});

Deno.test("rejeita clientDataJSON malformado", async () => {
  const fixture = await es256Fixture();
  assertEquals(await verify({ ...fixture, clientDataJSON: encoder.encode("nao-e-json") }), {
    ok: false,
    reason: "client_data_invalido",
  });
});

Deno.test("rejeita clientDataJSON sem os campos obrigatórios", async () => {
  const fixture = await es256Fixture();
  assertEquals(await verify({ ...fixture, clientDataJSON: encoder.encode('{"type":"webauthn.get"}') }), {
    ok: false,
    reason: "client_data_invalido",
  });
});