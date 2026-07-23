// Edge Function: send-campaign-push
// Envia notificações Web Push respeitando `notification_preferences` e limpa inscrições inválidas.
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
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
        logRows.push({ ...base, status: "sent", status_code: 201, error: null });
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        const errMsg = (err as { body?: string; message?: string })?.body
          ?? (err as { message?: string })?.message
          ?? String(err);
        if (statusCode === 404 || statusCode === 410) {
          invalidIds.push(s.id);
          logRows.push({ ...base, status: "invalidated", status_code: statusCode ?? null, error: errMsg });
        } else {
          failedIds.push(s.id);
          logRows.push({ ...base, status: "failed", status_code: statusCode ?? null, error: errMsg });
        }
      }
    }),
  );

  if (invalidIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ disabled_at: new Date().toISOString() })
      .in("id", invalidIds);
  }
  if (failedIds.length > 0) {
    await supabase.rpc("increment_push_failures", { _ids: failedIds }).catch(() => {});
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