import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { predictionMarketService } from "@/services/predictionMarketService";
import { useAuth } from "./useAuth";

export const predictionKeys = {
  all: ["prediction-markets"] as const,
  list: () => [...predictionKeys.all, "list"] as const,
  myStakes: () => [...predictionKeys.all, "my-stakes"] as const,
};

export function usePredictionMarkets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: predictionKeys.list(),
    queryFn: () => predictionMarketService.list(),
    enabled: !!user,
    staleTime: 20_000,
  });
}

export function useMyPredictionStakes() {
  const { user } = useAuth();
  return useQuery({
    queryKey: predictionKeys.myStakes(),
    queryFn: () => predictionMarketService.myStakes(),
    enabled: !!user,
    staleTime: 20_000,
  });
}

export function usePlacePredictionStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      optionId,
      amount,
      dedupeKey,
    }: {
      marketId: string;
      optionId: string;
      amount: number;
      dedupeKey?: string;
    }) => predictionMarketService.placeStake(marketId, optionId, amount, dedupeKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: predictionKeys.all });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useSettlePredictionMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      winningOptionId,
    }: {
      marketId: string;
      winningOptionId: string | null;
    }) => predictionMarketService.settle(marketId, winningOptionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: predictionKeys.all });
    },
  });
}
