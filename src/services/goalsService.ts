import { supabase } from "@/integrations/supabase/client";

export interface Goal {
  id: string;
  user_id: string;
  department_id: string | null;
  title: string;
  description: string | null;
  goal_type: 'personal' | 'team' | 'company';
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress_percent: number;
  start_date: string;
  due_date: string | null;
  completed_at: string | null;
  xp_reward: number;
  coin_reward: number;
  created_at: string;
  updated_at: string;
  key_results?: KeyResult[];
}

export interface KeyResult {
  id: string;
  goal_id: string;
  title: string;
  description: string | null;
  metric_type: 'percentage' | 'number' | 'currency' | 'boolean';
  target_value: number;
  current_value: number;
  unit: string | null;
  weight: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalUpdate {
  id: string;
  goal_id: string;
  user_id: string;
  key_result_id: string | null;
  previous_value: number | null;
  new_value: number;
  note: string | null;
  created_at: string;
}

export interface GoalInsert {
  title: string;
  description?: string;
  goal_type?: 'personal' | 'team' | 'company';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'draft' | 'active' | 'completed' | 'cancelled';
  progress_percent?: number;
  start_date?: string;
  due_date?: string;
  department_id?: string;
  xp_reward?: number;
  coin_reward?: number;
}

export interface KeyResultInsert {
  goal_id: string;
  title: string;
  description?: string;
  metric_type?: 'percentage' | 'number' | 'currency' | 'boolean';
  target_value?: number;
  unit?: string;
  weight?: number;
}

export const goalsService = {
  async getMyGoals(): Promise<Goal[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  async getGoalWithKeyResults(goalId: string): Promise<Goal | null> {
    const { data: goal, error: goalError } = await supabase
      .from("goals")
      .select("*")
      .eq("id", goalId)
      .maybeSingle();

    if (goalError) throw goalError;
    if (!goal) return null;

    const { data: keyResults, error: krError } = await supabase
      .from("key_results")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: true });

    if (krError) throw krError;

    return {
      ...goal,
      key_results: keyResults ?? [],
    } as Goal;
  },

  async getTeamGoals(departmentId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("department_id", departmentId)
      .eq("goal_type", "team")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  async getCompanyGoals(): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("goal_type", "company")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as Goal[];
  },

  async createGoal(goal: GoalInsert): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("goals")
      .insert({ ...goal, user_id: user.id })
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to create goal");
    return data as Goal;
  },

  async updateGoal(goalId: string, updates: Partial<GoalInsert>): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", goalId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Goal not found");
    return data as Goal;
  },

  async deleteGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", goalId);

    if (error) throw error;
  },

  async createKeyResult(keyResult: KeyResultInsert): Promise<KeyResult> {
    const { data, error } = await supabase
      .from("key_results")
      .insert(keyResult)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to create key result");
    return data as KeyResult;
  },

  async updateKeyResult(krId: string, currentValue: number, note?: string): Promise<KeyResult> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Get previous value
    const { data: kr } = await supabase
      .from("key_results")
      .select("current_value, goal_id")
      .eq("id", krId)
      .maybeSingle();

    // Update key result
    const { data, error } = await supabase
      .from("key_results")
      .update({ current_value: currentValue })
      .eq("id", krId)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Key result not found");

    // Log update
    if (kr) {
      await supabase.from("goal_updates").insert({
        goal_id: kr.goal_id,
        user_id: user.id,
        key_result_id: krId,
        previous_value: kr.current_value,
        new_value: currentValue,
        note,
      });

      // Recalculate goal progress
      await this.recalculateGoalProgress(kr.goal_id as string);
    }

    return data as KeyResult;
  },

  async recalculateGoalProgress(goalId: string): Promise<void> {
    const { data: keyResults } = await supabase
      .from("key_results")
      .select("current_value, target_value, weight")
      .eq("goal_id", goalId);

    if (!keyResults || keyResults.length === 0) return;

    let totalWeight = 0;
    let weightedProgress = 0;

    keyResults.forEach((kr) => {
      const progress = Math.min(100, (Number(kr.current_value) / Number(kr.target_value)) * 100);
      weightedProgress += progress * Number(kr.weight);
      totalWeight += Number(kr.weight);
    });

    const overallProgress = totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;

    await supabase
      .from("goals")
      .update({ 
        progress_percent: overallProgress,
        completed_at: overallProgress >= 100 ? new Date().toISOString() : null,
        status: overallProgress >= 100 ? 'completed' : 'active'
      })
      .eq("id", goalId);
  },

  async getGoalUpdates(goalId: string): Promise<GoalUpdate[]> {
    const { data, error } = await supabase
      .from("goal_updates")
      .select("*")
      .eq("goal_id", goalId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []) as GoalUpdate[];
  },
};
