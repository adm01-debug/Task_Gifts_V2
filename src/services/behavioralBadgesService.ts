import { supabase } from "@/integrations/supabase/client";
import { achievementsService } from "./achievementsService";
import { logger } from "./loggingService";

export interface BehaviorMetrics {
  userId: string;
  feedbacksGiven: number;
  feedbacksReceived: number;
  checkinsCompleted: number;
  consecutiveCheckinsWeeks: number;
  pulsesResponded: number;
  consecutivePulsesWeeks: number;
  oneOnOnesAttended: number;
  goalsCompleted: number;
  goalsOnTrack: number;
  totalGoals: number;
  coursesCompleted: number;
  pdiActionsCompleted: number;
  socialPostsCreated: number;
  socialReactionsGiven: number;
  earlyCheckins: number;
  lateNightActivity: number;
  weekendActivity: number;
  helpfulComments: number;
  mentorSessions: number;
}

export interface BehavioralBadge {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
   xpReward: number;
   coinReward: number;
   condition: (metrics: BehaviorMetrics) => boolean;
}

// Definição de todos os badges comportamentais
export const BEHAVIORAL_BADGES: BehavioralBadge[] = [
  // === FEEDBACK CHAMPION ===
  {
    key: "feedback_champion_bronze",
    name: "Feedback Champion Bronze",
    description: "Deu 10 feedbacks construtivos",
    icon: "MessageSquare",
    category: "feedback",
    rarity: "common",
    xpReward: 50,
    coinReward: 25,
    condition: (m) => m.feedbacksGiven >= 10
  },
  {
    key: "feedback_champion_silver",
    name: "Feedback Champion Prata",
    description: "Deu 50 feedbacks construtivos",
    icon: "MessageSquare",
    category: "feedback",
    rarity: "rare",
    xpReward: 150,
    coinReward: 75,
    condition: (m) => m.feedbacksGiven >= 50
  },
  {
    key: "feedback_champion_gold",
    name: "Feedback Champion Ouro",
    description: "Deu 100 feedbacks construtivos",
    icon: "MessageSquare",
    category: "feedback",
    rarity: "epic",
    xpReward: 300,
    coinReward: 150,
    condition: (m) => m.feedbacksGiven >= 100
  },

  // === CHECKIN MASTER ===
  {
    key: "checkin_regular",
    name: "Check-in Regular",
    description: "Completou 4 semanas seguidas de check-ins",
    icon: "CalendarCheck",
    category: "engagement",
    rarity: "common",
    xpReward: 75,
    coinReward: 40,
    condition: (m) => m.consecutiveCheckinsWeeks >= 4
  },
  {
    key: "checkin_dedicated",
    name: "Check-in Dedicado",
    description: "Completou 12 semanas seguidas de check-ins",
    icon: "CalendarCheck",
    category: "engagement",
    rarity: "rare",
    xpReward: 200,
    coinReward: 100,
    condition: (m) => m.consecutiveCheckinsWeeks >= 12
  },
  {
    key: "checkin_master",
    name: "Mestre do Check-in",
    description: "Completou 52 semanas seguidas de check-ins (1 ano!)",
    icon: "CalendarCheck",
    category: "engagement",
    rarity: "legendary",
    xpReward: 1000,
    coinReward: 500,
    condition: (m) => m.consecutiveCheckinsWeeks >= 52
  },

  // === PULSE RESPONDER ===
  {
    key: "pulse_voice",
    name: "Voz Ativa",
    description: "Respondeu 20 pulses de sentimento",
    icon: "Heart",
    category: "engagement",
    rarity: "common",
    xpReward: 50,
    coinReward: 25,
    condition: (m) => m.pulsesResponded >= 20
  },
  {
    key: "pulse_consistent",
    name: "Pulso Constante",
    description: "Respondeu pulses por 8 semanas seguidas",
    icon: "Activity",
    category: "engagement",
    rarity: "rare",
    xpReward: 150,
    coinReward: 75,
    condition: (m) => m.consecutivePulsesWeeks >= 8
  },

  // === 1-ON-1 CHAMPION ===
  {
    key: "one_on_one_starter",
    name: "Comunicador Iniciante",
    description: "Participou de 5 reuniões 1-on-1",
    icon: "Users",
    category: "communication",
    rarity: "common",
    xpReward: 50,
    coinReward: 25,
    condition: (m) => m.oneOnOnesAttended >= 5
  },
  {
    key: "one_on_one_pro",
    name: "Comunicador Pro",
    description: "Participou de 25 reuniões 1-on-1",
    icon: "Users",
    category: "communication",
    rarity: "rare",
    xpReward: 200,
    coinReward: 100,
    condition: (m) => m.oneOnOnesAttended >= 25
  },
  {
    key: "one_on_one_master",
    name: "Mestre da Comunicação",
    description: "Participou de 100 reuniões 1-on-1",
    icon: "Users",
    category: "communication",
    rarity: "epic",
    xpReward: 400,
    coinReward: 200,
    condition: (m) => m.oneOnOnesAttended >= 100
  },

  // === GOAL CRUSHER ===
  {
    key: "goal_first",
    name: "Primeiro Objetivo",
    description: "Completou seu primeiro objetivo",
    icon: "Target",
    category: "performance",
    rarity: "common",
    xpReward: 50,
    coinReward: 25,
    condition: (m) => m.goalsCompleted >= 1
  },
  {
    key: "goal_crusher",
    name: "Destruidor de Metas",
    description: "Completou 10 objetivos",
    icon: "Target",
    category: "performance",
    rarity: "rare",
    xpReward: 250,
    coinReward: 125,
    condition: (m) => m.goalsCompleted >= 10
  },
  {
    key: "goal_perfectionist",
    name: "Perfeccionista",
    description: "Manteve 100% dos objetivos em dia por 30 dias",
    icon: "Award",
    category: "performance",
    rarity: "epic",
    xpReward: 500,
    coinReward: 250,
    condition: (m) => m.totalGoals > 0 && m.goalsOnTrack === m.totalGoals
  },

  // === LIFELONG LEARNER ===
  {
    key: "learner_curious",
    name: "Curioso",
    description: "Completou 3 cursos",
    icon: "BookOpen",
    category: "learning",
    rarity: "common",
    xpReward: 75,
    coinReward: 40,
    condition: (m) => m.coursesCompleted >= 3
  },
  {
    key: "learner_dedicated",
    name: "Estudante Dedicado",
    description: "Completou 10 cursos",
    icon: "GraduationCap",
    category: "learning",
    rarity: "rare",
    xpReward: 200,
    coinReward: 100,
    condition: (m) => m.coursesCompleted >= 10
  },
  {
    key: "learner_master",
    name: "Mestre do Conhecimento",
    description: "Completou 25 cursos",
    icon: "Trophy",
    category: "learning",
    rarity: "epic",
    xpReward: 500,
    coinReward: 250,
    condition: (m) => m.coursesCompleted >= 25
  },

  // === PDI CHAMPION ===
  {
    key: "pdi_starter",
    name: "Desenvolvedor Iniciante",
    description: "Completou 3 ações do PDI",
    icon: "TrendingUp",
    category: "development",
    rarity: "common",
    xpReward: 75,
    coinReward: 40,
    condition: (m) => m.pdiActionsCompleted >= 3
  },
  {
    key: "pdi_dedicated",
    name: "Desenvolvedor Dedicado",
    description: "Completou 10 ações do PDI",
    icon: "TrendingUp",
    category: "development",
    rarity: "rare",
    xpReward: 200,
    coinReward: 100,
    condition: (m) => m.pdiActionsCompleted >= 10
  },
  {
    key: "pdi_transformed",
    name: "Transformação Pessoal",
    description: "Completou 25 ações do PDI",
    icon: "Sparkles",
    category: "development",
    rarity: "epic",
    xpReward: 400,
    coinReward: 200,
    condition: (m) => m.pdiActionsCompleted >= 25
  },

  // === SOCIAL BUTTERFLY ===
  {
    key: "social_starter",
    name: "Social Iniciante",
    description: "Criou 5 posts no feed social",
    icon: "Share2",
    category: "social",
    rarity: "common",
    xpReward: 50,
    coinReward: 25,
    condition: (m) => m.socialPostsCreated >= 5
  },
  {
    key: "social_influencer",
    name: "Influenciador",
    description: "Criou 25 posts e deu 100 reações",
    icon: "Star",
    category: "social",
    rarity: "rare",
    xpReward: 200,
    coinReward: 100,
    condition: (m) => m.socialPostsCreated >= 25 && m.socialReactionsGiven >= 100
  },

  // === EARLY BIRD ===
  {
    key: "early_bird",
    name: "Madrugador",
    description: "Fez check-in antes das 8h por 10 dias",
    icon: "Sunrise",
    category: "lifestyle",
    rarity: "rare",
    xpReward: 150,
    coinReward: 75,
    condition: (m) => m.earlyCheckins >= 10
  },

  // === NIGHT OWL ===
  {
    key: "night_owl",
    name: "Coruja Noturna",
    description: "Atividade após as 22h por 10 dias",
    icon: "Moon",
    category: "lifestyle",
    rarity: "rare",
    xpReward: 100,
    coinReward: 50,
    condition: (m) => m.lateNightActivity >= 10
  },

  // === MENTOR ===
  {
    key: "mentor_starter",
    name: "Mentor Iniciante",
    description: "Conduziu 3 sessões de mentoria",
    icon: "Lightbulb",
    category: "mentorship",
    rarity: "rare",
    xpReward: 200,
    coinReward: 100,
    condition: (m) => m.mentorSessions >= 3
  },
  {
    key: "mentor_master",
    name: "Mentor Master",
    description: "Conduziu 20 sessões de mentoria",
    icon: "Crown",
    category: "mentorship",
    rarity: "legendary",
    xpReward: 750,
    coinReward: 375,
    condition: (m) => m.mentorSessions >= 20
  },

  // === HELPER ===
  {
    key: "helpful_hand",
    name: "Mão Amiga",
    description: "Fez 20 comentários construtivos",
    icon: "HandHeart",
    category: "social",
    rarity: "common",
    xpReward: 75,
    coinReward: 40,
    condition: (m) => m.helpfulComments >= 20
  },
];

