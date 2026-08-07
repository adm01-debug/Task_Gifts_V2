import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string;
  category: string;
  xp_reward: number;
  coin_reward: number;
  rarity: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  achievement?: Achievement;
}

export const achievementsService = {
  async getAllAchievements(): Promise<Achievement[]> {
    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("category", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("*, achievement:achievements(*)")
      .eq("user_id", userId)
      .order("unlocked_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async hasAchievement(userId: string, achievementKey: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("user_achievements")
      .select("id, achievements!inner(key)")
      .eq("user_id", userId)
      .eq("achievements.key", achievementKey)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async unlockAchievement(
    userId: string,
    achievementKey: string
  ): Promise<{ success: boolean; achievement?: Achievement; alreadyUnlocked?: boolean }> {
    // Check if already unlocked
    const hasIt = await this.hasAchievement(userId, achievementKey);
    if (hasIt) {
      return { success: false, alreadyUnlocked: true };
    }

    // Get achievement details
    const { data: achievement, error: achError } = await supabase
      .from("achievements")
      .select("*")
      .eq("key", achievementKey)
      .maybeSingle();

    if (achError || !achievement) {
      logger.warn(`Achievement not found: ${achievementKey}`, "achievementsService");
      return { success: false };
    }

    // Insert user achievement
    const { error: insertError } = await supabase
      .from("user_achievements")
      .insert({
        user_id: userId,
        achievement_id: achievement.id,
      });

    if (insertError) {
      logger.apiError("Error unlocking achievement", insertError, "achievementsService");
      return { success: false };
    }

    // Award XP and coins - get current values first
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, coins")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          xp: profile.xp + achievement.xp_reward,
          coins: profile.coins + achievement.coin_reward,
        })
        .eq("id", userId);
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "🏆 Conquista Desbloqueada!",
      message: `Você desbloqueou "${achievement.name}"! +${achievement.xp_reward} XP, +${achievement.coin_reward} moedas`,
      type: "achievement_unlocked",
      data: { achievementKey, achievementName: achievement.name },
    });

    return { success: true, achievement };
  },

  async checkComboAchievements(userId: string, multiplier: number): Promise<Achievement | null> {
    const comboAchievements = [
      { multiplier: 2, key: "combo_primeira_chama" },
      { multiplier: 3, key: "combo_fogo_azul" },
      { multiplier: 4, key: "combo_inferno" },
    ];

    const applicable = comboAchievements
      .filter((a) => multiplier >= a.multiplier)
      .sort((a, b) => b.multiplier - a.multiplier);

    if (applicable.length === 0) return null;

    for (const ach of applicable) {
      const result = await this.unlockAchievement(userId, ach.key);
      if (result.success && result.achievement) {
        return result.achievement;
      }
    }

    return null;
  },

  async checkTrailAchievements(userId: string): Promise<Achievement | null> {
    // Count completed trails
    const { count } = await supabase
      .from("trail_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("completed_at", "is", null);

    const completedCount = count || 0;

    const trailAchievements = [
      { count: 1, key: "trail_first_complete" },
      { count: 5, key: "trail_5_complete" },
      { count: 10, key: "trail_10_complete" },
    ];

    const applicable = trailAchievements
      .filter((a) => completedCount >= a.count)
      .sort((a, b) => b.count - a.count);

    for (const ach of applicable) {
      const result = await this.unlockAchievement(userId, ach.key);
      if (result.success && result.achievement) {
        return result.achievement;
      }
    }

    return null;
  },

  async checkKudosGivenAchievements(userId: string): Promise<Achievement | null> {
    const { count } = await supabase
      .from("kudos")
      .select("*", { count: "exact", head: true })
      .eq("from_user_id", userId);

    const givenCount = count || 0;

    const kudosAchievements = [
      { count: 1, key: "kudos_first_given" },
      { count: 10, key: "kudos_10_given" },
      { count: 50, key: "kudos_50_given" },
    ];

    const applicable = kudosAchievements
      .filter((a) => givenCount >= a.count)
      .sort((a, b) => b.count - a.count);

    for (const ach of applicable) {
      const result = await this.unlockAchievement(userId, ach.key);
      if (result.success && result.achievement) {
        return result.achievement;
      }
    }

    return null;
  },

  async checkKudosReceivedAchievements(userId: string): Promise<Achievement | null> {
    const { count } = await supabase
      .from("kudos")
      .select("*", { count: "exact", head: true })
      .eq("to_user_id", userId);

    const receivedCount = count || 0;

    const kudosAchievements = [
      { count: 1, key: "kudos_first_received" },
      { count: 10, key: "kudos_10_received" },
      { count: 50, key: "kudos_50_received" },
    ];

    const applicable = kudosAchievements
      .filter((a) => receivedCount >= a.count)
      .sort((a, b) => b.count - a.count);

    for (const ach of applicable) {
      const result = await this.unlockAchievement(userId, ach.key);
      if (result.success && result.achievement) {
        return result.achievement;
      }
    }

    return null;
  },

  async checkStreakAchievements(userId: string, currentStreak: number): Promise<Achievement | null> {
    const streakAchievements = [
      { streak: 3, key: "streak_3_days" },
      { streak: 7, key: "streak_7_days" },
      { streak: 30, key: "streak_30_days" },
      { streak: 100, key: "streak_100_days" },
    ];

    const applicable = streakAchievements
      .filter((a) => currentStreak >= a.streak)
      .sort((a, b) => b.streak - a.streak);

    for (const ach of applicable) {
      const result = await this.unlockAchievement(userId, ach.key);
      if (result.success && result.achievement) {
        return result.achievement;
      }
    }

    return null;
  },

  async checkQuestAchievements(userId: string): Promise<Achievement | null> {
    const { data: profile } = await supabase
      .from("profiles")
      .select("quests_completed")
      .eq("id", userId)
      .maybeSingle();

    const completedCount = profile?.quests_completed || 0;

    const questAchievements = [
      { count: 1, key: "quest_first_complete" },
      { count: 10, key: "quest_10_complete" },
      { count: 50, key: "quest_50_complete" },
    ];

    const applicable = questAchievements
      .filter((a) => completedCount >= a.count)
      .sort((a, b) => b.count - a.count);

    for (const ach of applicable) {
      const result = await this.unlockAchievement(userId, ach.key);
      if (result.success && result.achievement) {
        return result.achievement;
      }
    }

    return null;
  },
};
