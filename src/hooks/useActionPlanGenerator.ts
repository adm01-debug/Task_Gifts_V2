import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actionPlanGeneratorService,
  type GenerateActionPlanInput,
} from "@/services/actionPlanGeneratorService";
import { logger } from "@/services/loggingService";

/** Gera um plano de ação 5W2H a partir de um fator crítico do diagnóstico. */
export function useGenerateActionPlanFromFactor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateActionPlanInput) =>
      actionPlanGeneratorService.generateFromFactor(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      toast.success("Plano de ação gerado", {
        description: "As ações recomendadas para o pilar já estão no plano.",
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      logger.error("Erro ao gerar plano de ação", message);
      toast.error("Não foi possível gerar o plano", { description: message });
    },
  });
}
