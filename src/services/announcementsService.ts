import { supabase } from "@/integrations/supabase/client";

export interface Announcement {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category: 'general' | 'urgent' | 'event' | 'achievement' | 'policy';
  department_id: string | null;
  is_pinned: boolean;
  pin_expires_at: string | null;
  published_at: string | null;
  expires_at: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  reactions?: AnnouncementReaction[];
  is_read?: boolean;
}

export interface AnnouncementReaction {
  id: string;
  announcement_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface AnnouncementInsert {
  title: string;
  content: string;
  category?: Announcement['category'];
  department_id?: string;
  is_pinned?: boolean;
  pin_expires_at?: string;
  expires_at?: string;
}

export const CATEGORY_CONFIG: Record<Announcement['category'], { icon: string; color: string; label: string }> = {
  general: { icon: '📢', color: 'bg-blue-500', label: 'Geral' },
  urgent: { icon: '🚨', color: 'bg-red-500', label: 'Urgente' },
  event: { icon: '🎉', color: 'bg-purple-500', label: 'Evento' },
  achievement: { icon: '🏆', color: 'bg-amber-500', label: 'Conquista' },
  policy: { icon: '📋', color: 'bg-gray-500', label: 'Política' },
};

export const announcementsService = {
  async getAnnouncements(limit = 20): Promise<Announcement[]> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        *,
        author:profiles(display_name, avatar_url)
      `)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .order("is_pinned", { ascending: false })
      .order("published_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Get user's reads if authenticated
    let readIds = new Set<string>();
    if (user) {
      const { data: reads } = await supabase
        .from("announcement_reads")
        .select("announcement_id")
        .eq("user_id", user.id);
      readIds = new Set(reads?.map(r => r.announcement_id) || []);
    }

    // Get reactions
    const announcementIds = data?.map(a => a.id) || [];
    const { data: reactions } = await supabase
      .from("announcement_reactions")
      .select("*")
      .in("announcement_id", announcementIds);

    const reactionsByAnnouncement: Record<string, AnnouncementReaction[]> = {};
    reactions?.forEach(r => {
      if (!reactionsByAnnouncement[r.announcement_id]) {
        reactionsByAnnouncement[r.announcement_id] = [];
      }
      reactionsByAnnouncement[r.announcement_id].push(r as AnnouncementReaction);
    });

    return (data ?? []).map(a => ({
      ...a,
      reactions: reactionsByAnnouncement[a.id] || [],
      is_read: readIds.has(a.id),
    })) as unknown as Announcement[];
  },

  async getPinnedAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from("announcements")
      .select(`
        *,
        author:profiles(display_name, avatar_url)
      `)
      .eq("is_pinned", true)
      .not("published_at", "is", null)
      .or(`pin_expires_at.is.null,pin_expires_at.gt.${new Date().toISOString()}`)
      .order("published_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as unknown as Announcement[];
  },

  async createAnnouncement(announcement: AnnouncementInsert): Promise<Announcement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        ...announcement,
        author_id: user.id,
        published_at: new Date().toISOString(),
      })
      .select(`
        *,
        author:profiles(display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data as unknown as Announcement;
  },

  async updateAnnouncement(id: string, updates: Partial<AnnouncementInsert>): Promise<Announcement> {
    const { data, error } = await supabase
      .from("announcements")
      .update(updates)
      .eq("id", id)
      .select(`
        *,
        author:profiles(display_name, avatar_url)
      `)
      .single();

    if (error) throw error;
    return data as unknown as Announcement;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async markAsRead(announcementId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("announcement_reads")
      .upsert({
        announcement_id: announcementId,
        user_id: user.id,
      }, {
        onConflict: 'announcement_id,user_id',
        ignoreDuplicates: true,
      });

    // Increment view count via RPC to ensure atomicity
    await supabase.rpc('increment_announcement_views', { 
      announcement_id: announcementId 
    });
  },

  async addReaction(announcementId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("announcement_reactions")
      .upsert({
        announcement_id: announcementId,
        user_id: user.id,
        emoji,
      }, {
        onConflict: 'announcement_id,user_id,emoji',
      });

    if (error) throw error;
  },

  async removeReaction(announcementId: string, emoji: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("announcement_reactions")
      .delete()
      .eq("announcement_id", announcementId)
      .eq("user_id", user.id)
      .eq("emoji", emoji);

    if (error) throw error;
  },

  async togglePin(announcementId: string, isPinned: boolean, expiresAt?: string): Promise<void> {
    const { error } = await supabase
      .from("announcements")
      .update({
        is_pinned: isPinned,
        pin_expires_at: expiresAt || null,
      })
      .eq("id", announcementId);

    if (error) throw error;
  },

  getUnreadCount(announcements: Announcement[]): number {
    return announcements.filter(a => !a.is_read).length;
  },
};
