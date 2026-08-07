import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";

export interface GenerateActionPlanInput {
  /** Chave do fator de engajamento (ex.: "feedback_lider"). */
  factorKey: string;
  /** Departamento do recorte; null representa toda a empresa. */
  departmentId?: string | null;
  /** Janela de análise em dias usada para calcular o score inicial. */
  days?: number;
}

/**
 * Gera (ou recupera, quando já existe um plano vivo) o plano de ação 5W2H
 * derivado de um fator crítico do diagnóstico de engajamento.
 *
 * A autorização é feita no banco: apenas admin/manager conseguem executar a RPC.
 */
export const actionPlanGeneratorService = {
  async generateFromFactor({
    factorKey,
    departmentId = null,
    days = 90,
  }: GenerateActionPlanInput): Promise<string> {
    if (!factorKey.trim()) {
      throw new Error("Fator de engajamento inválido.");
    }

    const { data, error } = await supabase.rpc("generate_action_plan_from_factor", {
      p_factor_key: factorKey,
      p_department_id: departmentId ?? undefined,
      p_days: days,
    });

    if (error) {
      logger.error("Falha ao gerar plano de ação a partir do fator", error.message);
      throw error;
    }

    if (typeof data !== "string" || data.length === 0) {
      throw new Error("O plano de ação não pôde ser criado.");
    }

    return data;
  },
};
