import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyUser, errorResponse } from "../_shared/security.ts";

interface AlertResult {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  affectedUsers?: number;
  data?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user JWT
    const user = await verifyUser(req);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin (optional but recommended for admin-alerts)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
      
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Unauthorized: Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const alerts: AlertResult[] = [];

    // 1. Check for inactive users (no activity in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from("profiles")
      .select("id, display_name, email, updated_at")
      .lt("updated_at", sevenDaysAgo.toISOString());

    if (!inactiveError && inactiveUsers && inactiveUsers.length > 0) {
      alerts.push({
        type: "inactive_users",
        severity: inactiveUsers.length > 10 ? "high" : "medium",
        title: "Usuários Inativos",
        message: `${inactiveUsers.length} usuário(s) não acessam a plataforma há mais de 7 dias`,
        affectedUsers: inactiveUsers.length,
        data: { users: inactiveUsers.slice(0, 10) },
      });
    }

    // 2. Check for users with zero XP (potentially inactive new users)
    const { data: zeroXpUsers, error: zeroXpError } = await supabase
      .from("profiles")
      .select("id, display_name, email, created_at")
      .eq("xp", 0)
      .eq("level", 1);

    if (!zeroXpError && zeroXpUsers && zeroXpUsers.length > 0) {
      alerts.push({
        type: "zero_engagement",
        severity: zeroXpUsers.length > 5 ? "medium" : "low",
        title: "Usuários Sem Engajamento",
        message: `${zeroXpUsers.length} usuário(s) ainda não ganharam nenhum XP`,
        affectedUsers: zeroXpUsers.length,
        data: { users: zeroXpUsers.slice(0, 10) },
      });
    }

    // 3. Check for broken streaks (users who had streak > 5 and now have 0)
    const { data: brokenStreaks, error: streakError } = await supabase
      .from("profiles")
      .select("id, display_name, email, streak, best_streak")
      .eq("streak", 0)
      .gt("best_streak", 5);

    if (!streakError && brokenStreaks && brokenStreaks.length > 0) {
      alerts.push({
        type: "broken_streaks",
        severity: "medium",
        title: "Streaks Interrompidos",
        message: `${brokenStreaks.length} usuário(s) quebraram sequências longas`,
        affectedUsers: brokenStreaks.length,
        data: { users: brokenStreaks.slice(0, 10) },
      });
    }

    // 4. Check for low attendance rate today
    const today = new Date().toISOString().split("T")[0];
    const { data: todayCheckins, error: checkinError } = await supabase
      .from("attendance_records")
      .select("id")
      .gte("check_in", `${today}T00:00:00`)
      .lte("check_in", `${today}T23:59:59`);

    const { count: totalUsers } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (!checkinError && totalUsers && totalUsers > 0) {
      const checkinRate = ((todayCheckins?.length || 0) / totalUsers) * 100;
      if (checkinRate < 50) {
        alerts.push({
          type: "low_attendance",
          severity: checkinRate < 30 ? "high" : "medium",
          title: "Taxa de Check-in Baixa",
          message: `Apenas ${checkinRate.toFixed(1)}% dos usuários fizeram check-in hoje`,
          data: { rate: checkinRate, checkins: todayCheckins?.length || 0, total: totalUsers },
        });
      }
    }

    // 5. Check for pending shop purchases
    const { data: pendingPurchases, error: purchaseError } = await supabase
      .from("shop_purchases")
      .select("id, created_at")
      .eq("status", "pending");

    if (!purchaseError && pendingPurchases && pendingPurchases.length > 0) {
      // Check for old pending purchases (more than 3 days)
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      const oldPending = pendingPurchases.filter(
        (p) => new Date(p.created_at) < threeDaysAgo
      );

      if (oldPending.length > 0) {
        alerts.push({
          type: "pending_purchases",
          severity: oldPending.length > 5 ? "high" : "medium",
          title: "Compras Pendentes",
          message: `${oldPending.length} compra(s) aguardando processamento há mais de 3 dias`,
          data: { count: oldPending.length },
        });
      }
    }

    // 6. Check for expiring certifications
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringCerts, error: certError } = await supabase
      .from("user_certifications")
      .select("id, user_id, expires_at")
      .eq("status", "active")
      .lte("expires_at", thirtyDaysFromNow.toISOString())
      .gt("expires_at", new Date().toISOString());

    if (!certError && expiringCerts && expiringCerts.length > 0) {
      alerts.push({
        type: "expiring_certifications",
        severity: expiringCerts.length > 10 ? "high" : "medium",
        title: "Certificações Expirando",
        message: `${expiringCerts.length} certificação(ões) expirarão nos próximos 30 dias`,
        affectedUsers: expiringCerts.length,
      });
    }

    // 7. Check for unusual activity spikes (anomaly detection)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentLogs } = await supabase
      .from("audit_logs")
      .select("id, action")
      .gte("created_at", yesterday.toISOString());

    const { data: weekLogs } = await supabase
      .from("audit_logs")
      .select("id")
      .gte("created_at", weekAgo.toISOString())
      .lt("created_at", yesterday.toISOString());

    if (recentLogs && weekLogs) {
      const dailyAverage = weekLogs.length / 6;
      if (recentLogs.length > dailyAverage * 3 && dailyAverage > 0) {
        alerts.push({
          type: "activity_spike",
          severity: "low",
          title: "Pico de Atividade",
          message: `Atividade ${(recentLogs.length / dailyAverage).toFixed(1)}x acima da média`,
          data: { today: recentLogs.length, average: dailyAverage },
        });
      }
    }

    // Sort alerts by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Alerts generated and sorted by severity

    return new Response(JSON.stringify({ alerts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin alerts error:", error);
    return errorResponse(error);
  }
});
