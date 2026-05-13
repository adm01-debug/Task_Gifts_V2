import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { notificationsService } from "./notificationsService";
import { auditService } from "./auditService";

export type Profile = Tables<"profiles">;
export type ProfileInsert = TablesInsert<"profiles">;
export type ProfileUpdate = TablesUpdate<"profiles">;

// Public-safe columns (no PII like cpf, phone, personal_email)
const PUBLIC_PROFILE_COLUMNS = "id, display_name, avatar_url, level, xp, coins, streak, best_streak, quests_completed, status, created_at, updated_at, email, employee_id, hire_date, last_access_at, contract_type" as const;

export const profilesService = {
  async getById(id: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select(PUBLIC_PROFILE_COLUMNS)
      .order("xp", { ascending: false });
    
    if (error) throw error;
     return (data ?? []) as unknown as Profile[];
  },

  async getLeaderboard(limit = 10): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select(PUBLIC_PROFILE_COLUMNS)
      .order("xp", { ascending: false })
      .limit(limit);
    
    if (error) throw error;
     return (data ?? []) as unknown as Profile[];
  },

  async update(id: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async addXp(id: string, xpAmount: number, source?: string): Promise<{ profile: Profile; leveledUp: boolean; newLevel?: number }> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");

    const newXp = profile.xp + xpAmount;
    const oldLevel = profile.level;
    const newLevel = Math.floor(newXp / 1000) + 1;
    const leveledUp = newLevel > oldLevel;

    const updatedProfile = await this.update(id, { 
      xp: newXp, 
      level: newLevel 
    });

    // Audit XP gain (fire and forget - don't block main flow)
    auditService.logXpGain(id, xpAmount, source || "atividade").catch(() => {});

    // Create XP notification (fire and forget)
    notificationsService.notifyXpGain(id, xpAmount, source || "atividade").catch(() => {});

    // Create level up notification and audit if leveled up
    if (leveledUp) {
      auditService.logLevelUp(id, oldLevel, newLevel).catch(() => {});
      notificationsService.notifyLevelUp(id, newLevel).catch(() => {});
    }

    return { profile: updatedProfile, leveledUp, newLevel: leveledUp ? newLevel : undefined };
  },

  async addCoins(id: string, coinsAmount: number): Promise<Profile> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");

    return this.update(id, { 
      coins: profile.coins + coinsAmount 
    });
  },

  async incrementStreak(id: string): Promise<Profile> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");

    const oldStreak = profile.streak;
    const newStreak = profile.streak + 1;
    const bestStreak = Math.max(profile.best_streak, newStreak);

    const updatedProfile = await this.update(id, { 
      streak: newStreak,
      best_streak: bestStreak
    });

    // Audit streak update (fire and forget)
    auditService.logStreakUpdate(id, oldStreak, newStreak).catch(() => {});

    return updatedProfile;
  },

  async incrementQuestsCompleted(id: string): Promise<Profile> {
    const profile = await this.getById(id);
    if (!profile) throw new Error("Profile not found");

    return this.update(id, { 
      quests_completed: profile.quests_completed + 1
    });
  },
};
