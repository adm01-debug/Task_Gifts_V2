// Monitor de saúde de webhooks — dispara alertas Sentry quando taxa de sucesso
// por assinatura cai abaixo do limiar (default 90%) na última hora.
// Executado via pg_cron (a cada 15 min) ou invocação manual admin.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { withSentry, captureMessage, captureException, recordMetric } from "../_shared/sentry.ts";

const THRESHOLD_PCT = Number(Deno.env.get("WEBHOOK_HEALTH_THRESHOLD") ?? "90");
const MIN_SAMPLE = Number(Deno.env.get("WEBHOOK_HEALTH_MIN_SAMPLE") ?? "5");

interface StatRow {
  subscription_id: string;
  subscription_name: string;
  subscription_url: string;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate_pct: number | null;
}

serve(withSentry("webhook-health-monitor", async (req, { requestId }) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.rpc("get_webhook_delivery_stats_1h");
  if (error) {
    captureException(error, { fn: "webhook-health-monitor", requestId });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rows = (data ?? []) as StatRow[];
  const degraded: StatRow[] = [];

  for (const r of rows) {
    if (r.total_deliveries < MIN_SAMPLE) continue;
    if ((r.success_rate_pct ?? 100) < THRESHOLD_PCT) {
      degraded.push(r);
      captureMessage(
        `webhook_health_degraded: ${r.subscription_name} @ ${r.success_rate_pct}%`,
        "warning",
        {
          subscription_id: r.subscription_id,
          subscription_name: r.subscription_name,
          subscription_url: r.subscription_url,
          total_deliveries: r.total_deliveries,
          failed_deliveries: r.failed_deliveries,
          success_rate_pct: r.success_rate_pct,
          threshold_pct: THRESHOLD_PCT,
          requestId,
        },
      );
    }
  }

  recordMetric("webhook-health-monitor", "subscriptions_checked", rows.length, { requestId });
  recordMetric("webhook-health-monitor", "subscriptions_degraded", degraded.length, { requestId });

  return new Response(
    JSON.stringify({
      checked: rows.length,
      degraded: degraded.length,
      threshold_pct: THRESHOLD_PCT,
      min_sample: MIN_SAMPLE,
      degraded_subscriptions: degraded.map((d) => ({
        id: d.subscription_id,
        name: d.subscription_name,
        success_rate_pct: d.success_rate_pct,
        total: d.total_deliveries,
        failed: d.failed_deliveries,
      })),
      requestId,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
}));