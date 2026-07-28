import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { dailyWagerService } from "@/services/dailyWagerService";
import { useAuth } from "./useAuth";

export const dailyWagerKeys = {
  all: ["dailyWager"] as const,
  today: () => [...dailyWagerKeys.all, "today"] as const,
  history: () => [...dailyWagerKeys.all, "history"] as const,
};

export function useDailyWager() {
  const { user } = useAuth();
  return useQuery({
    queryKey: dailyWagerKeys.today(),
    queryFn: () => dailyWagerService.getToday(),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useWagerHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: dailyWagerKeys.history(),
    queryFn: () => dailyWagerService.history(),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useSubmitWager() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { questionId: string; optionId: string; stake: number }) =>
      dailyWagerService.submit(input.questionId, input.optionId, input.stake),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dailyWagerKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}