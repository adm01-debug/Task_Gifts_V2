import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";


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

    const { days_to_keep = 30 } = await req.json().catch(() => ({}));

    console.log(`Starting security logs cleanup. Keeping last ${days_to_keep} days.`);

    // Use the database function for cleanup
    const { data, error } = await supabase.rpc("cleanup_old_security_logs", {
      p_days_to_keep: days_to_keep,
    });

    if (error) {
      console.error("Cleanup error:", error);
      throw error;
    }

    console.log("Cleanup completed:", data);

    // Log the cleanup action in audit logs
    await supabase.from("audit_logs").insert({
      action: "delete",
      entity_type: "security_logs",
      user_id: "00000000-0000-0000-0000-000000000000", // System user
      metadata: {
        cleanup_type: "scheduled",
        days_kept: days_to_keep,
        results: data,
      },
    });

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in cleanup-rate-limit-logs:", error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
