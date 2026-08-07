import { supabase } from "@/integrations/supabase/client";

export interface League {
  id: string;
  name: string;
  tier: number;
  icon: string;
  color: string;
  min_xp_weekly: number;
  promotion_slots: number;
  demotion_slots: number;
  xp_bonus_percent: number;
  created_at: string;
}

export interface UserLeague {
  id: string;
  user_id: string;
  league_id: string;
  week_start: string;
  weekly_xp: number;
  rank_in_league: number | null;
  promoted_at: string | null;
  demoted_at: string | null;
  created_at: string;
  updated_at: string;
  league?: League;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    level: number;
  };
}

export interface LeagueHistory {
  id: string;
  user_id: string;
  from_league_id: string | null;
  to_league_id: string;
  change_type: 'promotion' | 'demotion' | 'initial';
  weekly_xp: number;
  week_date: string;
  created_at: string;
  from_league?: League;
  to_league?: League;
}

export const leaguesService = {
  async getAllLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .order("tier", { ascending: true });

    if (error) throw error;
    return (data ?? []) as League[];
  },

  async getMyLeague(): Promise<UserLeague | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_leagues")
      .select(`
        *,
        league:leagues(*)
      `)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      // Initialize user in Bronze league (idempotent: safe under
      // concurrent calls because user_id has a UNIQUE constraint).
      return this.initializeUserLeague(user.id);
    }

    return data as unknown as UserLeague;
  },

  async ensureProfile(userId: string): Promise<void> {
    // The auth.users → public.profiles trigger normally creates a profile
    // on signup. If it's missing (trigger not recreated, or pre-existing
    // user from before the trigger was applied), we create the row here
    // using upsert on the primary key so the FK on user_leagues.user_id
    // → profiles.id is satisfied.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const email = user.email ?? "";
    const fallback = email.split("@")[0] || "user";
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          display_name: fallback,
        },
        { onConflict: "id", ignoreDuplicates: true }
      );

    if (error) {
      // Don't block initialization on a profiles issue — the FK below
      // will surface the real error if the profile really is missing.
      console.warn("[leaguesService] ensureProfile soft-fail:", error.message);
    }
  },

  async initializeUserLeague(userId: string): Promise<UserLeague> {
    // Race-free placement into the Bronze league. The previous `upsert`
    // approach still produced 409 because PostgREST requires a unique
    // index with a known name and the inline `UNIQUE` on user_id is
    // anonymous. Strategy:
    //   1) Ensure the user has a profile (handles stale rows where the
    //      auth.users → public.profiles trigger didn't fire for any
    //      reason — without a profile, the user_leagues FK rejects).
    //   2) Single shot: try to INSERT; if it fails with 23505 (race winner
    //      already inserted), swallow the error.
    //   3) Always read the row back with the league relation.
    //   4) Append the `initial` history row only once.
    const { data: bronzeLeague } = await supabase
      .from("leagues")
      .select("*")
      .eq("tier", 1)
      .maybeSingle();

    if (!bronzeLeague) throw new Error("Bronze league not found");

    // Defense in depth: ensure a profile exists. The handle_new_user
    // trigger normally creates it on signup, but if it's missing for any
    // reason (e.g. trigger not yet recreated on the deployed DB), the FK
    // on user_leagues.user_id → profiles.id will reject the insert below.
    await this.ensureProfile(userId);

    const { error: insertError } = await supabase
      .from("user_leagues")
      .insert({
        user_id: userId,
        league_id: bronzeLeague.id,
        weekly_xp: 0,
      });

    // 409 = another concurrent call already inserted our row. Any other
    // error is real and should bubble up.
    if (insertError && insertError.code !== "23505") {
      throw insertError;
    }

    const { data, error } = await supabase
      .from("user_leagues")
      .select(`
        *,
        league:leagues(*)
      `)
      .eq("user_id", userId)
      .single();

    if (error) throw error;

    // Log initial placement only if this is the first time (no history row yet).
    const { data: existingHistory } = await supabase
      .from("league_history")
      .select("id")
      .eq("user_id", userId)
      .eq("change_type", "initial")
      .limit(1)
      .maybeSingle();

    if (!existingHistory) {
      const { error: historyError } = await supabase
        .from("league_history")
        .insert({
          user_id: userId,
          to_league_id: bronzeLeague.id,
          change_type: "initial",
          weekly_xp: 0,
          week_date: new Date().toISOString().split("T")[0],
        });

      // 23505 here would mean another concurrent call already wrote the
      // history row — that's fine, treat as success.
      if (historyError && historyError.code !== "23505") {
        throw historyError;
      }
    }

    return data as unknown as UserLeague;
  },

  async getLeagueLeaderboard(leagueId: string, limit = 50): Promise<UserLeague[]> {
    const { data, error } = await supabase
      .from("user_leagues")
      .select(`
        *,
        league:leagues(*),
        profile:profiles(display_name, avatar_url, level)
      `)
      .eq("league_id", leagueId)
      .order("weekly_xp", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as unknown as UserLeague[];
  },

  async getMyLeagueHistory(limit = 10): Promise<LeagueHistory[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("league_history")
      .select(`
        *,
        from_league:leagues!league_history_from_league_id_fkey(*),
        to_league:leagues!league_history_to_league_id_fkey(*)
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as unknown as LeagueHistory[];
  },

  async addWeeklyXP(userId: string, xpAmount: number): Promise<void> {
    const { data: userLeague } = await supabase
      .from("user_leagues")
      .select("weekly_xp")
      .eq("user_id", userId)
      .maybeSingle();

    if (!userLeague) {
      await this.initializeUserLeague(userId);
      return this.addWeeklyXP(userId, xpAmount);
    }

    await supabase
      .from("user_leagues")
      .update({ 
        weekly_xp: (userLeague.weekly_xp || 0) + xpAmount 
      })
      .eq("user_id", userId);
  },

  async getPromotionZone(leagueId: string): Promise<UserLeague[]> {
    const { data: league } = await supabase
      .from("leagues")
      .select("promotion_slots")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league) return [];

    const { data, error } = await supabase
      .from("user_leagues")
      .select(`
        *,
        profile:profiles(display_name, avatar_url)
      `)
      .eq("league_id", leagueId)
      .order("weekly_xp", { ascending: false })
      .limit(league.promotion_slots);

    if (error) throw error;
    return (data ?? []) as unknown as UserLeague[];
  },

  async getDemotionZone(leagueId: string): Promise<UserLeague[]> {
    const { data: league } = await supabase
      .from("leagues")
      .select("demotion_slots")
      .eq("id", leagueId)
      .maybeSingle();

    if (!league || !league.demotion_slots) return [];

    const { data: allUsers } = await supabase
      .from("user_leagues")
      .select(`
        *,
        profile:profiles(display_name, avatar_url)
      `)
      .eq("league_id", leagueId)
      .order("weekly_xp", { ascending: true })
      .limit(league.demotion_slots);

    return (allUsers ?? []) as unknown as UserLeague[];
  },

  async createLeague(league: Omit<League, 'id' | 'created_at'>): Promise<League> {
    const { data, error } = await supabase
      .from("leagues")
      .insert(league)
      .select()
      .single();

    if (error) throw error;
    return data as League;
  },

  async updateLeague(id: string, league: Partial<Omit<League, 'id' | 'created_at'>>): Promise<League> {
    const { data, error } = await supabase
      .from("leagues")
      .update(league)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as League;
  },

  async deleteLeague(id: string): Promise<void> {
    const { error } = await supabase
      .from("leagues")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
