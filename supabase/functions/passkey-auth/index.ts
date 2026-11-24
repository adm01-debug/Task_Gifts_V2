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
import { clientIpForLogging } from "../_shared/clientIp.ts";
import {
  base64UrlToBytes,
  bytesToBase64Url,
  isCounterAcceptable,
  verifyAssertion,
} from "../_shared/webauthn.ts";

const MAX_BODY_BYTES = 16 * 1024;
const CHALLENGE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_ACTIONS = ["options", "verify"] as const;
type Action = (typeof ALLOWED_ACTIONS)[number];

interface VerifyPayload {
  action: "verify";
  email?: string;
  credentialId: string;
  authenticatorData: string;
  clientDataJSON: string;
  signature: string;
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

async function readJsonBody(req: Request): Promise<Record<string, unknown>> {
  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    throw new HttpError(413, "Corpo muito grande", "Requisição inválida");
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    return parsed as Record<string, unknown>;
  } catch {
    throw new HttpError(400, "JSON inválido", "Requisição inválida");
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
    const ip = clientIpForLogging(req);
    const payload = await readJsonBody(req);
    const action = payload.action as Action;
    if (!ALLOWED_ACTIONS.includes(action)) {
      throw new HttpError(400, "action inválida", "Ação inválida");
    }

    const limit = action === "options" ? { max: 20, window: 60 } : { max: 10, window: 60 };
    const rate = await checkRateLimit(`passkey-auth:${action}:${ip}`, limit.max, limit.window);
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
      const email = typeof payload.email === "string" ? payload.email.trim() : "";
      let allowCredentials: { id: string; type: "public-key" }[] = [];

      if (email) {
        // E-mail desconhecido apenas não restringe credenciais; não revelamos
        // existência de conta e o verify falha depois.
        const { data: passkeys } = await admin.rpc("get_passkeys_by_email", { p_email: email });
        allowCredentials = ((passkeys ?? []) as { credential_id: string }[]).map((row) => ({
          id: row.credential_id,
          type: "public-key" as const,
        }));
      }

      const challenge = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const { error: insertError } = await admin.from("webauthn_challenges").insert({
        user_id: null,
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
    const body = payload as unknown as VerifyPayload;
    const credentialId = requiredString(body.credentialId, "credentialId", 2048);
    const clientDataJSON = requiredString(body.clientDataJSON, "clientDataJSON");
    const authenticatorData = requiredString(body.authenticatorData, "authenticatorData");
    const signature = requiredString(body.signature, "signature");

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
      .select("id")
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

    const storedCounter = Number(credential.counter ?? 0);
    if (!isCounterAcceptable(storedCounter, verification.counter)) {
      // Contador regrediu: indício de clone de autenticador. Desativa a credencial.
      await admin.from("webauthn_credentials").update({ is_active: false }).eq("id", credential.id);
      console.warn("[passkey-auth] contador regrediu, credencial desativada");
      return jsonResponse({ ok: false, error: "contador_invalido" }, 401, req);
    }

    const { data: updated, error: updateError } = await admin
      .from("webauthn_credentials")
      .update({ counter: verification.counter, last_used_at: new Date().toISOString() })
      .eq("id", credential.id)
      .eq("counter", storedCounter)
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
    return errorResponse(error, undefined, req);
  }
});