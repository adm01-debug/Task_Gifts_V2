import { supabase } from "@/integrations/supabase/client";

export interface NineBoxEvaluation {
  id: string;
  user_id: string;
  evaluator_id: string;
  evaluation_period: string;
  performance_score: number;
  potential_score: number;
  box_position: number;
  performance_notes: string | null;
  potential_notes: string | null;
  goals_for_next_period: string[] | null;
  strengths: string[] | null;
  development_areas: string[] | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    display_name: string;
    avatar_url: string | null;
    email: string;
  };
}

export interface NineBoxDistribution {
  distribution: Record<string, number>;
  total: number;
  labels: Record<string, string>;
}

export const BOX_LABELS: Record<number, { name: string; color: string; description: string }> = {
  1: { name: "Iceberg", color: "bg-red-500", description: "Baixo Desempenho / Baixo Potencial" },
  2: { name: "Dilema", color: "bg-orange-400", description: "Médio Desempenho / Baixo Potencial" },
  3: { name: "Profissional de Confiança", color: "bg-yellow-500", description: "Alto Desempenho / Baixo Potencial" },
  4: { name: "Enigma", color: "bg-orange-500", description: "Baixo Desempenho / Médio Potencial" },
  5: { name: "Mantenedor", color: "bg-blue-400", description: "Médio Desempenho / Médio Potencial" },
  6: { name: "Forte Desempenho", color: "bg-green-400", description: "Alto Desempenho / Médio Potencial" },
  7: { name: "Diamante Bruto", color: "bg-purple-400", description: "Baixo Desempenho / Alto Potencial" },
  8: { name: "Futuro Líder", color: "bg-emerald-500", description: "Médio Desempenho / Alto Potencial" },
  9: { name: "Estrela", color: "bg-amber-400", description: "Alto Desempenho / Alto Potencial" },
};

export const nineBoxService = {
  async getEvaluations(departmentId?: string, period?: string) {
    let query = supabase
      .from("nine_box_evaluations")
      .select("*")
      .order("created_at", { ascending: false });

    if (period) {
      query = query.eq("evaluation_period", period);
    }

    const { data, error } = await query;
    if (error) throw error;
     return (data || []) as unknown as NineBoxEvaluation[];
  },

  async getLatestEvaluationByUser(userId: string) {
    const { data, error } = await supabase
      .from("nine_box_evaluations")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createEvaluation(evaluation: {
    user_id: string;
    evaluator_id: string;
    evaluation_period: string;
    performance_score: number;
    potential_score: number;
    performance_notes?: string;
    potential_notes?: string;
    goals_for_next_period?: string[];
    strengths?: string[];
    development_areas?: string[];
  }) {
    const { data, error } = await supabase
      .from("nine_box_evaluations")
      .insert(evaluation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvaluation(id: string, updates: Partial<NineBoxEvaluation>) {
    const { data, error } = await supabase
      .from("nine_box_evaluations")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDistribution(departmentId?: string, period?: string) {
    const { data, error } = await supabase
      .rpc("get_nine_box_distribution", {
        p_department_id: (departmentId || null) as any,
        p_period: (period || null) as any,
      });

    if (error) throw error;
    return data as unknown as NineBoxDistribution;
  },

  async getAvailablePeriods() {
    const { data, error } = await supabase
      .from("nine_box_evaluations")
      .select("evaluation_period")
      .order("evaluation_period", { ascending: false });

    if (error) throw error;
    const periods = [...new Set(data?.map((d) => d.evaluation_period) || [])];
    return periods;
  },
};
