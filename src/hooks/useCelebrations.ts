import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { celebrationsService, CelebrationInsert } from "@/services/celebrationsService";
import { useToast } from "@/hooks/use-toast";

export function useCelebrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const upcomingQuery = useQuery({
    queryKey: ["celebrations", "upcoming"],
    queryFn: () => celebrationsService.getUpcomingCelebrations(),
  });

  const myCelebrationsQuery = useQuery({
    queryKey: ["celebrations", "mine"],
    queryFn: () => celebrationsService.getMyCelebrations(),
  });

  const todayQuery = useQuery({
    queryKey: ["celebrations", "today"],
    queryFn: () => celebrationsService.getTodayCelebrations(),
  });

  const createCelebrationMutation = useMutation({
    mutationFn: (celebration: CelebrationInsert) => celebrationsService.createCelebration(celebration),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["celebrations"] });
      toast({ title: "Celebração criada!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar celebração", variant: "destructive" });
    },
  });

  return {
    upcomingCelebrations: upcomingQuery.data ?? [],
    myCelebrations: myCelebrationsQuery.data ?? [],
    todayCelebrations: todayQuery.data ?? [],
    isLoading: upcomingQuery.isLoading,
    createCelebration: createCelebrationMutation.mutate,
    isCreating: createCelebrationMutation.isPending,
  };
}
