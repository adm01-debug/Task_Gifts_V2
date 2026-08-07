import { supabase } from "@/integrations/supabase/client";

export interface DirectDuel {
  id: string;
  challenger_id: string;
  opponent_id: string;
  status: 'pending' | 'accepted' | 'active' | 'completed' | 'declined' | 'cancelled';
  challenger_xp_start: number;
  opponent_xp_start: number;
  challenger_xp_gained: number;
  opponent_xp_gained: number;
  winner_id: string | null;
  xp_reward: number;
  coin_reward: number;
  duration_hours: number;
  message: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuelWithProfiles extends DirectDuel {
  challenger?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number;
    xp: number;
  };
  opponent?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number;
    xp: number;
  };
}

export const duelsService = {
  async getUserDuels(userId: string): Promise<DuelWithProfiles[]> {
    const { data, error } = await supabase
      .from("direct_duels")
      .select("*")
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch profiles for all duels
    const userIds = new Set<string>();
    data?.forEach(d => {
      userIds.add(d.challenger_id);
      userIds.add(d.opponent_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, level, xp")
      .in("id", Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return (data || []).map(duel => ({
      ...duel,
      status: duel.status as DirectDuel['status'],
      challenger: profileMap.get(duel.challenger_id),
      opponent: profileMap.get(duel.opponent_id),
    }));
  },

  async getActiveDuel(userId: string): Promise<DuelWithProfiles | null> {
    const { data, error } = await supabase
      .from("direct_duels")
      .select("*")
      .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
      .in("status", ["pending", "accepted", "active"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const userIds = [data.challenger_id, data.opponent_id];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, level, xp")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return {
      ...data,
      status: data.status as DirectDuel['status'],
      challenger: profileMap.get(data.challenger_id),
      opponent: profileMap.get(data.opponent_id),
    };
  },

  async getAllActiveDuels(): Promise<DuelWithProfiles[]> {
    const { data, error } = await supabase
      .from("direct_duels")
      .select("*")
      .in("status", ["active"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const userIds = new Set<string>();
    data?.forEach(d => {
      userIds.add(d.challenger_id);
      userIds.add(d.opponent_id);
    });

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, level, xp")
      .in("id", Array.from(userIds));

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return (data || []).map(duel => ({
      ...duel,
      status: duel.status as DirectDuel['status'],
      challenger: profileMap.get(duel.challenger_id),
      opponent: profileMap.get(duel.opponent_id),
    }));
  },

  async createDuel(
    challengerId: string,
    opponentId: string,
    durationHours: number = 24,
    message?: string
  ): Promise<DirectDuel> {
    // Get current XP for both users
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, xp")
      .in("id", [challengerId, opponentId]);

    const challengerXp = profiles?.find(p => p.id === challengerId)?.xp || 0;
    const opponentXp = profiles?.find(p => p.id === opponentId)?.xp || 0;

    const { data, error } = await supabase
      .from("direct_duels")
      .insert({
        challenger_id: challengerId,
        opponent_id: opponentId,
        challenger_xp_start: challengerXp,
        opponent_xp_start: opponentXp,
        duration_hours: durationHours,
        message: message || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as DirectDuel['status'] };
  },

  async acceptDuel(duelId: string): Promise<DirectDuel> {
    const now = new Date();
    const { data: duel } = await supabase
      .from("direct_duels")
      .select("duration_hours, challenger_id, opponent_id")
      .eq("id", duelId)
      .maybeSingle();

    if (!duel) throw new Error("Duel not found");

    // Get fresh XP values
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, xp")
      .in("id", [duel.challenger_id, duel.opponent_id]);

    const challengerXp = profiles?.find(p => p.id === duel.challenger_id)?.xp || 0;
    const opponentXp = profiles?.find(p => p.id === duel.opponent_id)?.xp || 0;

    const endsAt = new Date(now.getTime() + duel.duration_hours * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from("direct_duels")
      .update({
        status: 'active',
        starts_at: now.toISOString(),
        ends_at: endsAt.toISOString(),
        challenger_xp_start: challengerXp,
        opponent_xp_start: opponentXp,
      })
      .eq("id", duelId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as DirectDuel['status'] };
  },

  async declineDuel(duelId: string): Promise<DirectDuel> {
    const { data, error } = await supabase
      .from("direct_duels")
      .update({ status: 'declined' })
      .eq("id", duelId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as DirectDuel['status'] };
  },

  async cancelDuel(duelId: string): Promise<DirectDuel> {
    const { data, error } = await supabase
      .from("direct_duels")
      .update({ status: 'cancelled' })
      .eq("id", duelId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as DirectDuel['status'] };
  },

  async updateDuelProgress(duelId: string, userId: string, currentXp: number): Promise<void> {
    const { data: duel } = await supabase
      .from("direct_duels")
      .select("*")
      .eq("id", duelId)
      .maybeSingle();

    if (!duel) return;

    const isChallenger = duel.challenger_id === userId;
    const xpGained = currentXp - (isChallenger ? duel.challenger_xp_start : duel.opponent_xp_start);

    await supabase
      .from("direct_duels")
      .update(isChallenger 
        ? { challenger_xp_gained: Math.max(0, xpGained) }
        : { opponent_xp_gained: Math.max(0, xpGained) }
      )
      .eq("id", duelId);
  },

  async completeDuel(duelId: string): Promise<DirectDuel> {
    const { data: duel } = await supabase
      .from("direct_duels")
      .select("*")
      .eq("id", duelId)
      .maybeSingle();

    if (!duel) throw new Error("Duel not found");

    // Get current XP for both participants
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, xp")
      .in("id", [duel.challenger_id, duel.opponent_id]);

    const challengerCurrentXp = profiles?.find(p => p.id === duel.challenger_id)?.xp || 0;
    const opponentCurrentXp = profiles?.find(p => p.id === duel.opponent_id)?.xp || 0;

    const challengerXpGained = challengerCurrentXp - duel.challenger_xp_start;
    const opponentXpGained = opponentCurrentXp - duel.opponent_xp_start;

    let winnerId: string | null = null;
    if (challengerXpGained > opponentXpGained) {
      winnerId = duel.challenger_id;
    } else if (opponentXpGained > challengerXpGained) {
      winnerId = duel.opponent_id;
    }
    // If equal, it's a draw (winner_id stays null)

    const { data, error } = await supabase
      .from("direct_duels")
      .update({
        status: 'completed',
        challenger_xp_gained: challengerXpGained,
        opponent_xp_gained: opponentXpGained,
        winner_id: winnerId,
      })
      .eq("id", duelId)
      .select()
      .single();

    if (error) throw error;
    return { ...data, status: data.status as DirectDuel['status'] };
  },

  async getPotentialOpponents(userId: string): Promise<Array<{
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    level: number;
    xp: number;
  }>> {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url, level, xp")
      .neq("id", userId)
      .order("xp", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  },
};
