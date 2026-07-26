import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";
import {
  generateActionPlanFromNr1Category,
  nr1RiskService,
  type GenerateNr1PlanInput,
} from "@/services/nr1RiskService";
import type { DiagnosticsFilters } from "@/services/engagementDiagnosticsService";

const STALE = 5 * 60 * 1000;

export function useNr1RiskMatrix(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: ["nr1", "matrix", filters.departmentId ?? null, filters.days ?? 90],
    queryFn: () => nr1RiskService.getRiskMatrix(filters),
    staleTime: STALE,
  });
}

export function useNr1Summary(filters: DiagnosticsFilters = {}) {
  return useQuery({
    queryKey: ["nr1", "summary", filters.departmentId ?? null, filters.days ?? 90],
    queryFn: () => nr1RiskService.getSummary(filters),
    staleTime: STALE,
  });
}

export function useGenerateNr1ActionPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateNr1PlanInput) => generateActionPlanFromNr1Category(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      toast.success("Plano de tratativa criado", {
        description: "O plano 5W2H do risco psicossocial já está disponível.",
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      logger.error("Erro ao gerar plano de tratativa NR-1", message);
      toast.error("Não foi possível gerar o plano", { description: message });
    },
  });
}
