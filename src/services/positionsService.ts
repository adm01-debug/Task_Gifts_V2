import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type PositionInsert = Database["public"]["Tables"]["positions"]["Insert"];
type TaskTemplateInsert = Database["public"]["Tables"]["position_task_templates"]["Insert"];
type TaskScoreInsert = Database["public"]["Tables"]["task_scores"]["Insert"];
type PenaltyRuleInsert = Database["public"]["Tables"]["penalty_rules"]["Insert"];
type TaskScoreStatus = Database["public"]["Tables"]["task_scores"]["Row"]["status"];

export interface Position {
  id: string;
  name: string;
  description: string | null;
  department_id: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  departments?: { name: string; color: string | null } | null;
}

export interface PositionTaskTemplate {
  id: string;
  position_id: string;
  title: string;
  description: string | null;
  frequency: string;
  priority: string;
  expected_duration_minutes: number | null;
  xp_reward: number;
  coin_reward: number;
  xp_penalty_late: number;
  xp_penalty_rework: number;
  deadline_hours: number | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  positions?: { name: string } | null;
}

export interface UserPosition {
  id: string;
  user_id: string;
  position_id: string;
  started_at: string;
  ended_at: string | null;
  is_primary: boolean;
  created_at: string;
  positions?: Position | null;
  profiles?: { display_name: string | null; email: string | null } | null;
}

