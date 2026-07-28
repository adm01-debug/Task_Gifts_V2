import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  predictionMarketService,
  type CreateMarketInput,
} from "@/services/predictionMarketService";
import { useAuth } from "./useAuth";

export const predictionKeys = {
  all: ["prediction-markets"] as const,
  list: () => [...predictionKeys.all, "list"] as const,
  myStakes: () => [...predictionKeys.all, "my-stakes"] as const,
  adminEvents: (marketId?: string) =>
    [...predictionKeys.all, "admin-events", marketId ?? "all"] as const,
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

/** Trilha auditável das ações administrativas (RLS: apenas admin). */
export function usePredictionAdminEvents(marketId?: string, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: predictionKeys.adminEvents(marketId),
    queryFn: () => predictionMarketService.adminEvents(marketId),
    enabled: !!user && enabled,
    staleTime: 30_000,
  });
}

export function useCreatePredictionMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMarketInput) => predictionMarketService.createMarket(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: predictionKeys.all });
    },
  });
}

export function useTransitionPredictionMarket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      marketId,
      action,
    }: {
      marketId: string;
      action: "publish" | "lock" | "void";
    }) => predictionMarketService.transition(marketId, action),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: predictionKeys.all });
    },
  });
}
