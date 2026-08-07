import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { nineBoxService, NineBoxEvaluation } from "@/services/nineBoxService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useNineBoxEvaluations(departmentId?: string, period?: string) {
  return useQuery({
    queryKey: ["nine-box", "evaluations", departmentId, period],
    queryFn: () => nineBoxService.getEvaluations(departmentId, period),
  });
}

export function useNineBoxDistribution(departmentId?: string, period?: string) {
  return useQuery({
    queryKey: ["nine-box", "distribution", departmentId, period],
    queryFn: () => nineBoxService.getDistribution(departmentId, period),
  });
}

export function useNineBoxPeriods() {
  return useQuery({
    queryKey: ["nine-box", "periods"],
    queryFn: () => nineBoxService.getAvailablePeriods(),
  });
}

export function useLatestNineBoxEvaluation(userId: string) {
  return useQuery({
    queryKey: ["nine-box", "latest", userId],
    queryFn: () => nineBoxService.getLatestEvaluationByUser(userId),
    enabled: !!userId,
  });
}

export function useCreateNineBoxEvaluation() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (evaluation: Omit<Parameters<typeof nineBoxService.createEvaluation>[0], "evaluator_id">) =>
      nineBoxService.createEvaluation({
        ...evaluation,
        evaluator_id: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nine-box"] });
      toast.success("Avaliação 9-Box criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar avaliação: ${error.message}`);
    },
  });
}

export function useUpdateNineBoxEvaluation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<NineBoxEvaluation> & { id: string }) =>
      nineBoxService.updateEvaluation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nine-box"] });
      toast.success("Avaliação atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}
