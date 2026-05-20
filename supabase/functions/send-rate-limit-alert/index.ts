import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";


interface RateLimitAlertPayload {
  ip_address: string;
  endpoint: string;
  request_count: number;
  block_duration_minutes?: number;
  alert_type?: "rate_limit_exceeded" | "brute_force" | "suspicious";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify service role or internal secret
    verifyServiceRole(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: RateLimitAlertPayload = await req.json();

    console.log("Rate limit alert received:", payload);

    const { ip_address, endpoint, request_count, block_duration_minutes = 15, alert_type = "rate_limit_exceeded" } = payload;

    // 1. Auto-block the IP
    const { data: blockData, error: blockError } = await supabase.rpc("auto_block_ip", {
      p_ip_address: ip_address,
      p_reason: `Rate limit excedido: ${request_count} requisições em ${endpoint}`,
      p_block_type: alert_type === "brute_force" ? "brute_force" : "rate_limit",
      p_duration_minutes: block_duration_minutes,
    });

    if (blockError) {
      console.error("Error blocking IP:", blockError);
    } else {
      console.log("IP blocked:", blockData);
    }

    // 2. Log the rate limit violation
    const { error: logError } = await supabase.from("rate_limit_logs").insert({
      ip_address,
      endpoint,
      method: "ALERT",
      request_count,
      was_blocked: true,
    });

    if (logError) {
      console.error("Error logging rate limit:", logError);
    }

    // 3. Get admin users to notify (optional - for email alerts in the future)
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    // 4. Create in-app notifications for admins
    if (admins && admins.length > 0) {
      const notifications = admins.map((admin) => ({
        user_id: admin.user_id,
        title: "⚠️ Alerta de Segurança",
        message: `IP ${ip_address} bloqueado por ${alert_type}. ${request_count} requisições em ${endpoint}.`,
        type: "security_alert",
        metadata: { ip_address, endpoint, request_count, alert_type },
      }));

      // Insert notifications if table exists
      try {
        await supabase.from("notifications").insert(notifications);
      } catch {
        console.log("Notifications table not available, skipping");
      }
    }

    // 5. Determine severity based on violation count
    const { data: existingBlock } = await supabase
      .from("blocked_ips")
      .select("violation_count")
      .eq("ip_address", ip_address)
      .single();

    const violationCount = existingBlock?.violation_count || 1;
    let severity = "medium";
    if (violationCount >= 5) severity = "critical";
    else if (violationCount >= 3) severity = "high";

    console.log(`Alert processed. IP: ${ip_address}, Violations: ${violationCount}, Severity: ${severity}`);

    return new Response(
      JSON.stringify({
        success: true,
        ip_blocked: true,
        violation_count: violationCount,
        severity,
        block_duration_minutes,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-rate-limit-alert:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
