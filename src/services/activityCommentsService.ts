import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import { toast } from "sonner";

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const activityCommentsService = {
  async getCommentsByActivityId(activityId: string): Promise<ActivityComment[]> {
    try {
      const { data: comments, error } = await supabase
        .from("activity_comments")
        .select("*")
        .eq("activity_id", activityId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!comments || comments.length === 0) return [];

    // Fetch user profiles
    const userIds = [...new Set(comments.map((c) => c.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return comments.map((comment) => {
      const user = profileMap.get(comment.user_id);
      return {
        ...comment,
        user: user ? { display_name: user.display_name, avatar_url: user.avatar_url } : undefined,
      };
      });
    } catch (error) {
      logger.apiError("getCommentsByActivityId", error, "activityCommentsService");
      return [];
    }
  },

  async getCommentsCountByActivityIds(activityIds: string[]): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from("activity_comments")
        .select("activity_id")
        .in("activity_id", activityIds);

      if (error) throw error;

    const counts: Record<string, number> = {};
    activityIds.forEach((id) => (counts[id] = 0));
    data?.forEach((item) => {
      counts[item.activity_id] = (counts[item.activity_id] || 0) + 1;
    });

      return counts;
    } catch (error) {
      logger.apiError("getCommentsCountByActivityIds", error, "activityCommentsService");
      return {};
    }
  },

  async addComment(activityId: string, userId: string, content: string): Promise<ActivityComment> {
    try {
      const { data, error } = await supabase
        .from("activity_comments")
        .insert({
          activity_id: activityId,
          user_id: userId,
          content: content.trim(),
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to add comment");
      return data;
    } catch (error) {
      logger.apiError("addComment", error, "activityCommentsService");
      toast.error("Erro ao adicionar comentário");
      throw error;
    }
  },

  async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("activity_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
    } catch (error) {
      logger.apiError("deleteComment", error, "activityCommentsService");
      toast.error("Erro ao excluir comentário");
      throw error;
    }
  },
};
