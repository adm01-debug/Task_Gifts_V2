import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  continuousEngagementService,
  type SubmitAnswerInput,
} from "@/services/continuousEngagementService";

export function useActiveEngagementCycle() {
  return useQuery({
    queryKey: ["engagement-cycle", "active"],
    queryFn: () => continuousEngagementService.getActiveCycle(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMyEngagementQuestions(cycleId?: string) {
  return useQuery({
    queryKey: ["engagement-questions", cycleId],
    queryFn: () => continuousEngagementService.getMyQuestions(cycleId),
    enabled: !!cycleId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEngagementProgress(cycleId?: string) {
  return useQuery({
    queryKey: ["engagement-progress", cycleId],
    queryFn: () => continuousEngagementService.getProgress(cycleId as string),
    enabled: !!cycleId,
  });
}

export function useSubmitEngagementAnswer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitAnswerInput) => continuousEngagementService.submitAnswer(input),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["engagement-questions", variables.cycleId] });
      queryClient.invalidateQueries({ queryKey: ["engagement-progress", variables.cycleId] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Não foi possível registrar sua resposta", { description: message });
    },
  });
}