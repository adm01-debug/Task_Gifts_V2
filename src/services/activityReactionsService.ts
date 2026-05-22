import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import { toast } from "sonner";

export interface ActivityReaction {
  id: string;
  activity_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface ReactionCount {
  emoji: string;
  count: number;
  userReacted: boolean;
}

export const AVAILABLE_REACTIONS = ["👍", "❤️", "🎉", "🔥", "👏", "💪"];

export const activityReactionsService = {
  async getReactionsByActivityIds(
    activityIds: string[],
    currentUserId?: string
  ): Promise<Record<string, ReactionCount[]>> {
    try {
      const { data, error } = await supabase
        .from("activity_reactions")
        .select("*")
        .in("activity_id", activityIds);

      if (error) throw error;

    const result: Record<string, ReactionCount[]> = {};
    activityIds.forEach((id) => (result[id] = []));

    if (!data) return result;

    // Group by activity_id and emoji
    const grouped: Record<string, Record<string, { count: number; userReacted: boolean }>> = {};

    data.forEach((reaction) => {
      if (!grouped[reaction.activity_id]) {
        grouped[reaction.activity_id] = {};
      }
      if (!grouped[reaction.activity_id][reaction.emoji]) {
        grouped[reaction.activity_id][reaction.emoji] = { count: 0, userReacted: false };
      }
      grouped[reaction.activity_id][reaction.emoji].count++;
      if (currentUserId && reaction.user_id === currentUserId) {
        grouped[reaction.activity_id][reaction.emoji].userReacted = true;
      }
    });

    // Convert to array format
    Object.entries(grouped).forEach(([activityId, emojis]) => {
      result[activityId] = Object.entries(emojis).map(([emoji, data]) => ({
        emoji,
        count: data.count,
        userReacted: data.userReacted,
      }));
    });

      return result;
    } catch (error) {
      logger.apiError("getReactionsByActivityIds", error, "activityReactionsService");
      return {};
    }
  },

  async toggleReaction(activityId: string, userId: string, emoji: string): Promise<boolean> {
    // Check if reaction exists
    const { data: existing } = await supabase
      .from("activity_reactions")
      .select("id")
      .eq("activity_id", activityId)
      .eq("user_id", userId)
      .eq("emoji", emoji)
      .maybeSingle();

    if (existing) {
      // Remove reaction
      const { error } = await supabase
        .from("activity_reactions")
        .delete()
        .eq("id", existing.id);
      if (error) throw error;
      return false;
    } else {
      // Add reaction
      const { error } = await supabase
        .from("activity_reactions")
        .insert({ activity_id: activityId, user_id: userId, emoji });
      if (error) throw error;
      return true;
    }
  },
};
