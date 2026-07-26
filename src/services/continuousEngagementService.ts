import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import type { ClimatePillar } from "@/services/climateSurveyService";

/** Formatos lúdicos de resposta suportados pelo motor de pesquisa contínua. */
export type EngagementAnswerFormat =
  | "slider"
  | "stars"
  | "emoji"
  | "cards"
  | "checkbox"
  | "percentage"
  | "text";

export interface EngagementCycle {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  questions_per_user: number;
  status: "scheduled" | "active" | "closed";
  department_id: string | null;
}

export interface EngagementAssignment {
  assignment_id: string;
  question_id: string;
  code: string;
  question_text: string;
  helper_text: string | null;
  pillar: ClimatePillar;
  factor_id: string | null;
  answer_format: EngagementAnswerFormat;
  options: string[];
  order_index: number;
  answered_at: string | null;
}

export interface EngagementProgress {
  total: number;
  answered: number;
  pending: number;
}

export interface SubmitAnswerInput {
  cycleId: string;
  questionId: string;
  /** Valor bruto conforme o formato (número, string ou booleano). */
  rawValue: unknown;
  /** Nota normalizada de 0 a 10. Nulo para respostas puramente textuais. */
  normalizedScore: number | null;
  textAnswer?: string | null;
}

/** Normaliza o valor bruto de cada formato para a escala comum de 0 a 10. */
export function normalizeAnswer(
  format: EngagementAnswerFormat,
  value: unknown,
  optionCount = 5,
): number | null {
  switch (format) {
    case "slider":
      return typeof value === "number" ? clamp(value, 0, 10) : null;
    case "stars":
      return typeof value === "number" ? clamp((value / 5) * 10, 0, 10) : null;
    case "emoji":
      return typeof value === "number" ? clamp(((value - 1) / 4) * 10, 0, 10) : null;
    case "percentage":
      return typeof value === "number" ? clamp(value / 10, 0, 10) : null;
    case "cards": {
      if (typeof value !== "number" || optionCount <= 1) return null;
      return clamp((value / (optionCount - 1)) * 10, 0, 10);
    }
    case "checkbox":
      return typeof value === "boolean" ? (value ? 10 : 0) : null;
    case "text":
      return null;
    default:
      return null;
  }
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min;
  return Math.min(Math.max(v, min), max);
}

/** Aplica inversão para perguntas reversas (ex.: "sinto esgotamento"). */
export function applyReverse(score: number | null, isReverse: boolean): number | null {
  if (score === null) return null;
  return isReverse ? 10 - score : score;
}

export const continuousEngagementService = {
  async getActiveCycle(): Promise<EngagementCycle | null> {
    const { data, error } = await supabase.rpc("get_active_engagement_cycle");
    if (error) {
      logger.error("Falha ao buscar ciclo de engajamento ativo", error);
      throw error;
    }
    const row = Array.isArray(data) ? data[0] : data;
    return (row as EngagementCycle) ?? null;
  },

  async getMyQuestions(cycleId?: string): Promise<EngagementAssignment[]> {
    const { data, error } = await supabase.rpc("assign_engagement_questions", {
      p_cycle_id: cycleId ?? null,
    });
    if (error) {
      logger.error("Falha ao distribuir perguntas de engajamento", error);
      throw error;
    }
    return ((data ?? []) as unknown as EngagementAssignment[]).map((row) => ({
      ...row,
      options: Array.isArray(row.options) ? row.options : [],
    }));
  },

  async getProgress(cycleId: string): Promise<EngagementProgress> {
    const { data, error } = await supabase.rpc("get_engagement_cycle_progress", {
      p_cycle_id: cycleId,
    });
    if (error) {
      logger.error("Falha ao obter progresso do ciclo", error);
      throw error;
    }
    const row = (Array.isArray(data) ? data[0] : data) as EngagementProgress | undefined;
    return row ?? { total: 0, answered: 0, pending: 0 };
  },

  async submitAnswer(input: SubmitAnswerInput): Promise<string> {
    const { data, error } = await supabase.rpc("submit_engagement_answer", {
      p_cycle_id: input.cycleId,
      p_question_id: input.questionId,
      p_raw_value: JSON.parse(JSON.stringify({ value: input.rawValue ?? null })),
      p_normalized_score: input.normalizedScore,
      p_text_answer: input.textAnswer ?? null,
    });
    if (error) {
      logger.error("Falha ao registrar resposta de engajamento", error);
      throw error;
    }
    return data as unknown as string;
  },
};