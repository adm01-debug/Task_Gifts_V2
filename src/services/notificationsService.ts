import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  data: Json;
  read: boolean;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type?: string;
  title: string;
  message?: string | null;
  data?: Json;
}

export const notificationsService = {
  async getAll(userId: string, limit = 50): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  async getUnread(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .eq("read", false)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data ?? []) as Notification[];
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);
    
    if (error) throw error;
    return count ?? 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);
    
    if (error) throw error;
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    
    if (error) throw error;
  },

  async delete(notificationId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);
    
    if (error) throw error;
  },

  async deleteAll(userId: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", userId);
    
    if (error) throw error;
  },

  async create(notification: NotificationInsert): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();
    
    if (error) throw error;
    return data as Notification;
  },

  // Helper methods for specific notification types
  async notifyAchievement(userId: string, achievementName: string, xpReward: number): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: "achievement",
      title: "🏆 Nova Conquista!",
      message: `Você desbloqueou: ${achievementName}`,
      data: { achievement: achievementName, xp: xpReward },
    });
  },

  async notifyLeaderboardChange(userId: string, newRank: number, previousRank: number): Promise<Notification> {
    const improved = newRank < previousRank;
    return this.create({
      user_id: userId,
      type: "leaderboard",
      title: improved ? "📈 Subiu no Ranking!" : "📉 Mudança no Ranking",
      message: improved 
        ? `Você subiu para a posição #${newRank}!` 
        : `Você agora está na posição #${newRank}`,
      data: { newRank, previousRank },
    });
  },

  async notifyQuestAssigned(userId: string, questTitle: string, questId: string): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: "quest",
      title: "📋 Nova Quest Atribuída!",
      message: `Você recebeu a quest: ${questTitle}`,
      data: { questId, questTitle },
    });
  },

  async notifyLevelUp(userId: string, newLevel: number): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: "level_up",
      title: "⬆️ Level Up!",
      message: `Parabéns! Você chegou ao nível ${newLevel}!`,
      data: { level: newLevel },
    });
  },

  async notifyXpGain(userId: string, amount: number, source: string): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: "xp",
      title: "✨ XP Ganho!",
      message: `+${amount} XP de ${source}`,
      data: { amount, source },
    });
  },

  async notifyCompetencyGap(userId: string, gaps: { area: string; value: number; icon: string }[]): Promise<Notification> {
    const gapAreas = gaps.map(g => `${g.icon} ${g.area}`).join(', ');
    return this.create({
      user_id: userId,
      type: "competency_gap",
      title: "⚠️ Gaps de Competência Detectados",
      message: `Áreas que precisam de atenção: ${gapAreas}`,
      data: { gaps },
    });
  },

  async notifyDevelopmentTip(userId: string, area: string, icon: string, recommendation: string): Promise<Notification> {
    return this.create({
      user_id: userId,
      type: "development_tip",
      title: "💡 Dica de Desenvolvimento",
      message: `Desenvolva sua competência em ${icon} ${area}`,
      data: { area, recommendation },
    });
  },

  async triggerCompetencyAnalysis(userId: string): Promise<void> {
    const { invokeEdgeSafe } = await import("@/lib/requestId");
    await invokeEdgeSafe("competency-alerts", { body: { userId } });
  },
};
