// Edge Function: burn-rate-monitor
// Alertas de burn rate (Google SRE style), executado via pg_cron (a cada 5 min).
// Janelas avaliadas:
//  - Rápida:  1h  E 5min   burn >= 14.4x  -> critical (2% do budget em 1h)
//  - Lenta:   6h  E 30min  burn >= 6x     -> high     (5% do budget em 6h)
// Dispara apenas quando AMBAS as janelas (curta e longa) cruzam o limite (menos ruído).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { guardInternalRequest } from "../_shared/security.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLO = Number(Deno.env.get("SLO_TARGET") ?? "99.0");

type Surface = "webhooks" | "api_external";
interface Pair { name: string; long: number; short: number; threshold: number; severity: "high" | "critical" }
const PAIRS: Pair[] = [
  { name: "fast", long: 60, short: 5, threshold: 14.4, severity: "critical" },
  { name: "slow", long: 360, short: 30, threshold: 6, severity: "high" },
];

async function burn(sb: any, minutes: number) {
  const { data, error } = await sb.rpc("get_burn_rate", { _minutes: minutes, _slo: SLO });
  if (error) throw new Error(`get_burn_rate(${minutes}): ${error.message}`);
  return data as Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = guardInternalRequest(req);
  if (denied) return denied;
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const triggered: any[] = [];

    for (const pair of PAIRS) {
      const [longW, shortW] = await Promise.all([burn(sb, pair.long), burn(sb, pair.short)]);
      for (const surface of ["webhooks", "api_external"] as Surface[]) {
        const lb = Number(longW[surface]?.burn_rate ?? 0);
        const sb_ = Number(shortW[surface]?.burn_rate ?? 0);
        const lTotal = Number(longW[surface]?.total ?? 0);
        const sTotal = Number(shortW[surface]?.total ?? 0);
        // volume mínimo para evitar falso positivo
        if (lTotal < 20 || sTotal < 5) continue;
        if (lb >= pair.threshold && sb_ >= pair.threshold) {
          const alertType = `burn_rate_${pair.name}_${surface}`;
          // dedupe: não reemite o mesmo alerta dentro da janela longa
          const sinceIso = new Date(Date.now() - pair.long * 60_000).toISOString();
          const { data: existing } = await sb
            .from("security_alerts")
            .select("id")
            .eq("alert_type", alertType)
            .gte("created_at", sinceIso)
            .limit(1);
          if (existing && existing.length > 0) continue;

          const title = `${pair.severity === "critical" ? "🔥" : "⚠️"} Burn ${pair.name} — ${surface}`;
          const description =
            `${surface} burn ${pair.name} — janela longa (${pair.long}m)=${lb.toFixed(1)}x, ` +
            `curta (${pair.short}m)=${sb_.toFixed(1)}x >= ${pair.threshold}x (SLO ${SLO}%)`;

          const { data: alert, error: insErr } = await sb
            .from("security_alerts")
            .insert({
              alert_type: alertType,
              severity: pair.severity,
              title,
              description,
              is_resolved: false,
              metadata: { pair, surface, long: longW[surface], short: shortW[surface] },
            })
            .select("id")
            .single();
          if (insErr) { console.error("insert alert", insErr); continue; }

          triggered.push({ alertType, severity: pair.severity, id: alert?.id });

          try {
            await sb.functions.invoke("dispatch-critical-alert", {
              body: { alert_id: alert?.id, severity: pair.severity, alert_type: alertType, message: description },
            });
          } catch (e) {
            console.error("dispatch-critical-alert failed", e);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ ok: true, triggered, evaluated_at: new Date().toISOString(), slo: SLO }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("burn-rate-monitor error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});