import { supabase } from "@/integrations/supabase/client";

export interface CompetencyData {
  area: string;
  value: number;
  maxValue: number;
  icon: string;
}

export const competencyService = {
  async getUserCompetencies(userId: string): Promise<CompetencyData[]> {
    // Fetch completed modules by content type
    const { data: moduleProgress } = await supabase
      .from("module_progress")
      .select(`
        id,
        score,
        completed_at,
        module_id,
        trail_modules!inner (
          content_type,
          xp_reward
        )
      `)
      .eq("user_id", userId)
      .not("completed_at", "is", null);

    // Fetch completed quests by difficulty
    const { data: questAssignments } = await supabase
      .from("quest_assignments")
      .select(`
        id,
        completed_at,
        custom_quests!inner (
          difficulty,
          xp_reward
        )
      `)
      .eq("user_id", userId)
      .not("completed_at", "is", null);

    // Fetch achievements by category
    const { data: userAchievements } = await supabase
      .from("user_achievements")
      .select(`
        id,
        achievements!inner (
          category,
          xp_reward
        )
      `)
      .eq("user_id", userId);

    // Fetch kudos received (social skills)
    const { data: kudosReceived } = await supabase
      .from("kudos")
      .select("id, badge_id")
      .eq("to_user_id", userId);

    // Fetch attendance streaks (discipline)
    const { data: attendanceStreak } = await supabase
      .from("attendance_streaks")
      .select("current_streak, best_streak, total_punctual_days")
      .eq("user_id", userId)
      .maybeSingle();

    // Calculate competencies
    const competencies: CompetencyData[] = [];

    // 1. Conhecimento Técnico (based on completed modules with high scores)
    const moduleScores = moduleProgress?.map(m => m.score || 0) || [];
    const avgScore = moduleScores.length > 0 
      ? moduleScores.reduce((a, b) => a + b, 0) / moduleScores.length 
      : 0;
    const technicalValue = Math.min(100, (moduleProgress?.length || 0) * 10 + avgScore * 0.5);
    competencies.push({
      area: "Conhecimento Técnico",
      value: Math.round(technicalValue),
      maxValue: 100,
      icon: "📚"
    });

    // 2. Resolução de Problemas (based on quest completions by difficulty)
    const questsByDifficulty: Record<string, number> = {
      easy: 0,
      medium: 0,
      hard: 0,
      expert: 0
    };
    questAssignments?.forEach(q => {
      const questData = q.custom_quests as { difficulty?: string } | null;
      const difficulty = questData?.difficulty || 'easy';
      if (difficulty in questsByDifficulty) {
        questsByDifficulty[difficulty]++;
      }
    });
    const problemSolvingValue = Math.min(100, 
      questsByDifficulty.easy * 5 + 
      questsByDifficulty.medium * 10 + 
      questsByDifficulty.hard * 20 + 
      questsByDifficulty.expert * 30
    );
    competencies.push({
      area: "Resolução de Problemas",
      value: Math.round(problemSolvingValue),
      maxValue: 100,
      icon: "🧩"
    });

    // 3. Colaboração (based on kudos received)
    const collaborationValue = Math.min(100, (kudosReceived?.length || 0) * 15);
    competencies.push({
      area: "Colaboração",
      value: Math.round(collaborationValue),
      maxValue: 100,
      icon: "🤝"
    });

    // 4. Disciplina (based on attendance)
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

    // 5. Liderança (based on achievements and mentorship)
    const leadershipAchievements = userAchievements?.filter(a => {
      const achievementData = a.achievements as { category?: string } | null;
      return achievementData?.category === 'leadership' || achievementData?.category === 'social';
    }).length || 0;
    const leadershipValue = Math.min(100, leadershipAchievements * 20 + (kudosReceived?.length || 0) * 5);
    competencies.push({
      area: "Liderança",
      value: Math.round(leadershipValue),
      maxValue: 100,
      icon: "👑"
    });

    // 6. Comunicação (based on content types completed - video, text presentations)
    const communicationModules = moduleProgress?.filter(m => {
      const moduleData = m.trail_modules as { content_type?: string } | null;
      return ['video', 'text', 'infographic'].includes(moduleData?.content_type || '');
    }).length || 0;
    const communicationValue = Math.min(100, communicationModules * 12);
    competencies.push({
      area: "Comunicação",
      value: Math.round(communicationValue),
      maxValue: 100,
      icon: "💬"
    });

    return competencies;
  }
};
