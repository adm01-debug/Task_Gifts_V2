// Multi-window burn-rate alerts (Google SRE style)
// Windows evaluated:
//  - Fast page:  1h  AND 5min   burn >= 14.4x  -> critical (2% budget in 1h)
//  - Slow page:  6h  AND 30min  burn >= 6x     -> high     (5% budget in 6h)
// Alert only when BOTH long and short windows exceed the threshold (reduces noise).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SLO = Number(Deno.env.get("SLO_TARGET") ?? "99.0");

type Surface = "webhooks" | "api_external";
interface Pair { name: string; long: number; short: number; threshold: number; severity: "high" | "critical" }
const PAIRS: Pair[] = [
  { name: "fast", long: 60, short: 5, threshold: 14.4, severity: "critical" },
  { name: "slow", long: 360, short: 30, threshold: 6, severity: "high" },
];

async function burn(sb: ReturnType<typeof createClient>, minutes: number) {
  const { data, error } = await sb.rpc("get_burn_rate", { _minutes: minutes, _slo: SLO });
  if (error) throw new Error(`get_burn_rate(${minutes}): ${error.message}`);
  return data as Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
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
        // require minimum volume to avoid false positives
        if (lTotal < 20 || sTotal < 5) continue;
        if (lb >= pair.threshold && sb_ >= pair.threshold) {
          const alertType = `burn_rate_${pair.name}_${surface}`;
          // dedupe: skip if same alert emitted within long window
          const sinceIso = new Date(Date.now() - pair.long * 60_000).toISOString();
          const { data: existing } = await sb
            .from("security_alerts")
            .select("id")
            .eq("alert_type", alertType)
            .gte("created_at", sinceIso)
            .limit(1);
          if (existing && existing.length > 0) continue;

          const message =
            `${surface} burn ${pair.name} — long(${pair.long}m)=${lb.toFixed(1)}x ` +
            `short(${pair.short}m)=${sb_.toFixed(1)}x >= ${pair.threshold}x (SLO ${SLO}%)`;

          const { data: alert, error: insErr } = await sb
            .from("security_alerts")
            .insert({
              alert_type: alertType,
              severity: pair.severity,
              message,
              metadata: { pair, surface, long: longW[surface], short: shortW[surface] },
            })
            .select("id")
            .single();
          if (insErr) { console.error("insert alert", insErr); continue; }

          triggered.push({ alertType, severity: pair.severity, id: alert?.id });

          // Fan out via existing dispatcher (Slack + in-app admins)
          try {
            await sb.functions.invoke("dispatch-critical-alert", {
              body: { alert_id: alert?.id, severity: pair.severity, alert_type: alertType, message },
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