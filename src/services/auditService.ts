import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AuditAction = 
  | 'user_signup'
  | 'user_login'
  | 'profile_update'
  | 'xp_gained'
  | 'level_up'
  | 'coins_earned'
  | 'coins_spent'
  | 'quest_created'
  | 'quest_updated'
  | 'quest_deleted'
  | 'quest_assigned'
  | 'quest_completed'
  | 'kudos_given'
  | 'kudos_received'
  | 'achievement_unlocked'
  | 'streak_updated'
  | 'department_created'
  | 'department_updated'
  | 'team_member_added'
  | 'team_member_removed'
  | 'role_assigned'
  | 'role_removed';

export interface AuditLog {
  id: string;
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogInsert {
  user_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string | null;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export const auditService = {
  async log(data: AuditLogInsert): Promise<void> {
    try {
      const insertData = {
        user_id: data.user_id,
        action: data.action,
        entity_type: data.entity_type,
        entity_id: data.entity_id ?? null,
        old_data: data.old_data ?? null,
        new_data: data.new_data ?? null,
        metadata: data.metadata ?? {},
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      };

      const { error } = await supabase
        .from("audit_logs")
        .insert(insertData as Database["public"]["Tables"]["audit_logs"]["Insert"]);
      
      // Fire and forget - no console.error in production
    } catch {
      // Silently fail - audit logging should not block main operations
    }
  },

  async getByUserId(userId: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  },

  async getByAction(action: AuditAction, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("action", action)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  },

  async getByEntity(entityType: string, entityId: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  },

  async getRecent(limit = 100): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  },

  async getByDateRange(startDate: Date, endDate: Date, limit = 500): Promise<AuditLog[]> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return (data ?? []) as AuditLog[];
  },

  // Helper methods for common audit events
  async logXpGain(userId: string, xpAmount: number, source: string): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'xp_gained',
      entity_type: 'profile',
      entity_id: userId,
      new_data: { xp_amount: xpAmount, source },
    });
  },

  async logLevelUp(userId: string, oldLevel: number, newLevel: number): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'level_up',
      entity_type: 'profile',
      entity_id: userId,
      old_data: { level: oldLevel },
      new_data: { level: newLevel },
    });
  },

  async logKudosGiven(fromUserId: string, toUserId: string, kudosId: string, badgeId?: string): Promise<void> {
    await this.log({
      user_id: fromUserId,
      action: 'kudos_given',
      entity_type: 'kudos',
      entity_id: kudosId,
      new_data: { to_user_id: toUserId, badge_id: badgeId },
    });
  },

  async logKudosReceived(toUserId: string, fromUserId: string, kudosId: string, badgeId?: string): Promise<void> {
    await this.log({
      user_id: toUserId,
      action: 'kudos_received',
      entity_type: 'kudos',
      entity_id: kudosId,
      new_data: { from_user_id: fromUserId, badge_id: badgeId },
    });
  },

  async logQuestCreated(userId: string, questId: string, questTitle: string): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'quest_created',
      entity_type: 'quest',
      entity_id: questId,
      new_data: { title: questTitle },
    });
  },

  async logQuestCompleted(userId: string, questId: string, xpEarned: number, coinsEarned: number): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'quest_completed',
      entity_type: 'quest',
      entity_id: questId,
      new_data: { xp_earned: xpEarned, coins_earned: coinsEarned },
    });
  },

  async logProfileUpdate(userId: string, oldData: Record<string, unknown>, newData: Record<string, unknown>): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'profile_update',
      entity_type: 'profile',
      entity_id: userId,
      old_data: oldData,
      new_data: newData,
    });
  },

  async logStreakUpdate(userId: string, oldStreak: number, newStreak: number): Promise<void> {
    await this.log({
      user_id: userId,
      action: 'streak_updated',
      entity_type: 'profile',
      entity_id: userId,
      old_data: { streak: oldStreak },
      new_data: { streak: newStreak },
    });
  },
};
