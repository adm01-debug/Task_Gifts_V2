import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";

export interface HighPotentialScore {
  userId: string;
  displayName: string;
  avatarUrl?: string;
  department?: string;
  position?: string;
  level: number;
  overallScore: number;
  factors: {
    performance: number;
    learning: number;
    engagement: number;
    consistency: number;
    collaboration: number;
    growth: number;
  };
  strengths: string[];
  readyFor: string[];
  riskOfLeaving: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface HiPoMetrics {
  // Performance metrics
  questsCompleted: number;
  goalsAchieved: number;
  goalsTotal: number;
  taskOnTimeRate: number;
  
  // Learning metrics
  trailsCompleted: number;
  trailsEnrolled: number;
  pdiProgress: number;
  certificationsCount: number;
  
  // Engagement metrics
  kudosReceived: number;
  kudosGiven: number;
  feedbacksGiven: number;
  checkinsCompleted: number;
  avgMood: number;
  
  // Consistency metrics
  attendanceRate: number;
  streak: number;
  bestStreak: number;
  
  // Collaboration metrics
  mentoringSessions: number;
  teamChallengesParticipated: number;
  
  // Growth metrics
  xpGained30Days: number;
  levelUpsLast90Days: number;
  nineBoxPosition?: { performance: number; potential: number };
}

const WEIGHTS = {
  performance: 0.25,
  learning: 0.20,
  engagement: 0.15,
  consistency: 0.15,
  collaboration: 0.10,
  growth: 0.15,
};

export const highPotentialService = {
  async getUserMetrics(userId: string): Promise<HiPoMetrics> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    // Fetch profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      // Return default metrics if profile not found
      return {
        questsCompleted: 0,
        goalsAchieved: 0,
        goalsTotal: 0,
        taskOnTimeRate: 0,
        trailsCompleted: 0,
        trailsEnrolled: 0,
        pdiProgress: 0,
        certificationsCount: 0,
        kudosReceived: 0,
        kudosGiven: 0,
        feedbacksGiven: 0,
        checkinsCompleted: 0,
        avgMood: 3,
        attendanceRate: 0,
        streak: 0,
        bestStreak: 0,
        mentoringSessions: 0,
        teamChallengesParticipated: 0,
        xpGained30Days: 0,
        levelUpsLast90Days: 0,
        nineBoxPosition: undefined,
      };
    }

