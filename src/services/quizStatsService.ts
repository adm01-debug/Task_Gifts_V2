import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface QuizAnswer {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean;
  time_spent_ms: number;
  created_at: string;
}

export interface CategoryStats {
  category: string;
  total_answers: number;
  correct_answers: number;
  accuracy_rate: number;
  avg_time_ms: number;
  question_count: number;
}

export const quizStatsService = {
  async recordAnswer(data: {
    question_id: string;
    selected_option_id?: string;
    is_correct: boolean;
    time_spent_ms?: number;
  }): Promise<QuizAnswer | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: answer, error } = await supabase
      .from('quiz_answers')
      .insert({
        user_id: user.id,
        question_id: data.question_id,
        selected_option_id: data.selected_option_id || null,
        is_correct: data.is_correct,
         time_spent_ms: data.time_spent_ms ?? 0,
      })
      .select()
      .single();

    if (error) {
      logger.apiError('recordAnswer', error, 'quizStatsService');
      return null;
    }

    return (answer as any) as QuizAnswer;
  },

  async getCategoryStats(): Promise<CategoryStats[]> {
    const { data, error } = await supabase.rpc('get_quiz_category_stats');

    if (error) {
      logger.apiError('getCategoryStats', error, 'quizStatsService');
      return [];
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      category: row.category as string,
      total_answers: Number(row.total_answers) || 0,
      correct_answers: Number(row.correct_answers) || 0,
      accuracy_rate: Number(row.accuracy_rate) || 0,
      avg_time_ms: Number(row.avg_time_ms) || 0,
      question_count: Number(row.question_count) || 0,
    }));
  },

  async getQuestionStats(questionId: string): Promise<{
    total: number;
    correct: number;
    rate: number;
  }> {
    const { data, error } = await supabase
      .from('quiz_answers')
      .select('is_correct')
      .eq('question_id', questionId);

    if (error) {
      logger.apiError('getQuestionStats', error, 'quizStatsService');
      return { total: 0, correct: 0, rate: 0 };
    }

    const total = data?.length || 0;
    const correct = data?.filter(a => a.is_correct).length || 0;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { total, correct, rate };
  },

  async getHardestQuestions(limit: number = 10): Promise<Array<{
    question_id: string;
    question_text: string;
    category: string | null;
    difficulty: string;
    total_answers: number;
    correct_answers: number;
    accuracy_rate: number;
    avg_time_ms: number;
  }>> {
    // Get all answers with question info
    const { data: answers, error: answersError } = await supabase
      .from('quiz_answers')
      .select(`
        question_id,
        is_correct,
        time_spent_ms
      `);

    if (answersError) {
      logger.apiError('getHardestQuestions.answers', answersError, 'quizStatsService');
      return [];
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('quiz_questions')
      .select('id, question, category, difficulty')
      .eq('is_active', true);

    if (questionsError) {
      logger.apiError('getHardestQuestions.questions', questionsError, 'quizStatsService');
      return [];
    }

    // Aggregate stats per question
    const statsMap = new Map<string, {
      total: number;
      correct: number;
      totalTime: number;
    }>();

    (answers || []).forEach(a => {
      const existing = statsMap.get(a.question_id) || { total: 0, correct: 0, totalTime: 0 };
      existing.total++;
      if (a.is_correct) existing.correct++;
      existing.totalTime += a.time_spent_ms || 0;
      statsMap.set(a.question_id, existing);
    });

    // Build result with question info
    const result = (questions || [])
      .filter(q => statsMap.has(q.id) && (statsMap.get(q.id)?.total || 0) >= 3)
      .map(q => {
        const stats = statsMap.get(q.id)!;
        const rate = Math.round((stats.correct / stats.total) * 100);
        return {
          question_id: q.id,
          question_text: q.question,
          category: q.category,
          difficulty: q.difficulty,
          total_answers: stats.total,
          correct_answers: stats.correct,
          accuracy_rate: rate,
          avg_time_ms: Math.round(stats.totalTime / stats.total),
        };
      })
      .sort((a, b) => a.accuracy_rate - b.accuracy_rate)
      .slice(0, limit);

    return result;
  },
};
