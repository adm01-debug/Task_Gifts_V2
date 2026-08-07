// Edge Function: push-device-revoked
// Envia um push REAL de segurança aos demais aparelhos da conta quando uma
// inscrição é revogada. Escopo estritamente pessoal: o usuário do JWT só
// consegue notificar os próprios dispositivos.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import webpush from "npm:web-push@3.6.7";
import { z } from "npm:zod@3.23.8";

const BodySchema = z.object({
  exclude_subscription_id: z.string().uuid(),
  title: z.string().min(1).max(120),
  message: z.string().min(1).max(400),
  url: z.string().max(300).optional(),
  data: z.record(z.unknown()).optional(),
});

const TYPE = "security_device_revoked";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY");
  const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");
  const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:no-reply@taskgifts.com";
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return json({ error: "VAPID keys not configured" }, 503);
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
  if (!jwt) return json({ error: "Unauthorized" }, 401);
  const { data: userData, error: userErr } = await supabase.auth.getUser(jwt);
  if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
  const userId = userData.user.id;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
  const { exclude_subscription_id, title, message, url, data } = parsed.data;

  // Alerta de segurança é sempre entregue: não passa pelo filtro de preferência
  // por tipo, mas respeita aparelhos desativados/revogados.
  const { data: subs, error: subsErr } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, device_label")
    .eq("user_id", userId)
    .is("disabled_at", null)
    .neq("id", exclude_subscription_id);
  if (subsErr) return json({ error: subsErr.message }, 500);
  if (!subs || subs.length === 0) return json({ sent: 0, targets: 0 });

  const payload = JSON.stringify({ title, message, url: url ?? "/security?tab=devices", data: data ?? {} });
  const invalidIds: string[] = [];
  const logRows: Record<string, unknown>[] = [];
  let sent = 0;

  await Promise.all(subs.map(async (s) => {
    const base = {
      user_id: userId,
      subscription_id: s.id,
      endpoint: s.endpoint,
      device_label: s.device_label ?? null,
      campaign_id: null,
      type: TYPE,
      title,
      message,
      url: url ?? "/security?tab=devices",
      data: data ?? null,
    };
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      sent++;
      logRows.push({ ...base, status: "sent", status_code: 201, error: null });
    } catch (err: unknown) {
      const e = err as { statusCode?: number; body?: string; message?: string };
      const statusCode = typeof e?.statusCode === "number" ? e.statusCode : null;
      const errMsg = e?.body ?? e?.message ?? String(err);
      if (statusCode === 404 || statusCode === 410) {
        invalidIds.push(s.id);
        logRows.push({ ...base, status: "invalidated", status_code: statusCode, error: errMsg });
      } else {
        logRows.push({ ...base, status: "failed", status_code: statusCode, error: errMsg });
      }
    }
  }));

  if (invalidIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .update({ disabled_at: new Date().toISOString(), disabled_reason: "endpoint_expired_or_removed" })
      .in("id", invalidIds)
      .eq("user_id", userId);
  }
  if (logRows.length > 0) {
    const { error } = await supabase.from("push_notification_logs").insert(logRows);
    if (error) console.error("[push-device-revoked] log insert failed", error.message);
  }

  return json({ sent, targets: subs.length, invalidated: invalidIds.length });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
