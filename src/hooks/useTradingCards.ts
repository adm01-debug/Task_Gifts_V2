import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { SetMilestone } from "@/lib/cardSetRewards";
import { tradingCardsService } from "@/services/tradingCardsService";
import { useAuth } from "./useAuth";

export const tradingCardKeys = {
  all: ["tradingCards"] as const,
  definitions: () => [...tradingCardKeys.all, "definitions"] as const,
  owned: () => [...tradingCardKeys.all, "owned"] as const,
  packs: () => [...tradingCardKeys.all, "packs"] as const,
  trades: () => [...tradingCardKeys.all, "trades"] as const,
  setRewards: () => [...tradingCardKeys.all, "setRewards"] as const,
};

export function useCardDefinitions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: tradingCardKeys.definitions(),
    queryFn: () => tradingCardsService.listDefinitions(),
    enabled: !!user,
    // O catálogo muda raramente: cache longo evita refetch a cada navegação.
    staleTime: 10 * 60_000,
  });
}

export function useOwnedCards() {
  const { user } = useAuth();
  return useQuery({
    queryKey: tradingCardKeys.owned(),
    queryFn: () => tradingCardsService.listOwned(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCardPacks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: tradingCardKeys.packs(),
    queryFn: () => tradingCardsService.listPacks(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useCardTrades() {
  const { user } = useAuth();
  return useQuery({
    queryKey: tradingCardKeys.trades(),
    queryFn: () => tradingCardsService.listTrades(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useOpenCardPack() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (packId: string) => tradingCardsService.openPack(packId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tradingCardKeys.owned() });
      void queryClient.invalidateQueries({ queryKey: tradingCardKeys.packs() });
    },
  });
}

export function useRespondCardTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { tradeId: string; action: "accept" | "decline" | "cancel" }) =>
      tradingCardsService.respondTrade(params.tradeId, params.action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tradingCardKeys.trades() });
      void queryClient.invalidateQueries({ queryKey: tradingCardKeys.owned() });
    },
  });
}
