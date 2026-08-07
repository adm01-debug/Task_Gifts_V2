import { supabase } from "@/integrations/supabase/client";

export interface WeeklyChallenge {
  id: string;
  challenger_id: string;
  opponent_id: string;
  week_start: string;
  week_end: string;
  challenger_xp_start: number;
  opponent_xp_start: number;
  challenger_xp_gained: number;
  opponent_xp_gained: number;
  xp_reward: number;
  coin_reward: number;
  winner_id: string | null;
  status: "active" | "completed" | "expired";
  created_at: string;
  updated_at: string;
}

export const weeklyChallengesService = {
  async getCurrentChallenge(userId: string): Promise<WeeklyChallenge | null> {
    const weekStart = getWeekStart();
    
    const { data, error } = await supabase
      .from("weekly_challenges")
      .select("*")
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .eq("week_start", weekStart)
      .eq("status", "active")
      .maybeSingle();

    if (error) throw error;
    return data as WeeklyChallenge | null;
  },

  async createChallenge(
    challengerId: string,
    opponentId: string,
    challengerXp: number,
    opponentXp: number
  ): Promise<WeeklyChallenge> {
    const weekStart = getWeekStart();
    const weekEnd = getWeekEnd();

    const { data, error } = await supabase
      .from("weekly_challenges")
      .insert({
        challenger_id: challengerId,
        opponent_id: opponentId,
        week_start: weekStart,
        week_end: weekEnd,
        challenger_xp_start: challengerXp,
        opponent_xp_start: opponentXp,
        challenger_xp_gained: 0,
        opponent_xp_gained: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as WeeklyChallenge;
  },

  async updateXpGained(
    challengeId: string,
    userId: string,
    isChallenger: boolean,
    xpGained: number
  ): Promise<void> {
    const updateField = isChallenger ? "challenger_xp_gained" : "opponent_xp_gained";
    
    const { error } = await supabase
      .from("weekly_challenges")
      .update({ [updateField]: xpGained })
      .eq("id", challengeId);

    if (error) throw error;
  },

  async completeChallenge(
    challengeId: string,
    winnerId: string | null
  ): Promise<void> {
    const { error } = await supabase
      .from("weekly_challenges")
      .update({ 
        status: "completed",
        winner_id: winnerId 
      })
      .eq("id", challengeId);

    if (error) throw error;
  },

  async findOpponent(userId: string, userRank: number): Promise<{ id: string; xp: number } | null> {
    // Find users within ±5 positions in ranking
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, xp")
      .order("xp", { ascending: false });

    if (error) throw error;
    if (!profiles || profiles.length < 2) return null;

    const userIndex = profiles.findIndex((p) => p.id === userId);
    if (userIndex === -1) return null;

    // Find candidates within ±5 positions
    const candidates = profiles.filter((p, index) => {
      if (p.id === userId) return false;
      const distance = Math.abs(index - userIndex);
      return distance >= 1 && distance <= 5;
    });

    if (candidates.length === 0) {
      // If no one within ±5, pick closest available
      const closest = profiles.find((p) => p.id !== userId);
      return closest ? { id: closest.id, xp: closest.xp } : null;
    }

    // Pick random from candidates
    const randomIndex = Math.floor(Math.random() * candidates.length);
    const opponent = candidates[randomIndex];
    return { id: opponent.id, xp: opponent.xp };
  },

  async getPastChallenges(userId: string, limit = 10): Promise<WeeklyChallenge[]> {
    const { data, error } = await supabase
      .from("weekly_challenges")
      .select("*")
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .in("status", ["completed", "expired"])
      .order("week_end", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as WeeklyChallenge[];
  },
};

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split("T")[0];
}

function getWeekEnd(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? 0 : 7); // Sunday end
  const sunday = new Date(now.setDate(diff));
  return sunday.toISOString().split("T")[0];
}
