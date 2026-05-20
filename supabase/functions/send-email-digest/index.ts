import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders, verifyServiceRole } from "../_shared/security.ts";



interface DigestData {
  userId: string;
  email: string;
  name: string;
  xpGained: number;
  coinsEarned: number;
  questsCompleted: number;
  achievementsUnlocked: number;
  streakDays: number;
  rank: number;
  rankChange: number;
  topAchievements: Array<{ name: string; icon: string }>;
  upcomingDeadlines: Array<{ title: string; dueDate: string }>;
}

const generateEmailHTML = (data: DigestData): string => {
  const rankChangeIcon = data.rankChange > 0 ? "📈" : data.rankChange < 0 ? "📉" : "➡️";
  const rankChangeText = data.rankChange > 0 ? `+${data.rankChange}` : data.rankChange.toString();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu Resumo Semanal</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #1a1a2e; }
    .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .header p { color: rgba(255,255,255,0.9); margin: 10px 0 0; }
    .content { padding: 30px 20px; }
    .greeting { color: #e0e0e0; font-size: 18px; margin-bottom: 20px; }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(255,255,255,0.1); }
    .stat-icon { font-size: 32px; margin-bottom: 10px; }
    .stat-value { color: #fff; font-size: 24px; font-weight: bold; }
    .stat-label { color: #a0a0a0; font-size: 12px; text-transform: uppercase; }
    .highlight-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; padding: 25px; margin-bottom: 25px; }
    .highlight-title { color: white; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
    .rank-display { display: flex; align-items: center; justify-content: center; gap: 20px; }
    .rank-number { color: white; font-size: 48px; font-weight: bold; }
    .rank-change { color: rgba(255,255,255,0.9); font-size: 18px; }
    .achievements-section { margin-bottom: 25px; }
    .section-title { color: #e0e0e0; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
    .achievement-list { display: flex; gap: 10px; flex-wrap: wrap; }
    .achievement-badge { background: rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 15px; color: #fff; font-size: 14px; }
    .deadlines-section { margin-bottom: 25px; }
    .deadline-item { background: rgba(255,193,7,0.1); border-left: 3px solid #ffc107; padding: 12px 15px; margin-bottom: 10px; border-radius: 0 8px 8px 0; }
    .deadline-title { color: #fff; font-size: 14px; }
    .deadline-date { color: #ffc107; font-size: 12px; margin-top: 5px; }
    .cta-button { display: block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 30px; border-radius: 25px; text-align: center; font-weight: bold; margin: 30px auto; max-width: 250px; }
    .footer { text-align: center; padding: 30px 20px; color: #666; font-size: 12px; }
    .footer a { color: #667eea; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Resumo Semanal</h1>
      <p>Sua jornada de gamificação</p>
    </div>
    
    <div class="content">
      <p class="greeting">Olá, ${data.name}! 👋</p>
      <p style="color: #a0a0a0; margin-bottom: 25px;">Veja como foi sua semana na plataforma:</p>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">⚡</div>
          <div class="stat-value">${data.xpGained.toLocaleString()}</div>
          <div class="stat-label">XP Ganho</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🪙</div>
          <div class="stat-value">${data.coinsEarned.toLocaleString()}</div>
          <div class="stat-label">Moedas</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🎯</div>
          <div class="stat-value">${data.questsCompleted}</div>
          <div class="stat-label">Missões</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-value">${data.streakDays}</div>
          <div class="stat-label">Dias de Streak</div>
        </div>
      </div>
      
      <div class="highlight-card">
        <div class="highlight-title">🏆 Sua Posição no Ranking</div>
        <div class="rank-display">
          <div class="rank-number">#${data.rank}</div>
          <div class="rank-change">${rankChangeIcon} ${rankChangeText} posições</div>
        </div>
      </div>
      
      ${data.topAchievements.length > 0 ? `
      <div class="achievements-section">
        <div class="section-title">🏅 Conquistas Desbloqueadas</div>
        <div class="achievement-list">
          ${data.topAchievements.map(a => `<div class="achievement-badge">${a.icon} ${a.name}</div>`).join('')}
        </div>
      </div>
      ` : ''}
      
      ${data.upcomingDeadlines.length > 0 ? `
      <div class="deadlines-section">
        <div class="section-title">⏰ Próximos Prazos</div>
        ${data.upcomingDeadlines.map(d => `
          <div class="deadline-item">
            <div class="deadline-title">${d.title}</div>
            <div class="deadline-date">${d.dueDate}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
      
      <a href="#" class="cta-button">Ver Dashboard Completo →</a>
    </div>
    
    <div class="footer">
      <p>Você está recebendo este email porque ativou o resumo semanal.</p>
      <p><a href="#">Gerenciar preferências</a> | <a href="#">Cancelar inscrição</a></p>
    </div>
  </div>
</body>
</html>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify service role or internal secret for cron job
    verifyServiceRole(req);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, sendToAll } = await req.json();

    // Get users to send digest to
    let usersQuery = supabase
      .from("profiles")
      .select("id, full_name, email, digest_enabled")
      .eq("digest_enabled", true);

    if (userId && !sendToAll) {
      usersQuery = usersQuery.eq("id", userId);
    }

    const { data: users, error: usersError } = await usersQuery;

    if (usersError) throw usersError;

    const results = [];

    for (const user of users || []) {
      // Get user stats for the past week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Get XP transactions
      const { data: xpData } = await supabase
        .from("xp_transactions")
        .select("xp_amount")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString());

      const xpGained = xpData?.reduce((sum, t) => sum + (t.xp_amount || 0), 0) || 0;

      // Get coin transactions
      const { data: coinData } = await supabase
        .from("coin_transactions")
        .select("amount")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString())
        .gt("amount", 0);

      const coinsEarned = coinData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

      // Get completed quests
      const { count: questsCompleted } = await supabase
        .from("user_quests")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed")
        .gte("completed_at", weekAgo.toISOString());

      // Get unlocked achievements
      const { data: achievements } = await supabase
        .from("user_achievements")
        .select("achievements(name, icon)")
        .eq("user_id", user.id)
        .gte("unlocked_at", weekAgo.toISOString())
        .limit(5);

      // Get user's current streak
      const { data: streakData } = await supabase
        .from("attendance_streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .single();

      // Get user's rank
      const { data: rankData } = await supabase
        .from("profiles")
        .select("id")
        .order("xp", { ascending: false });

      const rank = (rankData?.findIndex(p => p.id === user.id) || 0) + 1;

      const digestData: DigestData = {
        userId: user.id,
        email: user.email || "",
        name: user.full_name || "Usuário",
        xpGained,
        coinsEarned,
        questsCompleted: questsCompleted || 0,
        achievementsUnlocked: achievements?.length || 0,
        streakDays: streakData?.current_streak || 0,
        rank,
        rankChange: 0,
        topAchievements: achievements?.map((a: Record<string, unknown>) => {
          const ach = a.achievements as { name?: string; icon?: string } | null;
          return {
            name: ach?.name || "",
            icon: ach?.icon || "🏆"
          };
        }) || [],
        upcomingDeadlines: []
      };

      const emailHTML = generateEmailHTML(digestData);

      // Log the digest (in production, integrate with email service)
      console.log(`Digest generated for ${user.email}`);

      results.push({
        userId: user.id,
        email: user.email,
        status: "generated",
        stats: {
          xpGained,
          coinsEarned,
          questsCompleted: questsCompleted || 0
        }
      });
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating digest:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
