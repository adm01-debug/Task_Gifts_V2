// Edge Function: security-weekly-digest
// Digest semanal de segurança (pg_cron 0 13 * * 1): consolida alertas dos
// últimos 7 dias, calcula SLA/MTTR agregados e publica no Slack (opt-in via
// SLACK_ALERT_WEBHOOK_URL) e como notificação in-app para todos os admins.
// Idempotente por semana ISO (upsert ignorando duplicatas por (user_id,type,data)).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Guarda para chamadores internos (pg_cron): aceita o segredo em
 * `x-internal-secret` (header que os crons 30-34 enviam) OU o padrão
 * `Authorization: Bearer <segredo>` usado pelo restante das funções.
 * Comparação timing-safe contra SERVICE_ROLE/CRON_SECRET/INTERNAL_FUNCTION_SECRET.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  let diff = bufA.length ^ bufB.length;
  const len = Math.max(bufA.length, bufB.length);
  for (let i = 0; i < len; i++) diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  return diff === 0;
}

function guardInternalRequest(req: Request): Response | null {
  const raw =
    req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ??
    req.headers.get("x-internal-secret") ??
    "";
  const token = raw.trim();
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const accepted = [
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    Deno.env.get("CRON_SECRET"),
    Deno.env.get("INTERNAL_FUNCTION_SECRET"),
  ].filter((v): v is string => typeof v === "string" && v.length > 0);
  let ok = false;
  for (const secret of accepted) if (timingSafeEqual(token, secret)) ok = true;
  if (!ok) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return null;
}

interface AlertRow {
  id: string;
  alert_type: string;
  severity: string;
  is_resolved: boolean;
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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = guardInternalRequest(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekKey = isoWeekKey(new Date());

    const { data: alerts, error } = await admin
      .from("security_alerts")
      .select("id, alert_type, severity, is_resolved, created_at, resolved_at")
      .gte("created_at", since)
      .returns<AlertRow[]>();
    if (error) throw error;

    const total = alerts?.length ?? 0;
    const resolved = alerts?.filter((a) => a.is_resolved).length ?? 0;
    const pending = total - resolved;
    const critical = alerts?.filter((a) => a.severity === "critical").length ?? 0;
    const high = alerts?.filter((a) => a.severity === "high").length ?? 0;

    const mttrs = (alerts ?? [])
      .filter((a) => a.is_resolved && a.resolved_at)
      .map((a) => (new Date(a.resolved_at!).getTime() - new Date(a.created_at).getTime()) / 60000);
    const avgMttr = mttrs.length ? Math.round(mttrs.reduce((s, v) => s + v, 0) / mttrs.length) : null;

    const byType = new Map<string, number>();
    (alerts ?? []).forEach((a) => byType.set(a.alert_type, (byType.get(a.alert_type) ?? 0) + 1));
    const top = [...byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

    const slaTarget = 95;
    const slaPct = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 100;
    const slaEmoji = slaPct >= slaTarget ? "\u{1F7E2}" : slaPct >= 85 ? "\u{1F7E1}" : "\u{1F534}";

    const lines: string[] = [
      `*\u{1F6E1}\u{FE0F} Digest Semanal de Segurança — ${weekKey}*`,
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
      data: {
        week_key: weekKey,
        sla_pct: slaPct,
        avg_mttr_min: avgMttr,
        total,
        pending,
        critical,
        high,
        top: top.map(([t, c]) => ({ type: t, count: c })),
        link: "/admin/security-runbook",
      },
    }));

    if (notifRows.length > 0) {
      // ON CONFLICT DO NOTHING sem arbiter: o índice único de prod é de expressão
      // (user_id, type, (data)::text) e o PostgREST não aceita coluna `data` como
      // onConflict. Dedup por (user_id,type,data) sai do índice de expressão.
      await admin.from("notifications").upsert(notifRows, { ignoreDuplicates: true });
    }

    return json({
      ok: true,
      week: weekKey,
      total,
      resolved,
      pending,
      critical,
      high,
      sla_pct: slaPct,
      avg_mttr_min: avgMttr,
      top: top.map(([t, c]) => ({ type: t, count: c })),
      slack_status: slackStatus,
      notified_admins: notifRows.length,
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("security-weekly-digest failed:", details);
    return json({ ok: false, error: "digest_failed", details }, 500);
  }
});