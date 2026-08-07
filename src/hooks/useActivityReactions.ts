import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { activityReactionsService, ReactionCount } from "@/services/activityReactionsService";
import { useAuth } from "@/hooks/useAuth";

export const activityReactionsKeys = {
  all: ["activity-reactions"] as const,
  byActivities: (activityIds: string[]) => [...activityReactionsKeys.all, ...activityIds] as const,
};

export function useActivityReactions(activityIds: string[]) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery({
    queryKey: activityReactionsKeys.byActivities(activityIds),
    queryFn: () => activityReactionsService.getReactionsByActivityIds(activityIds, user?.id),
    enabled: activityIds.length > 0,
    staleTime: 30000,
  });

  // Real-time subscription
  useEffect(() => {
    if (activityIds.length === 0) return;

    const channel = supabase
      .channel("activity-reactions-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_reactions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: activityReactionsKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityIds, queryClient]);

  return {
    reactions: query.data ?? {},
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useToggleReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, userId, emoji }: { activityId: string; userId: string; emoji: string }) =>
      activityReactionsService.toggleReaction(activityId, userId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityReactionsKeys.all });
    },
  });
}
