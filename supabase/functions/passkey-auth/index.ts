/**
 * passkey-auth — login por passkey/biometria com verificação server-side.
 *
 * Antes: o cliente gerava o próprio challenge, lia a credencial e devolvia
 * `success` sem checar assinatura. Aqui o servidor emite o challenge, guarda-o
 * com validade curta, verifica a asserção (assinatura ES256/RS256, RP ID,
 * origem, flags e contador) e só então emite sessão.
 *
 * Fluxo:
 *   1. `{action:"options"}`  -> challenge + rpId (+ allowCredentials se veio email)
 *   2. `navigator.credentials.get(...)` no navegador (biometria/PIN)
 *   3. `{action:"verify"}`   -> valida a asserção e devolve `tokenHash`
 *   4. cliente chama `supabase.auth.verifyOtp({ token_hash, type: "magiclink" })`
 *
 * O tokenHash nunca é logado. O challenge é de uso único (consumido no verify).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { errorResponse, getCorsHeaders, HttpError } from "../_shared/security.ts";
import { checkRateLimit } from "../_shared/rate-limit.ts";
import { resolveClientIp } from "../_shared/clientIp.ts";
import {
  passkeyAuthContract,
  type PasskeyAuthRequest,
} from "../_shared/contracts/passkey-auth.ts";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  isCounterAcceptable,
  verifyAssertion,
} from "../_shared/webauthn.ts";
import {
  buildValidationError,
  validationErrorResponse,
  type ValidationError,
} from "../_shared/validation.ts";

const MAX_BODY_BYTES = 16 * 1024;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
/** Tentativas por credencial/minuto — o IP sozinho é forjável (ver `ipKey`). */
const VERIFY_LIMIT_PER_CREDENTIAL = 15;

/**
 * Falha de validação no formato único das edge functions (HTTP 422, ver
 * `_shared/contracts/README.md`): `{ error, code, message, fields }`. É lançada
 * no meio da leitura e convertida em resposta no `catch` do handler, para o
 * caminho de erro não precisar de `Request` nem de CORS em cada ponto.
 */
class ValidationHttpError extends Error {
  readonly body: ValidationError;

  constructor(body: ValidationError) {
    super(body.message);
    this.name = "ValidationHttpError";
    this.body = body;
  }
}

function jsonResponse(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...(req ? getCorsHeaders(req) : {}), "Content-Type": "application/json" },
  });
}

function requiredString(value: unknown, field: string, maxLength = 8192): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(400, `${field} ausente`, `Campo ${field} é obrigatório`);
  }
  if (value.length > maxLength) {
    throw new HttpError(400, `${field} muito longo`, `Campo ${field} é inválido`);
  }
  return value.trim();
}

