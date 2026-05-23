import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  checkRateLimit, 
  getRateLimitIdentifier, 
  createRateLimitResponse,
  RATE_LIMITS 
} from "../_shared/rate-limiter.ts";
import { corsHeaders, verifyUser } from "../_shared/security.ts";


interface CompetencyData {
  area: string;
  value: number;
  maxValue: number;
  icon: string;
}

interface ModuleProgressItem {
  id: string;
  score: number | null;
  completed_at: string | null;
  module_id: string;
}

interface QuestAssignmentItem {
  id: string;
  completed_at: string | null;
  quest_id: string;
}

interface UserAchievementItem {
  id: string;
  achievement_id: string;
}

interface KudosItem {
  id: string;
  badge_id: string | null;
}

interface AttendanceStreakItem {
  current_streak: number;
  best_streak: number;
  total_punctual_days: number;
}

interface ProfileItem {
  id: string;
}

async function calculateUserCompetencies(supabase: SupabaseClient, userId: string): Promise<CompetencyData[]> {
  const competencies: CompetencyData[] = [];

  // Fetch completed modules
  const { data: moduleProgress } = await supabase
    .from("module_progress")
    .select("id, score, completed_at, module_id")
    .eq("user_id", userId)
    .not("completed_at", "is", null) as { data: ModuleProgressItem[] | null };

  // Fetch completed quests
  const { data: questAssignments } = await supabase
    .from("quest_assignments")
    .select("id, completed_at, quest_id")
    .eq("user_id", userId)
    .not("completed_at", "is", null) as { data: QuestAssignmentItem[] | null };

  // Fetch achievements
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("id, achievement_id")
    .eq("user_id", userId) as { data: UserAchievementItem[] | null };

  // Fetch kudos received
  const { data: kudosReceived } = await supabase
    .from("kudos")
    .select("id, badge_id")
    .eq("to_user_id", userId) as { data: KudosItem[] | null };

  // Fetch attendance streaks
  const { data: attendanceStreak } = await supabase
    .from("attendance_streaks")
    .select("current_streak, best_streak, total_punctual_days")
    .eq("user_id", userId)
    .maybeSingle() as { data: AttendanceStreakItem | null };

  // 1. Conhecimento Técnico
  const moduleScores = moduleProgress?.map((m) => m.score || 0) || [];
  const avgScore = moduleScores.length > 0 
    ? moduleScores.reduce((a: number, b: number) => a + b, 0) / moduleScores.length 
    : 0;
  const technicalValue = Math.min(100, (moduleProgress?.length || 0) * 10 + avgScore * 0.5);
  competencies.push({
    area: "Conhecimento Técnico",
    value: Math.round(technicalValue),
    maxValue: 100,
    icon: "📚"
  });

  // 2. Resolução de Problemas
  const problemSolvingValue = Math.min(100, (questAssignments?.length || 0) * 15);
  competencies.push({
    area: "Resolução de Problemas",
    value: Math.round(problemSolvingValue),
    maxValue: 100,
    icon: "🧩"
  });

  // 3. Colaboração
  const collaborationValue = Math.min(100, (kudosReceived?.length || 0) * 15);
  competencies.push({
    area: "Colaboração",
    value: Math.round(collaborationValue),
    maxValue: 100,
    icon: "🤝"
  });

  // 4. Disciplina
  const disciplineValue = Math.min(100, 
    (attendanceStreak?.current_streak || 0) * 5 + 
    (attendanceStreak?.total_punctual_days || 0) * 2
  );
  competencies.push({
    area: "Disciplina",
    value: Math.round(disciplineValue),
    maxValue: 100,
    icon: "⏰"
  });

  // 5. Liderança
  const leadershipValue = Math.min(100, (userAchievements?.length || 0) * 10 + (kudosReceived?.length || 0) * 5);
  competencies.push({
    area: "Liderança",
    value: Math.round(leadershipValue),
    maxValue: 100,
    icon: "👑"
  });

  // 6. Comunicação
  const communicationValue = Math.min(100, (moduleProgress?.length || 0) * 12);
  competencies.push({
    area: "Comunicação",
    value: Math.round(communicationValue),
    maxValue: 100,
    icon: "💬"
  });

  return competencies;
}

