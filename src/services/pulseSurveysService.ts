import { supabase } from "@/integrations/supabase/client";

export interface PulseSurvey {
  id: string;
  title: string;
  description: string | null;
  questions: SurveyQuestion[];
  is_anonymous: boolean;
  department_id: string | null;
  starts_at: string;
  ends_at: string;
  status: 'draft' | 'active' | 'closed';
  created_by: string;
  created_at: string;
  updated_at: string;
  response_count?: number;
  has_responded?: boolean;
}

export interface SurveyQuestion {
  id: string;
  question: string;
  type: 'rating' | 'text' | 'select' | 'nps';
  options?: string[];
  required?: boolean;
}

export interface PulseResponse {
  id: string;
  survey_id: string;
  user_id: string;
  answers: Record<string, string | number>;
  submitted_at: string;
}

export interface SurveyInsert {
  title: string;
  description?: string;
  questions: SurveyQuestion[];
  is_anonymous?: boolean;
  department_id?: string;
  starts_at?: string;
  ends_at: string;
}

export interface SurveyAnalytics {
  total_responses: number;
  completion_rate: number;
  question_stats: Record<string, QuestionStats>;
  nps_score?: number;
  average_ratings: Record<string, number>;
}

export interface QuestionStats {
  question_id: string;
  question_text: string;
  type: string;
  responses: number;
  average?: number;
  distribution?: Record<string, number>;
}

export const pulseSurveysService = {
  async getActiveSurveys(): Promise<PulseSurvey[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: surveys, error } = await supabase
      .from("pulse_surveys")
      .select("*")
      .eq("status", "active")
      .lte("starts_at", new Date().toISOString())
      .gte("ends_at", new Date().toISOString())
      .order("ends_at", { ascending: true });

    if (error) throw error;

    // Check which surveys user has responded to
    const { data: responses } = await supabase
      .from("pulse_responses")
      .select("survey_id")
      .eq("user_id", user.id);

    const respondedIds = new Set(responses?.map(r => r.survey_id) || []);

    return (surveys ?? []).map(s => ({
      ...s,
      questions: s.questions as unknown as SurveyQuestion[],
      has_responded: respondedIds.has(s.id),
    })) as PulseSurvey[];
  },

  async getMySurveys(): Promise<PulseSurvey[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("pulse_surveys")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(s => ({
      ...s,
      questions: s.questions as unknown as SurveyQuestion[],
    })) as PulseSurvey[];
  },

  async getSurvey(surveyId: string): Promise<PulseSurvey | null> {
    const { data, error } = await supabase
      .from("pulse_surveys")
      .select("*")
      .eq("id", surveyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      questions: data.questions as unknown as SurveyQuestion[],
    } as PulseSurvey;
  },

  async createSurvey(survey: SurveyInsert): Promise<PulseSurvey> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const insertPayload = {
      title: survey.title,
      description: survey.description || null,
      questions: survey.questions as never,
      is_anonymous: survey.is_anonymous ?? true,
      department_id: survey.department_id || null,
      starts_at: survey.starts_at || new Date().toISOString(),
      ends_at: survey.ends_at,
      created_by: user.id,
      status: 'active' as const,
    };

    const { data, error } = await supabase
      .from("pulse_surveys")
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      questions: data.questions as unknown as SurveyQuestion[],
    } as PulseSurvey;
  },

  async submitResponse(surveyId: string, answers: Record<string, string | number>): Promise<PulseResponse> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data, error } = await supabase
      .from("pulse_responses")
      .insert({
        survey_id: surveyId,
        user_id: user.id,
        answers,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PulseResponse;
  },

  async getSurveyAnalytics(surveyId: string): Promise<SurveyAnalytics> {
    const { data: survey } = await supabase
      .from("pulse_surveys")
      .select("questions")
      .eq("id", surveyId)
      .maybeSingle();

    const { data: responses } = await supabase
      .from("pulse_responses")
      .select("answers")
      .eq("survey_id", surveyId);

    const questions = (survey?.questions || []) as unknown as SurveyQuestion[];
    const allResponses = responses || [];
    
    const questionStats: Record<string, QuestionStats> = {};
    const averageRatings: Record<string, number> = {};
    let npsResponses: number[] = [];

    questions.forEach(q => {
      const qResponses = allResponses
        .map(r => (r.answers as Record<string, string | number>)[q.id])
        .filter(Boolean);

      const stats: QuestionStats = {
        question_id: q.id,
        question_text: q.question,
        type: q.type,
        responses: qResponses.length,
      };

      if (q.type === 'rating') {
        const numericResponses = qResponses.map(Number).filter(n => !isNaN(n));
        if (numericResponses.length > 0) {
          stats.average = numericResponses.reduce((a, b) => a + b, 0) / numericResponses.length;
          averageRatings[q.id] = stats.average;
        }
      }

      if (q.type === 'nps') {
        npsResponses = qResponses.map(Number).filter(n => !isNaN(n));
      }

      if (q.type === 'select' && q.options) {
        stats.distribution = {};
        q.options.forEach(opt => {
          stats.distribution![opt] = qResponses.filter(r => r === opt).length;
        });
      }

      questionStats[q.id] = stats;
    });

    // Calculate NPS score
    let npsScore: number | undefined;
    if (npsResponses.length > 0) {
      const promoters = npsResponses.filter(n => n >= 9).length;
      const detractors = npsResponses.filter(n => n <= 6).length;
      npsScore = Math.round(((promoters - detractors) / npsResponses.length) * 100);
    }

    return {
      total_responses: allResponses.length,
      completion_rate: 0, // Would need total eligible users
      question_stats: questionStats,
      nps_score: npsScore,
      average_ratings: averageRatings,
    };
  },

  async closeSurvey(surveyId: string): Promise<void> {
    const { error } = await supabase
      .from("pulse_surveys")
      .update({ status: 'closed' })
      .eq("id", surveyId);

    if (error) throw error;
  },
};
