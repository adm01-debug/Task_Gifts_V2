/**
 * Segurança de webhooks de entrada: assinatura HMAC obrigatória,
 * proteção contra replay e idempotência persistente.
 *
 * Por que obrigatória
 * -------------------
 * O padrão anterior era `if (signature && secret) { validar }`, que só valida
 * quando o chamador COOPERA. Um atacante simplesmente omite o header e o
 * webhook é aceito sem nenhuma autenticação. Validação de autenticidade nunca
 * pode ser opt-in pelo cliente — aqui ela é fail-closed.
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const REPLAY_WINDOW_SECONDS = 300; // 5 minutos

/** Comparação em tempo constante entre dois buffers de bytes. */
function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

/** Converte hex em bytes. Retorna null se a string não for hex válido. */
function hexToBytes(hex: string): Uint8Array | null {
  const clean = hex.trim().toLowerCase().replace(/^sha256=/, "");
  if (clean.length === 0 || clean.length % 2 !== 0 || !/^[0-9a-f]+$/.test(clean)) {
    return null;
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function computeHmacSha256(payload: string, secret: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return new Uint8Array(sig);
}

export async function verifyHmacSha256(
  payload: string,
  signatureHex: string,
  secret: string,
): Promise<boolean> {
  // Nunca deixar hex malformado lançar exceção (o código antigo usava
  // `signature.match(...)!` e quebrava com 500 em entrada inválida).
  const provided = hexToBytes(signatureHex);
  if (!provided) return false;
  const expected = await computeHmacSha256(payload, secret);
  return timingSafeEqualBytes(provided, expected);
}

export interface SignatureCheck {
  ok: boolean;
  /** Motivo estável para log; nunca exponha detalhe ao chamador. */
  reason?: "missing_secret" | "missing_signature" | "missing_timestamp" | "bad_signature" | "expired" | "future";
}

/**
 * Valida assinatura HMAC obrigatória, com janela anti-replay quando um
 * timestamp assinado é usado.
 *
 * @param signedPayload string exata que foi assinada pela origem
 * @param timestamp     epoch em segundos (string). Omita se o esquema da
 *                      origem não assina timestamp.
 */
export async function verifySignedWebhook(params: {
  signedPayload: string;
  signature: string | null;
  secret: string | null | undefined;
  timestamp?: string | null;
}): Promise<SignatureCheck> {
  const { signedPayload, signature, secret, timestamp } = params;

  if (!secret) return { ok: false, reason: "missing_secret" };
  if (!signature) return { ok: false, reason: "missing_signature" };

  if (timestamp !== undefined) {
    if (!timestamp) return { ok: false, reason: "missing_timestamp" };
    const ts = Number.parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return { ok: false, reason: "missing_timestamp" };
    const drift = Math.floor(Date.now() / 1000) - ts;
    if (drift > REPLAY_WINDOW_SECONDS) return { ok: false, reason: "expired" };
    if (drift < -REPLAY_WINDOW_SECONDS) return { ok: false, reason: "future" };
  }

  const ok = await verifyHmacSha256(signedPayload, signature, secret);
  return ok ? { ok: true } : { ok: false, reason: "bad_signature" };
}

// ---------------------------------------------------------------------------
// Idempotência
// ---------------------------------------------------------------------------

export type IdempotencyClaim =
  | { state: "fresh"; key: string }
  | { state: "duplicate"; key: string; status: string; response: unknown }
  | { state: "in_progress"; key: string }
  | { state: "unavailable"; key: string };

/** Chave derivada do conteúdo quando a origem não envia uma explícita. */
export async function derivedIdempotencyKey(provider: string, rawBody: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawBody));
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${provider}:sha256:${hex}`;
}

/**
 * Reserva atomicamente o processamento de um evento.
 * Usa o índice único em `idempotency_key`: quem conseguir inserir processa,
 * os demais recebem `duplicate`/`in_progress`. Sem race condition, mesmo com
 * entregas simultâneas do provedor.
 */
export async function claimIdempotency(
  supabase: SupabaseClient,
  provider: string,
  key: string,
): Promise<IdempotencyClaim> {
  const scopedKey = key.startsWith(`${provider}:`) ? key : `${provider}:${key}`;

  const { error } = await supabase
    .from("webhook_idempotency")
    .insert({ idempotency_key: scopedKey, provider, status: "processing" });

  if (!error) return { state: "fresh", key: scopedKey };

  // 23505 = unique_violation => já existe um registro para esta chave.
  if (error.code !== "23505") {
    console.error("[idempotency] falha ao reservar chave", { provider, code: error.code });
    // Indisponibilidade do controle não deve derrubar o webhook: seguimos
    // processando (at-least-once), que é o contrato padrão de webhooks.
    return { state: "unavailable", key: scopedKey };
  }

  const { data: existing } = await supabase
    .from("webhook_idempotency")
    .select("status, response_body")
    .eq("idempotency_key", scopedKey)
    .maybeSingle();

  if (!existing) return { state: "fresh", key: scopedKey };
  if (existing.status === "processing") return { state: "in_progress", key: scopedKey };
  return { state: "duplicate", key: scopedKey, status: existing.status, response: existing.response_body };
}

export async function completeIdempotency(
  supabase: SupabaseClient,
  key: string,
  status: "completed" | "failed",
  response: unknown,
): Promise<void> {
  const { error } = await supabase
    .from("webhook_idempotency")
    .update({ status, response_body: response ?? null })
    .eq("idempotency_key", key);
  if (error) console.error("[idempotency] falha ao concluir chave", { code: error.code });
}

/**
 * Falhas liberam a chave para permitir o retry do provedor. Sem isso, um erro
 * transitório (ex.: timeout no banco) marcaria o evento como visto e a
 * reentrega seria descartada silenciosamente — perda de dados.
 */
export async function releaseIdempotency(supabase: SupabaseClient, key: string): Promise<void> {
  const { error } = await supabase.from("webhook_idempotency").delete().eq("idempotency_key", key);
  if (error) console.error("[idempotency] falha ao liberar chave", { code: error.code });
}

export { createClient };
