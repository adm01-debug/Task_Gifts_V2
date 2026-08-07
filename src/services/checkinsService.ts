import { supabase } from "@/integrations/supabase/client";

export interface CheckinTemplate {
  id: string;
  name: string;
  description: string | null;
  questions: CheckinQuestion[];
  is_default: boolean;
  created_by: string;
  created_at: string;
}

export interface CheckinQuestion {
  id: string;
  question: string;
  type: 'text' | 'rating' | 'select' | 'multiselect';
  options?: string[];
}

export interface Checkin {
  id: string;
  manager_id: string;
  employee_id: string;
  template_id: string | null;
  scheduled_at: string;
  completed_at: string | null;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes: string | null;
  action_items: ActionItem[];
  responses: Record<string, string | number>;
  mood_rating: number | null;
  xp_reward: number;
  created_at: string;
  updated_at: string;
  manager?: { display_name: string | null; avatar_url: string | null };
  employee?: { display_name: string | null; avatar_url: string | null };
  template?: CheckinTemplate;
}

export interface ActionItem {
  id: string;
  text: string;
  completed: boolean;
  due_date?: string;
  assigned_to?: string;
}

export interface CheckinInsert {
  employee_id: string;
  template_id?: string;
  scheduled_at: string;
  notes?: string;
}

export const checkinsService = {
  async getTemplates(): Promise<CheckinTemplate[]> {
    const { data, error } = await supabase
      .from("checkin_templates")
      .select("*")
      .order("is_default", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(t => ({
      ...t,
      questions: t.questions as unknown as CheckinQuestion[],
    })) as CheckinTemplate[];
  },

  async getMyCheckins(): Promise<Checkin[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .or(`manager_id.eq.${user.id},employee_id.eq.${user.id}`)
      .order("scheduled_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(c => ({
      ...c,
      action_items: (c.action_items || []) as unknown as ActionItem[],
      responses: (c.responses || {}) as unknown as Record<string, string | number>,
    })) as Checkin[];
  },

  async getUpcomingCheckins(): Promise<Checkin[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .or(`manager_id.eq.${user.id},employee_id.eq.${user.id}`)
      .in("status", ["scheduled", "in_progress"])
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(10);

    if (error) throw error;
    return (data ?? []).map(c => ({
      ...c,
      action_items: (c.action_items || []) as unknown as ActionItem[],
      responses: (c.responses || {}) as unknown as Record<string, string | number>,
    })) as Checkin[];
  },

  async createCheckin(checkin: CheckinInsert): Promise<Checkin> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("checkins")
      .insert({
        ...checkin,
        manager_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      action_items: [],
      responses: {},
    } as Checkin;
  },

  async updateCheckin(checkinId: string, updates: Record<string, unknown>): Promise<Checkin> {
    const { data, error } = await supabase
      .from("checkins")
      .update(updates as never)
      .eq("id", checkinId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      action_items: (data.action_items || []) as unknown as ActionItem[],
      responses: (data.responses || {}) as unknown as Record<string, string | number>,
    } as Checkin;
  },

  async completeCheckin(checkinId: string, responses: Record<string, string | number>, moodRating?: number): Promise<Checkin> {
    return this.updateCheckin(checkinId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      responses,
      mood_rating: moodRating,
    });
  },

  async addActionItem(checkinId: string, actionItem: Omit<ActionItem, 'id'>): Promise<Checkin> {
    const { data: checkin, error } = await supabase
      .from("checkins")
      .select("action_items")
      .eq("id", checkinId)
      .maybeSingle();
    
    if (error) throw error;
    if (!checkin) throw new Error("Checkin not found");

    const currentItems = (checkin?.action_items || []) as unknown as ActionItem[];
    const newItem: ActionItem = {
      ...actionItem,
      id: crypto.randomUUID(),
    };

    return this.updateCheckin(checkinId, {
      action_items: [...currentItems, newItem],
    });
  },

  async toggleActionItem(checkinId: string, actionItemId: string): Promise<Checkin> {
    const { data: checkin, error } = await supabase
      .from("checkins")
      .select("action_items")
      .eq("id", checkinId)
      .maybeSingle();
    
    if (error) throw error;
    if (!checkin) throw new Error("Checkin not found");

    const items = (checkin?.action_items || []) as unknown as ActionItem[];
    const updatedItems = items.map(item => 
      item.id === actionItemId ? { ...item, completed: !item.completed } : item
    );

    return this.updateCheckin(checkinId, { action_items: updatedItems });
  },

  async getCheckinHistory(employeeId: string, limit = 10): Promise<Checkin[]> {
    const { data, error } = await supabase
      .from("checkins")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []).map(c => ({
      ...c,
      action_items: (c.action_items || []) as unknown as ActionItem[],
      responses: (c.responses || {}) as unknown as Record<string, string | number>,
    })) as Checkin[];
  },
};
