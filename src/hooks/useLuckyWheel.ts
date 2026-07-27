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

/**
 * Chave de idempotência estável por usuário/dia: sobrevive a reload, duplo toque
 * e retentativas automáticas, garantindo que o servidor devolva o mesmo prêmio.
 */
function getDailyDedupeKey(userId: string): string {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const storageKey = `luckyWheel:dedupe:${userId}:${today}`;

  try {
    const existing = window.localStorage.getItem(storageKey);
    if (existing) return existing;
    const fresh = `spin:${userId}:${today}:${crypto.randomUUID()}`;
    window.localStorage.setItem(storageKey, fresh);
    return fresh;
  } catch {
    // Armazenamento indisponível (modo privado): cai na chave determinística diária.
    return `daily-fallback:${userId}:${today}`;
  }
}

export function useSpinLuckyWheel() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation<LuckyWheelSpinResult>({
    mutationFn: () => luckyWheelService.spin(user ? getDailyDedupeKey(user.id) : undefined),
    retry: 1,
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: luckyWheelKeys.all });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });
}