import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import type { ClimatePillar } from "@/services/climateSurveyService";
import type { NpsHistoryPoint } from "@/lib/npsHistory";
import {
  normalizeCompanySize,
  normalizeIndustry,
  type PillarBenchmarkRow,
} from "@/lib/climateBenchmark";

/** Mínimo de respondentes exigido pelo banco para revelar qualquer recorte. */
export const MIN_RESPONDENTS = 5;

export interface PillarScore {
  pillar: ClimatePillar;
  score: number | null;
  favorability: number | null;
  respondents: number;
  answer_count: number;
}

export interface FactorScore {
  factor_id: string;
  factor_key: string;
  factor_name: string;
  pillar: ClimatePillar;
  score: number | null;
  favorability: number | null;
  respondents: number;
}

export interface NpsMetric {
  metric: string;
  score: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  respondents: number;
}

export interface PillarCorrelation {
  pillar_a: ClimatePillar;
  pillar_b: ClimatePillar;
  correlation: number | null;
  sample_size: number;
}

export interface EngagementOverview {
  overall_score: number | null;
  overall_favorability: number | null;
  respondents: number;
  eligible_users: number;
  participation_rate: number | null;
  answer_count: number;
}

export interface DiagnosticsFilters {
  departmentId?: string | null;
  days?: number;
}

/** Classificação de zona usada nos badges e no heatmap. */
export type ScoreZone = "critical" | "attention" | "neutral" | "good" | "excellent";

export function scoreZone(score: number | null | undefined): ScoreZone {
  if (score === null || score === undefined || !Number.isFinite(score)) return "neutral";
  if (score < 4) return "critical";
  if (score < 6) return "attention";
  if (score < 7.5) return "neutral";
  if (score < 9) return "good";
  return "excellent";
}

export const ZONE_LABEL: Record<ScoreZone, string> = {
  critical: "Crítico",
  attention: "Atenção",
  neutral: "Neutro",
  good: "Bom",
  excellent: "Excelente",
};

/** Classes de token semântico por zona — nunca cores hard-coded. */
export const ZONE_CLASS: Record<ScoreZone, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  attention: "bg-warning/15 text-warning border-warning/30",
  neutral: "bg-muted text-muted-foreground border-border",
  good: "bg-primary/15 text-primary border-primary/30",
  excellent: "bg-success/15 text-success border-success/30",
};

function rpcArgs(filters: DiagnosticsFilters) {
  return {
    p_department_id: filters.departmentId ?? undefined,
    p_days: filters.days ?? 90,
  };
}

function unwrap<T>(data: unknown): T[] {
  return (Array.isArray(data) ? data : []) as T[];
}

export const engagementDiagnosticsService = {
  async getOverview(filters: DiagnosticsFilters = {}): Promise<EngagementOverview | null> {
    const { data, error } = await supabase.rpc("get_engagement_overview", rpcArgs(filters));
    if (error) {
      logger.error("Falha ao obter visão geral de engajamento", error.message);
      throw error;
    }
    return (unwrap<EngagementOverview>(data)[0] ?? null);
  },

  async getPillarScores(filters: DiagnosticsFilters = {}): Promise<PillarScore[]> {
    const { data, error } = await supabase.rpc("get_engagement_pillar_scores", rpcArgs(filters));
    if (error) {
      logger.error("Falha ao obter scores por pilar", error.message);
      throw error;
    }
    return unwrap<PillarScore>(data);
  },

  async getFactorScores(filters: DiagnosticsFilters = {}): Promise<FactorScore[]> {
    const { data, error } = await supabase.rpc("get_engagement_factor_scores", rpcArgs(filters));
    if (error) {
      logger.error("Falha ao obter scores por fator", error.message);
      throw error;
    }
    return unwrap<FactorScore>(data);
  },

  async getNps(filters: DiagnosticsFilters = {}): Promise<NpsMetric[]> {
    const { data, error } = await supabase.rpc("get_engagement_nps", rpcArgs(filters));
    if (error) {
      logger.error("Falha ao obter eNPS/LNPS", error.message);
      throw error;
    }
    return unwrap<NpsMetric>(data);
  },

  /**
   * Série histórica de eNPS/LNPS agregada por mês (ou semana).
   * O banco já aplica o mínimo de respondentes por período.
   */
  async getNpsHistory(
    filters: DiagnosticsFilters & { months?: number; bucket?: "month" | "week" } = {},
  ): Promise<NpsHistoryPoint[]> {
    const { data, error } = await supabase.rpc("get_engagement_nps_history", {
      p_department_id: filters.departmentId ?? undefined,
      p_months: Math.min(Math.max(filters.months ?? 12, 1), 36),
      p_bucket: filters.bucket ?? "month",
    });
    if (error) {
      logger.error("Falha ao obter histórico de eNPS/LNPS", error.message);
      throw error;
    }
    return unwrap<NpsHistoryPoint>(data);
  },

  async getCorrelations(days = 180): Promise<PillarCorrelation[]> {
    const { data, error } = await supabase.rpc("get_engagement_pillar_correlations", {
      p_days: days,
    });
    if (error) {
      logger.error("Falha ao obter correlações entre pilares", error.message);
      throw error;
    }
    return unwrap<PillarCorrelation>(data);
  },
};

/** Comparação dos pilares internos com o benchmark de mercado. */
export async function getPillarBenchmark(
  filters: DiagnosticsFilters = {},
  segment: { industry?: string; companySize?: string } = {},
): Promise<PillarBenchmarkRow[]> {
  const { data, error } = await supabase.rpc("get_engagement_pillar_benchmark", {
    p_department_id: filters.departmentId ?? undefined,
    p_days: filters.days ?? 90,
    p_industry: normalizeIndustry(segment.industry),
    p_company_size: normalizeCompanySize(segment.companySize),
  });
  if (error) {
    logger.error("Falha ao obter benchmark de mercado por pilar", error.message);
    throw error;
  }
  return unwrap<PillarBenchmarkRow>(data);
}
