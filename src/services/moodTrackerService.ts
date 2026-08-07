import { supabase } from "@/integrations/supabase/client";

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: number;
  mood_emoji: string;
  note: string | null;
  factors: string[];
  is_anonymous: boolean;
  entry_date: string;
  created_at: string;
}

export interface MoodInsert {
  mood_score: number;
  mood_emoji?: string;
  note?: string;
  factors?: string[];
  is_anonymous?: boolean;
}

export interface TeamMoodStats {
  date: string;
  average_mood: number;
  total_entries: number;
  distribution: Record<number, number>;
  common_factors: { factor: string; count: number }[];
}

export const MOOD_OPTIONS = [
  { score: 1, emoji: '😢', label: 'Muito mal', color: '#ef4444' },
  { score: 2, emoji: '😔', label: 'Mal', color: '#f97316' },
  { score: 3, emoji: '😐', label: 'Neutro', color: '#eab308' },
  { score: 4, emoji: '🙂', label: 'Bem', color: '#22c55e' },
  { score: 5, emoji: '😄', label: 'Muito bem', color: '#10b981' },
];

export const MOOD_FACTORS = [
  { id: 'workload', label: 'Carga de trabalho', icon: '📊' },
  { id: 'team', label: 'Equipe', icon: '👥' },
  { id: 'management', label: 'Gestão', icon: '👔' },
  { id: 'growth', label: 'Crescimento', icon: '📈' },
  { id: 'work_life', label: 'Equilíbrio vida-trabalho', icon: '⚖️' },
  { id: 'recognition', label: 'Reconhecimento', icon: '🏆' },
  { id: 'tools', label: 'Ferramentas', icon: '🛠️' },
  { id: 'communication', label: 'Comunicação', icon: '💬' },
  { id: 'personal', label: 'Pessoal', icon: '🏠' },
  { id: 'health', label: 'Saúde', icon: '❤️' },
];

export const moodTrackerService = {
  async getTodayMood(): Promise<MoodEntry | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .eq("entry_date", today)
      .maybeSingle();

    if (error) throw error;

    return data
      ? ({
          ...data,
          factors: (data.factors || []) as string[],
        } as MoodEntry)
      : null;
  },

  async getMyMoodHistory(days = 30): Promise<MoodEntry[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data, error } = await supabase
      .from("mood_entries")
      .select("*")
      .eq("user_id", user.id)
      .gte("entry_date", startDate.toISOString().split('T')[0])
      .order("entry_date", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(m => ({
      ...m,
      factors: (m.factors || []) as string[],
    })) as MoodEntry[];
  },

  async submitMood(mood: MoodInsert): Promise<MoodEntry> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const today = new Date().toISOString().split('T')[0];
    const moodOption = MOOD_OPTIONS.find(m => m.score === mood.mood_score);

    const { data, error } = await supabase
      .from("mood_entries")
      .upsert({
        user_id: user.id,
        entry_date: today,
        mood_score: mood.mood_score,
        mood_emoji: mood.mood_emoji || moodOption?.emoji || '😐',
        note: mood.note,
        factors: mood.factors || [],
        is_anonymous: mood.is_anonymous ?? false,
      }, {
        onConflict: 'user_id,entry_date',
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      factors: (data.factors || []) as string[],
    } as MoodEntry;
  },

  async getTeamMoodStats(departmentId?: string, days = 7): Promise<TeamMoodStats[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get team members if department specified
    let userIds: string[] = [];
    if (departmentId) {
      const { data: members } = await supabase
        .from("team_members")
        .select("user_id")
        .eq("department_id", departmentId);
      userIds = members?.map(m => m.user_id) || [];
    }

    let query = supabase
      .from("mood_entries")
      .select("*")
      .gte("entry_date", startDate.toISOString().split('T')[0]);

    if (userIds.length > 0) {
      query = query.in("user_id", userIds);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by date
    const byDate: Record<string, MoodEntry[]> = {};
    (data ?? []).forEach(entry => {
      const date = entry.entry_date;
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push({
        ...entry,
        factors: (entry.factors || []) as string[],
      } as MoodEntry);
    });

    return Object.entries(byDate).map(([date, entries]) => {
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      const factorCounts: Record<string, number> = {};
      
      entries.forEach(e => {
        distribution[e.mood_score] = (distribution[e.mood_score] || 0) + 1;
        e.factors.forEach(f => {
          factorCounts[f] = (factorCounts[f] || 0) + 1;
        });
      });

      const avgMood = entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length;

      return {
        date,
        average_mood: Math.round(avgMood * 10) / 10,
        total_entries: entries.length,
        distribution,
        common_factors: Object.entries(factorCounts)
          .map(([factor, count]) => ({ factor, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5),
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  },

  async getAverageMood(days = 7): Promise<number> {
    const stats = await this.getTeamMoodStats(undefined, days);
    if (stats.length === 0) return 0;
    
    const total = stats.reduce((sum, s) => sum + s.average_mood * s.total_entries, 0);
    const count = stats.reduce((sum, s) => sum + s.total_entries, 0);
    
    return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
  },

  getMoodEmoji(score: number): string {
    return MOOD_OPTIONS.find(m => m.score === score)?.emoji || '😐';
  },

  getMoodColor(score: number): string {
    return MOOD_OPTIONS.find(m => m.score === score)?.color || '#eab308';
  },
};