export interface TaskScore {
  id: string;
  user_id: string;
  task_template_id: string | null;
  bitrix_task_id: string | null;
  title: string;
  description: string | null;
  status: 'pending' | 'on_time' | 'late' | 'rejected' | 'rework';
  source: string;
  assigned_at: string;
  deadline_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  xp_earned: number;
  coins_earned: number;
  xp_penalty: number;
  is_late: boolean;
  late_hours: number | null;
  rework_count: number;
  bitrix_metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TaskPenalty {
  id: string;
  user_id: string;
  task_score_id: string | null;
  penalty_type: string;
  xp_deducted: number;
  coins_deducted: number;
  reason: string | null;
  applied_by: string | null;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

export interface PenaltyRule {
  id: string;
  name: string;
  description: string | null;
  penalty_type: string;
  trigger_condition: string;
  xp_penalty_percent: number | null;
  xp_penalty_fixed: number | null;
  coin_penalty_percent: number | null;
  coin_penalty_fixed: number | null;
  is_escalating: boolean;
  escalation_multiplier: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const positionsService = {
  // === POSITIONS ===
  async getPositions(): Promise<Position[]> {
    const { data, error } = await supabase
      .from("positions")
      .select("*, departments(name, color)")
      .order("name");
    
    if (error) throw error;
    return (data || []) as Position[];
  },

  async getActivePositions(): Promise<Position[]> {
    const { data, error } = await supabase
      .from("positions")
      .select("*, departments(name, color)")
      .eq("is_active", true)
      .order("name");
    
    if (error) throw error;
    return (data || []) as Position[];
  },

  async createPosition(position: Partial<Position>): Promise<Position> {
    const insertData: PositionInsert = {
      name: position.name || "",
      description: position.description,
      department_id: position.department_id,
      level: position.level,
      is_active: position.is_active,
    };
    const { data, error } = await supabase
      .from("positions")
      .insert(insertData)
      .select("*, departments(name, color)")
      .single();
    if (error) throw error;
    return data as Position;
  },

  async updatePosition(id: string, updates: Partial<Position>): Promise<Position> {
    const { data, error } = await supabase
      .from("positions")
      .update(updates)
      .eq("id", id)
      .select("*, departments(name, color)")
      .single();
    
    if (error) throw error;
    return data as Position;
  },

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase
      .from("positions")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // === TASK TEMPLATES ===
  async getTaskTemplates(positionId?: string): Promise<PositionTaskTemplate[]> {
    let query = supabase
      .from("position_task_templates")
      .select("*, positions(name)")
      .order("title");
    
    if (positionId) {
      query = query.eq("position_id", positionId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as PositionTaskTemplate[];
  },

  async createTaskTemplate(template: Partial<PositionTaskTemplate>): Promise<PositionTaskTemplate> {
    const insertData: TaskTemplateInsert = {
      position_id: template.position_id || "",
      title: template.title || "",
      description: template.description,
      frequency: template.frequency,
      priority: template.priority,
      expected_duration_minutes: template.expected_duration_minutes,
      xp_reward: template.xp_reward,
      coin_reward: template.coin_reward,
      xp_penalty_late: template.xp_penalty_late,
      xp_penalty_rework: template.xp_penalty_rework,
      deadline_hours: template.deadline_hours,
      is_active: template.is_active,
      created_by: template.created_by || "",
    };
    const { data, error } = await supabase
      .from("position_task_templates")
      .insert(insertData)
      .select("*, positions(name)")
      .single();
    if (error) throw error;
    return data as PositionTaskTemplate;
  },

  async updateTaskTemplate(id: string, updates: Partial<PositionTaskTemplate>): Promise<PositionTaskTemplate> {
    const { data, error } = await supabase
      .from("position_task_templates")
      .update(updates)
      .eq("id", id)
      .select("*, positions(name)")
      .single();
    
    if (error) throw error;
    return data as PositionTaskTemplate;
  },

  async deleteTaskTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from("position_task_templates")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // === USER POSITIONS ===
  async getUserPositions(userId?: string): Promise<UserPosition[]> {
    let query = supabase
      .from("user_positions")
      .select("*, positions(*)")
      .order("started_at", { ascending: false });
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as UserPosition[];
  },

  async assignUserPosition(userId: string, positionId: string, isPrimary: boolean = true): Promise<UserPosition> {
    // Se for primário, remover flag primary de outros
    if (isPrimary) {
      await supabase
        .from("user_positions")
        .update({ is_primary: false })
        .eq("user_id", userId)
        .eq("is_primary", true);
    }

    const { data, error } = await supabase
      .from("user_positions")
      .insert({ user_id: userId, position_id: positionId, is_primary: isPrimary })
      .select("*, positions(*)")
      .single();
    
    if (error) throw error;
    return data as UserPosition;
  },

  async removeUserPosition(id: string): Promise<void> {
    const { error } = await supabase
      .from("user_positions")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
  },

  // === TASK SCORES ===
  async getTaskScores(userId?: string, status?: string): Promise<TaskScore[]> {
    let query = supabase
      .from("task_scores")
      .select("*")
      .order("assigned_at", { ascending: false });
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    if (status) {
      query = query.eq("status", status as TaskScoreStatus);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TaskScore[];
  },

  async getMyTaskScores(): Promise<TaskScore[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    return this.getTaskScores(user.id);
  },

  async createTaskScore(taskScore: Partial<TaskScore>): Promise<TaskScore> {
    const insertData: TaskScoreInsert = {
      user_id: taskScore.user_id || "",
      task_template_id: taskScore.task_template_id,
      bitrix_task_id: taskScore.bitrix_task_id,
      title: taskScore.title || "",
      description: taskScore.description,
      deadline_at: taskScore.deadline_at,
      source: taskScore.source,
    };
    const { data, error } = await supabase
      .from("task_scores")
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return data as TaskScore;
  },

  async completeTaskScore(taskScoreId: string, status: 'on_time' | 'late' | 'rejected' | 'rework'): Promise<{ success: boolean; xp_earned?: number; coins_earned?: number; xp_penalty?: number }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.rpc as any)("complete_task_score", { 
      p_task_score_id: taskScoreId, 
      p_status: status 
    });
    
    if (error) throw error;
     return data as unknown as { success: boolean; xp_earned?: number; coins_earned?: number; xp_penalty?: number };
  },

  // === PENALTIES ===
  async getTaskPenalties(userId?: string): Promise<TaskPenalty[]> {
    let query = supabase
      .from("task_penalties")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (userId) {
      query = query.eq("user_id", userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as TaskPenalty[];
  },

  async applyPenalty(
    userId: string, 
    taskScoreId: string, 
    penaltyType: string, 
    xpDeducted: number, 
    coinsDeducted: number = 0, 
    reason?: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .rpc("apply_task_penalty", {
        p_user_id: userId,
        p_task_score_id: taskScoreId,
        p_penalty_type: penaltyType,
        p_xp_deducted: xpDeducted,
        p_coins_deducted: coinsDeducted,
        p_reason: reason || null,
        p_applied_by: user?.id || null
      });
    
    if (error) throw error;
    return data as string;
  },

  // === PENALTY RULES ===
  async getPenaltyRules(): Promise<PenaltyRule[]> {
    const { data, error } = await supabase
      .from("penalty_rules")
      .select("*")
      .order("penalty_type");
    
    if (error) throw error;
    return (data || []) as PenaltyRule[];
  },

  async updatePenaltyRule(id: string, updates: Partial<PenaltyRule>): Promise<PenaltyRule> {
    const { data, error } = await supabase
      .from("penalty_rules")
      .update(updates)
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data as PenaltyRule;
  },

  async createPenaltyRule(rule: Partial<PenaltyRule>): Promise<PenaltyRule> {
    const insertData: PenaltyRuleInsert = {
      penalty_type: rule.penalty_type || "",
      name: rule.name || "",
      description: rule.description,
      trigger_condition: rule.trigger_condition,
      xp_penalty_percent: rule.xp_penalty_percent,
      xp_penalty_fixed: rule.xp_penalty_fixed,
      coin_penalty_percent: rule.coin_penalty_percent,
      coin_penalty_fixed: rule.coin_penalty_fixed,
      is_escalating: rule.is_escalating,
      escalation_multiplier: rule.escalation_multiplier,
      is_active: rule.is_active,
    };
    const { data, error } = await supabase
      .from("penalty_rules")
      .insert(insertData)
      .select()
      .single();
    if (error) throw error;
    return data as PenaltyRule;
  },

  // === STATISTICS ===
  async getUserTaskStats(userId: string): Promise<{
    total: number;
    completed: number;
    on_time: number;
    late: number;
    rework: number;
    pending: number;
    total_xp_earned: number;
    total_xp_penalty: number;
    total_coins: number;
  }> {
    const { data, error } = await supabase
      .from("task_scores")
      .select("status, xp_earned, xp_penalty, coins_earned")
      .eq("user_id", userId);
    
    if (error) throw error;
    
    const tasks = data || [];
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'on_time' || t.status === 'late').length,
      on_time: tasks.filter(t => t.status === 'on_time').length,
      late: tasks.filter(t => t.status === 'late').length,
      rework: tasks.filter(t => t.status === 'rework').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      total_xp_earned: tasks.reduce((sum, t) => sum + (t.xp_earned || 0), 0),
      total_xp_penalty: tasks.reduce((sum, t) => sum + (t.xp_penalty || 0), 0),
      total_coins: tasks.reduce((sum, t) => sum + (t.coins_earned || 0), 0),
    };
  },

  // === BITRIX24 INTEGRATION ===
  async createBitrixTaskScore(
    userId: string,
    bitrixTaskId: string,
    title: string,
    description: string | null,
    deadlineAt: string | null,
    metadata: Record<string, unknown>
  ): Promise<TaskScore> {
    const insertData: TaskScoreInsert = {
      user_id: userId,
      bitrix_task_id: bitrixTaskId,
      title,
      description,
      deadline_at: deadlineAt,
      source: 'bitrix24',
      bitrix_metadata: metadata as unknown as Database["public"]["Tables"]["task_scores"]["Insert"]["bitrix_metadata"]
    };
    const { data, error } = await supabase
      .from("task_scores")
      .insert(insertData)
      .select()
      .single();
    
    if (error) throw error;
    return data as TaskScore;
  },

  async getBitrixTaskScore(bitrixTaskId: string): Promise<TaskScore | null> {
    const { data, error } = await supabase
      .from("task_scores")
      .select("*")
      .eq("bitrix_task_id", bitrixTaskId)
      .maybeSingle();
    
    if (error) throw error;
    return data as TaskScore | null;
  }
};
