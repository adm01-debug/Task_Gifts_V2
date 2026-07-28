import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { SequenceStep } from "@/lib/sequenceGame";

export interface SequenceProcedure {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  is_active: boolean;
}

export interface SequenceProcedureWithSteps extends SequenceProcedure {
  steps: SequenceStep[];
}

export interface SequenceAttempt {
  id: string;
  procedure_id: string;
  steps_total: number;
  correct_positions: number;
  is_perfect: boolean;
  duration_ms: number;
  coins_awarded: number;
  xp_awarded: number;
  created_at: string;
}

export interface SequenceSubmitResult {
  success: boolean;
  reason?: "unauthenticated" | "not_found" | "empty" | "invalid_order";
  attempt_id?: string;
  steps_total?: number;
  correct_positions?: number;
  is_perfect?: boolean;
  daily_limit_reached?: boolean;
  coins_awarded?: number;
  xp_awarded?: number;
}

export const sequenceGameService = {
  /** Procedimentos ativos disponíveis para jogar. */
  async listProcedures(): Promise<SequenceProcedure[]> {
    const { data, error } = await supabase
      .from("sequence_procedures")
      .select("id, title, description, department_id, is_active")
      .eq("is_active", true)
      .order("title", { ascending: true });

    if (error) {
      logger.error(
        "Falha ao listar procedimentos",
        "sequenceGameService.listProcedures",
        error,
      );
      throw error;
    }
    return (data as SequenceProcedure[]) || [];
  },

  /** Carrega um procedimento com suas etapas já ordenadas. */
  async getProcedure(procedureId: string): Promise<SequenceProcedureWithSteps | null> {
    const { data, error } = await supabase
      .from("sequence_procedures")
      .select(
        "id, title, description, department_id, is_active, sequence_steps(id, label, hint, position)",
      )
      .eq("id", procedureId)
      .maybeSingle();

    if (error) {
      logger.error("Falha ao carregar procedimento", "sequenceGameService.getProcedure", error);
      throw error;
    }
    if (!data) return null;

    const row = data as SequenceProcedure & { sequence_steps?: SequenceStep[] | null };
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      department_id: row.department_id,
      is_active: row.is_active,
      steps: [...(row.sequence_steps || [])].sort((a, b) => a.position - b.position),
    };
  },

  /** Envia a ordem para correção e crédito no servidor. */
  async submit(
    procedureId: string,
    order: string[],
    durationMs: number,
  ): Promise<SequenceSubmitResult> {
    const { data, error } = await supabase.rpc("submit_sequence_attempt", {
      p_procedure_id: procedureId,
      p_order: order,
      p_duration_ms: Math.max(0, Math.round(durationMs)),
    });

    if (error) {
      logger.error("Falha ao enviar sequência", "sequenceGameService.submit", error);
      throw error;
    }
    return (data as unknown as SequenceSubmitResult) ?? { success: false };
  },

  /** Histórico das próprias tentativas (a RLS já restringe ao usuário). */
  async history(limit = 10): Promise<SequenceAttempt[]> {
    const { data, error } = await supabase
      .from("sequence_attempts")
      .select(
        "id, procedure_id, steps_total, correct_positions, is_perfect, duration_ms, coins_awarded, xp_awarded, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(50, Math.max(1, Math.floor(limit))));

    if (error) {
      logger.error("Falha ao carregar histórico", "sequenceGameService.history", error);
      throw error;
    }
    return (data as SequenceAttempt[]) || [];
  },
};