function allowedOrigins(): string[] {
  return (Deno.env.get("WEBAUTHN_ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function originMatches(origin: string, pattern: string): boolean {
  if (!pattern.includes("*")) return origin === pattern;
  const regex = `^${pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^.]+")}$`;
  return new RegExp(regex).test(origin);
}

/**
 * RP ID = domínio para o qual a credencial foi registrada (`rp.id` no
 * registro). Derivar da request sem validar permitiria validar asserções para
 * um domínio escolhido pelo atacante, então preferimos o secret
 * `WEBAUTHN_RP_ID` e só caímos para o host da origem quando essa origem está
 * na lista permitida.
 */
function resolveRpId(headers: Headers): string {
  const configured = (Deno.env.get("WEBAUTHN_RP_ID") ?? "").trim().toLowerCase();
  if (configured) return configured;

  const originHeader = headers.get("origin") ?? headers.get("referer") ?? "";
  let host = "";
  try {
    host = new URL(originHeader).hostname.toLowerCase();
  } catch {
    throw new HttpError(400, "Origin ausente", "Origem da requisição não identificada");
  }
  if (!host) throw new HttpError(400, "Origin ausente", "Origem da requisição não identificada");

  const list = allowedOrigins();
  if (list.length > 0 && !list.some((item) => originMatches(originHeader.toLowerCase(), item))) {
    throw new HttpError(403, "Origem não permitida", "Origem não permitida");
  }
  return host;
}

/**
 * Lê o corpo respeitando o teto ANTES de materializá-lo: `req.text()` só
 * detectaria o excesso depois de o corpo inteiro já estar na memória. O
 * `Content-Length` declarado corta o caso comum e o leitor aborta no limite
 * quando o header vem ausente ou mentiroso.
 */
async function readBodyCapped(req: Request, maxBytes: number): Promise<string> {
  const reader = req.body?.getReader();
  if (!reader) return "";

  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      throw new HttpError(413, "Corpo muito grande", "Requisição inválida");
    }
    chunks.push(value);
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

async function readJsonBody(req: Request): Promise<unknown> {
  const declared = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new HttpError(413, "Corpo muito grande", "Requisição inválida");
  }

  const raw = await readBodyCapped(req, MAX_BODY_BYTES);
  try {
    // A forma do corpo (objeto, campos, obrigatórios no `verify`) é decidida
    // pelo contrato; aqui separamos só "não é JSON", que é o `INVALID_JSON` do
    // formato único — inclusive corpo vazio, porque `bodyRequired: true`.
    return JSON.parse(raw);
  } catch {
    throw new ValidationHttpError(buildValidationError({ code: "INVALID_JSON" }));
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405, req);
  }

  try {
    const client = resolveClientIp(req);
    // Só `cf-connecting-ip` (sobrescrito pelo proxy) alimenta o limite por IP.
    // Sem ele todos os chamadores caem no mesmo balde, em vez de cada header
    // forjado abrir um balde novo.
    const ipKey = client.trusted && client.ip ? client.ip : "ip-nao-confiavel";

    const payload = await readJsonBody(req);
    const validated = passkeyAuthContract.validate?.(payload);
    if (!validated?.ok) {
      const invalid = validated?.error ?? buildValidationError({ code: "VALIDATION_ERROR" });
      console.warn("[passkey-auth] payload rejeitado", invalid.code);
      return validationErrorResponse(invalid, getCorsHeaders(req));
    }
    const body = validated.data as PasskeyAuthRequest;
    const action = body.action;

    const limit = action === "options" ? { max: 20, window: 60 } : { max: 10, window: 60 };
    const rate = await checkRateLimit(`passkey-auth:${action}:${ipKey}`, limit.max, limit.window);
    if (!rate.success) {
      return jsonResponse({ ok: false, error: "rate_limited" }, 429, req);
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });
    const rpId = resolveRpId(req.headers);
    const origins = allowedOrigins();
    // Best effort: mantém a tabela de challenges pequena.
    await admin.from("webauthn_challenges").delete().lt("expires_at", new Date().toISOString());

    if (action === "options") {
      const email = body.email ?? "";
      let allowCredentials: { id: string; type: "public-key" }[] = [];
      let ownerId: string | null = null;

      if (email) {
        // E-mail desconhecido apenas não restringe credenciais; não revelamos
        // existência de conta e o verify falha depois.
        const { data: passkeys } = await admin.rpc("get_passkeys_by_email", { p_email: email });
        allowCredentials = ((passkeys ?? []) as { credential_id: string }[]).map((row) => ({
          id: row.credential_id,
          type: "public-key" as const,
        }));

        // Com e-mail informado, o challenge fica amarrado ao dono daquele
        // e-mail (quando existe): o verify recusa a passkey de outra conta em
        // vez de logar silenciosamente na conta errada.
        const { data: profileRows } = await admin
          .from("profiles")
          .select("id, email")
          .ilike("email", email)
          .limit(5);
        // Comparação exata em JS: `ilike` trata `%`/`_` como curinga e um
        // e-mail com curinga não pode "pescar" o dono de outra conta.
        const ownerIds = new Set(
          ((profileRows ?? []) as { id: string; email: string | null }[])
            .filter((row) => (row.email ?? "").trim().toLowerCase() === email.toLowerCase())
            .map((row) => String(row.id)),
        );
        if (ownerIds.size === 1) ownerId = [...ownerIds][0];
      }

      const challenge = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const { error: insertError } = await admin.from("webauthn_challenges").insert({
        user_id: ownerId,
        challenge,
        type: "authentication",
        expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
      });
      if (insertError) {
        console.error("[passkey-auth] falha ao gravar challenge", insertError.message);
        throw new HttpError(500, "challenge insert failed", "Não foi possível iniciar o login");
      }

      return jsonResponse(
        {
          ok: true,
          challenge,
          rpId,
          allowCredentials,
          timeout: 60_000,
          userVerification: "required",
        },
        200,
        req,
      );
    }

    // ── verify ──────────────────────────────────────────────────────────────
    const credentialId = requiredString(body.credentialId, "credentialId", 2048);
    const clientDataJSON = requiredString(body.clientDataJSON, "clientDataJSON");
    const authenticatorData = requiredString(body.authenticatorData, "authenticatorData");
    const signature = requiredString(body.signature, "signature");

    // Limite por credencial além do limite por IP: o IP vem de header e é
    // forjável, a credencial que o atacante quer quebrar não é.
    const credentialRate = await checkRateLimit(
      `passkey-auth:verify:cred:${credentialId}`,
      VERIFY_LIMIT_PER_CREDENTIAL,
      60,
    );
    if (!credentialRate.success) {
      return jsonResponse({ ok: false, error: "rate_limited" }, 429, req);
    }

    let clientDataBytes: Uint8Array;
    let receivedChallenge = "";
    try {
      clientDataBytes = base64UrlToBytes(clientDataJSON);
      receivedChallenge = String(JSON.parse(new TextDecoder().decode(clientDataBytes)).challenge ?? "");
    } catch {
      return jsonResponse({ ok: false, error: "client_data_invalido" }, 400, req);
    }
    if (!receivedChallenge) {
      return jsonResponse({ ok: false, error: "client_data_invalido" }, 400, req);
    }

    // Uso único: apaga o challenge ANTES de validar, para que uma tentativa
    // com assinatura inválida também queime o challenge (sem replay).
    const { data: challengeRows } = await admin
      .from("webauthn_challenges")
      .select("id, user_id")
      .eq("challenge", receivedChallenge)
      .eq("type", "authentication")
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    const challengeRow = challengeRows?.[0];
    if (!challengeRow) {
      return jsonResponse({ ok: false, error: "challenge_invalido" }, 401, req);
    }
    const { data: consumed } = await admin
      .from("webauthn_challenges")
      .delete()
      .eq("id", challengeRow.id)
      .select("id");
    if (!consumed || consumed.length === 0) {
      return jsonResponse({ ok: false, error: "challenge_invalido" }, 401, req);
    }

    const { data: credentialRows, error: credentialError } = await admin
      .from("webauthn_credentials")
      .select("id, user_id, public_key, counter, is_active")
      .eq("credential_id", credentialId)
      .limit(1);
    if (credentialError) {
      console.error("[passkey-auth] erro ao ler credencial", credentialError.message);
      throw new HttpError(500, "credential lookup failed", "Não foi possível concluir o login");
    }
    const credential = credentialRows?.[0];
    if (!credential || !credential.is_active) {
      return jsonResponse({ ok: false, error: "credencial_nao_encontrada" }, 401, req);
    }
    if (typeof credential.public_key !== "string" || credential.public_key.trim() === "") {
      // Registro antigo/interrompido sem chave pública: sem esta guarda a
      // verificação estouraria em 500 em vez de orientar o usuário.
      console.warn("[passkey-auth] credencial sem chave pública", credential.id);
      return jsonResponse({ ok: false, error: "credencial_invalida" }, 409, req);
    }
    // `challengeRow.user_id` só é preenchido quando o `options` identificou a
    // conta dona do e-mail; nesse caso a passkey apresentada tem que ser dela.
    if (challengeRow.user_id && String(challengeRow.user_id) !== String(credential.user_id)) {
      console.warn("[passkey-auth] passkey de outra conta apresentada", credential.id);
      return jsonResponse({ ok: false, error: "conta_diferente" }, 409, req);
    }

    let verification: Awaited<ReturnType<typeof verifyAssertion>>;
    try {
      verification = await verifyAssertion({
        clientDataJSON: clientDataBytes,
        authenticatorData: base64UrlToBytes(authenticatorData),
        signature: base64UrlToBytes(signature),
        publicKeySpki: base64UrlToBytes(credential.public_key),
        expectedChallenge: receivedChallenge,
        rpId,
        allowedOrigins: origins,
        requireUserVerification: true,
      });
    } catch {
      return jsonResponse({ ok: false, error: "payload_malformado" }, 400, req);
    }
    if (!verification.ok) {
      console.warn("[passkey-auth] asserção rejeitada", verification.reason);
      return jsonResponse({ ok: false, error: verification.reason }, 401, req);
    }

    // Passkey não substitui o segundo fator. A sessão só é criada ao final
    // deste handler, então recusamos aqui e o usuário segue pelo login com
    // senha, que é quem exibe a tela de TOTP (`Auth.tsx` faz signOut antes).
    const { data: twoFactor, error: twoFactorError } = await admin
      .from("user_two_factor")
      .select("is_enabled")
      .eq("user_id", credential.user_id)
      .maybeSingle();
    if (twoFactorError) {
      console.error("[passkey-auth] erro ao ler 2FA", twoFactorError.message);
      throw new HttpError(500, "two factor lookup failed", "Não foi possível concluir o login");
    }
    if (twoFactor?.is_enabled === true) {
      return jsonResponse({ ok: false, error: "mfa_obrigatorio" }, 403, req);
    }

    const storedCounter = Number(credential.counter ?? 0);
    if (!isCounterAcceptable(storedCounter, verification.counter)) {
      // Contador regrediu. NÃO desativamos a credencial: dois logins
      // simultâneos (ou um autenticador que compartilha o contador entre
      // credenciais) produzem o mesmo sintoma, e desativar transformaria um
      // falso positivo em bloqueio permanente da conta.
      console.warn("[passkey-auth] contador fora de ordem", {
        stored: storedCounter,
        received: verification.counter,
      });
      return jsonResponse({ ok: false, error: "contador_fora_de_ordem" }, 409, req);
    }

    const { data: updated, error: updateError } = await admin
      .from("webauthn_credentials")
      .update({ counter: verification.counter, last_used_at: new Date().toISOString() })
      .eq("id", credential.id)
      .eq("counter", storedCounter)
      // Revogação durante a verificação: credencial desativada no meio do
      // caminho não pode emitir sessão.
      .eq("is_active", true)
      .select("id");
    if (updateError || !updated || updated.length === 0) {
      // Outra requisição consumiu este contador em paralelo.
      return jsonResponse({ ok: false, error: "concorrencia" }, 409, req);
    }

    const { data: userData, error: userError } = await admin.auth.admin.getUserById(credential.user_id);
    const email = userData?.user?.email ?? "";
    if (userError || !email) {
      console.error("[passkey-auth] usuário sem e-mail para emitir sessão");
      throw new HttpError(500, "user lookup failed", "Não foi possível concluir o login");
    }

    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    const tokenHash = linkData?.properties?.hashed_token;
    if (linkError || !tokenHash) {
      console.error("[passkey-auth] falha ao gerar sessão", linkError?.message);
      throw new HttpError(500, "session generation failed", "Não foi possível concluir o login");
    }

    return jsonResponse({ ok: true, tokenHash, email, userId: credential.user_id }, 200, req);
  } catch (error) {
    if (error instanceof ValidationHttpError) {
      return validationErrorResponse(error.body, getCorsHeaders(req));
    }
    return errorResponse(error, undefined, req);
  }
});