function getRecommendation(area: string): { trail: string; action: string } {
  const recommendations: Record<string, { trail: string; action: string }> = {
    "Conhecimento Técnico": {
      trail: "Complete mais módulos de treinamento",
      action: "Explore as trilhas de aprendizado disponíveis"
    },
    "Resolução de Problemas": {
      trail: "Participe de quests de maior dificuldade",
      action: "Aceite desafios medium e hard para desenvolver essa habilidade"
    },
    "Colaboração": {
      trail: "Interaja mais com colegas",
      action: "Envie kudos para reconhecer colegas e participe de desafios em equipe"
    },
    "Disciplina": {
      trail: "Mantenha consistência no check-in",
      action: "Faça check-in pontual diariamente para aumentar seu streak"
    },
    "Liderança": {
      trail: "Busque conquistas de liderança",
      action: "Participe de mentorias e complete desafios avançados"
    },
    "Comunicação": {
      trail: "Complete módulos de apresentação",
      action: "Finalize trilhas com conteúdo de vídeo e texto"
    }
  };
  return recommendations[area] || { trail: "Continue seu desenvolvimento", action: "Explore novas atividades" };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const identifier = getRateLimitIdentifier(req, "competency-alerts");
  const rateLimitResult = await checkRateLimit(identifier, RATE_LIMITS.standard);
  
  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for ${identifier}`);
    return createRateLimitResponse(rateLimitResult.retryAfter || 60, corsHeaders);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user JWT
    const authenticatedUser = await verifyUser(req);
    
    const { userId: bodyUserId, checkAllUsers } = await req.json();

    let usersToAnalyze: string[] = [];

    if (checkAllUsers) {
      // Admin only check
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authenticatedUser.id)
        .single();
        
      if (profile?.role !== 'admin') {
        return new Response(JSON.stringify({ error: "Unauthorized: Admin access required for batch analysis" }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Get all users for batch analysis (e.g., scheduled job)
      const { data: profiles } = await supabase.from('profiles').select('id') as { data: ProfileItem[] | null };
      usersToAnalyze = profiles?.map((p: ProfileItem) => p.id) || [];
    } else {
      // If userId is provided, ensure it matches authenticated user or user is admin
      const targetUserId = bodyUserId || authenticatedUser.id;
      
      if (bodyUserId && bodyUserId !== authenticatedUser.id) {
        // Check if admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authenticatedUser.id)
          .single();
          
        if (profile?.role !== 'admin') {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
      
      usersToAnalyze = [targetUserId];
    }


    const results: { userId: string; gaps: string[]; notificationsCreated: number }[] = [];

    for (const uid of usersToAnalyze) {
      const competencies = await calculateUserCompetencies(supabase, uid);
      const gaps = competencies.filter(c => c.value < 40);
      const criticalGaps = gaps.filter(c => c.value < 20);

      let notificationsCreated = 0;

      // Check if we already sent a gap notification today
      const today = new Date().toISOString().split('T')[0];
      const { data: existingNotifs } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', uid)
        .eq('type', 'competency_gap')
        .gte('created_at', `${today}T00:00:00.000Z`)
        .limit(1);

      if (existingNotifs && existingNotifs.length > 0) {
        // Already notified today, skip
        results.push({ userId: uid, gaps: gaps.map(g => g.area), notificationsCreated: 0 });
        continue;
      }

      // Create notifications for critical gaps
      if (criticalGaps.length > 0) {
        const gapAreas = criticalGaps.map(g => `${g.icon} ${g.area}`).join(', ');
        const recommendation = getRecommendation(criticalGaps[0].area);
        
        await supabase.from('notifications').insert({
          user_id: uid,
          type: 'competency_gap',
          title: '⚠️ Gaps de Competência Detectados',
          message: `Você tem ${criticalGaps.length} área(s) que precisam de atenção: ${gapAreas}`,
          data: {
            gaps: criticalGaps.map(g => ({ area: g.area, value: g.value, icon: g.icon })),
            recommendation: recommendation.action,
            suggestedTrail: recommendation.trail
          }
        });
        notificationsCreated++;
      }

      // Create development recommendation if there are moderate gaps
      const moderateGaps = gaps.filter(c => c.value >= 20 && c.value < 40);
      if (moderateGaps.length > 0 && criticalGaps.length === 0) {
        const recommendation = getRecommendation(moderateGaps[0].area);
        
        await supabase.from('notifications').insert({
          user_id: uid,
          type: 'development_tip',
          title: '💡 Dica de Desenvolvimento',
          message: `Desenvolva sua competência em ${moderateGaps[0].icon} ${moderateGaps[0].area}`,
          data: {
            area: moderateGaps[0].area,
            currentValue: moderateGaps[0].value,
            recommendation: recommendation.action,
            suggestedTrail: recommendation.trail
          }
        });
        notificationsCreated++;
      }

      // Celebrate strengths if all competencies are above 70%
      const allStrong = competencies.every(c => c.value >= 70);
      if (allStrong) {
        const { data: celebrationNotif } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', uid)
          .eq('type', 'competency_celebration')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (!celebrationNotif || celebrationNotif.length === 0) {
          await supabase.from('notifications').insert({
            user_id: uid,
            type: 'competency_celebration',
            title: '🌟 Competências Excelentes!',
            message: 'Parabéns! Todas as suas competências estão em nível excelente!',
            data: {
              competencies: competencies.map(c => ({ area: c.area, value: c.value }))
            }
          });
          notificationsCreated++;
        }
      }

      results.push({
        userId: uid,
        gaps: gaps.map(g => g.area),
        notificationsCreated
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      analyzed: usersToAnalyze.length,
      results 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Competency alerts error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
