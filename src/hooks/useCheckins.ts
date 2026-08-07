import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { checkinsService, CheckinInsert } from "@/services/checkinsService";
import { useToast } from "@/hooks/use-toast";

export function useCheckins() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["checkin-templates"],
    queryFn: () => checkinsService.getTemplates(),
  });

  const myCheckinsQuery = useQuery({
    queryKey: ["checkins", "mine"],
    queryFn: () => checkinsService.getMyCheckins(),
  });

  const upcomingQuery = useQuery({
    queryKey: ["checkins", "upcoming"],
    queryFn: () => checkinsService.getUpcomingCheckins(),
  });

  const createCheckinMutation = useMutation({
    mutationFn: (checkin: CheckinInsert) => checkinsService.createCheckin(checkin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      toast({ title: "Check-in agendado!" });
    },
    onError: () => {
      toast({ title: "Erro ao agendar check-in", variant: "destructive" });
    },
  });

  const completeCheckinMutation = useMutation({
    mutationFn: ({ id, responses, moodRating }: { id: string; responses: Record<string, string | number>; moodRating?: number }) =>
      checkinsService.completeCheckin(id, responses, moodRating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      toast({ title: "Check-in concluído! +50 XP" });
    },
    onError: () => {
      toast({ title: "Erro ao concluir check-in", variant: "destructive" });
    },
  });

  const addActionItemMutation = useMutation({
    mutationFn: ({ checkinId, item }: { checkinId: string; item: { text: string; completed: boolean; due_date?: string } }) =>
      checkinsService.addActionItem(checkinId, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
    },
  });

  const toggleActionItemMutation = useMutation({
    mutationFn: ({ checkinId, itemId }: { checkinId: string; itemId: string }) =>
      checkinsService.toggleActionItem(checkinId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
    },
  });

  return {
    templates: templatesQuery.data ?? [],
    checkins: myCheckinsQuery.data ?? [],
    upcomingCheckins: upcomingQuery.data ?? [],
    isLoading: myCheckinsQuery.isLoading,
    createCheckin: createCheckinMutation.mutate,
    completeCheckin: completeCheckinMutation.mutate,
    addActionItem: addActionItemMutation.mutate,
    toggleActionItem: toggleActionItemMutation.mutate,
    isCreating: createCheckinMutation.isPending,
  };
}
