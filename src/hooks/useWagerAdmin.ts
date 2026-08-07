import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { wagerAdminService } from "@/services/wagerAdminService";
import { wagerBudgetService } from "@/services/wagerBudgetService";
import type { WagerQuestionDraft } from "@/lib/wagerAuthoring";
import { dailyWagerKeys } from "./useDailyWager";
import { useAuth } from "./useAuth";

export const wagerAdminKeys = {
  all: ["wagerAdmin"] as const,
  list: (from?: string, to?: string) => [...wagerAdminKeys.all, "list", from, to] as const,
};

export function useAdminWagerQuestions(from?: string, to?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: wagerAdminKeys.list(from, to),
    queryFn: () => wagerAdminService.list(from, to),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useSaveWagerQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: WagerQuestionDraft) => wagerAdminService.save(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wagerAdminKeys.all });
      void queryClient.invalidateQueries({ queryKey: dailyWagerKeys.all });
    },
  });
}

export function useDeleteWagerQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => wagerAdminService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wagerAdminKeys.all });
      void queryClient.invalidateQueries({ queryKey: dailyWagerKeys.all });
    },
  });
}

/** Importação em lote de perguntas agendadas (CSV). */
export function useBulkImportWagerQuestions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (drafts: WagerQuestionDraft[]) => wagerAdminService.saveMany(drafts),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wagerAdminKeys.all });
      void queryClient.invalidateQueries({ queryKey: dailyWagerKeys.all });
    },
  });
}
export const wagerBudgetKeys = {
  all: ["wagerBudget"] as const,
};

/** Configuração persistida de orçamento/participantes da Pergunta do Dia. */
export function useWagerBudgetSettings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: wagerBudgetKeys.all,
    queryFn: () => wagerBudgetService.get(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveWagerBudgetSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { monthlyCoinBudget: number; expectedPlayers: number }) =>
      wagerBudgetService.save(input),
    onSuccess: (settings) => {
      queryClient.setQueryData(wagerBudgetKeys.all, settings);
    },
  });
}
