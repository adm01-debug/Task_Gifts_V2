import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bingoService } from "@/services/bingoService";
import { useAuth } from "./useAuth";

export const bingoKeys = {
  all: ["bingo"] as const,
  card: () => [...bingoKeys.all, "card"] as const,
  marks: (cardId: string) => [...bingoKeys.all, "marks", cardId] as const,
};

export function useBingoCard() {
  const { user } = useAuth();
  return useQuery({
    queryKey: bingoKeys.card(),
    queryFn: () => bingoService.getOrCreateCard(),
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useBingoMarks(cardId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: bingoKeys.marks(cardId ?? "none"),
    queryFn: () => bingoService.marks(cardId as string),
    enabled: !!user && !!cardId,
    staleTime: 30_000,
  });
}

export function useSyncBingoCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => bingoService.sync(cardId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bingoKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
