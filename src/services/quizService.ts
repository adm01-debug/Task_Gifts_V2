import { supabase } from "@/integrations/supabase/client";

export interface QuizScore {
  id: string;
  user_id: string;
  quiz_type: string;
  score: number;
  correct_answers: number;
  total_questions: number;
  streak_bonus: number;
  time_bonus: number;
  played_at: string;
  created_at: string;
}

export interface DailyRankingEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_score: number;
  games_played: number;
  best_score: number;
  rank: number;
}

export const quizService = {
  async saveScore(data: {
    quiz_type: string;
    score: number;
    correct_answers: number;
    total_questions: number;
    streak_bonus?: number;
    time_bonus?: number;
  }): Promise<QuizScore | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: score, error } = await supabase
      .from('quiz_scores')
      .insert({
        user_id: user.id,
        quiz_type: data.quiz_type,
        score: data.score,
        correct_answers: data.correct_answers,
        total_questions: data.total_questions,
        streak_bonus: data.streak_bonus || 0,
        time_bonus: data.time_bonus || 0,
      })
      .select()
      .single();

    if (error) {
      return null;
    }

    return score;
  },

  async getDailyRanking(date?: string): Promise<DailyRankingEntry[]> {
    const targetDate = date || new Date().toISOString().split('T')[0];

    const { data: scores, error } = await supabase
      .from('quiz_scores')
      .select('user_id, score')
      .eq('played_at', targetDate);

    if (error || !scores) {
      return [];
    }

    // Aggregate scores by user
    const userScores: Record<string, { total: number; count: number; best: number }> = {};
    scores.forEach(s => {
      if (!userScores[s.user_id]) {
        userScores[s.user_id] = { total: 0, count: 0, best: 0 };
      }
      userScores[s.user_id].total += s.score;
      userScores[s.user_id].count += 1;
      userScores[s.user_id].best = Math.max(userScores[s.user_id].best, s.score);
    });

    // Get user profiles
    const userIds = Object.keys(userScores);
    if (userIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);

    const profileMap: Record<string, { display_name: string; avatar_url: string | null }> = {};
    profiles?.forEach(p => {
      profileMap[p.id] = { display_name: p.display_name || 'Usuário', avatar_url: p.avatar_url };
    });

    // Build ranking
    const ranking: DailyRankingEntry[] = userIds.map(userId => ({
      user_id: userId,
      display_name: profileMap[userId]?.display_name || 'Usuário',
      avatar_url: profileMap[userId]?.avatar_url || null,
      total_score: userScores[userId].total,
      games_played: userScores[userId].count,
      best_score: userScores[userId].best,
      rank: 0,
    }));

    // Sort by total score and assign ranks
    ranking.sort((a, b) => b.total_score - a.total_score);
    ranking.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return ranking;
  },

  async getUserTodayScores(): Promise<QuizScore[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('quiz_scores')
      .select('*')
      .eq('user_id', user.id)
      .eq('played_at', today)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    return data || [];
  },
};