    // Fetch goals
    const { data: goals } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId);

    // Fetch trail enrollments
    const { data: enrollments } = await supabase
      .from("trail_enrollments")
      .select("*")
      .eq("user_id", userId);

    // Fetch PDI
    const { data: pdiData } = await supabase
      .from("development_plans")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");
    
    let pdiProgress = 0;
    if (pdiData && pdiData.length > 0) {
      const { data: actions } = await supabase
        .from("development_plan_actions")
        .select("*")
        .eq("plan_id", pdiData[0].id);
      if (actions && actions.length > 0) {
        pdiProgress = (actions.filter(a => a.status === 'completed').length / actions.length) * 100;
      }
    }

    // Fetch certifications
    const { data: certs } = await supabase
      .from("user_certifications")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active");

    // Fetch kudos received
    const { data: kudosReceived } = await supabase
      .from("kudos")
      .select("*")
      .eq("to_user_id", userId);

    // Fetch kudos given
    const { data: kudosGiven } = await supabase
      .from("kudos")
      .select("*")
      .eq("from_user_id", userId);

    // Fetch attendance
    const { data: attendance } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("user_id", userId)
      .gte("check_in", thirtyDaysAgo.toISOString());

    // Fetch mood entries
    const { data: moods } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", userId)
      .gte("entry_date", thirtyDaysAgo.toISOString().split('T')[0]);

    // Fetch checkins
    const { data: checkins } = await supabase
      .from("checkins")
      .select("*")
      .eq("employee_id", userId)
      .eq("status", "completed");

    // Fetch 9-box
    const { data: nineBox } = await supabase
      .from("nine_box_evaluations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Fetch mentorship
    const { data: mentorship } = await supabase
      .from("mentorship_pairs")
      .select("*")
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      .eq("status", "active");

    // Calculate metrics
    const goalsData = goals || [];
    const enrollmentsData = enrollments || [];
    const attendanceData = attendance || [];
    const moodsData = moods || [];

    interface GoalData { status: string }
    interface EnrollmentData { completed_at: string | null }
    interface MoodData { mood_score: number }
    interface AttendanceData { is_punctual: boolean }

    return {
      questsCompleted: profile?.quests_completed || 0,
      goalsAchieved: goalsData.filter((g: GoalData) => g.status === 'completed').length,
      goalsTotal: goalsData.length,
      taskOnTimeRate: 85, // Would need task_scores to calculate properly

      trailsCompleted: enrollmentsData.filter((e: EnrollmentData) => e.completed_at).length,
      trailsEnrolled: enrollmentsData.length,
      pdiProgress,
      certificationsCount: certs?.length || 0,

      kudosReceived: kudosReceived?.length || 0,
      kudosGiven: kudosGiven?.length || 0,
      feedbacksGiven: 0, // Would need feedback_responses
      checkinsCompleted: checkins?.length || 0,
      avgMood: moodsData.length > 0 
        ? moodsData.reduce((acc: number, m: MoodData) => acc + m.mood_score, 0) / moodsData.length 
        : 3,

      attendanceRate: attendanceData.length > 0 
        ? (attendanceData.filter((a: AttendanceData) => a.is_punctual).length / attendanceData.length) * 100 
        : 0,
      streak: profile?.streak || 0,
      bestStreak: profile?.best_streak || 0,

      mentoringSessions: mentorship?.length || 0,
      teamChallengesParticipated: 0,

      xpGained30Days: 0, // Would need XP history
      levelUpsLast90Days: 0, // Would need level history
      nineBoxPosition: nineBox ? {
        performance: nineBox.performance_score,
        potential: nineBox.potential_score,
      } : undefined,
    };
  },

  calculateFactorScores(metrics: HiPoMetrics): HighPotentialScore['factors'] {
    // Performance (0-100)
    const goalsRate = metrics.goalsTotal > 0 ? (metrics.goalsAchieved / metrics.goalsTotal) * 100 : 50;
    const performance = Math.min(100, (
      (metrics.questsCompleted * 2) + 
      (goalsRate * 0.5) + 
      (metrics.taskOnTimeRate * 0.3)
    ));

    // Learning (0-100)
    const trailsRate = metrics.trailsEnrolled > 0 ? (metrics.trailsCompleted / metrics.trailsEnrolled) * 100 : 0;
    const learning = Math.min(100, (
      (trailsRate * 0.4) + 
      (metrics.pdiProgress * 0.3) + 
      (metrics.certificationsCount * 10)
    ));

    // Engagement (0-100)
    const engagement = Math.min(100, (
      (metrics.kudosReceived * 5) + 
      (metrics.kudosGiven * 3) + 
      (metrics.checkinsCompleted * 5) + 
      ((metrics.avgMood / 5) * 20)
    ));

    // Consistency (0-100)
    const consistency = Math.min(100, (
      (metrics.attendanceRate * 0.5) + 
      (metrics.streak * 2) + 
      (metrics.bestStreak * 1)
    ));

    // Collaboration (0-100)
    const collaboration = Math.min(100, (
      (metrics.mentoringSessions * 15) + 
      (metrics.kudosGiven * 5) + 
      (metrics.teamChallengesParticipated * 10)
    ));

    // Growth (0-100)
    let growth = 50; // Base
    if (metrics.nineBoxPosition) {
      growth = ((metrics.nineBoxPosition.performance + metrics.nineBoxPosition.potential) / 10) * 100;
    }
    growth = Math.min(100, growth + (metrics.xpGained30Days / 100));

    return {
      performance: Math.round(performance),
      learning: Math.round(learning),
      engagement: Math.round(engagement),
      consistency: Math.round(consistency),
      collaboration: Math.round(collaboration),
      growth: Math.round(growth),
    };
  },

  calculateOverallScore(factors: HighPotentialScore['factors']): number {
    return Math.round(
      factors.performance * WEIGHTS.performance +
      factors.learning * WEIGHTS.learning +
      factors.engagement * WEIGHTS.engagement +
      factors.consistency * WEIGHTS.consistency +
      factors.collaboration * WEIGHTS.collaboration +
      factors.growth * WEIGHTS.growth
    );
  },

  determineStrengths(factors: HighPotentialScore['factors']): string[] {
    const strengths: string[] = [];
    const sortedFactors = Object.entries(factors)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    const labels: Record<string, string> = {
      performance: 'Alta Performance',
      learning: 'Aprendizado Contínuo',
      engagement: 'Alto Engajamento',
      consistency: 'Consistência',
      collaboration: 'Colaboração',
      growth: 'Potencial de Crescimento',
    };

    sortedFactors.forEach(([key, value]) => {
      if (value >= 60) {
        strengths.push(labels[key]);
      }
    });

    return strengths;
  },

  determineReadyFor(overallScore: number, factors: HighPotentialScore['factors']): string[] {
    const readyFor: string[] = [];

    if (overallScore >= 80) {
      readyFor.push('Promoção imediata');
      readyFor.push('Projetos estratégicos');
    }
    if (overallScore >= 70) {
      readyFor.push('Liderança de equipe');
    }
    if (factors.learning >= 70) {
      readyFor.push('Mentoria de novos colaboradores');
    }
    if (factors.collaboration >= 70) {
      readyFor.push('Projetos cross-funcionais');
    }
    if (overallScore >= 60 && readyFor.length === 0) {
      readyFor.push('Desenvolvimento acelerado');
      readyFor.push('Job rotation');
    }

    return readyFor.slice(0, 3);
  },

  determineRiskOfLeaving(factors: HighPotentialScore['factors']): 'low' | 'medium' | 'high' {
    // High performers with low engagement are at risk
    if (factors.performance >= 70 && factors.engagement < 50) {
      return 'high';
    }
    if (factors.engagement < 40) {
      return 'high';
    }
    if (factors.engagement < 60) {
      return 'medium';
    }
    return 'low';
  },

  generateRecommendation(score: number, factors: HighPotentialScore['factors'], risk: 'low' | 'medium' | 'high'): string {
    if (score >= 80 && risk === 'low') {
      return 'Star Player - Incluir em programa de sucessão e retenção máxima';
    }
    if (score >= 80 && risk !== 'low') {
      return 'Talento em risco - Ação urgente de retenção necessária';
    }
    if (score >= 70) {
      return 'Alto potencial - Investir em desenvolvimento acelerado';
    }
    if (score >= 60) {
      return 'Potencial promissor - Monitorar e desenvolver pontos fracos';
    }
    return 'Em desenvolvimento - Acompanhar progresso regularmente';
  },

  async identifyHighPotentials(departmentId?: string): Promise<HighPotentialScore[]> {
    // Fetch all profiles (optionally filtered by department)
    let query = supabase
      .from("profiles")
      .select("*, team_members(department_id, departments(name)), user_positions(positions(name))");

    const { data: profiles } = await query;

    if (!profiles) return [];

    // Filter by department if specified - use unknown first due to dynamic relation types
    type TeamMember = { department_id: string; departments: { name: string } | null };
    type UserPosition = { positions: { name: string } | null };
    
    let filteredProfiles = profiles;
    if (departmentId) {
      filteredProfiles = profiles.filter((p) => {
        const teamMembers = p.team_members as unknown as TeamMember[] | null;
        return teamMembers?.some((tm) => tm.department_id === departmentId);
      });
    }

    const results: HighPotentialScore[] = [];

    for (const profile of filteredProfiles.slice(0, 50)) { // Limit to 50 for performance
      try {
        const metrics = await this.getUserMetrics(profile.id);
        const factors = this.calculateFactorScores(metrics);
        const overallScore = this.calculateOverallScore(factors);
        const strengths = this.determineStrengths(factors);
        const readyFor = this.determineReadyFor(overallScore, factors);
        const risk = this.determineRiskOfLeaving(factors);
        const recommendation = this.generateRecommendation(overallScore, factors, risk);

        // Cast nested relations using unknown first for type safety
        const teamMembers = profile.team_members as unknown as TeamMember[] | null;
        const userPositions = profile.user_positions as unknown as UserPosition[] | null;

        results.push({
          userId: profile.id,
          displayName: profile.display_name || profile.email?.split('@')[0] || 'Usuário',
          avatarUrl: profile.avatar_url || undefined,
          department: teamMembers?.[0]?.departments?.name,
          position: userPositions?.[0]?.positions?.name,
          level: profile.level || 1,
          overallScore,
          factors,
          strengths,
          readyFor,
          riskOfLeaving: risk,
          recommendation,
        });
      } catch (err: unknown) {
        logger.apiError(`Processing high potential user ${profile.id}`, err, "HighPotentialService");
      }
    }

    // Sort by overall score descending
    return results.sort((a, b) => b.overallScore - a.overallScore);
  },

  async getTopHighPotentials(limit = 10, departmentId?: string): Promise<HighPotentialScore[]> {
    const allHiPos = await this.identifyHighPotentials(departmentId);
    return allHiPos.filter(h => h.overallScore >= 60).slice(0, limit);
  },
};
