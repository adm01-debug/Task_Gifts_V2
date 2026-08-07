import { supabase } from "@/integrations/supabase/client";

export interface ENPSSurvey {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  department_id: string | null;
  starts_at: string;
  ends_at: string;
  is_anonymous: boolean;
  status: "draft" | "active" | "closed" | "archived";
  follow_up_question: string | null;
  created_at: string;
  updated_at: string;
  departments?: {
    name: string;
  };
  response_count?: number;
  enps_score?: number;
}

export interface ENPSResponse {
  id: string;
  survey_id: string;
  user_id: string;
  score: number;
  category: "promoter" | "passive" | "detractor";
  follow_up_answer: string | null;
  created_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
  };
}

export interface ENPSStats {
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  score: number;
  promoterPercent: number;
  passivePercent: number;
  detractorPercent: number;
}

export interface EngagementSnapshot {
  id: string;
  department_id: string | null;
  snapshot_date: string;
  period_type: string;
  enps_score: number | null;
  mood_avg: number | null;
  participation_rate: number | null;
  active_users: number | null;
  total_users: number | null;
  quests_completed: number | null;
  training_completion_rate: number | null;
  punctuality_rate: number | null;
  kudos_given: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export const enpsService = {
  async getSurveys(status?: string) {
    let query = supabase
      .from("enps_surveys")
      .select(`
        *,
        departments:department_id (name)
      `)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get response counts for each survey
    const surveysWithStats = await Promise.all(
      (data || []).map(async (survey) => {
        const { count } = await supabase
          .from("enps_responses")
          .select("*", { count: "exact", head: true })
          .eq("survey_id", survey.id);

        const { data: scoreData } = await supabase
          .rpc("calculate_enps_score", { p_survey_id: survey.id });

        return {
          ...survey,
          response_count: count || 0,
          enps_score: scoreData as number | null,
        };
      })
    );

    return surveysWithStats as ENPSSurvey[];
  },

  async getSurvey(surveyId: string) {
    const { data, error } = await supabase
      .from("enps_surveys")
      .select(`
        *,
        departments:department_id (name)
      `)
      .eq("id", surveyId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Survey not found");
    return data as ENPSSurvey;
  },

  async createSurvey(survey: {
    title: string;
    description?: string;
    created_by: string;
    department_id?: string;
    starts_at?: string;
    ends_at: string;
    is_anonymous?: boolean;
    follow_up_question?: string;
    status?: string;
  }) {
    const { data, error } = await supabase
      .from("enps_surveys")
      .insert(survey)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateSurvey(id: string, updates: Partial<ENPSSurvey>) {
    const { data, error } = await supabase
      .from("enps_surveys")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteSurvey(id: string) {
    const { error } = await supabase
      .from("enps_surveys")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  async getResponses(surveyId: string) {
    const { data, error } = await supabase
      .from("enps_responses")
      .select("*")
      .eq("survey_id", surveyId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as unknown as ENPSResponse[];
  },

  async submitResponse(response: {
    survey_id: string;
    user_id: string;
    score: number;
    follow_up_answer?: string;
  }) {
    const { data, error } = await supabase
      .from("enps_responses")
      .insert(response)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async hasResponded(surveyId: string, userId: string) {
    const { data, error } = await supabase
      .from("enps_responses")
      .select("id")
      .eq("survey_id", surveyId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async getSurveyStats(surveyId: string): Promise<ENPSStats> {
    const { data, error } = await supabase
      .from("enps_responses")
      .select("score, category")
      .eq("survey_id", surveyId);

    if (error) throw error;

    const responses = data || [];
    const total = responses.length;
    const promoters = responses.filter((r) => r.category === "promoter").length;
    const passives = responses.filter((r) => r.category === "passive").length;
    const detractors = responses.filter((r) => r.category === "detractor").length;

    const score = total > 0 
      ? Math.round(((promoters - detractors) / total) * 100) 
      : 0;

    return {
      promoters,
      passives,
      detractors,
      total,
      score,
      promoterPercent: total > 0 ? Math.round((promoters / total) * 100) : 0,
      passivePercent: total > 0 ? Math.round((passives / total) * 100) : 0,
      detractorPercent: total > 0 ? Math.round((detractors / total) * 100) : 0,
    };
  },

  async getEngagementSnapshots(departmentId?: string, limit = 12) {
    let query = supabase
      .from("engagement_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: false })
      .limit(limit);

    if (departmentId) {
      query = query.eq("department_id", departmentId);
    } else {
      query = query.is("department_id", null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as EngagementSnapshot[];
  },

  async generateSnapshot(departmentId?: string, periodType = "weekly") {
    const { data, error } = await supabase
      .rpc("generate_engagement_snapshot", {
        p_department_id: departmentId,
        p_period_type: periodType,
      });

    if (error) throw error;
    return data;
  },

  async getActiveSurveyForUser(userId: string) {
    const { data: surveys, error } = await supabase
      .from("enps_surveys")
      .select("*")
      .eq("status", "active")
      .lte("starts_at", new Date().toISOString())
      .gte("ends_at", new Date().toISOString())
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Find first survey user hasn't responded to
    for (const survey of surveys || []) {
      const hasResponded = await this.hasResponded(survey.id, userId);
      if (!hasResponded) {
        return survey;
      }
    }

    return null;
  },
};
