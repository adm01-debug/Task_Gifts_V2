import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";

interface AlertPayload {
  alert_id?: string;
  alert_type: string;
  severity: string;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
}

const SEVERITY_EMOJI: Record<string, string> = {
  critical: "🚨",
  high: "🔴",
  medium: "🟡",
  low: "🔵",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#eab308",
  low: "#3b82f6",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    verifyServiceRole(req);

    const payload: AlertPayload = await req.json();
    const severity = (payload.severity || "medium").toLowerCase();

    // Only escalate high/critical
    if (!["high", "critical"].includes(severity)) {
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: "severity_below_threshold" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const results: Record<string, unknown> = {
      slack: "skipped",
      in_app_notifications: 0,
    };

    // 1) Slack webhook (opt-in via SLACK_ALERT_WEBHOOK_URL)
    const slackUrl = Deno.env.get("SLACK_ALERT_WEBHOOK_URL");
    if (slackUrl) {
      const emoji = SEVERITY_EMOJI[severity] ?? "⚠️";
      const color = SEVERITY_COLOR[severity] ?? "#eab308";
      const slackBody = {
        attachments: [
          {
            color,
            title: `${emoji} [${severity.toUpperCase()}] ${payload.title}`,
            text: payload.description || "",
            fields: [
              { title: "Tipo", value: payload.alert_type, short: true },
              { title: "Alert ID", value: payload.alert_id ?? "-", short: true },
            ],
            footer: "Task Gifts Security",
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      };
      try {
        const resp = await fetch(slackUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(slackBody),
        });
        results.slack = resp.ok ? "sent" : `failed:${resp.status}`;
      } catch (err) {
        results.slack = `error:${err instanceof Error ? err.message : "unknown"}`;
      }
    }

    // 2) In-app notifications for admins
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (admins && admins.length > 0) {
      const rows = admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        type: "security",
        title: `${SEVERITY_EMOJI[severity] ?? "⚠️"} ${payload.title}`,
        message: payload.description ?? `Novo alerta crítico: ${payload.alert_type}`,
        data: {
          alert_id: payload.alert_id,
          alert_type: payload.alert_type,
          severity,
          metadata: payload.metadata ?? {},
        },
      }));
      const { error } = await supabase.from("notifications").insert(rows);
      if (!error) results.in_app_notifications = rows.length;
      else results.in_app_error = error.message;
    }

    return new Response(
      JSON.stringify({ success: true, severity, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("dispatch-critical-alert error:", message);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});