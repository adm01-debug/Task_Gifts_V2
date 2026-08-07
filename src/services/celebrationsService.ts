import { supabase } from "@/integrations/supabase/client";

export interface Celebration {
  id: string;
  user_id: string;
  celebration_type: 'birthday' | 'work_anniversary' | 'milestone' | 'custom';
  title: string;
  description: string | null;
  celebration_date: string;
  year_count: number | null;
  is_public: boolean;
  auto_generated: boolean;
  xp_reward: number;
  coin_reward: number;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CelebrationInsert {
  celebration_type: Celebration['celebration_type'];
  title: string;
  description?: string;
  celebration_date: string;
  is_public?: boolean;
}

export const celebrationsService = {
  async getTodayCelebrations(): Promise<Celebration[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from("celebrations")
      .select(`
        *,
        profile:profiles(display_name, avatar_url)
      `)
      .eq("celebration_date", today)
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as Celebration[];
  },

  async getUpcomingCelebrations(days = 7): Promise<Celebration[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);
    
    const { data, error } = await supabase
      .from("celebrations")
      .select(`
        *,
        profile:profiles(display_name, avatar_url)
      `)
      .gte("celebration_date", today.toISOString().split('T')[0])
      .lte("celebration_date", endDate.toISOString().split('T')[0])
      .eq("is_public", true)
      .order("celebration_date", { ascending: true });

    if (error) throw error;
    return (data ?? []) as unknown as Celebration[];
  },

  async getMyCelebrations(): Promise<Celebration[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("celebrations")
      .select("*")
      .eq("user_id", user.id)
      .order("celebration_date", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Celebration[];
  },

  async createCelebration(celebration: CelebrationInsert): Promise<Celebration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("celebrations")
      .insert({
        ...celebration,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Celebration;
  },

  async updateProfileDates(birthDate?: string, hireDate?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const updates: Record<string, string | undefined> = {};
    if (birthDate) updates.birth_date = birthDate;
    if (hireDate) updates.hire_date = hireDate;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;
    }
  },

  async generateAnnualCelebrations(userId: string): Promise<void> {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, birth_date, hire_date")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) return;

    const currentYear = new Date().getFullYear();
    const celebrations: Omit<Celebration, 'id' | 'created_at' | 'profile'>[] = [];

    // Birthday
    if (profile.birth_date) {
      const birthDate = new Date(profile.birth_date);
      const thisYearBirthday = new Date(currentYear, birthDate.getMonth(), birthDate.getDate());
      
      celebrations.push({
        user_id: userId,
        celebration_type: 'birthday',
        title: `🎂 Aniversário de ${profile.display_name}`,
        description: `Hoje é o aniversário de ${profile.display_name}! Deseje os parabéns!`,
        celebration_date: thisYearBirthday.toISOString().split('T')[0],
        year_count: currentYear - birthDate.getFullYear(),
        is_public: true,
        auto_generated: true,
        xp_reward: 50,
        coin_reward: 25,
      });
    }

    // Work anniversary
    if (profile.hire_date) {
      const hireDate = new Date(profile.hire_date);
      const yearsAtCompany = currentYear - hireDate.getFullYear();
      const thisYearAnniversary = new Date(currentYear, hireDate.getMonth(), hireDate.getDate());
      
      if (yearsAtCompany > 0) {
        celebrations.push({
          user_id: userId,
          celebration_type: 'work_anniversary',
          title: `🎊 ${yearsAtCompany} ${yearsAtCompany === 1 ? 'ano' : 'anos'} de ${profile.display_name}`,
          description: `${profile.display_name} completa ${yearsAtCompany} ${yearsAtCompany === 1 ? 'ano' : 'anos'} na empresa! Parabéns pela jornada!`,
          celebration_date: thisYearAnniversary.toISOString().split('T')[0],
          year_count: yearsAtCompany,
          is_public: true,
          auto_generated: true,
          xp_reward: 100 * yearsAtCompany,
          coin_reward: 50 * yearsAtCompany,
        });
      }
    }

    // Insert celebrations (upsert to avoid duplicates)
    for (const celebration of celebrations) {
      await supabase
        .from("celebrations")
        .upsert(celebration, { 
          onConflict: 'user_id,celebration_type,celebration_date',
          ignoreDuplicates: true 
        });
    }
  },

  getCelebrationIcon(type: Celebration['celebration_type']): string {
    const icons: Record<Celebration['celebration_type'], string> = {
      birthday: '🎂',
      work_anniversary: '🎊',
      milestone: '🏆',
      custom: '🎉',
    };
    return icons[type] || '🎉';
  },
};
