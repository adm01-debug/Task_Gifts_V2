import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { autoChallengesService, AutoChallenge } from "@/services/autoChallengesService";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { profilesService } from "@/services/profilesService";

export function useAutoChallenges() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const challengesQuery = useQuery({
    queryKey: ["auto-challenges", user?.id],
    queryFn: () => autoChallengesService.getCurrentChallenges(user!.id),
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({
      type,
      increment = 1,
    }: {
      type: AutoChallenge["type"];
      increment?: number;
    }) => {
      if (!user?.id) throw new Error("No user");
      return autoChallengesService.updateChallengeProgress(user.id, type, increment);
    },
    onSuccess: async (result) => {
      if (result.completed && result.challenge && user?.id) {
        // Award XP and coins
        await profilesService.addXp(
          user.id,
          result.challenge.xp_reward,
          `Desafio: ${result.challenge.title}`
        );
        await profilesService.addCoins(user.id, result.challenge.coin_reward);

        toast({
          title: `🎉 Desafio Completado!`,
          description: `${result.challenge.title} - +${result.challenge.xp_reward} XP e +${result.challenge.coin_reward} moedas!`,
        });

        // Invalidate profile queries
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
      queryClient.invalidateQueries({ queryKey: ["auto-challenges"] });
    },
  });

  const resetChallengesMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");
      autoChallengesService.resetChallenges(user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auto-challenges"] });
      toast({ title: "Desafios resetados!" });
    },
  });

  const stats = challengesQuery.data
    ? autoChallengesService.getChallengeStats(challengesQuery.data)
    : { total: 0, completed: 0, inProgress: 0, totalXpPossible: 0, earnedXp: 0 };

  return {
    challenges: challengesQuery.data ?? [],
    isLoading: challengesQuery.isLoading,
    stats,
    updateProgress: updateProgressMutation.mutate,
    isUpdating: updateProgressMutation.isPending,
    resetChallenges: resetChallengesMutation.mutate,
    refetch: challengesQuery.refetch,
  };
}
