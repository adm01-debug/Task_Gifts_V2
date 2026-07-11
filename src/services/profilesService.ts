import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { notificationsService } from "./notificationsService";
import { auditService } from "./auditService";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

const PUBLIC_PROFILE_COLUMNS = "id, display_name, avatar_url, level, xp, coins, streak, best_streak, quests_completed, status, created_at, updated_at, email, employee_id, hire_date, last_access_at, contract_type" as const;

export const profilesService = {
   getById: async (id: string): Promise<Profile | null> => {
     try {
       const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
       if (error) throw error;
       return data;
     } catch (error) {
       logger.apiError("getProfileById", error, "ProfilesService");
       return null;
     }
   },

   getAll: async (): Promise<Profile[]> => {
     const { data, error } = await supabase.from("profiles").select(PUBLIC_PROFILE_COLUMNS).order("xp", { ascending: false });
     if (error) throw error;
     return (data ?? []) as unknown as Profile[];
   },

   getLeaderboard: async (limit = 10): Promise<Profile[]> => {
     const { data, error } = await supabase.from("profiles").select(PUBLIC_PROFILE_COLUMNS).order("xp", { ascending: false }).limit(limit);
     if (error) throw error;
     return (data ?? []) as unknown as Profile[];
   },

   getTopByLevel: async (limit = 20): Promise<Array<Pick<Profile, "id" | "display_name" | "email" | "level" | "xp">>> => {
     try {
       const { data, error } = await supabase
         .from("profiles")
         .select("id, display_name, email, level, xp")
         .order("level", { ascending: false })
         .limit(limit);
       if (error) throw error;
       return (data ?? []) as Array<Pick<Profile, "id" | "display_name" | "email" | "level" | "xp">>;
     } catch (error) {
       logger.apiError("getTopByLevel", error, "ProfilesService");
       return [];
     }
   },

  async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    try {
      const { data, error } = await supabase.from("profiles").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      logger.apiError("updateProfile", error, "ProfilesService");
      throw error;
    }
  },

  async addXp(id: string, xpAmount: number, source?: string): Promise<{ profile: Profile; leveledUp: boolean; newLevel?: number }> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");

    const newXp = profile.xp + xpAmount;
    const oldLevel = profile.level;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const leveledUp = newLevel > oldLevel;

    // Check for XP decay (Issue 15.2 Sugestão 1)
    // If user hasn't logged in for 3+ days, we might apply a small penalty 
    // but typically decay is a scheduled task. Here we just log gain.

    const updatedProfile = await this.update(id, { xp: newXp, level: newLevel });

    auditService.logXpGain(id, xpAmount, source || "atividade").catch(() => {});
    notificationsService.notifyXpGain(id, xpAmount, source || "atividade").catch(() => {});

    if (leveledUp) {
      auditService.logLevelUp(id, oldLevel, newLevel).catch(() => {});
      notificationsService.notifyLevelUp(id, newLevel).catch(() => {});
      
      // Integration with sound effects or celebrations can be triggered in UI
    }

    return { profile: updatedProfile, leveledUp, newLevel: leveledUp ? newLevel : undefined };
  },

  async addCoins(id: string, coinsAmount: number): Promise<Profile> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");
    return this.update(id, { coins: profile.coins + coinsAmount });
  },

  async incrementStreak(id: string): Promise<Profile> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");

    const now = new Date();
    const lastAccess = profile.last_access_at ? new Date(profile.last_access_at) : null;
    
    let newStreak = profile.streak + 1;
    
    // Logic to reset streak if 24h+ gap (simple version)
    if (lastAccess) {
      const diffHours = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);
      if (diffHours > 48) newStreak = 1; // More than 2 days gap
      else if (diffHours < 12) newStreak = profile.streak; // Same day access
    }

    const bestStreak = Math.max(profile.best_streak, newStreak);
    const updatedProfile = await this.update(id, { streak: newStreak, best_streak: bestStreak, last_access_at: now.toISOString() });

    auditService.logStreakUpdate(id, profile.streak, newStreak).catch(() => {});
    return updatedProfile;
  },

  async incrementQuestsCompleted(id: string): Promise<Profile> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");
    return this.update(id, { quests_completed: profile.quests_completed + 1 });
  },
};
