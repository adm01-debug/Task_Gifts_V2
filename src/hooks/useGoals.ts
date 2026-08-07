import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { goalsService, GoalInsert, KeyResultInsert } from "@/services/goalsService";
import { useToast } from "@/hooks/use-toast";

export function useGoals(departmentId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ["goals"],
    queryFn: () => goalsService.getMyGoals(),
  });

  const teamGoalsQuery = useQuery({
    queryKey: ["goals", "team", departmentId],
    queryFn: () => goalsService.getTeamGoals(departmentId!),
    enabled: !!departmentId,
  });

  const companyGoalsQuery = useQuery({
    queryKey: ["goals", "company"],
    queryFn: () => goalsService.getCompanyGoals(),
  });

  const createGoalMutation = useMutation({
    mutationFn: (goal: GoalInsert) => goalsService.createGoal(goal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Meta criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar meta", variant: "destructive" });
    },
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: Partial<GoalInsert> }) =>
      goalsService.updateGoal(goalId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Meta atualizada!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar meta", variant: "destructive" });
    },
  });

  const createKeyResultMutation = useMutation({
    mutationFn: (keyResult: KeyResultInsert) => goalsService.createKeyResult(keyResult),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Key Result adicionado!" });
    },
  });

  const updateKeyResultMutation = useMutation({
    mutationFn: ({ krId, value, note }: { krId: string; value: number; note?: string }) =>
      goalsService.updateKeyResult(krId, value, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Progresso atualizado!" });
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) => goalsService.deleteGoal(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Meta removida" });
    },
  });

  return {
    goals: goalsQuery.data ?? [],
    teamGoals: teamGoalsQuery.data ?? [],
    companyGoals: companyGoalsQuery.data ?? [],
    isLoading: goalsQuery.isLoading,
    createGoal: createGoalMutation.mutate,
    updateGoal: updateGoalMutation.mutate,
    createKeyResult: createKeyResultMutation.mutate,
    updateKeyResult: updateKeyResultMutation.mutate,
    deleteGoal: deleteGoalMutation.mutate,
    isCreating: createGoalMutation.isPending,
    getGoalWithKeyResults: goalsService.getGoalWithKeyResults,
    getGoalUpdates: goalsService.getGoalUpdates,
  };
}