export const behavioralBadgesService = {
  async getUserMetrics(userId: string): Promise<BehaviorMetrics> {
    const [
      feedbacksGiven,
      feedbacksReceived,
      checkinsData,
      pulsesData,
      oneOnOnesData,
      goalsData,
      coursesData,
      pdiData,
      socialData,
      attendanceData,
      mentorData,
      commentsData,
    ] = await Promise.all([
      // Feedbacks dados
      supabase
        .from("kudos")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", userId),
      
      // Feedbacks recebidos
      supabase
        .from("kudos")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId),
      
      // Check-ins
      supabase
        .from("checkins")
        .select("completed_at")
        .eq("employee_id", userId)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false }),
      
      // Pulses (mood tracker)
      supabase
        .from("mood_entries")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      
      // 1-on-1s
      supabase
        .from("checkins")
        .select("*", { count: "exact", head: true })
        .or(`employee_id.eq.${userId},manager_id.eq.${userId}`)
        .eq("status", "completed"),
      
      // Goals
      supabase
        .from("goals")
        .select("status")
        .eq("user_id", userId),
      
      // Cursos (trail enrollments)
      supabase
        .from("trail_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("completed_at", "is", null),
      
      // PDI actions
      supabase
        .from("development_plan_actions")
        .select("status, plan:development_plans!inner(user_id)")
        .eq("development_plans.user_id", userId),
      
      // Social (announcements e reações)
      Promise.all([
        supabase
          .from("announcements")
          .select("*", { count: "exact", head: true })
          .eq("author_id", userId),
        supabase
          .from("activity_reactions")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId),
      ]),
      
      // Attendance (check-ins matinais)
      supabase
        .from("attendance_records")
        .select("check_in")
        .eq("user_id", userId),
      
      // Mentor sessions (using mentorship_pairs as mentor)
      supabase
        .from("mentorship_pairs")
        .select("*", { count: "exact", head: true })
        .eq("mentor_id", userId)
        .eq("status", "active"),
      
      // Comments
      supabase
        .from("activity_comments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    // Calcular semanas consecutivas de check-ins
    const checkins = checkinsData.data || [];
    let consecutiveCheckinsWeeks = 0;
    if (checkins.length > 0) {
      const now = new Date();
      let currentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      
      for (let i = 0; i < 52; i++) {
        const weekStart = new Date(currentWeek);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
         const hasCheckinInWeek = (checkins as any[]).some(c => {
           const date = new Date(c.completed_at);
           return date >= weekStart && date < weekEnd;
         });
        
        if (hasCheckinInWeek) {
          consecutiveCheckinsWeeks++;
        } else {
          break;
        }
      }
    }

    // Calcular semanas consecutivas de pulses
    const pulses = pulsesData.data || [];
    let consecutivePulsesWeeks = 0;
    if (pulses.length > 0) {
      const now = new Date();
      let currentWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
      
      for (let i = 0; i < 52; i++) {
        const weekStart = new Date(currentWeek);
        weekStart.setDate(weekStart.getDate() - (i * 7));
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        
         const hasPulseInWeek = (pulses as any[]).some(p => {
           const date = new Date(p.created_at);
           return date >= weekStart && date < weekEnd;
         });
        
        if (hasPulseInWeek) {
          consecutivePulsesWeeks++;
        } else {
          break;
        }
      }
    }

    // Goals analysis
     const goals = (goalsData.data || []) as any[];
     const goalsCompleted = goals.filter(g => g.status === "completed").length;
     const goalsOnTrack = goals.filter(g => g.status === "on_track" || g.status === "completed").length;

    // PDI actions
     const pdiActions = (pdiData.data || []) as any[];
     const pdiActionsCompleted = pdiActions.filter(a => a.status === "completed").length;

    // Early check-ins (before 8am)
     const attendance = (attendanceData.data || []) as any[];
     const earlyCheckins = attendance.filter(a => {
      const hour = new Date(a.check_in).getHours();
      return hour < 8;
    }).length;

    // Late night activity
    const lateNightActivity = attendance.filter(a => {
      const hour = new Date(a.check_in).getHours();
      return hour >= 22;
    }).length;

    return {
      userId,
       feedbacksGiven: (feedbacksGiven as any).count || 0,
       feedbacksReceived: (feedbacksReceived as any).count || 0,
       checkinsCompleted: (checkins as any[]).length,
      consecutiveCheckinsWeeks,
       pulsesResponded: (pulses as any[]).length,
      consecutivePulsesWeeks,
       oneOnOnesAttended: (oneOnOnesData as any).count || 0,
      goalsCompleted,
      goalsOnTrack,
       totalGoals: (goals as any[]).length,
       coursesCompleted: (coursesData as any).count || 0,
      pdiActionsCompleted,
       socialPostsCreated: ((socialData as any)[0]).count || 0,
       socialReactionsGiven: ((socialData as any)[1]).count || 0,
      earlyCheckins,
      lateNightActivity,
      weekendActivity: 0,
       helpfulComments: (commentsData as any).count || 0,
       mentorSessions: (mentorData as any).count || 0,
    };
  },

  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const metrics = await this.getUserMetrics(userId);
    const awardedBadges: string[] = [];

    for (const badge of BEHAVIORAL_BADGES) {
      if (badge.condition(metrics)) {
        const result = await achievementsService.unlockAchievement(userId, badge.key);
        if (result.success) {
          awardedBadges.push(badge.key);
          logger.info(`Badge desbloqueado: ${badge.name} para usuário ${userId}`, "behavioralBadges");
        }
      }
    }

    return awardedBadges;
  },

  async syncBadgesToDatabase(): Promise<void> {
    for (const badge of BEHAVIORAL_BADGES) {
      const { data: existing } = await supabase
        .from("achievements")
        .select("id")
        .eq("key", badge.key)
        .maybeSingle();

      if (!existing) {
        await supabase.from("achievements").insert({
          key: badge.key,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          xp_reward: badge.xpReward,
          coin_reward: badge.coinReward,
        });
        logger.info(`Badge criado no banco: ${badge.name}`, "behavioralBadges");
      }
    }
  },

  getBadgesByCategory(): Record<string, BehavioralBadge[]> {
    const categories: Record<string, BehavioralBadge[]> = {};
    
    for (const badge of BEHAVIORAL_BADGES) {
      if (!categories[badge.category]) {
        categories[badge.category] = [];
      }
      categories[badge.category].push(badge);
    }
    
    return categories;
  },
};
