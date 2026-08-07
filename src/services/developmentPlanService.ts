import { supabase } from "@/integrations/supabase/client";

export interface DevelopmentPlan {
  id: string;
  user_id: string;
  created_by: string;
  title: string;
  description: string | null;
  status: "draft" | "active" | "completed" | "cancelled";
  start_date: string;
  target_date: string | null;
  completed_at: string | null;
  linked_feedback_id: string | null;
  linked_nine_box_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    email: string;
  };
  actions?: DevelopmentPlanAction[];
}

export interface DevelopmentPlanAction {
  id: string;
  plan_id: string;
  title: string;
  description: string | null;
  action_type: "learning" | "project" | "mentoring" | "certification" | "training" | "experience" | "other";
  competency_id: string | null;
  priority: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "completed" | "cancelled";
  due_date: string | null;
  completed_at: string | null;
  progress_percent: number;
  evidence_url: string | null;
  notes: string | null;
  xp_reward: number;
  created_at: string;
  updated_at: string;
  competencies?: {
    name: string;
    category: string;
  };
}

export interface Competency {
  id: string;
  name: string;
  description: string | null;
  category: string;
  department_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ACTION_TYPES: Record<string, { label: string; icon: string }> = {
  learning: { label: "Aprendizado", icon: "📚" },
  project: { label: "Projeto", icon: "🎯" },
  mentoring: { label: "Mentoria", icon: "🤝" },
  certification: { label: "Certificação", icon: "🏆" },
  training: { label: "Treinamento", icon: "📋" },
  experience: { label: "Experiência", icon: "💼" },
  other: { label: "Outro", icon: "📌" },
};

export const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export const developmentPlanService = {
  async getPlans(userId?: string, status?: string) {
    let query = supabase
      .from("development_plans")
      .select("*")
      .order("created_at", { ascending: false });

    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as unknown as DevelopmentPlan[];
  },

  async getPlan(planId: string) {
    const { data, error } = await supabase
      .from("development_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (error) throw error;
    
    // Get actions separately
    const { data: actions } = await supabase
      .from("development_plan_actions")
      .select("*")
      .eq("plan_id", planId)
      .order("created_at");
    
    return { ...data, actions: actions || [] } as unknown as DevelopmentPlan;
  },

  async createPlan(plan: {
    user_id: string;
    created_by: string;
    title: string;
    description?: string;
    status?: string;
    start_date?: string;
    target_date?: string;
    linked_feedback_id?: string;
    linked_nine_box_id?: string;
  }) {
    const { data, error } = await supabase
      .from("development_plans")
      .insert(plan)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlan(id: string, updates: Partial<DevelopmentPlan>) {
    const { data, error } = await supabase
      .from("development_plans")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlan(id: string) {
    const { error } = await supabase
      .from("development_plans")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async createAction(action: {
    plan_id: string;
    title: string;
    description?: string;
    action_type?: string;
    competency_id?: string;
    priority?: string;
    due_date?: string;
    xp_reward?: number;
  }) {
    const { data, error } = await supabase
      .from("development_plan_actions")
      .insert(action)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAction(id: string, updates: Partial<DevelopmentPlanAction>) {
    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() };
    
    if (updates.status === "completed" && !updates.completed_at) {
      updateData.completed_at = new Date().toISOString();
      updateData.progress_percent = 100;
    }

    const { data, error } = await supabase
      .from("development_plan_actions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAction(id: string) {
    const { error } = await supabase
      .from("development_plan_actions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getCompetencies(departmentId?: string) {
    let query = supabase
      .from("competencies")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (departmentId) {
      query = query.or(`department_id.eq.${departmentId},department_id.is.null`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as Competency[];
  },

  async createCompetency(competency: {
    name: string;
    description?: string;
    category?: string;
    department_id?: string;
  }) {
    const { data, error } = await supabase
      .from("competencies")
      .insert(competency)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
