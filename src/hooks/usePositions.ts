import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { positionsService, Position, PositionTaskTemplate, UserPosition, TaskScore, TaskPenalty, PenaltyRule } from "@/services/positionsService";
import { toast } from "sonner";

// === POSITIONS ===
export function usePositions() {
  return useQuery({
    queryKey: ["positions"],
    queryFn: () => positionsService.getPositions(),
  });
}

export function useActivePositions() {
  return useQuery({
    queryKey: ["positions", "active"],
    queryFn: () => positionsService.getActivePositions(),
  });
}

export function useCreatePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (position: Partial<Position>) => positionsService.createPosition(position),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Cargo criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar cargo: ${error.message}`);
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Position> }) => 
      positionsService.updatePosition(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Cargo atualizado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cargo: ${error.message}`);
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => positionsService.deletePosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] });
      toast.success("Cargo removido com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cargo: ${error.message}`);
    },
  });
}

// === TASK TEMPLATES ===
export function useTaskTemplates(positionId?: string) {
  return useQuery({
    queryKey: ["task-templates", positionId],
    queryFn: () => positionsService.getTaskTemplates(positionId),
  });
}

export function useCreateTaskTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (template: Partial<PositionTaskTemplate>) => positionsService.createTaskTemplate(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Tarefa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar tarefa: ${error.message}`);
    },
  });
}

export function useUpdateTaskTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PositionTaskTemplate> }) => 
      positionsService.updateTaskTemplate(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar tarefa: ${error.message}`);
    },
  });
}

export function useDeleteTaskTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => positionsService.deleteTaskTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-templates"] });
      toast.success("Tarefa removida com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover tarefa: ${error.message}`);
    },
  });
}

// === USER POSITIONS ===
export function useUserPositions(userId?: string) {
  return useQuery({
    queryKey: ["user-positions", userId],
    queryFn: () => positionsService.getUserPositions(userId),
  });
}

export function useAssignUserPosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, positionId, isPrimary }: { userId: string; positionId: string; isPrimary?: boolean }) => 
      positionsService.assignUserPosition(userId, positionId, isPrimary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      toast.success("Cargo atribuído com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atribuir cargo: ${error.message}`);
    },
  });
}

export function useRemoveUserPosition() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => positionsService.removeUserPosition(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-positions"] });
      toast.success("Cargo removido do usuário!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cargo: ${error.message}`);
    },
  });
}

// === TASK SCORES ===
export function useTaskScores(userId?: string, status?: string) {
  return useQuery({
    queryKey: ["task-scores", userId, status],
    queryFn: () => positionsService.getTaskScores(userId, status),
  });
}

export function useMyTaskScores() {
  return useQuery({
    queryKey: ["task-scores", "my"],
    queryFn: () => positionsService.getMyTaskScores(),
  });
}

export function useCompleteTaskScore() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskScoreId, status }: { taskScoreId: string; status: 'on_time' | 'late' | 'rejected' | 'rework' }) => 
      positionsService.completeTaskScore(taskScoreId, status),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["task-scores"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      if (result.xp_earned && result.xp_earned > 0) {
        toast.success(`Tarefa concluída! +${result.xp_earned} XP`);
      } else if (result.xp_penalty && result.xp_penalty > 0) {
        toast.warning(`Tarefa processada com penalidade de -${result.xp_penalty} XP`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao concluir tarefa: ${error.message}`);
    },
  });
}

// === PENALTIES ===
export function useTaskPenalties(userId?: string) {
  return useQuery({
    queryKey: ["task-penalties", userId],
    queryFn: () => positionsService.getTaskPenalties(userId),
  });
}

export function useApplyPenalty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, taskScoreId, penaltyType, xpDeducted, coinsDeducted, reason }: {
      userId: string;
      taskScoreId: string;
      penaltyType: string;
      xpDeducted: number;
      coinsDeducted?: number;
      reason?: string;
    }) => positionsService.applyPenalty(userId, taskScoreId, penaltyType, xpDeducted, coinsDeducted, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-penalties"] });
      queryClient.invalidateQueries({ queryKey: ["task-scores"] });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Penalidade aplicada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aplicar penalidade: ${error.message}`);
    },
  });
}

// === PENALTY RULES ===
export function usePenaltyRules() {
  return useQuery({
    queryKey: ["penalty-rules"],
    queryFn: () => positionsService.getPenaltyRules(),
  });
}

export function useUpdatePenaltyRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<PenaltyRule> }) => 
      positionsService.updatePenaltyRule(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalty-rules"] });
      toast.success("Regra atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar regra: ${error.message}`);
    },
  });
}

export function useCreatePenaltyRule() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (rule: Partial<PenaltyRule>) => positionsService.createPenaltyRule(rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["penalty-rules"] });
      toast.success("Regra criada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar regra: ${error.message}`);
    },
  });
}

// === STATISTICS ===
export function useUserTaskStats(userId: string) {
  return useQuery({
    queryKey: ["task-stats", userId],
    queryFn: () => positionsService.getUserTaskStats(userId),
    enabled: !!userId,
  });
}
