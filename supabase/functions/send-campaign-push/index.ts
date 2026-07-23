// Edge Function: send-campaign-push
// Envia notificações Web Push com retry+backoff, invalidação automática de
// endpoints expirados e reset de contador de falhas em sucesso.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import webpush from "npm:web-push@3.6.7";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  user_ids: z.array(z.string().uuid()).min(1).max(500),
  type: z.string().min(1).max(64),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(400),
  url: z.string().url().optional(),
  data: z.record(z.unknown()).optional(),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:no-reply@taskgifts.com";
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return json({ error: "VAPID keys not configured" }, 503);
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  // Auth: require valid JWT (called from trusted backend contexts).
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const jwt = authHeader.replace("Bearer ", "").trim();
  if (!jwt) return json({ error: "Unauthorized" }, 401);
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { user_ids, type, title, message, url, data } = parsed.data;

  // Filtra usuários pela preferência push.
  const allowed: string[] = [];
  for (const uid of user_ids) {
    const { data: wants } = await supabase.rpc("user_wants_push_notification", {
      _user_id: uid,
      _type: type,
    });
    if (wants !== false) allowed.push(uid);
  }
  if (allowed.length === 0) return json({ sent: 0, skipped: user_ids.length, reason: "prefs" });

  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("id, user_id, endpoint, p256dh, auth, device_label")
    .in("user_id", allowed)
    .is("disabled_at", null);
  if (subsErr) return json({ error: subsErr.message }, 500);

  const payload = JSON.stringify({ title, message, url, data });
  let sent = 0;
  const invalidIds: string[] = [];
  const failedIds: string[] = [];
  const successIds: string[] = [];
  const logRows: Record<string, unknown>[] = [];
  const campaignId = (data && typeof data === "object" && "campaign_id" in (data as Record<string, unknown>))
    ? String((data as Record<string, unknown>).campaign_id)
    : null;

  await Promise.all(
    (subs ?? []).map(async (s) => {
      const base = {
        user_id: s.user_id,
        subscription_id: s.id,
        endpoint: s.endpoint,
        device_label: s.device_label ?? null,
        campaign_id: campaignId,
        type,
        title,
        message,
        url: url ?? null,
        data: data ?? null,
      };
      const outcome = await sendWithRetry(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      if (outcome.status === "sent") {
        sent++;
        successIds.push(s.id);
        logRows.push({ ...base, status: "sent", status_code: outcome.statusCode ?? 201, error: null, attempts: outcome.attempts });
      } else if (outcome.status === "invalidated") {
        invalidIds.push(s.id);
        logRows.push({ ...base, status: "invalidated", status_code: outcome.statusCode ?? null, error: outcome.error, attempts: outcome.attempts });
      } else {
        failedIds.push(s.id);
        logRows.push({ ...base, status: "failed", status_code: outcome.statusCode ?? null, error: outcome.error, attempts: outcome.attempts });
      }
    }),
  );

  if (invalidIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .update({
        disabled_at: new Date().toISOString(),
        disabled_reason: "endpoint_expired_or_removed",
      })
      .in("id", invalidIds);
  }
  if (failedIds.length > 0) {
    await supabase.rpc("increment_push_failures", { _ids: failedIds }).catch(() => {});
  }
  if (successIds.length > 0) {
    await supabase.rpc("reset_push_failures", { _ids: successIds }).catch(() => {});
  }

  if (logRows.length > 0) {
    await supabase.from("push_notification_logs").insert(logRows).then(({ error }) => {
      if (error) console.error("[send-campaign-push] log insert failed", error.message);
    });
  }

  return json({ sent, invalidated: invalidIds.length, failed: failedIds.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------------------------------------------------------------------------
// Retry policy
// ---------------------------------------------------------------------------
// - 404 / 410  → invalidated (endpoint removido/expirado). NÃO retentar.
// - 401 / 403  → failed. NÃO retentar (VAPID/auth issue exige reconfig).
// - 4xx demais → failed. NÃO retentar (payload/rate rules do provider).
// - 429        → retentar, respeitando Retry-After (segundos) quando presente.
// - 5xx / rede → retentar com backoff exponencial + jitter.
// Máximo de 3 tentativas totais. Backoff base: 500ms, cap 8s.
type PushOutcome = {
  status: "sent" | "invalidated" | "failed";
  statusCode: number | null;
  error: string | null;
  attempts: number;
};

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 8000;

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
      const e = err as { statusCode?: number; body?: string; message?: string; headers?: Record<string, string> };
      const statusCode = typeof e?.statusCode === "number" ? e.statusCode : null;
      const errMsg = e?.body ?? e?.message ?? String(err);
      lastStatusCode = statusCode;
      lastError = errMsg;

      // Terminal: subscription morta.
      if (statusCode === 404 || statusCode === 410) {
        return { status: "invalidated", statusCode, error: errMsg, attempts: attempt };
      }
      // Terminal: 4xx não recuperável (exceto 429).
      if (statusCode !== null && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
        return { status: "failed", statusCode, error: errMsg, attempts: attempt };
      }
      // Se já é última tentativa, sai.
      if (attempt === MAX_ATTEMPTS) break;

      // Retentar com backoff.
      const retryAfterMs = parseRetryAfter(e?.headers?.["retry-after"] ?? e?.headers?.["Retry-After"]);
      const backoff = retryAfterMs ?? computeBackoff(attempt);
      await sleep(backoff);
    }
  }

  return { status: "failed", statusCode: lastStatusCode, error: lastError, attempts: MAX_ATTEMPTS };
}

function computeBackoff(attempt: number): number {
  const exp = Math.min(MAX_BACKOFF_MS, BASE_BACKOFF_MS * Math.pow(2, attempt - 1));
  const jitter = Math.floor(Math.random() * (exp / 2));
  return exp + jitter;
}

function parseRetryAfter(value: string | undefined | null): number | null {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_BACKOFF_MS, Math.floor(seconds * 1000));
  }
  // HTTP-date fallback
  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? Math.min(MAX_BACKOFF_MS, delta) : 0;
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}