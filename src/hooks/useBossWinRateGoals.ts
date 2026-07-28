import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  bossWinRateGoalService,
  type BossWinRateGoal,
  type BossWinRateGoalPayload,
} from "@/services/bossWinRateGoalService";
import { useAuth } from "./useAuth";

export const bossWinRateGoalKeys = {
  all: ["boss-win-rate-goals"] as const,
  list: () => [...bossWinRateGoalKeys.all, "list"] as const,
};

export interface BossWinRateGoalsConfig {
  /** Padrão global persistido (ou `null` quando ainda não configurado). */
  global: BossWinRateGoal | null;
  /** Metas específicas indexadas por departamento. */
  overrides: Record<string, { target: number; tolerancePp: number }>;
  goals: BossWinRateGoal[];
}

export function useBossWinRateGoals() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: bossWinRateGoalKeys.list(),
    queryFn: () => bossWinRateGoalService.list(),
    enabled: !!user,
    staleTime: 60_000,
  });

  const config = useMemo<BossWinRateGoalsConfig>(() => {
    const goals = query.data || [];
    const overrides: Record<string, { target: number; tolerancePp: number }> = {};
    let global: BossWinRateGoal | null = null;
    for (const goal of goals) {
      if (goal.departmentId === null) {
        global = goal;
      } else {
        overrides[goal.departmentId] = {
          target: goal.target,
          tolerancePp: goal.tolerancePp,
        };
      }
    }
    return { global, overrides, goals };
  }, [query.data]);

  return { ...query, config };
}

export function useSaveBossWinRateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BossWinRateGoalPayload) => bossWinRateGoalService.save(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bossWinRateGoalKeys.all });
      toast.success("Meta de aproveitamento salva");
    },
    onError: () => {
      toast.error("Não foi possível salvar a meta");
    },
  });
}

export function useRemoveBossWinRateGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (departmentId: string) => bossWinRateGoalService.remove(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bossWinRateGoalKeys.all });
      toast.success("Meta específica removida");
    },
    onError: () => {
      toast.error("Não foi possível remover a meta");
    },
  });
}