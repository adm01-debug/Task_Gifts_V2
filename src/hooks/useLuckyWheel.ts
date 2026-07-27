import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { luckyWheelService, type LuckyWheelSpinResult } from "@/services/luckyWheelService";
import { useAuth } from "./useAuth";

export const luckyWheelKeys = {
  all: ["luckyWheel"] as const,
  prizes: () => [...luckyWheelKeys.all, "prizes"] as const,
  status: () => [...luckyWheelKeys.all, "status"] as const,
  history: (userId: string) => [...luckyWheelKeys.all, "history", userId] as const,
};

export function useLuckyWheelPrizes() {
  return useQuery({
    queryKey: luckyWheelKeys.prizes(),
    queryFn: () => luckyWheelService.getPrizes(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useLuckyWheelStatus() {
  const { user } = useAuth();
  return useQuery({
    queryKey: luckyWheelKeys.status(),
    queryFn: () => luckyWheelService.getStatus(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useLuckyWheelHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: luckyWheelKeys.history(user?.id ?? ""),
    queryFn: () => luckyWheelService.getHistory(user!.id),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useSpinLuckyWheel() {
  const queryClient = useQueryClient();

  return useMutation<LuckyWheelSpinResult>({
    mutationFn: () => luckyWheelService.spin(),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: luckyWheelKeys.all });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}