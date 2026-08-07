import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { socialFeedService, FeedActivity } from "@/services/socialFeedService";

export const socialFeedKeys = {
  all: ["social-feed"] as const,
  recent: (limit: number) => [...socialFeedKeys.all, "recent", limit] as const,
  user: (userId: string, limit: number) => [...socialFeedKeys.all, "user", userId, limit] as const,
};

export function useSocialFeed(limit = 50) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: socialFeedKeys.recent(limit),
    queryFn: () => socialFeedService.getRecentActivities(limit),
    staleTime: 30000,
  });

  // Real-time subscription for new activities
  useEffect(() => {
    const channel = supabase
      .channel("social-feed-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "audit_logs",
        },
        () => {
          // Invalidate and refetch on new audit log
          queryClient.invalidateQueries({ queryKey: socialFeedKeys.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return {
    activities: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useUserFeed(userId: string | undefined, limit = 20) {
  return useQuery({
    queryKey: socialFeedKeys.user(userId ?? "", limit),
    queryFn: () => socialFeedService.getUserActivities(userId!, limit),
    enabled: !!userId,
    staleTime: 30000,
  });
}
