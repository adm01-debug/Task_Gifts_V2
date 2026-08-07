import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { activityCommentsService, ActivityComment } from "@/services/activityCommentsService";

export const activityCommentsKeys = {
  all: ["activity-comments"] as const,
  byActivity: (activityId: string) => [...activityCommentsKeys.all, activityId] as const,
  counts: (activityIds: string[]) => [...activityCommentsKeys.all, "counts", ...activityIds] as const,
};

export function useActivityComments(activityId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: activityCommentsKeys.byActivity(activityId),
    queryFn: () => activityCommentsService.getCommentsByActivityId(activityId),
    enabled: !!activityId,
    staleTime: 30000,
  });

  // Real-time subscription for comments
  useEffect(() => {
    if (!activityId) return;

    const channel = supabase
      .channel(`activity-comments-${activityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "activity_comments",
          filter: `activity_id=eq.${activityId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: activityCommentsKeys.byActivity(activityId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activityId, queryClient]);

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useCommentsCounts(activityIds: string[]) {
  return useQuery({
    queryKey: activityCommentsKeys.counts(activityIds),
    queryFn: () => activityCommentsService.getCommentsCountByActivityIds(activityIds),
    enabled: activityIds.length > 0,
    staleTime: 30000,
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ activityId, userId, content }: { activityId: string; userId: string; content: string }) =>
      activityCommentsService.addComment(activityId, userId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: activityCommentsKeys.byActivity(variables.activityId) });
      queryClient.invalidateQueries({ queryKey: activityCommentsKeys.all });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => activityCommentsService.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityCommentsKeys.all });
    },
  });
}
