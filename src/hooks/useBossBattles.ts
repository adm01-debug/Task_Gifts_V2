import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { bossBattleService, type BossBattleDraftPayload } from "@/services/bossBattleService";
import { useAuth } from "./useAuth";

export const bossBattleKeys = {
  all: ["boss-battles"] as const,
  list: () => [...bossBattleKeys.all, "list"] as const,
  myDamage: (battleId: string, userId: string) =>
    [...bossBattleKeys.all, "damage", battleId, userId] as const,
  leaderboard: (battleId: string, limit: number) =>
    [...bossBattleKeys.all, "leaderboard", battleId, limit] as const,
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

/** Ranking de contribuintes; atualiza sozinho enquanto a batalha está viva. */
export function useBossLeaderboard(battleId?: string, limit = 20, live = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: bossBattleKeys.leaderboard(battleId ?? "none", limit),
    queryFn: () => bossBattleService.leaderboard(battleId as string, limit),
    enabled: !!user?.id && !!battleId,
    staleTime: 15_000,
    refetchInterval: live ? 30_000 : false,
  });
}

function _unusedSettlePlaceholder() {
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

export function useCreateBossBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BossBattleDraftPayload) => bossBattleService.create(payload),
    onSuccess: (battle) => {
      toast.success(
        battle.status === "running"
          ? `"${battle.title}" foi convocado e já está valendo.`
          : `"${battle.title}" salvo como rascunho.`,
      );
      queryClient.invalidateQueries({ queryKey: bossBattleKeys.all });
    },
    onError: () => toast.error("Não foi possível criar a batalha."),
  });
}

export function usePublishBossBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (battleId: string) => bossBattleService.publish(battleId),
    onSuccess: () => {
      toast.success("Batalha publicada para o time.");
      queryClient.invalidateQueries({ queryKey: bossBattleKeys.all });
    },
    onError: () => toast.error("Não foi possível publicar a batalha."),
  });
}

export function useExpireBossBattle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (battleId: string) => bossBattleService.expire(battleId),
    onSuccess: () => {
      toast.success("Batalha encerrada.");
      queryClient.invalidateQueries({ queryKey: bossBattleKeys.all });
    },
    onError: () => toast.error("Não foi possível encerrar a batalha."),
  });
}