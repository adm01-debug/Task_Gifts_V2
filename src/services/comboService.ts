import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface UserCombo {
  id: string;
  user_id: string;
  combo_date: string;
  actions_count: number;
  current_multiplier: number;
  max_multiplier_reached: number;
  total_bonus_xp: number;
  last_action_at: string;
}

// Combo tiers configuration
export const COMBO_TIERS = [
  { minActions: 0, multiplier: 1.0, label: "Normal", color: "text-muted-foreground", bgColor: "bg-muted" },
  { minActions: 3, multiplier: 1.5, label: "Aquecendo", color: "text-blue-500", bgColor: "bg-blue-500/20" },
  { minActions: 5, multiplier: 2.0, label: "Em Chamas!", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  { minActions: 8, multiplier: 2.5, label: "Imparável!", color: "text-red-500", bgColor: "bg-red-500/20" },
  { minActions: 12, multiplier: 3.0, label: "LENDÁRIO!", color: "text-amber-500", bgColor: "bg-amber-500/20" },
] as const;

export const comboService = {
  async getTodayCombo(userId: string): Promise<UserCombo | null> {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_combos")
      .select("*")
      .eq("user_id", userId)
      .eq("combo_date", today)
      .maybeSingle();

    if (error) {
      logger.apiError("Error fetching combo", error, "comboService");
      return null;
    }

     return (data || null) as unknown as UserCombo;
  },

  async initTodayCombo(userId: string): Promise<UserCombo | null> {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("user_combos")
      .insert({
        user_id: userId,
        combo_date: today,
        actions_count: 0,
        current_multiplier: 1.0,
        max_multiplier_reached: 1.0,
        total_bonus_xp: 0,
      })
      .select()
      .single();

    if (error) {
      logger.apiError("Error initializing combo", error, "comboService");
      return null;
    }

     return (data || null) as unknown as UserCombo;
  },

  getComboTier(actionsCount: number) {
    // Find the highest tier the user qualifies for
    for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
      if (actionsCount >= COMBO_TIERS[i].minActions) {
        return COMBO_TIERS[i];
      }
    }
    return COMBO_TIERS[0];
  },

  getNextTier(actionsCount: number) {
    const currentTierIndex = COMBO_TIERS.findIndex(
      (tier, i) =>
        actionsCount >= tier.minActions &&
        (i === COMBO_TIERS.length - 1 || actionsCount < COMBO_TIERS[i + 1].minActions)
    );

    if (currentTierIndex < COMBO_TIERS.length - 1) {
      return COMBO_TIERS[currentTierIndex + 1];
    }
    return null;
  },

  async registerAction(userId: string, baseXp: number): Promise<{ 
    finalXp: number; 
    bonusXp: number; 
    combo: UserCombo | null;
    tierUp: boolean;
  }> {
    let combo = await this.getTodayCombo(userId);
    
    if (!combo) {
      combo = await this.initTodayCombo(userId);
    }

    if (!combo) {
      return { finalXp: baseXp, bonusXp: 0, combo: null, tierUp: false };
    }

    const previousTier = this.getComboTier(combo.actions_count);
    const newActionsCount = combo.actions_count + 1;
    const newTier = this.getComboTier(newActionsCount);
    
    const tierUp = newTier.multiplier > previousTier.multiplier;
    const bonusXp = Math.round(baseXp * (newTier.multiplier - 1));
    const finalXp = baseXp + bonusXp;

    // Update combo in database
    const { data: updatedCombo, error } = await supabase
      .from("user_combos")
      .update({
        actions_count: newActionsCount,
        current_multiplier: newTier.multiplier,
        max_multiplier_reached: Math.max(combo.max_multiplier_reached, newTier.multiplier),
        total_bonus_xp: combo.total_bonus_xp + bonusXp,
         last_action_at: new Date().toISOString() || "",
      })
      .eq("id", combo.id)
      .select()
      .single();

    if (error) {
      logger.apiError("Error updating combo", error, "comboService");
      return { finalXp: baseXp, bonusXp: 0, combo, tierUp: false };
    }

    return { finalXp, bonusXp, combo: updatedCombo as unknown as UserCombo, tierUp };
  },

  async getComboHistory(userId: string, days: number = 7): Promise<UserCombo[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from("user_combos")
      .select("*")
      .eq("user_id", userId)
      .gte("combo_date", startDate.toISOString().split("T")[0])
      .order("combo_date", { ascending: false });

    if (error) {
      logger.apiError("Error fetching combo history", error, "comboService");
      return [];
    }

    return data || [];
  },
};
