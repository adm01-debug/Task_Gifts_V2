import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

/** Meta de aproveitamento persistida. `departmentId === null` = padrão global. */
export interface BossWinRateGoal {
  id: string;
  departmentId: string | null;
  /** Meta 0..1 (o banco guarda 0..100). */
  target: number;
  /** Tolerância em pontos percentuais. */
  tolerancePp: number;
  windowDays: number;
  notes: string | null;
  updatedAt: string;
}

export interface BossWinRateGoalPayload {
  departmentId: string | null;
  /** Meta 0..1. */
  target: number;
  tolerancePp?: number;
  windowDays?: number;
  notes?: string | null;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return value < min ? min : value > max ? max : value;
}

interface GoalRow {
  id: string;
  department_id: string | null;
  target_pct: number | string;
  tolerance_pp: number | string;
  window_days: number;
  notes: string | null;
  updated_at: string;
}

function mapRow(row: GoalRow): BossWinRateGoal {
  return {
    id: row.id,
    departmentId: row.department_id,
    target: clamp(Number(row.target_pct) / 100, 0, 1),
    tolerancePp: clamp(Number(row.tolerance_pp), 0, 100),
    windowDays: clamp(Number(row.window_days), 1, 3650),
    notes: row.notes,
    updatedAt: row.updated_at,
  };
}

export const bossWinRateGoalService = {
  /** Lista todas as metas (global + overrides). Nunca lança para leitura vazia. */
  async list(): Promise<BossWinRateGoal[]> {
    const { data, error } = await supabase
      .from("boss_win_rate_goals")
      .select("id, department_id, target_pct, tolerance_pp, window_days, notes, updated_at");

    if (error) {
      logger.error(`Falha ao carregar metas de aproveitamento: ${error.message}`);
      throw error;
    }
    return ((data as GoalRow[] | null) || []).map(mapRow);
  },

  /** Cria ou atualiza a meta do departamento (ou o padrão global). */
  async save(payload: BossWinRateGoalPayload): Promise<BossWinRateGoal> {
    const { data: auth } = await supabase.auth.getUser();
    const record = {
      department_id: payload.departmentId,
      target_pct: clamp(payload.target * 100, 0, 100),
      tolerance_pp: clamp(payload.tolerancePp ?? 5, 0, 100),
      window_days: Math.trunc(clamp(payload.windowDays ?? 90, 1, 3650)),
      notes: payload.notes ?? null,
      updated_by: auth.user?.id ?? null,
    };

    // O índice parcial impede duplicidade, mas `onConflict` só cobre colunas
    // não nulas: para o padrão global fazemos update explícito.
    let query;
    if (payload.departmentId === null) {
      const existing = await supabase
        .from("boss_win_rate_goals")
        .select("id")
        .is("department_id", null)
        .maybeSingle();
      query = existing.data?.id
        ? supabase.from("boss_win_rate_goals").update(record).eq("id", existing.data.id)
        : supabase.from("boss_win_rate_goals").insert(record);
    } else {
      query = supabase
        .from("boss_win_rate_goals")
        .upsert(record, { onConflict: "department_id" });
    }

    const { data, error } = await query
      .select("id, department_id, target_pct, tolerance_pp, window_days, notes, updated_at")
      .maybeSingle();

    if (error || !data) {
      logger.error(`Falha ao salvar meta de aproveitamento: ${error?.message ?? "sem retorno"}`);
      throw error ?? new Error("Meta não pôde ser salva");
    }
    return mapRow(data as GoalRow);
  },

  /** Remove a meta específica de um departamento (volta ao padrão global). */
  async remove(departmentId: string): Promise<void> {
    const { error } = await supabase
      .from("boss_win_rate_goals")
      .delete()
      .eq("department_id", departmentId);
    if (error) {
      logger.error(`Falha ao remover meta de aproveitamento: ${error.message}`);
      throw error;
    }
  },

  /**
   * Dispara manualmente a varredura de quedas críticas de aproveitamento.
   * A rotina também roda diariamente via agendamento no banco.
   * @returns quantidade de alertas enfileirados.
   */
  async runCriticalAlerts(days: number): Promise<number> {
    const safeDays = Math.trunc(clamp(days, 1, 3650));
    const { data, error } = await supabase.rpc("run_boss_win_rate_alerts", {
      p_days: safeDays,
    });
    if (error) {
      logger.error(`Falha ao disparar alertas de aproveitamento: ${error.message}`);
      throw error;
    }
    return Number(data ?? 0);
  },
};
