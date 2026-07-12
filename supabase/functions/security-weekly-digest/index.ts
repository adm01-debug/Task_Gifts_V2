import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Digest semanal de segurança.
 * Consolida alertas dos últimos 7 dias, calcula SLA/MTTR agregados e
 * publica no Slack (opt-in via SLACK_ALERT_WEBHOOK_URL) e como notificação
 * in-app para todos os admins. Idempotente por semana ISO.
 */

interface AlertRow {
  id: string;
  alert_type: string;
  severity: string;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

function isoWeekKey(d: Date): string {
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((+tmp - +yearStart) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekKey = isoWeekKey(new Date());

    const { data: alerts, error } = await admin
      .from("security_alerts")
      .select("id, alert_type, severity, resolved, created_at, resolved_at")
      .gte("created_at", since)
      .returns<AlertRow[]>();
    if (error) throw error;

    const total = alerts?.length ?? 0;
    const resolved = alerts?.filter((a) => a.resolved).length ?? 0;
    const pending = total - resolved;
    const critical = alerts?.filter((a) => a.severity === "critical").length ?? 0;
    const high = alerts?.filter((a) => a.severity === "high").length ?? 0;

    const mttrs = (alerts ?? [])
      .filter((a) => a.resolved && a.resolved_at)
      .map((a) => (new Date(a.resolved_at!).getTime() - new Date(a.created_at).getTime()) / 60000);
    const avgMttr = mttrs.length ? Math.round(mttrs.reduce((s, v) => s + v, 0) / mttrs.length) : null;

    const byType = new Map<string, number>();
    (alerts ?? []).forEach((a) => byType.set(a.alert_type, (byType.get(a.alert_type) ?? 0) + 1));
    const top = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const slaTarget = 95;
    const slaPct = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 100;
    const slaEmoji = slaPct >= slaTarget ? "🟢" : slaPct >= 85 ? "🟡" : "🔴";

    const lines: string[] = [
      `*🛡️ Digest Semanal de Segurança — ${weekKey}*`,
      `${slaEmoji} SLA: *${slaPct}%* (alvo ${slaTarget}%)  •  MTTR médio: *${avgMttr ?? "—"} min*`,
      `Total: *${total}*  •  Resolvidos: *${resolved}*  •  Pendentes: *${pending}*  •  Críticos: *${critical}*  •  Altos: *${high}*`,
    ];
    if (top.length > 0) {
      lines.push("*Top tipos de alerta:*");
      top.forEach(([t, c]) => lines.push(`  • \`${t}\` — ${c}`));
    }
    const message = lines.join("\n");

    // Slack opt-in
    const slackUrl = Deno.env.get("SLACK_ALERT_WEBHOOK_URL");
    let slackStatus: number | null = null;
    if (slackUrl) {
      const r = await fetch(slackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message }),
      });
      slackStatus = r.status;
    }

    // Notificação in-app para admins (idempotente via week_key no metadata)
    const { data: admins } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    const notifRows = (admins ?? []).map((a: { user_id: string }) => ({
      user_id: a.user_id,
      type: "security_weekly_digest",
      title: `Digest de segurança — ${weekKey}`,
      message: `SLA ${slaPct}% • MTTR ${avgMttr ?? "—"}min • ${pending} pendentes de ${total}`,
      metadata: { week_key: weekKey, sla_pct: slaPct, avg_mttr_min: avgMttr, total, pending, critical, high, top: top.map(([t, c]) => ({ type: t, count: c })) },
      link: "/admin/security-runbook",
    }));

    if (notifRows.length > 0) {
      await admin.from("notifications").upsert(notifRows, {
        onConflict: "user_id,type,metadata",
        ignoreDuplicates: true,
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        week: weekKey,
        total, resolved, pending, critical, high,
        sla_pct: slaPct, avg_mttr_min: avgMttr,
        top: top.map(([t, c]) => ({ type: t, count: c })),
        slack_status: slackStatus,
        notified_admins: notifRows.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("security-weekly-digest failed:", details);
    return new Response(
      JSON.stringify({ ok: false, error: "digest_failed", details }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});