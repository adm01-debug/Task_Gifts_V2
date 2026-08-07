import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memoryDeckAdminService, memoryGameService } from "@/services/memoryGameService";
import type { DeckDraft, PairDiff } from "@/lib/memoryDeckAuthoring";
import { useAuth } from "./useAuth";

export const memoryGameKeys = {
  all: ["memoryGame"] as const,
  decks: () => [...memoryGameKeys.all, "decks"] as const,
  pairs: (deckId: string) => [...memoryGameKeys.all, "pairs", deckId] as const,
  history: () => [...memoryGameKeys.all, "history"] as const,
  leaderboard: (deckId: string | null, days: number) =>
    [...memoryGameKeys.all, "leaderboard", deckId ?? "all", days] as const,
  adminDecks: () => [...memoryGameKeys.all, "adminDecks"] as const,
};

export function useMemoryDecks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: memoryGameKeys.decks(),
    queryFn: () => memoryGameService.listDecks(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMemoryPairs(deckId: string | null) {
  return useQuery({
    queryKey: memoryGameKeys.pairs(deckId ?? ""),
    queryFn: () => memoryGameService.listPairs(deckId as string),
    enabled: !!deckId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMemoryHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: memoryGameKeys.history(),
    queryFn: () => memoryGameService.history(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useMemoryLeaderboard(deckId: string | null, days = 7) {
  const { user } = useAuth();
  return useQuery({
    queryKey: memoryGameKeys.leaderboard(deckId, days),
    queryFn: () => memoryGameService.leaderboard(deckId, days),
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useStartMemorySession() {
  return useMutation({
    mutationFn: (deckId: string) => memoryGameService.start(deckId),
  });
}

export function useFinishMemorySession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      moves,
      matchedPairs,
    }: {
      sessionId: string;
      moves: number;
      matchedPairs: number;
    }) => memoryGameService.finish(sessionId, moves, matchedPairs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memoryGameKeys.history() });
      void queryClient.invalidateQueries({ queryKey: [...memoryGameKeys.all, "leaderboard"] });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useAdminMemoryDecks(enabled = true) {
  return useQuery({
    queryKey: memoryGameKeys.adminDecks(),
    queryFn: () => memoryDeckAdminService.listAll(),
    enabled,
    staleTime: 60_000,
  });
}

function useInvalidateDecks() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: memoryGameKeys.all });
  };
}

export function useSaveMemoryDeck() {
  const invalidate = useInvalidateDecks();
  return useMutation({
    mutationFn: async ({
      deckId,
      draft,
      diff,
    }: {
      deckId: string | null;
      draft: DeckDraft;
      diff: PairDiff;
    }) => {
      const id = deckId
        ? (await memoryDeckAdminService.updateDeck(deckId, draft), deckId)
        : (await memoryDeckAdminService.createDeck(draft)).id;
      await memoryDeckAdminService.applyPairDiff(id, diff);
      return id;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMemoryDeck() {
  const invalidate = useInvalidateDecks();
  return useMutation({
    mutationFn: (deckId: string) => memoryDeckAdminService.deleteDeck(deckId),
    onSuccess: invalidate,
  });
}