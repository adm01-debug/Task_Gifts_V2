import { supabase } from "@/integrations/supabase/client";

export interface SeasonalEvent {
  id: string;
  title: string;
  description: string | null;
  theme: string;
  icon: string;
  banner_color: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  xp_multiplier: number;
  created_at: string;
  challenges?: SeasonalChallenge[];
}

export interface SeasonalChallenge {
  id: string;
  event_id: string;
  title: string;
  description: string | null;
  icon: string;
  target_value: number;
  metric_key: string;
  xp_reward: number;
  coin_reward: number;
  badge_name: string | null;
  badge_icon: string | null;
  order_index: number;
  progress?: UserSeasonalProgress;
}

export interface UserSeasonalProgress {
  id: string;
  user_id: string;
  challenge_id: string;
  current_value: number;
  completed_at: string | null;
  claimed: boolean;
}

export const seasonalEventsService = {
  async getActiveEvents(): Promise<SeasonalEvent[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from("seasonal_events")
      .select("*")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now)
      .order("ends_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getEventWithChallenges(eventId: string, userId?: string): Promise<SeasonalEvent | null> {
    const { data: event, error: eventError } = await supabase
      .from("seasonal_events")
      .select("*")
      .eq("id", eventId)
      .maybeSingle();

    if (eventError) throw eventError;
    if (!event) return null;

    const { data: challenges, error: challengesError } = await supabase
      .from("seasonal_challenges")
      .select("*")
      .eq("event_id", eventId)
      .order("order_index", { ascending: true });

    if (challengesError) throw challengesError;

    let progressMap: Record<string, UserSeasonalProgress> = {};
    if (userId && challenges && challenges.length > 0) {
      const challengeIds = challenges.map((c) => c.id);
      const { data: progress } = await supabase
        .from("user_seasonal_progress")
        .select("*")
        .eq("user_id", userId)
        .in("challenge_id", challengeIds);

      if (progress) {
        progressMap = Object.fromEntries(progress.map((p) => [p.challenge_id, p]));
      }
    }

    return {
      ...event,
      challenges: challenges?.map((c) => ({
        ...c,
        progress: progressMap[c.id],
      })) || [],
    };
  },

  async getUserProgress(userId: string, challengeId: string): Promise<UserSeasonalProgress | null> {
    const { data, error } = await supabase
      .from("user_seasonal_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async incrementProgress(userId: string, challengeId: string, amount: number = 1): Promise<void> {
    // Get challenge to check target
    const { data: challenge } = await supabase
      .from("seasonal_challenges")
      .select("target_value")
      .eq("id", challengeId)
      .maybeSingle();

    if (!challenge) return;

    // Get or create progress
    let { data: progress } = await supabase
      .from("user_seasonal_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .maybeSingle();

    if (!progress) {
      const { data: newProgress, error: insertError } = await supabase
        .from("user_seasonal_progress")
        .insert({ user_id: userId, challenge_id: challengeId, current_value: amount })
        .select()
        .single();

      if (insertError) throw insertError;
      progress = newProgress;
    } else {
      const newValue = progress.current_value + amount;
      const isCompleted = newValue >= challenge.target_value && !progress.completed_at;

      const { error: updateError } = await supabase
        .from("user_seasonal_progress")
        .update({
          current_value: newValue,
          completed_at: isCompleted ? new Date().toISOString() : progress.completed_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", progress.id);

      if (updateError) throw updateError;
    }
  },

  async claimReward(userId: string, challengeId: string): Promise<{ xp: number; coins: number }> {
    // Get challenge rewards
    const { data: challenge } = await supabase
      .from("seasonal_challenges")
      .select("xp_reward, coin_reward, badge_name, badge_icon")
      .eq("id", challengeId)
      .maybeSingle();

    if (!challenge) throw new Error("Challenge not found");

    // Mark as claimed
    const { error } = await supabase
      .from("user_seasonal_progress")
      .update({ claimed: true, updated_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("challenge_id", challengeId);

    if (error) throw error;

    // Update user profile with rewards
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, coins")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          xp: profile.xp + challenge.xp_reward,
          coins: profile.coins + challenge.coin_reward,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    return { xp: challenge.xp_reward, coins: challenge.coin_reward };
  },

  async incrementByMetricKey(userId: string, metricKey: string, amount: number = 1): Promise<void> {
    const now = new Date().toISOString();

    // Get active events
    const { data: activeEvents } = await supabase
      .from("seasonal_events")
      .select("id")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gte("ends_at", now);

    if (!activeEvents || activeEvents.length === 0) return;

    // Get challenges matching the metric key
    const eventIds = activeEvents.map((e) => e.id);
    const { data: challenges } = await supabase
      .from("seasonal_challenges")
      .select("id")
      .in("event_id", eventIds)
      .eq("metric_key", metricKey);

    if (!challenges || challenges.length === 0) return;

    // Increment progress for each matching challenge
    for (const challenge of challenges) {
      await this.incrementProgress(userId, challenge.id, amount);
    }
  },
};
