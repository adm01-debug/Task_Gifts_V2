import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { memoryGameService } from "@/services/memoryGameService";
import { useAuth } from "./useAuth";

export const memoryGameKeys = {
  all: ["memoryGame"] as const,
  decks: () => [...memoryGameKeys.all, "decks"] as const,
  pairs: (deckId: string) => [...memoryGameKeys.all, "pairs", deckId] as const,
  history: () => [...memoryGameKeys.all, "history"] as const,
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
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}