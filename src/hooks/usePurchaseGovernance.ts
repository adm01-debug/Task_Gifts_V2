import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  purchaseGovernanceService,
  type RiskAnalysisResult,
} from "@/services/purchaseGovernanceService";
import { shopKeys } from "./useShop";

export const governanceKeys = {
  all: ["purchase-governance"] as const,
  trail: (purchaseId: string) => ["purchase-governance", "trail", purchaseId] as const,
};

export function usePurchaseTrail(purchaseId: string | null) {
  return useQuery({
    queryKey: governanceKeys.trail(purchaseId ?? "none"),
    queryFn: () => purchaseGovernanceService.getTrail(purchaseId as string),
    enabled: Boolean(purchaseId),
    staleTime: 15_000,
  });
}

export function useAnalyzePurchaseRisk() {
  const queryClient = useQueryClient();

  return useMutation<RiskAnalysisResult, Error, string>({
    mutationFn: (purchaseId: string) => purchaseGovernanceService.analyzeRisk(purchaseId),
    onSuccess: (result, purchaseId) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      queryClient.invalidateQueries({ queryKey: governanceKeys.trail(purchaseId) });
      toast.success(
        result.ai_available
          ? `Análise concluída — risco ${result.score}/100`
          : `Análise heurística concluída — risco ${result.score}/100 (IA indisponível)`
      );
    },
    onError: (error) => toast.error(error.message || "Erro ao analisar o resgate"),
  });
}

export function useReviewPurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      purchaseId,
      action,
      reason,
    }: {
      purchaseId: string;
      action: "approve" | "reject" | "deliver" | "cancel";
      reason?: string;
    }) => purchaseGovernanceService.review(purchaseId, action, reason),
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      queryClient.invalidateQueries({ queryKey: governanceKeys.trail(variables.purchaseId) });
      if (result.awaiting_second_approval) {
        toast.info("Primeira aprovação registrada. Aguardando um segundo aprovador distinto.");
        return;
      }
      const labels: Record<string, string> = {
        approved: "Resgate aprovado",
        delivered: "Resgate marcado como entregue",
        cancelled: "Resgate cancelado e moedas devolvidas",
      };
      toast.success(labels[result.status] ?? "Decisão registrada");
    },
    onError: (error: Error) => toast.error(error.message || "Não foi possível registrar a decisão"),
  });
}