import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { toast } from "sonner";

export interface FeedbackCycle {
  id: string;
  name: string;
  description?: string;
  cycle_type: string;
  starts_at: string;
  ends_at: string;
  status: string;
  questions?: unknown;
  grace_period_days?: number;
  is_anonymous?: boolean;
  min_evaluators?: number;
  include_self_evaluation?: boolean;
  include_manager_evaluation?: boolean;
  include_peer_evaluation?: boolean;
  include_direct_report_evaluation?: boolean;
  department_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface FeedbackQuestion {
  id: string;
  cycle_id: string;
  competency_id?: string;
  question_text: string;
  question_type: string;
  scale_min: number;
  scale_max: number;
  is_required: boolean;
  weight: number;
  order_index: number;
}

export interface FeedbackEvaluation {
  id: string;
  cycle_id: string;
  evaluator_id: string;
  evaluatee_id: string;
  evaluator_type: string;
  status: string;
  started_at?: string;
  completed_at?: string;
}

export interface FeedbackResult {
  id: string;
  cycle_id: string;
  user_id: string;
  competency_id?: string;
  self_score?: number;
  manager_score?: number;
  peer_score?: number;
  direct_report_score?: number;
  overall_score?: number;
  response_count: number;
}

export const feedback360Service = {
  async getCycles(filters?: { status?: string; departmentId?: string }): Promise<FeedbackCycle[]> {
    try {
      let query = supabase.from('feedback_cycles').select('*').order('created_at', { ascending: false });
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.departmentId) query = query.eq('department_id', filters.departmentId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FeedbackCycle[];
    } catch (error) {
      logger.apiError('getCycles', error, 'Feedback360');
      toast.error('Erro ao carregar ciclos de feedback');
      return [];
    }
  },

  async getCycleById(id: string): Promise<FeedbackCycle | null> {
    try {
      const { data, error } = await supabase.from('feedback_cycles').select('*').eq('id', id).maybeSingle();
      if (error) throw error;
      return data as unknown as FeedbackCycle;
    } catch (error) {
      logger.apiError('getCycleById', error, 'Feedback360');
      toast.error('Erro ao carregar ciclo de feedback');
      return null;
    }
  },

  async createCycle(cycle: {
    name: string;
    description?: string;
    cycle_type?: string;
    starts_at: string;
    ends_at: string;
    created_by: string;
    department_id?: string;
  }): Promise<FeedbackCycle> {
    try {
      const { data, error } = await supabase.from('feedback_cycles').insert({
        name: cycle.name,
        description: cycle.description,
        cycle_type: cycle.cycle_type || '360',
        starts_at: cycle.starts_at,
        ends_at: cycle.ends_at,
        created_by: cycle.created_by,
        department_id: cycle.department_id,
        status: 'draft',
      }).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Failed to create feedback cycle');
      return data as unknown as FeedbackCycle;
    } catch (error) {
      logger.apiError('createCycle', error, 'Feedback360');
      throw error;
    }
  },

  async updateCycle(id: string, updates: Record<string, unknown>): Promise<FeedbackCycle> {
    try {
      const { data, error } = await supabase.from('feedback_cycles').update(updates as never).eq('id', id).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Feedback cycle not found');
      return data as unknown as FeedbackCycle;
    } catch (error) {
      logger.apiError('updateCycle', error, 'Feedback360');
      throw error;
    }
  },

  async getQuestions(cycleId: string): Promise<FeedbackQuestion[]> {
    try {
      const { data, error } = await supabase.from('feedback_questions').select('*').eq('cycle_id', cycleId).order('order_index');
      if (error) throw error;
      return (data || []) as unknown as FeedbackQuestion[];
    } catch (error) {
      logger.apiError('getQuestions', error, 'Feedback360');
      return [];
    }
  },

  async getMyEvaluations(userId: string): Promise<FeedbackEvaluation[]> {
    try {
      const { data, error } = await supabase.from('feedback_evaluations').select('*').eq('evaluator_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FeedbackEvaluation[];
    } catch (error) {
      logger.apiError('getMyEvaluations', error, 'Feedback360');
      return [];
    }
  },

  async getEvaluationsForMe(userId: string): Promise<FeedbackEvaluation[]> {
    try {
      const { data, error } = await supabase.from('feedback_evaluations').select('*').eq('evaluatee_id', userId).order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as FeedbackEvaluation[];
    } catch (error) {
      logger.apiError('getEvaluationsForMe', error, 'Feedback360');
      return [];
    }
  },

  async createEvaluation(evaluation: { cycle_id: string; evaluator_id: string; evaluatee_id: string; evaluator_type: string }): Promise<FeedbackEvaluation> {
    try {
      const { data, error } = await supabase.from('feedback_evaluations').insert({
        cycle_id: evaluation.cycle_id,
        evaluator_id: evaluation.evaluator_id,
        evaluatee_id: evaluation.evaluatee_id,
        evaluator_type: evaluation.evaluator_type,
        status: 'pending',
      }).select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error('Failed to create evaluation');
      return data as unknown as FeedbackEvaluation;
    } catch (error) {
      logger.apiError('createEvaluation', error, 'Feedback360');
      throw error;
    }
  },

  async completeEvaluation(evaluationId: string): Promise<void> {
    try {
      const { error } = await supabase.from('feedback_evaluations').update({ 
        status: 'completed', 
        completed_at: new Date().toISOString() 
      }).eq('id', evaluationId);
      if (error) throw error;
    } catch (error) {
      logger.apiError('completeEvaluation', error, 'Feedback360');
      throw error;
    }
  },

  async getMyResults(userId: string, cycleId?: string): Promise<FeedbackResult[]> {
    try {
      let query = supabase.from('feedback_results').select('*').eq('user_id', userId);
      if (cycleId) query = query.eq('cycle_id', cycleId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FeedbackResult[];
    } catch (error) {
      logger.apiError('getMyResults', error, 'Feedback360');
      return [];
    }
  },
};
