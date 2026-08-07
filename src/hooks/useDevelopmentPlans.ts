import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { developmentPlanService, DevelopmentPlan, DevelopmentPlanAction } from "@/services/developmentPlanService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export function useDevelopmentPlans(userId?: string, status?: string) {
  return useQuery({
    queryKey: ["development-plans", userId, status],
    queryFn: () => developmentPlanService.getPlans(userId, status),
  });
}

export function useDevelopmentPlan(planId: string) {
  return useQuery({
    queryKey: ["development-plans", planId],
    queryFn: () => developmentPlanService.getPlan(planId),
    enabled: !!planId,
  });
}

export function useMyDevelopmentPlans() {
  const { user } = useAuth();
  return useDevelopmentPlans(user?.id);
}

export function useCreateDevelopmentPlan() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: Omit<Parameters<typeof developmentPlanService.createPlan>[0], "created_by">) =>
      developmentPlanService.createPlan({
        ...plan,
        created_by: user!.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
      toast.success("Plano de desenvolvimento criado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar plano: ${error.message}`);
    },
  });
}

export function useUpdateDevelopmentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<DevelopmentPlan> & { id: string }) =>
      developmentPlanService.updatePlan(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
      toast.success("Plano atualizado!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeleteDevelopmentPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => developmentPlanService.deletePlan(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
      toast.success("Plano removido!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });
}

export function useCreatePlanAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: developmentPlanService.createAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
      toast.success("Ação adicionada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar ação: ${error.message}`);
    },
  });
}

export function useUpdatePlanAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: Partial<DevelopmentPlanAction> & { id: string }) =>
      developmentPlanService.updateAction(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
      toast.success("Ação atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });
}

export function useDeletePlanAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => developmentPlanService.deleteAction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["development-plans"] });
      toast.success("Ação removida!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`);
    },
  });
}

export function useCompetencies(departmentId?: string) {
  return useQuery({
    queryKey: ["competencies", departmentId],
    queryFn: () => developmentPlanService.getCompetencies(departmentId),
  });
}

export function useCreateCompetency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: developmentPlanService.createCompetency,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
      toast.success("Competência criada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar: ${error.message}`);
    },
  });
}
