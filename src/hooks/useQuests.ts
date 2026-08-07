import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { questsService, type Quest, type QuestInsert, type QuestUpdate, type QuestStepInsert, type QuestStatus } from "@/services/questsService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const questKeys = {
  all: ["quests"] as const,
  lists: () => [...questKeys.all, "list"] as const,
  list: (status?: QuestStatus) => [...questKeys.lists(), { status }] as const,
  details: () => [...questKeys.all, "detail"] as const,
  detail: (id: string) => [...questKeys.details(), id] as const,
  byCreator: (creatorId: string) => [...questKeys.all, "creator", creatorId] as const,
  steps: (questId: string) => [...questKeys.all, "steps", questId] as const,
  assignments: (questId: string) => [...questKeys.all, "assignments", questId] as const,
  userAssignments: (userId: string) => [...questKeys.all, "userAssignments", userId] as const,
  stats: (questId: string) => [...questKeys.all, "stats", questId] as const,
};

// Queries
export function useQuests(status?: QuestStatus) {
  return useQuery({
    queryKey: questKeys.list(status),
    queryFn: () => questsService.getAll(status),
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: questKeys.detail(id),
    queryFn: () => questsService.getById(id),
    enabled: !!id,
  });
}

export function useMyQuests() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: questKeys.byCreator(user?.id ?? ""),
    queryFn: () => questsService.getByCreator(user!.id),
    enabled: !!user?.id,
  });
}

export function useQuestSteps(questId: string) {
  return useQuery({
    queryKey: questKeys.steps(questId),
    queryFn: () => questsService.getSteps(questId),
    enabled: !!questId,
  });
}

export function useQuestAssignments(questId: string) {
  return useQuery({
    queryKey: questKeys.assignments(questId),
    queryFn: () => questsService.getAssignments(questId),
    enabled: !!questId,
  });
}

export function useMyAssignments() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: questKeys.userAssignments(user?.id ?? ""),
    queryFn: () => questsService.getUserAssignments(user!.id),
    enabled: !!user?.id,
  });
}

export function useQuestStats(questId: string) {
  return useQuery({
    queryKey: questKeys.stats(questId),
    queryFn: () => questsService.getQuestStats(questId),
    enabled: !!questId,
  });
}

// Mutations
export function useCreateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      quest, 
      steps 
    }: { 
      quest: QuestInsert; 
      steps?: Omit<QuestStepInsert, "quest_id">[] 
    }) => {
      const createdQuest = await questsService.create(quest);
      
      if (steps && steps.length > 0) {
        const stepsWithQuestId = steps.map((step, index) => ({
          ...step,
          quest_id: createdQuest.id,
          order_index: index,
        }));
        await questsService.createSteps(stepsWithQuestId);
      }
      
      return createdQuest;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questKeys.byCreator(data.created_by) });
    },
  });
}

export function useUpdateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      updates, 
      steps 
    }: { 
      id: string; 
      updates: QuestUpdate; 
      steps?: Omit<QuestStepInsert, "quest_id">[] 
    }) => {
      const updatedQuest = await questsService.update(id, updates);
      
      if (steps) {
        // Delete old steps and create new ones
        await questsService.deleteSteps(id);
        if (steps.length > 0) {
          const stepsWithQuestId = steps.map((step, index) => ({
            ...step,
            quest_id: id,
            order_index: index,
          }));
          await questsService.createSteps(stepsWithQuestId);
        }
      }
      
      return updatedQuest;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(questKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
      queryClient.invalidateQueries({ queryKey: questKeys.steps(data.id) });
    },
  });
}

export function useDeleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
    },
  });
}

export function useArchiveQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questsService.archive(id),
    onSuccess: (data) => {
      queryClient.setQueryData(questKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
    },
  });
}

export function useActivateQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => questsService.activate(id),
    onSuccess: (data) => {
      queryClient.setQueryData(questKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: questKeys.lists() });
    },
  });
}

export function useAssignQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ questId, userId }: { questId: string; userId: string }) =>
      questsService.assignQuest(questId, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.assignments(data.quest_id) });
      queryClient.invalidateQueries({ queryKey: questKeys.userAssignments(data.user_id) });
      queryClient.invalidateQueries({ queryKey: questKeys.stats(data.quest_id) });
    },
  });
}

export function useUpdateQuestProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ assignmentId, currentStep }: { assignmentId: string; currentStep: number }) =>
      questsService.updateProgress(assignmentId, currentStep),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.assignments(data.quest_id) });
      queryClient.invalidateQueries({ queryKey: questKeys.userAssignments(data.user_id) });
    },
  });
}

export function useCompleteQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (assignmentId: string) => questsService.completeQuest(assignmentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: questKeys.assignments(data.assignment.quest_id) });
      queryClient.invalidateQueries({ queryKey: questKeys.userAssignments(data.assignment.user_id) });
      queryClient.invalidateQueries({ queryKey: questKeys.stats(data.assignment.quest_id) });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      queryClient.invalidateQueries({ queryKey: ['combo'] });
      
      if (data.quest && data.comboResult) {
        const comboText = data.comboResult.bonusXp > 0 
          ? ` (${data.comboResult.finalXp - data.comboResult.bonusXp} + ${data.comboResult.bonusXp} combo ${data.comboResult.multiplier}x)`
          : '';
        
        toast.success(`🎉 Quest completada! +${data.comboResult.finalXp} XP${comboText}`, {
          duration: 5000,
        });
      }
    },
  });
}
