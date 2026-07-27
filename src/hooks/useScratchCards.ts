import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { scratchCardService, type ScratchCardSource } from "@/services/scratchCardService";
import { useAuth } from "./useAuth";

export const scratchCardKeys = {
  all: ["scratchCards"] as const,
  list: () => [...scratchCardKeys.all, "list"] as const,
};

export function useScratchCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: scratchCardKeys.list(),
    queryFn: () => scratchCardService.list(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useRevealScratchCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (cardId: string) => scratchCardService.reveal(cardId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scratchCardKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useGrantScratchCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ source, sourceRef }: { source: ScratchCardSource; sourceRef?: string }) =>
      scratchCardService.grant(source, sourceRef),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: scratchCardKeys.all });
    },
  });
}