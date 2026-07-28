// Edge Function: push-outbox-dispatcher
// Processa a fila `push_outbox` (outbox pattern) a cada minuto:
// - claim atômico das linhas pendentes (evita duplo envio entre execuções);
// - envio Web Push com retry/backoff e invalidação de endpoints mortos;
// - transição terminal por linha (sent | failed | skipped) com log auditável.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import webpush from "npm:web-push@3.6.7";
import { guardInternalRequest } from "../_shared/security.ts";

const BATCH_SIZE = 100;
const MAX_ATTEMPTS = 3;

interface OutboxRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  url: string | null;
  data: Record<string, unknown> | null;
  attempts: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = guardInternalRequest(req);
  if (denied) return denied;

  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:no-reply@taskgifts.com";
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json({ error: "VAPID keys not configured" }, 503);
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  // Claim atômico: só esta execução assume as linhas marcadas.
  const { data: claimed, error: claimErr } = await admin
    .rpc("claim_push_outbox", { p_limit: BATCH_SIZE })
    .returns<OutboxRow[]>();
  if (claimErr) return json({ error: claimErr.message }, 500);
  if (!claimed || claimed.length === 0) return json({ processed: 0 });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of claimed) {
    const { data: subs } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, device_label")
      .eq("user_id", row.user_id)
      .is("disabled_at", null);

    if (!subs || subs.length === 0) {
      await finish(admin, row.id, "skipped", row.attempts + 1, "no_active_subscription");
      skipped++;
      continue;
    }

    const payload = JSON.stringify({
      title: row.title,
      message: row.message,
      url: row.url ?? undefined,
      data: row.data ?? undefined,
    });

    let anySent = false;
    let lastError: string | null = null;
    const invalidIds: string[] = [];
    const logRows: Record<string, unknown>[] = [];

    for (const s of subs) {
      const outcome = await sendWithRetry(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      logRows.push({
        user_id: row.user_id,
        subscription_id: s.id,
        endpoint: s.endpoint,
        device_label: s.device_label ?? null,
        type: row.type,
        title: row.title,
        message: row.message,
        url: row.url,
        data: row.data,
        status: outcome.status,
        status_code: outcome.statusCode,
        error: outcome.error,
        attempts: outcome.attempts,
      });
      if (outcome.status === "sent") anySent = true;
      else if (outcome.status === "invalidated") invalidIds.push(s.id);
      else lastError = outcome.error;
    }

    if (invalidIds.length > 0) {
      await admin
        .from("push_subscriptions")
        .update({ disabled_at: new Date().toISOString(), disabled_reason: "endpoint_expired_or_removed" })
        .in("id", invalidIds);
    }
    if (logRows.length > 0) {
      await admin.from("push_notification_logs").insert(logRows);
    }

    const attempts = row.attempts + 1;
    if (anySent) {
      await finish(admin, row.id, "sent", attempts, null);
      sent++;
    } else if (attempts >= MAX_ATTEMPTS) {
      await finish(admin, row.id, "failed", attempts, lastError ?? "exhausted_attempts");
      failed++;
    } else {
      // Devolve para a fila: próxima execução tenta de novo.
      await finish(admin, row.id, "pending", attempts, lastError);
    }
  }

  return json({ processed: claimed.length, sent, failed, skipped });
});

async function finish(
  admin: ReturnType<typeof createClient>,
  id: string,
  status: string,
  attempts: number,
  error: string | null,
) {
  await admin
    .from("push_outbox")
    .update({
      status,
      attempts,
      last_error: error,
      processed_at: status === "pending" ? null : new Date().toISOString(),
    })
    .eq("id", id);
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

type PushOutcome = {
  status: "sent" | "invalidated" | "failed";
  statusCode: number | null;
  error: string | null;
  attempts: number;
};

const BASE_BACKOFF_MS = 400;
const MAX_BACKOFF_MS = 5000;

async function sendWithRetry(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: string,
): Promise<PushOutcome> {
  let lastStatusCode: number | null = null;
  let lastError: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await webpush.sendNotification(subscription, payload);
      return { status: "sent", statusCode: 201, error: null, attempts: attempt };
    } catch (err: unknown) {
      const e = err as { statusCode?: number; body?: string; message?: string };
      const statusCode = typeof e?.statusCode === "number" ? e.statusCode : null;
      lastStatusCode = statusCode;
      lastError = e?.body ?? e?.message ?? String(err);

      if (statusCode === 404 || statusCode === 410) {
        return { status: "invalidated", statusCode, error: lastError, attempts: attempt };
      }
      if (statusCode !== null && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return { status: "failed", statusCode, error: lastError, attempts: attempt };
      }
      if (attempt === MAX_ATTEMPTS) break;
      await sleep(Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * 2 ** (attempt - 1)) + Math.random() * 200);
    }
  }
  return { status: "failed", statusCode: lastStatusCode, error: lastError, attempts: MAX_ATTEMPTS };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
