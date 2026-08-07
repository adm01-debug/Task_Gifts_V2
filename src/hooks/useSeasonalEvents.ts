import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { seasonalEventsService, SeasonalEvent } from "@/services/seasonalEventsService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const seasonalEventsKeys = {
  all: ["seasonal-events"] as const,
  active: () => [...seasonalEventsKeys.all, "active"] as const,
  detail: (eventId: string) => [...seasonalEventsKeys.all, eventId] as const,
};

export function useActiveSeasonalEvents() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: seasonalEventsKeys.active(),
    queryFn: () => seasonalEventsService.getActiveEvents(),
    staleTime: 60000,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("seasonal-events-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "seasonal_events",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: seasonalEventsKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSeasonalEventDetail(eventId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: seasonalEventsKeys.detail(eventId),
    queryFn: () => seasonalEventsService.getEventWithChallenges(eventId, user?.id),
    enabled: !!eventId,
    staleTime: 30000,
  });

  // Real-time subscription for progress
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`seasonal-progress-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_seasonal_progress",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: seasonalEventsKeys.detail(eventId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, user, queryClient]);

  return {
    event: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useClaimSeasonalReward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) => {
      if (!user) throw new Error("User not authenticated");
      return seasonalEventsService.claimReward(user.id, challengeId);
    },
    onSuccess: (rewards) => {
      toast.success(`Recompensa coletada! +${rewards.xp} XP, +${rewards.coins} moedas`);
      queryClient.invalidateQueries({ queryKey: seasonalEventsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast.error("Erro ao coletar recompensa");
    },
  });
}
