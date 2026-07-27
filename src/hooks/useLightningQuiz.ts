import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lightningQuizService } from "@/services/lightningQuizService";
import { useAuth } from "./useAuth";

export const lightningQuizKeys = {
  all: ["lightningQuiz"] as const,
  history: () => [...lightningQuizKeys.all, "history"] as const,
};

export function useLightningHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: lightningQuizKeys.history(),
    queryFn: () => lightningQuizService.history(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useStartLightningRound() {
  return useMutation({
    mutationFn: () => lightningQuizService.start(),
  });
}

export function useAnswerLightningQuestion() {
  return useMutation({
    mutationFn: ({ sessionId, index, answer }: { sessionId: string; index: number; answer: boolean }) =>
      lightningQuizService.answer(sessionId, index, answer),
  });
}

export function useFinishLightningRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => lightningQuizService.finish(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: lightningQuizKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}