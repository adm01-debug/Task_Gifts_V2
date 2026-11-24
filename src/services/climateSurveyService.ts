import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import { MIN_RESPONDENTS } from "@/services/engagementDiagnosticsService";
import type { Database, Json } from "@/integrations/supabase/types";

export type ClimatePillar = 
  | 'recognition' | 'autonomy' | 'growth' | 'leadership' | 'peers'
  | 'purpose' | 'environment' | 'communication' | 'benefits' | 'balance';

export interface ClimateSurvey {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  status: string;
  starts_at: string;
  ends_at: string;
  is_anonymous: boolean;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  send_reminders: boolean;
  reminder_frequency: string | null;
  allow_skip: boolean;
  department_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ClimateSurveyQuestion {
  id: string;
  survey_id: string;
  question_text: string;
  question_text_en: string | null;
  question_text_es: string | null;
  question_type: string;
  pillar: ClimatePillar;
  options: Record<string, unknown> | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

export interface ClimatePillarScore {
  id: string;
  survey_id: string;
  pillar: ClimatePillar;
  score: number;
  previous_score: number | null;
  trend: string | null;
  response_count: number;
  department_id: string | null;
  calculated_at: string;
}

export interface ClimateSurveyEnps {
  enps: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  response_count: number;
  suppressed: boolean;
  min_responses: number;
}

export const PILLAR_LABELS: Record<ClimatePillar, { pt: string; en: string; es: string }> = {
  recognition: { pt: 'Reconhecimento', en: 'Recognition', es: 'Reconocimiento' },
  autonomy: { pt: 'Autonomia', en: 'Autonomy', es: 'Autonomía' },
  growth: { pt: 'Crescimento', en: 'Growth', es: 'Crecimiento' },
  leadership: { pt: 'Liderança', en: 'Leadership', es: 'Liderazgo' },
  peers: { pt: 'Pares', en: 'Peers', es: 'Pares' },
  purpose: { pt: 'Propósito', en: 'Purpose', es: 'Propósito' },
  environment: { pt: 'Ambiente', en: 'Environment', es: 'Ambiente' },
  communication: { pt: 'Comunicação', en: 'Communication', es: 'Comunicación' },
  benefits: { pt: 'Benefícios', en: 'Benefits', es: 'Beneficios' },
  balance: { pt: 'Equilíbrio', en: 'Balance', es: 'Equilibrio' },
};

export const climateSurveyService = {
  async getSurveys(status?: string): Promise<ClimateSurvey[]> {
    let query = supabase
      .from('climate_surveys')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch climate surveys', 'ClimateSurveyService', error);
      throw error;
    }
    return data || [];
  },

  async getSurveyById(id: string): Promise<ClimateSurvey | null> {
    const { data, error } = await supabase
      .from('climate_surveys')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      logger.error('Failed to fetch climate survey', 'ClimateSurveyService', error);
      return null;
    }
    return data;
  },

  async createSurvey(survey: Omit<ClimateSurvey, 'id' | 'created_at' | 'updated_at'>): Promise<ClimateSurvey> {
    const { data, error } = await supabase
      .from('climate_surveys')
      .insert(survey)
      .select()
      .single();

    if (error) {
      logger.error('Failed to create climate survey', 'ClimateSurveyService', error);
      throw error;
    }
    return data;
  },

  async updateSurvey(id: string, updates: Partial<ClimateSurvey>): Promise<ClimateSurvey> {
    const { data, error } = await supabase
      .from('climate_surveys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update climate survey', 'ClimateSurveyService', error);
      throw error;
    }
    return data;
  },

  async getQuestions(surveyId: string): Promise<ClimateSurveyQuestion[]> {
    const { data, error } = await supabase
      .from('climate_survey_questions')
      .select('*')
      .eq('survey_id', surveyId)
      .order('order_index');

    if (error) {
      logger.error('Failed to fetch survey questions', 'ClimateSurveyService', error);
      throw error;
    }
    return (data || []) as unknown as ClimateSurveyQuestion[];
  },

  async createQuestion(question: Omit<ClimateSurveyQuestion, 'id' | 'created_at'>): Promise<ClimateSurveyQuestion> {
    const { data, error } = await supabase
      .from('climate_survey_questions')
      .insert({
        survey_id: question.survey_id,
        question_text: question.question_text,
        question_type: question.question_type,
        pillar: question.pillar as Database["public"]["Enums"]["climate_pillar"],
        order_index: question.order_index,
        is_required: question.is_required,
        options: question.options as Json | null,
        question_text_en: question.question_text_en,
        question_text_es: question.question_text_es,
      })
      .select()
      .single();

    if (error) {
      logger.error('Failed to create survey question', 'ClimateSurveyService', error);
      throw error;
    }
    return data as unknown as ClimateSurveyQuestion;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    const { error } = await supabase
      .from('climate_survey_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      logger.error('Failed to delete survey question', 'ClimateSurveyService', error);
      throw error;
    }
  },

  async submitResponse(surveyId: string, answers: { questionId: string; score?: number; textAnswer?: string }[]): Promise<void> {
    const payload = answers.map((answer) => ({
      question_id: answer.questionId,
      score: answer.score ?? null,
      text_answer: answer.textAnswer ?? null,
    }));

    const { error } = await supabase.rpc('climate_submit_response', {
      p_survey_id: surveyId,
      p_answers: payload as unknown as Json,
    });

    if (error) {
      logger.error('Failed to submit survey response', 'ClimateSurveyService', error);
      if (error.code === '23505') {
        throw new Error('Você já respondeu esta pesquisa.');
      }
      throw error;
    }
  },

  async getMyAnsweredSurveyIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('climate_survey_responses')
      .select('survey_id')
      .eq('user_id', userId);

    if (error) {
      logger.error('Failed to fetch answered surveys', 'ClimateSurveyService', error);
      throw error;
    }
    return (data || []).map((row) => row.survey_id);
  },

  async recalculatePillarScores(surveyId: string, minResponses = MIN_RESPONDENTS): Promise<number> {
    const { data, error } = await supabase.rpc('climate_recalculate_pillar_scores', {
      p_survey_id: surveyId,
      p_min_responses: minResponses,
    });

    if (error) {
      logger.error('Failed to recalculate pillar scores', 'ClimateSurveyService', error);
      throw error;
    }
    return data ?? 0;
  },

  async getPillarScores(surveyId: string, departmentId?: string): Promise<ClimatePillarScore[]> {
    let query = supabase
      .from('climate_pillar_scores')
      .select('*')
      .eq('survey_id', surveyId);

    if (departmentId) {
      query = query.eq('department_id', departmentId);
    } else {
      query = query.is('department_id', null);
    }

    const { data, error } = await query;
    if (error) {
      logger.error('Failed to fetch pillar scores', 'ClimateSurveyService', error);
      throw error;
    }
    return (data || []) as unknown as ClimatePillarScore[];
  },

  async calculateENPS(surveyId: string, minResponses = MIN_RESPONDENTS): Promise<ClimateSurveyEnps> {
    const { data, error } = await supabase.rpc('climate_survey_enps', {
      p_survey_id: surveyId,
      p_min_responses: minResponses,
    });

    if (error) {
      logger.error('Failed to calculate eNPS', 'ClimateSurveyService', error);
      throw error;
    }
    return data as unknown as ClimateSurveyEnps;
  },
};
