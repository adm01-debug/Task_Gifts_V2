import { supabase } from "@/integrations/supabase/client";
import type { Tables, Database } from "@/integrations/supabase/types";

export type AuditLog = Tables<"audit_logs">;
export type AuditAction = Database["public"]["Enums"]["audit_action"];

export interface FeedActivity {
  id: string;
  type: "xp_gained" | "level_up" | "quest_completed" | "kudos_given" | "kudos_received" | "achievement_unlocked" | "streak_updated";
  userId: string;
  userName: string;
  avatarUrl: string | null;
  message: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  icon: string;
  color: string;
}

const activityConfig: Record<string, { icon: string; color: string; getMessage: (data: Record<string, unknown>, userName: string) => string }> = {
  xp_gained: {
    icon: "⚡",
    color: "text-yellow-500",
    getMessage: (data, userName) => `${userName} ganhou ${data.xp_amount || 0} XP por ${data.source || "atividade"}`,
  },
  level_up: {
    icon: "🎉",
    color: "text-purple-500",
    getMessage: (data, userName) => `${userName} subiu para o nível ${data.new_level || "?"}!`,
  },
  quest_completed: {
    icon: "✅",
    color: "text-green-500",
    getMessage: (data, userName) => `${userName} completou a quest "${data.quest_title || "Quest"}"`,
  },
  kudos_given: {
    icon: "🌟",
    color: "text-amber-500",
    getMessage: (data, userName) => `${userName} enviou um kudos para ${data.to_user_name || "colega"}`,
  },
  kudos_received: {
    icon: "💫",
    color: "text-pink-500",
    getMessage: (data, userName) => `${userName} recebeu um kudos de ${data.from_user_name || "colega"}`,
  },
  achievement_unlocked: {
    icon: "🏆",
    color: "text-orange-500",
    getMessage: (data, userName) => `${userName} desbloqueou "${data.achievement_name || "Conquista"}"`,
  },
  streak_updated: {
    icon: "🔥",
    color: "text-red-500",
    getMessage: (data, userName) => `${userName} está com ${data.new_streak || 0} dias de streak!`,
  },
};

export const socialFeedService = {
  async getRecentActivities(limit = 50): Promise<FeedActivity[]> {
    const relevantActions: AuditAction[] = [
      "xp_gained",
      "level_up",
      "quest_completed",
      "kudos_given",
      "kudos_received",
      "achievement_unlocked",
      "streak_updated",
    ];

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .in("action", relevantActions)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!logs || logs.length === 0) return [];

    // Get unique user IDs
    const userIds = [...new Set(logs.map((log) => log.user_id))];

    // Fetch profiles for all users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

    return logs.map((log) => {
      const profile = profileMap.get(log.user_id);
      const config = activityConfig[log.action] || {
        icon: "📌",
        color: "text-muted-foreground",
        getMessage: (_, userName) => `${userName} realizou uma ação`,
      };
      const metadata = (log.metadata as Record<string, unknown>) || {};

      return {
        id: log.id,
        type: log.action as FeedActivity["type"],
        userId: log.user_id,
         userName: profile?.display_name || "Usuário",
         avatarUrl: profile?.avatar_url || null,
         message: config.getMessage(metadata, profile?.display_name || "Usuário"),
        metadata,
        createdAt: log.created_at,
        icon: config.icon,
        color: config.color,
      };
    });
  },

  async getUserActivities(userId: string, limit = 20): Promise<FeedActivity[]> {
    const relevantActions: AuditAction[] = [
      "xp_gained",
      "level_up",
      "quest_completed",
      "kudos_given",
      "kudos_received",
      "achievement_unlocked",
      "streak_updated",
    ];

    const { data: logs, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .in("action", relevantActions)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!logs || logs.length === 0) return [];

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .eq("id", userId)
      .maybeSingle();

    return logs.map((log) => {
      const config = activityConfig[log.action] || {
        icon: "📌",
        color: "text-muted-foreground",
        getMessage: (_, userName) => `${userName} realizou uma ação`,
      };
      const metadata = (log.metadata as Record<string, unknown>) || {};

      return {
        id: log.id,
        type: log.action as FeedActivity["type"],
        userId: log.user_id,
         userName: profile?.display_name || "Usuário",
         avatarUrl: profile?.avatar_url || null,
         message: config.getMessage(metadata, profile?.display_name || "Usuário"),
        metadata,
        createdAt: log.created_at,
        icon: config.icon,
        color: config.color,
      };
    });
  },
};
