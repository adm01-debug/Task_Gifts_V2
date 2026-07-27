import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  luckyWheelAdminService,
  luckyWheelAuditService,
  luckyWheelPayoutService,
  luckyWheelService,
  type LuckyWheelPrizeInput,
  type LuckyWheelSpinResult,
} from "@/services/luckyWheelService";
import { useAuth } from "./useAuth";

export const luckyWheelKeys = {
  all: ["luckyWheel"] as const,
  prizes: () => [...luckyWheelKeys.all, "prizes"] as const,
  adminPrizes: () => [...luckyWheelKeys.all, "adminPrizes"] as const,
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
/** Lista completa (inclusive inativos) para a tela de calibração admin. */
export function useLuckyWheelAdminPrizes(enabled = true) {
  return useQuery({
    queryKey: luckyWheelKeys.adminPrizes(),
    queryFn: () => luckyWheelAdminService.listAll(),
    enabled,
    staleTime: 30_000,
  });
}

export function useSaveLuckyWheelPrizes() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patches: ReadonlyArray<{ id: string } & Partial<LuckyWheelPrizeInput>>) =>
      luckyWheelAdminService.saveMany(patches),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: luckyWheelKeys.all });
    },
  });
}

export function useCreateLuckyWheelPrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LuckyWheelPrizeInput) => luckyWheelAdminService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: luckyWheelKeys.all });
    },
  });
}

export function useDeleteLuckyWheelPrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => luckyWheelAdminService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: luckyWheelKeys.all });
    },
  });
}

/** Histórico imutável de calibração (somente admins conseguem ler via RLS). */
export function useLuckyWheelAudit(enabled = true, limit = 200) {
  return useQuery({
    queryKey: [...luckyWheelKeys.all, "audit", limit] as const,
    queryFn: () => luckyWheelAuditService.list(limit),
    enabled,
    staleTime: 30_000,
  });
}

/** Giros do período para reconciliação econômica (payout real x projetado). */
export function useLuckyWheelSpins(days = 30, enabled = true) {
  return useQuery({
    queryKey: [...luckyWheelKeys.all, "spins", days] as const,
    queryFn: () => luckyWheelPayoutService.listSpins(days),
    enabled,
    staleTime: 60_000,
  });
}

/** Série histórica diária de payout (snapshots do cron) para o gráfico de tendência. */
export function useLuckyWheelPayoutSnapshots(days = 90, enabled = true) {
  return useQuery({
    queryKey: [...luckyWheelKeys.all, "payout-snapshots", days] as const,
    queryFn: () => luckyWheelPayoutService.listSnapshots(days),
    enabled,
    staleTime: 5 * 60_000,
  });
}
