import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  wagerIntegrityReviewService,
  type WagerIntegrityReview,
  type WagerReviewStatus,
} from "@/services/wagerIntegrityReviewService";
import type { WagerAnomalyCode } from "@/lib/wagerIntegrity";
import type { WagerLeaderboardWindow } from "@/lib/wagerLeaderboard";
import { useAuth } from "./useAuth";
import {
  wagerIntegrityReviewEventService,
  type WagerIntegrityReviewEvent,
} from "@/services/wagerIntegrityReviewEventService";

export const wagerIntegrityKeys = {
  all: ["wagerIntegrityReviews"] as const,
  list: (days: number) => [...wagerIntegrityKeys.all, "list", days] as const,
  events: (days: number) => [...wagerIntegrityKeys.all, "events", days] as const,
};

/** Apurações registradas para o período selecionado. */
export function useWagerIntegrityReviews(days: WagerLeaderboardWindow) {
  const { user } = useAuth();
  return useQuery<WagerIntegrityReview[]>({
    queryKey: wagerIntegrityKeys.list(days),
    queryFn: () => wagerIntegrityReviewService.list(days),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export interface SaveWagerReviewInput {
  targetUserId: string;
  anomalyCode: WagerAnomalyCode;
  windowDays: WagerLeaderboardWindow;
  status: WagerReviewStatus;
  notes?: string | null;
  metric?: number;
}

/** Registra o desfecho da apuração de uma anomalia. */
export function useSaveWagerIntegrityReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SaveWagerReviewInput) => wagerIntegrityReviewService.upsert(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: wagerIntegrityKeys.all });
    },
  });
}

/** Histórico imutável de mudanças de desfecho no período selecionado. */
export function useWagerIntegrityReviewEvents(days: WagerLeaderboardWindow) {
  const { user } = useAuth();
  return useQuery<WagerIntegrityReviewEvent[]>({
    queryKey: wagerIntegrityKeys.events(days),
    queryFn: () => wagerIntegrityReviewEventService.list(days),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}