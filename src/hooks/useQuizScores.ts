import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizService, DailyRankingEntry, QuizScore } from "@/services/quizService";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const quizKeys = {
  all: ['quiz'] as const,
  dailyRanking: (date?: string) => [...quizKeys.all, 'daily-ranking', date || 'today'] as const,
  userToday: () => [...quizKeys.all, 'user-today'] as const,
};

export function useDailyQuizRanking(date?: string) {
  const queryClient = useQueryClient();

  const query = useQuery<DailyRankingEntry[]>({
    queryKey: quizKeys.dailyRanking(date),
    queryFn: () => quizService.getDailyRanking(date),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('quiz-scores-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'quiz_scores',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: quizKeys.dailyRanking(date) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, date]);

  return query;
}

export function useUserTodayScores() {
  return useQuery<QuizScore[]>({
    queryKey: quizKeys.userToday(),
    queryFn: quizService.getUserTodayScores,
  });
}

export function useSaveQuizScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: quizService.saveScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quizKeys.all });
    },
  });
}
