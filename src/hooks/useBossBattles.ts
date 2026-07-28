import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bossBattleService } from "@/services/bossBattleService";
import { useAuth } from "./useAuth";

export const bossBattleKeys = {
  all: ["boss-battles"] as const,
  list: () => [...bossBattleKeys.all, "list"] as const,
  myDamage: (battleId: string, userId: string) =>
    [...bossBattleKeys.all, "damage", battleId, userId] as const,
};

export function useBossBattles() {
  const { user } = useAuth();
  return useQuery({
    queryKey: bossBattleKeys.list(),
    queryFn: () => bossBattleService.list(),
    enabled: !!user,
    staleTime: 20_000,
  });
}

export function useMyBossDamage(battleId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: bossBattleKeys.myDamage(battleId ?? "none", user?.id ?? "anon"),
    queryFn: () => bossBattleService.myDamage(battleId as string, user!.id),
    enabled: !!user?.id && !!battleId,
    staleTime: 15_000,
  });
}

export function useSettleBossBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (battleId: string) => bossBattleService.settle(battleId),
    onSuccess: (result) => {
      if (result.alreadySettled) {
        toast.info("Esta batalha já havia sido apurada.");
      } else {
        toast.success(`Batalha apurada: ${result.coins} moedas e ${result.xp} XP distribuídos.`);
      }
      queryClient.invalidateQueries({ queryKey: bossBattleKeys.all });
    },
    onError: () => toast.error("Não foi possível apurar a batalha."),
  });
}