import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trailsService, type LearningTrail, type TrailModule, type TrailPrerequisite, type CreateTrailInput, type CreateModuleInput } from "@/services/trailsService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/errorMessages";

export const trailKeys = {
  all: ["trails"] as const,
  published: () => [...trailKeys.all, "published"] as const,
  byDepartment: (deptId: string) => [...trailKeys.all, "department", deptId] as const,
  detail: (id: string) => [...trailKeys.all, "detail", id] as const,
  enrollments: (userId: string) => [...trailKeys.all, "enrollments", userId] as const,
  moduleProgress: (userId: string, moduleIds: string[]) => [...trailKeys.all, "progress", userId, moduleIds] as const,
  prerequisites: () => [...trailKeys.all, "prerequisites"] as const,
};

export function usePublishedTrails() {
  return useQuery({
    queryKey: trailKeys.published(),
    queryFn: () => trailsService.getPublishedTrails(),
  });
}

export function useTrailsByDepartment(departmentId: string) {
  return useQuery({
    queryKey: trailKeys.byDepartment(departmentId),
    queryFn: () => trailsService.getTrailsByDepartment(departmentId),
    enabled: !!departmentId,
  });
}

export function useTrailWithModules(trailId: string) {
  return useQuery({
    queryKey: trailKeys.detail(trailId),
    queryFn: () => trailsService.getTrailWithModules(trailId),
    enabled: !!trailId,
  });
}

export function useUserEnrollments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: trailKeys.enrollments(user?.id || ""),
    queryFn: () => trailsService.getUserEnrollments(user!.id),
    enabled: !!user?.id,
  });
}

export function useModuleProgress(moduleIds: string[]) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: trailKeys.moduleProgress(user?.id || "", moduleIds),
    queryFn: () => trailsService.getUserModuleProgress(user!.id, moduleIds),
    enabled: !!user?.id && moduleIds.length > 0,
  });
}

export function useEnrollInTrail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (trailId: string) => trailsService.enrollInTrail(user!.id, trailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.enrollments(user!.id) });
      toast.success("Inscrição realizada com sucesso!");
    },
    onError: (error: Error) => {
      showErrorToast(error, "inscrever na trilha");
    },
  });
}

export function useStartModule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (moduleId: string) => trailsService.startModule(user!.id, moduleId),
    onSuccess: (_, moduleId) => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
    },
  });
}

export function useCompleteModule() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ moduleId, score, xpReward, trailId, totalModules, completedModules }: { 
      moduleId: string; 
      score?: number;
      xpReward: number;
      trailId: string;
      totalModules: number;
      completedModules: number;
    }) => {
      // Complete the module with XP reward (combo is applied inside the service)
      const result = await trailsService.completeModule(user!.id, moduleId, score, xpReward);
      
      // Calculate new progress percentage
      const newCompletedCount = completedModules + 1;
      const progressPercent = Math.round((newCompletedCount / totalModules) * 100);
      
      // Update enrollment progress
      await trailsService.updateEnrollmentProgress(user!.id, trailId, progressPercent);
      
      return { progress: result.progress, progressPercent, comboResult: result.comboResult };
    },
    onSuccess: ({ progressPercent, comboResult }) => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
      queryClient.invalidateQueries({ queryKey: ['combo'] });
      
      const comboText = comboResult.bonusXp > 0 
        ? ` (${comboResult.finalXp - comboResult.bonusXp} + ${comboResult.bonusXp} combo ${comboResult.multiplier}x)`
        : '';
      
      if (progressPercent >= 100) {
        toast.success(`🎉 Parabéns! Você completou a trilha! +${comboResult.finalXp} XP${comboText}`);
      } else {
        toast.success(`✅ Módulo concluído! +${comboResult.finalXp} XP${comboText}`);
      }
    },
    onError: () => {
      toast.error("Erro ao completar módulo");
    },
  });
}

export function useCreateTrail() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (trail: Omit<CreateTrailInput, 'created_by'>) => 
      trailsService.createTrail({ ...trail, created_by: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
      toast.success("Trilha criada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar trilha");
    },
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (module: CreateModuleInput) => trailsService.createModule(module),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
    },
  });
}

export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TrailModule> }) =>
      trailsService.updateModule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
    },
    onError: (error: Error) => {
      showErrorToast(error, "atualizar módulo");
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trailsService.deleteModule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
      toast.success("Módulo removido");
    },
    onError: (error: Error) => {
      showErrorToast(error, "remover módulo");
    },
  });
}

export function useReorderModules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (changes: { id: string; order_index: number }[]) =>
      trailsService.reorderModules(changes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
    },
    onError: (error: Error) => {
      showErrorToast(error, "reordenar módulos");
    },
  });
}

export function useUpdateTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<LearningTrail> }) =>
      trailsService.updateTrail(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
      toast.success("Trilha atualizada!");
    },
  });
}

export function useDeleteTrail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => trailsService.deleteTrail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.all });
      toast.success("Trilha excluída");
    },
  });
}

export function useTrailPrerequisites() {
  return useQuery({
    queryKey: trailKeys.prerequisites(),
    queryFn: () => trailsService.getPrerequisites(),
  });
}

export function useCheckPrerequisites(trailId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: [...trailKeys.prerequisites(), "check", user?.id, trailId],
    queryFn: () => trailsService.checkPrerequisitesCompleted(user!.id, trailId),
    enabled: !!user?.id && !!trailId,
  });
}

export function useAddPrerequisite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, prerequisiteTrailId }: { trailId: string; prerequisiteTrailId: string }) =>
      trailsService.addPrerequisite(trailId, prerequisiteTrailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.prerequisites() });
      toast.success("Pré-requisito adicionado!");
    },
    onError: () => {
      toast.error("Erro ao adicionar pré-requisito");
    },
  });
}

export function useRemovePrerequisite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ trailId, prerequisiteTrailId }: { trailId: string; prerequisiteTrailId: string }) =>
      trailsService.removePrerequisite(trailId, prerequisiteTrailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trailKeys.prerequisites() });
      toast.success("Pré-requisito removido!");
    },
  });
}
