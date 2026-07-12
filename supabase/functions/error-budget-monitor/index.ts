// Error Budget Monitor — avalia burn% do orçamento de erros (30d) para webhooks
// e API externa. Ao cruzar 75% ou 90%, cria um security_alert e dispara o
// dispatch-critical-alert (Slack + notificação in-app), com deduplicação por
// dia+tipo+bucket para não spammar.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface BudgetBlock {
  total: number;
  success: number;
  failed: number;
  success_rate_pct: number;
  budget_total: number;
  budget_consumed: number;
  burn_pct: number;
  status: "healthy" | "warning" | "high" | "critical";
}

interface BudgetResult {
  window_days: number;
  webhook_slo_pct: number;
  api_slo_pct: number;
  webhooks: BudgetBlock;
  external_api: BudgetBlock;
}

const BURN_HIGH = 75;
const BURN_CRITICAL = 90;

function bucketFor(burnPct: number): "critical" | "high" | null {
  if (burnPct >= BURN_CRITICAL) return "critical";
  if (burnPct >= BURN_HIGH) return "high";
  return null;
}

function severityFor(bucket: "critical" | "high"): "critical" | "high" {
  return bucket;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase.rpc("get_error_budget_30d", {
      p_webhook_slo: 99.0,
      p_api_slo: 99.0,
    });
    if (error) throw error;
    const budget = data as BudgetResult;

    const today = new Date().toISOString().split("T")[0];
    const dispatchUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/dispatch-critical-alert`;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const targets: Array<{ key: string; label: string; block: BudgetBlock; slo: number }> = [
      { key: "webhooks", label: "Webhooks", block: budget.webhooks, slo: budget.webhook_slo_pct },
      { key: "external_api", label: "API Externa", block: budget.external_api, slo: budget.api_slo_pct },
    ];

    const results: Record<string, unknown> = { evaluated: [], created: 0, dispatched: 0, skipped: 0 };

    for (const t of targets) {
      const bucket = bucketFor(t.block.burn_pct);
      (results.evaluated as unknown[]).push({ target: t.key, burn_pct: t.block.burn_pct, bucket });
      if (!bucket) continue;

      const alertType = `error_budget_${bucket}_${t.key}`;
      const dedupeKey = `${alertType}:${today}`;

      // Dedupe: skip if same type already fired today
      const { data: existing } = await supabase
        .from("security_alerts")
        .select("id")
        .eq("alert_type", alertType)
        .gte("created_at", `${today}T00:00:00Z`)
        .limit(1)
        .maybeSingle();

      if (existing) {
        results.skipped = (results.skipped as number) + 1;
        continue;
      }

      const title = bucket === "critical"
        ? `🔥 Error Budget CRÍTICO — ${t.label} em ${t.block.burn_pct}%`
        : `⚠️ Error Budget ALTO — ${t.label} em ${t.block.burn_pct}%`;

      const description = bucket === "critical"
        ? `${t.label} consumiu ${t.block.burn_pct}% do orçamento de erros (30d). Congelar releases não-essenciais e priorizar estabilização. Falhas: ${t.block.budget_consumed}/${t.block.budget_total} (SLO ${t.slo}%).`
        : `${t.label} consumiu ${t.block.burn_pct}% do orçamento de erros (30d). Reduzir mudanças arriscadas. Falhas: ${t.block.budget_consumed}/${t.block.budget_total} (SLO ${t.slo}%).`;

      const severity = severityFor(bucket);

      const { data: inserted, error: insErr } = await supabase
        .from("security_alerts")
        .insert({
          alert_type: alertType,
          severity,
          title,
          description,
          metadata: {
            target: t.key,
            burn_pct: t.block.burn_pct,
            budget_total: t.block.budget_total,
            budget_consumed: t.block.budget_consumed,
            success_rate_pct: t.block.success_rate_pct,
            slo_pct: t.slo,
            dedupe_key: dedupeKey,
            window_days: budget.window_days,
          },
          resolved: false,
        })
        .select("id")
        .single();

      if (insErr) {
        console.error("failed to insert security_alert", insErr);
        continue;
      }
      results.created = (results.created as number) + 1;

      // Dispatch (Slack + in-app admins)
      try {
        const resp = await fetch(dispatchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceRole}`,
          },
          body: JSON.stringify({
            alert_id: inserted.id,
            alert_type: alertType,
            severity,
            title,
            description,
            metadata: {
              target: t.key,
              burn_pct: t.block.burn_pct,
              slo_pct: t.slo,
            },
          }),
        });
        if (resp.ok) results.dispatched = (results.dispatched as number) + 1;
      } catch (err) {
        console.error("dispatch failed", err);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, ...results, generated_at: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("error-budget-monitor error:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});