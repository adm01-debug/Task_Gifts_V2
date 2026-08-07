import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
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

  async submitResponse(surveyId: string, userId: string, answers: { questionId: string; score?: number; textAnswer?: string }[]): Promise<void> {
    const { data: response, error: responseError } = await supabase
      .from('climate_survey_responses')
      .insert({
        survey_id: surveyId,
        user_id: userId,
        is_complete: true,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (responseError) {
      logger.error('Failed to create survey response', 'ClimateSurveyService', responseError);
      throw responseError;
    }

    const answersToInsert = answers.map(a => ({
      response_id: response.id,
      question_id: a.questionId,
      score: a.score,
      text_answer: a.textAnswer,
      skipped: !a.score && !a.textAnswer,
    }));

    const { error: answersError } = await supabase
      .from('climate_question_answers')
      .insert(answersToInsert);

    if (answersError) {
      logger.error('Failed to save answers', 'ClimateSurveyService', answersError);
      throw answersError;
    }
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

  async calculateENPS(surveyId: string): Promise<{ enps: number; promoters: number; passives: number; detractors: number }> {
    const { data, error } = await supabase
      .from('climate_question_answers')
      .select(`
        score,
        climate_survey_responses!inner(survey_id)
      `)
      .eq('climate_survey_responses.survey_id', surveyId);

    if (error) {
      logger.error('Failed to calculate eNPS', 'ClimateSurveyService', error);
      throw error;
    }

    interface ScoreData { score: number | null }
    const scores = (data || []).map((d: ScoreData) => d.score).filter((s): s is number => s !== null);
    const total = scores.length;
    if (total === 0) return { enps: 0, promoters: 0, passives: 0, detractors: 0 };

    const promoters = scores.filter((s) => s >= 9).length;
    const passives = scores.filter((s) => s >= 7 && s < 9).length;
    const detractors = scores.filter((s) => s < 7).length;

    const enps = Math.round(((promoters - detractors) / total) * 100);

    return { enps, promoters, passives, detractors };
  },
};
