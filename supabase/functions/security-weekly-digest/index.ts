// Edge Function: security-weekly-digest
// Digest semanal de seguranca (pg_cron 0 13 * * 1): consolida alertas dos
// ultimos 7 dias, calcula SLA/MTTR agregados e publica no Slack (opt-in via
// SLACK_ALERT_WEBHOOK_URL) e como notificacao in-app para todos os admins.
// Idempotente por semana ISO (upsert ignorando duplicatas por (user_id,type,data)).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * Guarda para chamadores internos (pg_cron): aceita o segredo em
 * `x-internal-secret` (header que os crons 30-34 enviam) OU o padrao
 * `Authorization: Bearer <segredo>` usado pelo restante das funcoes.
 * Comparacao timing-safe contra SERVICE_ROLE/CRON_SECRET/INTERNAL_FUNCTION_SECRET.
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
  // A funcao publica com efeito colateral (notificacoes) e chamada apenas por cron (POST),
  // igual ao restante das funcoes de cron do repo. GET tambem e rejeitado para manter
  // idempotencia de leitura (nenhum cliente le via essa rota).
  if (req.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);
  const denied = guardInternalRequest(req);
  if (denied) return denied;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRole, { auth: { persistSession: false } });

  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const weekKey = isoWeekKey(new Date());

    const { data: alerts, error: alertsError } = await admin
      .from("security_alerts")
      .select("id, alert_type, severity, is_resolved, created_at, resolved_at")
      .gte("created_at", since)
      .returns<AlertRow[]>();
    if (alertsError)
      return json({ ok: false, error: "alerts_query_failed", details: alertsError.message }, 500);

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
    // SLA e a fracao resolvidos/total (metricas de resolucao, nao de prazo): o repo nao
    // persiste se um alerta estourou o prazo, entao % de resolvidos e o indicador
    // disponivel e consistente com a UI (SecurityDigests.tsx mostra sla_pct).
    const slaPct = total > 0 ? Math.round((resolved / total) * 1000) / 10 : 100;
    const slaEmoji = slaPct >= slaTarget ? "\u{1F7E2}" : slaPct >= 85 ? "\u{1F7E1}" : "\u{1F534}";

    const lines: string[] = [
      `*\u{1F6E1}\u{FE0F} Digest Semanal de Seguranca \u2014 ${weekKey}*`,
      `${slaEmoji} SLA: *${slaPct}%* (alvo ${slaTarget}%)  \u2022  MTTR medio: *${avgMttr ?? "\u2014"} min*`,
      `Total: *${total}*  \u2022  Resolvidos: *${resolved}*  \u2022  Pendentes: *${pending}*  \u2022  Criticos: *${critical}*  \u2022  Altos: *${high}*`,
    ];
    if (top.length > 0) {
      lines.push("*Top tipos de alerta:*");
      top.forEach(([t, c]) => lines.push(`  \u2022 \`${t}\` \u2014 ${c}`));
    }
    const message = lines.join("\n");

    // Idempotencia semanal: se a semana ja foi publicada (para qualquer admin),
    // nao republica nem reenvia ao Slack. O indice unico e de expressao
    // UNIQUE(user_id,type,((data)::text)); se as metricas mudarem entre
    // reexecucoes o JSON diverge e o on-conflict nao deduplica (por isso a
    // checagem explicita por week_key antes de gravar qualquer coisa).
    const { count: weekExists, error: existsError } = await admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("type", "security_weekly_digest")
      .eq("data->>week_key", weekKey);
    if (existsError)
      return json({ ok: false, error: "already_published_check_failed", details: existsError.message }, 500);

    // Notificacao in-app para admins ANTES do Slack (canal opcional): o digest interno
    // nao pode depender de uma integracao externa. Publica primeiro, Slack depois.
    const { data: admins, error: adminsError } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    if (adminsError)
      return json({ ok: false, error: "admins_query_failed", details: adminsError.message }, 500);

    const notifRows = (admins ?? []).map((a: { user_id: string }) => ({
      user_id: a.user_id,
      type: "security_weekly_digest",
      title: `Digest de seguranca \u2014 ${weekKey}`,
      message: `SLA ${slaPct}% \u2022 MTTR ${avgMttr ?? "\u2014"}min \u2022 ${pending} pendentes de ${total}`,
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

    let notifiedAdmins = 0;
    if ((weekExists ?? 0) === 0 && notifRows.length > 0) {
      // ON CONFLICT DO NOTHING sem arbiter: o indice unico de prod e de expressao
      // (user_id, type, (data)::text) e o PostgREST nao aceita coluna `data` como
      // onConflict. Dedup por (user_id,type,data) sai do indice de expressao.
      const { error: upsertError } = await admin.from("notifications").upsert(notifRows, { ignoreDuplicates: true });
      if (upsertError)
        return json({ ok: false, error: "notifications_upsert_failed", details: upsertError.message }, 500);
      notifiedAdmins = notifRows.length;
    }

    // Slack opt-in: entregue por ultimo e registrado no mesmo metadata do digest.
    // Falha aqui nao apaga o que ja foi publicado internamente.
    const slackUrl = Deno.env.get("SLACK_ALERT_WEBHOOK_URL");
    let slackStatus: number | null = null;
    if ((weekExists ?? 0) === 0 && slackUrl) {
      try {
        const r = await fetch(slackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message }),
        });
        slackStatus = r.status;
      } catch (err) {
        console.error("security-weekly-digest: slack send failed", err instanceof Error ? err.message : String(err));
      }
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
      notified_admins: notifiedAdmins,
    });
  } catch (err) {
    const details = err instanceof Error ? err.message : String(err);
    console.error("security-weekly-digest failed:", details);
    return json({ ok: false, error: "digest_failed", details }, 500);
  }
});
