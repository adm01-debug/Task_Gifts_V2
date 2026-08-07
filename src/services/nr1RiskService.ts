import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import type { DiagnosticsFilters } from "@/services/engagementDiagnosticsService";

/**
 * Módulo NR-1 / ISO 45003 — gestão de riscos psicossociais.
 *
 * O grau de risco segue a matriz clássica Probabilidade x Severidade:
 *   probabilidade = 10 - score do clima (quanto pior o clima, maior a chance de dano)
 *   severidade    = peso legal/clínico da categoria (1 a 3)
 *   grau          = probabilidade * severidade  (faixa teórica 0 .. 30)
 */

export type Nr1RiskLevel = "critical" | "high" | "moderate" | "low";

export interface Nr1RiskRow {
  category_id: string;
  category_key: string;
  category_name: string;
  description: string | null;
  legal_reference: string | null;
  severity_weight: number;
  score: number | null;
  probability: number | null;
  risk_grade: number | null;
  risk_level: Nr1RiskLevel;
  respondents: number;
  factors_evaluated: number;
}

export interface Nr1Summary {
  categories_evaluated: number;
  critical_count: number;
  high_count: number;
  moderate_count: number;
  low_count: number;
  avg_risk_grade: number | null;
  max_risk_grade: number | null;
}

/** Limiares do grau de risco — espelham exatamente a função SQL get_nr1_risk_matrix. */
export const RISK_THRESHOLDS = { critical: 15, high: 9, moderate: 4.5 } as const;

/** Reprodução determinística da classificação do banco (usada em UI otimista e testes). */
export function riskGrade(score: number | null | undefined, severityWeight: number): number | null {
  if (score === null || score === undefined || !Number.isFinite(score)) return null;
  if (!Number.isFinite(severityWeight) || severityWeight <= 0) return null;
  const clamped = Math.min(Math.max(score, 0), 10);
  return Math.round((10 - clamped) * severityWeight * 100) / 100;
}

export function riskLevel(grade: number | null | undefined): Nr1RiskLevel {
  if (grade === null || grade === undefined || !Number.isFinite(grade)) return "low";
  if (grade >= RISK_THRESHOLDS.critical) return "critical";
  if (grade >= RISK_THRESHOLDS.high) return "high";
  if (grade >= RISK_THRESHOLDS.moderate) return "moderate";
  return "low";
}

export const RISK_LEVEL_LABEL: Record<Nr1RiskLevel, string> = {
  critical: "Crítico",
  high: "Alto",
  moderate: "Moderado",
  low: "Baixo",
};

/** Classes com tokens semânticos — nunca cores hard-coded. */
export const RISK_LEVEL_CLASS: Record<Nr1RiskLevel, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  moderate: "bg-muted text-muted-foreground border-border",
  low: "bg-success/15 text-success border-success/30",
};

/** Prazo legal sugerido para tratativa conforme criticidade (NR-1 item 1.5.4). */
export const RISK_LEVEL_DEADLINE_DAYS: Record<Nr1RiskLevel, number | null> = {
  critical: 30,
  high: 60,
  moderate: 90,
  low: null,
};

/** Um plano de ação é legalmente exigível a partir do nível alto. */
export function requiresActionPlan(level: Nr1RiskLevel): boolean {
  return level === "critical" || level === "high";
}

function rpcArgs(filters: DiagnosticsFilters) {
  return { p_department_id: filters.departmentId ?? undefined, p_days: filters.days ?? 90 };
}

function unwrap<T>(data: unknown): T[] {
  return (Array.isArray(data) ? data : []) as T[];
}

export const nr1RiskService = {
  async getRiskMatrix(filters: DiagnosticsFilters = {}): Promise<Nr1RiskRow[]> {
    const { data, error } = await supabase.rpc("get_nr1_risk_matrix", rpcArgs(filters));
    if (error) {
      logger.error("Falha ao obter matriz de riscos psicossociais", error.message);
      throw error;
    }
    return unwrap<Nr1RiskRow>(data);
  },

  async getSummary(filters: DiagnosticsFilters = {}): Promise<Nr1Summary | null> {
    const { data, error } = await supabase.rpc("get_nr1_summary", rpcArgs(filters));
    if (error) {
      logger.error("Falha ao obter resumo NR-1", error.message);
      throw error;
    }
    return unwrap<Nr1Summary>(data)[0] ?? null;
  },
};

/** Prazo (em dias) efetivamente aplicado ao plano de tratativa gerado pelo banco. */
export function nr1PlanDeadlineDays(level: Nr1RiskLevel): number {
  return level === "critical" ? 30 : level === "high" ? 60 : 90;
}

/** Meta de score do plano — espelha LEAST(10, score + 1.5) da RPC. */
export function nr1PlanTargetScore(score: number | null | undefined): number {
  const base = Number.isFinite(score as number) ? (score as number) : 5;
  return Math.min(10, Math.round((base + 1.5) * 100) / 100);
}

export interface GenerateNr1PlanInput {
  categoryKey: string;
  departmentId?: string | null;
  days?: number;
}

/** Gera (ou reaproveita) o plano 5W2H de tratativa de uma categoria de risco NR-1. */
export async function generateActionPlanFromNr1Category({
  categoryKey,
  departmentId = null,
  days = 90,
}: GenerateNr1PlanInput): Promise<string> {
  if (!categoryKey.trim()) throw new Error("Categoria de risco inválida.");

  const { data, error } = await supabase.rpc("generate_action_plan_from_nr1_category", {
    p_category_key: categoryKey,
    p_department_id: departmentId ?? undefined,
    p_days: days,
  });

  if (error) {
    logger.error("Falha ao gerar plano de tratativa NR-1", error.message);
    throw error;
  }
  if (typeof data !== "string" || data.length === 0) {
    throw new Error("O plano de tratativa não pôde ser criado.");
  }
  return data;
}
