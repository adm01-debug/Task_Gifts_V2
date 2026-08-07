import { supabase } from "@/integrations/supabase/client";
import { notificationsService } from "./notificationsService";
import { profilesService } from "./profilesService";
import { auditService } from "./auditService";
import { missionsService } from "./missionsService";
import { comboService } from "./comboService";
import { achievementsService } from "./achievementsService";
import { logger } from "./loggingService";

export interface KudosBadge {
  id: string;
  name: string;
  icon: string;
  description: string | null;
  category: string;
  xp_value: number;
  created_at: string;
}

export interface Kudos {
  id: string;
  from_user_id: string;
  to_user_id: string;
  badge_id: string | null;
  message: string;
  is_public: boolean;
  created_at: string;
}

export interface KudosWithDetails extends Kudos {
  from_profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  to_profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  badge: KudosBadge | null;
}

export interface KudosInsert {
  from_user_id: string;
  to_user_id: string;
  badge_id?: string | null;
  message: string;
  is_public?: boolean;
}

export const kudosService = {
  // Badges
  async getBadges(): Promise<KudosBadge[]> {
    const { data, error } = await supabase
      .from("kudos_badges")
      .select("*")
      .order("category", { ascending: true });
    
    if (error) throw error;
    return (data ?? []) as KudosBadge[];
  },

  async getBadgeById(id: string): Promise<KudosBadge | null> {
    const { data, error } = await supabase
      .from("kudos_badges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data as KudosBadge | null;
  },

  // Kudos
  async getRecentKudos(limit = 20): Promise<KudosWithDetails[]> {
    // First, get kudos with badge join only
    const { data, error } = await supabase
      .from("kudos")
      .select(`
        *,
        badge:kudos_badges(*)
      `)
      .eq("is_public", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    
    if (error) {
      logger.apiError("Error fetching kudos", error, "kudosService");
      throw error;
    }

    // Get all unique user IDs
    const userIds = new Set<string>();
    (data ?? []).forEach(k => {
      userIds.add(k.from_user_id);
      userIds.add(k.to_user_id);
    });

    // Fetch profiles for these users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", Array.from(userIds));

    const profilesMap = new Map(
      (profiles ?? []).map(p => [p.id, p])
    );

    // Map kudos with profile data
    return (data ?? []).map(k => ({
      ...k,
      from_profile: profilesMap.get(k.from_user_id) || null,
      to_profile: profilesMap.get(k.to_user_id) || null,
      badge: k.badge || null,
    })) as unknown as KudosWithDetails[];
  },

  async getKudosReceived(userId: string): Promise<KudosWithDetails[]> {
    const { data, error } = await supabase
      .from("kudos")
      .select("*")
      .eq("to_user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data ?? []).map(k => ({
      ...k,
      from_profile: null,
      to_profile: null,
      badge: null,
    })) as KudosWithDetails[];
  },

  async getKudosGiven(userId: string): Promise<KudosWithDetails[]> {
    const { data, error } = await supabase
      .from("kudos")
      .select("*")
      .eq("from_user_id", userId)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data ?? []).map(k => ({
      ...k,
      from_profile: null,
      to_profile: null,
      badge: null,
    })) as KudosWithDetails[];
  },

  async getKudosCount(userId: string): Promise<{ received: number; given: number }> {
    const [received, given] = await Promise.all([
      supabase
        .from("kudos")
        .select("*", { count: "exact", head: true })
        .eq("to_user_id", userId),
      supabase
        .from("kudos")
        .select("*", { count: "exact", head: true })
        .eq("from_user_id", userId),
    ]);
    
    return {
      received: received.count ?? 0,
      given: given.count ?? 0,
    };
  },

  async giveKudos(kudos: KudosInsert): Promise<{ 
    kudos: Kudos; 
    comboResult: { finalXp: number; bonusXp: number; multiplier: number } | null;
  }> {
    const { data, error } = await supabase
      .from("kudos")
      .insert(kudos)
      .select()
      .single();
    
    if (error) throw error;

    // Get badge info if present
    let badgeName = "Reconhecimento";
    let xpValue = 25;
    
    if (kudos.badge_id) {
      const badge = await this.getBadgeById(kudos.badge_id);
      if (badge) {
        badgeName = badge.name;
        xpValue = badge.xp_value;
      }
    }

    // Get sender name for notification
    let senderName = "Um colega";
    try {
      const sender = await profilesService.getById(kudos.from_user_id);
      if (sender?.display_name) {
        senderName = sender.display_name;
      }
    } catch (e) {
      logger.apiError("Failed to get sender name", e, "kudosService");
    }

    // Audit kudos given and received
    try {
      await auditService.logKudosGiven(kudos.from_user_id, kudos.to_user_id, data.id, kudos.badge_id ?? undefined);
      await auditService.logKudosReceived(kudos.to_user_id, kudos.from_user_id, data.id, kudos.badge_id ?? undefined);
    } catch (e) {
      logger.apiError("Failed to audit kudos", e, "kudosService");
    }

    // Add XP to the recipient with combo multiplier
    let comboResult: { finalXp: number; bonusXp: number; multiplier: number } | null = null;
    try {
      // Register combo action for the recipient and apply multiplier
      const result = await comboService.registerAction(kudos.to_user_id, xpValue);
      comboResult = {
        finalXp: result.finalXp,
        bonusXp: result.bonusXp,
        multiplier: result.combo?.current_multiplier || 1.0,
      };
      await profilesService.addXp(kudos.to_user_id, result.finalXp, `Kudos: ${badgeName}`);
    } catch (e) {
      logger.apiError("Failed to add XP for kudos", e, "kudosService");
    }

    // Notify the recipient with combo info
    try {
      const comboText = comboResult && comboResult.bonusXp > 0 
        ? ` (+${comboResult.bonusXp} bônus combo!)`
        : '';
      
      await notificationsService.create({
        user_id: kudos.to_user_id,
        type: "kudos",
        title: `🎉 ${senderName} te reconheceu!`,
        message: `Você recebeu: ${badgeName} +${comboResult?.finalXp || xpValue} XP${comboText}`,
        data: { 
          fromUserId: kudos.from_user_id,
          badgeId: kudos.badge_id,
          message: kudos.message,
          xpValue: comboResult?.finalXp || xpValue,
          bonusXp: comboResult?.bonusXp || 0,
        },
      });
    } catch (e) {
      logger.apiError("Failed to create kudos notification", e, "kudosService");
    }

    // Auto-update mission progress for kudos given
    try {
      await missionsService.incrementByMetricKey(kudos.from_user_id, 'kudos_given', 1);
      await missionsService.incrementByMetricKey(kudos.to_user_id, 'kudos_received', 1);
    } catch (e) {
      logger.apiError("Failed to update kudos mission progress", e, "kudosService");
    }

    // Check for kudos achievements
    try {
      await achievementsService.checkKudosGivenAchievements(kudos.from_user_id);
      await achievementsService.checkKudosReceivedAchievements(kudos.to_user_id);
    } catch (e) {
      logger.apiError("Failed to check kudos achievements", e, "kudosService");
    }

    return { kudos: data as Kudos, comboResult };
  },

  async deleteKudos(id: string): Promise<void> {
    const { error } = await supabase
      .from("kudos")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },
};
