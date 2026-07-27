import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import { normalizeWarDraft, reviewWarDraft, type WarConfigDraft } from "@/lib/departmentWarConfig";
import type { DepartmentWarStatus } from "./departmentWarService";

/**
 * Operacoes administrativas da Guerra de Departamentos.
 *
 * Defesa em camadas:
 *   1. `reviewWarDraft` (aqui e na UI) bloqueia configuracao invalida.
 *   2. RLS "Admins gerenciam guerras" bloqueia quem nao e admin.
 *   3. Trigger `validate_department_war` e os CHECKs sao a ultima palavra.
 */

export interface WarDepartmentOption {
  id: string;
  name: string;
  headcount: number;
}

export interface CreateWarResult {
  success: boolean;
  war_id?: string;
  reason?: string;
}

/** Traduz erro do Postgres para mensagem util ao gestor. */
function describeError(error: unknown): string {
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  if (/row-level security|permission denied/i.test(message)) {
    return "Apenas administradores podem gerenciar guerras.";
  }
  return message || "Erro inesperado ao salvar a guerra.";
}

export const departmentWarAdminService = {
  /** Departamentos disponiveis com efetivo real calculado no banco. */
  async departmentOptions(): Promise<WarDepartmentOption[]> {
    const { data, error } = await supabase
      .from("departments")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      logger.error(
        "Falha ao listar departamentos para a guerra",
        "departmentWarAdminService.departmentOptions",
        error,
      );
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name ?? "",
      headcount: 0,
    }));
  },

  /**
   * Cria a guerra em rascunho com metricas e departamentos.
   * Nao ha transacao multi-tabela no PostgREST: se um passo falhar apos criar a
   * guerra, removemos o rascunho para nao deixar registro orfao.
   */
  async create(draft: Partial<WarConfigDraft>): Promise<CreateWarResult> {
    const review = reviewWarDraft(draft);
    if (!review.valid) {
      return {
        success: false,
        reason: review.issues.find((i) => i.level === "error")?.message,
      };
    }
    const config = review.normalized;

    const { data: warRow, error: warError } = await supabase
      .from("department_wars")
      .insert({
        title: config.title,
        description: config.description || null,
        status: "draft",
        starts_at: config.starts_at,
        ends_at: config.ends_at,
        fairness_alpha: config.fairness_alpha,
        per_user_cap: config.per_user_cap,
        participation_bonus: config.participation_bonus,
        coins_pool: config.coins_pool,
        xp_pool: config.xp_pool,
        placement_shares: config.placement_shares,
        per_member_coins_cap: config.per_member_coins_cap,
      })
      .select("id")
      .maybeSingle();

    if (warError || !warRow) {
      logger.error("Falha ao criar guerra", "departmentWarAdminService.create", warError);
      return { success: false, reason: describeError(warError) };
    }

    const warId = warRow.id;

    try {
      if (config.metrics.length > 0) {
        const { error } = await supabase.from("department_war_metrics").insert(
          config.metrics.map((metric) => ({
            war_id: warId,
            metric_key: metric.metric_key,
            label: metric.label,
            weight: metric.weight,
          })),
        );
        if (error) throw error;
      }

      const { error: deptError } = await supabase.from("department_war_departments").insert(
        config.departments.map((dept) => ({
          war_id: warId,
          department_id: dept.department_id,
          headcount: dept.headcount,
        })),
      );
      if (deptError) throw deptError;

      // Efetivo real vem do banco, nunca do que o gestor digitou.
      await supabase.rpc("sync_department_war_headcount", { p_war_id: warId });

      return { success: true, war_id: warId };
    } catch (err: unknown) {
      logger.error(
        "Falha ao montar a guerra; revertendo rascunho",
        "departmentWarAdminService.create",
        err,
      );
      await supabase.from("department_wars").delete().eq("id", warId);
      return { success: false, reason: describeError(err) };
    }
  },

  /** Atualiza configuracao de uma guerra ainda nao encerrada. */
  async update(warId: string, draft: Partial<WarConfigDraft>): Promise<CreateWarResult> {
    const review = reviewWarDraft(draft);
    if (!review.valid) {
      return {
        success: false,
        reason: review.issues.find((i) => i.level === "error")?.message,
      };
    }
    const config = review.normalized;

    const { error } = await supabase
      .from("department_wars")
      .update({
        title: config.title,
        description: config.description || null,
        starts_at: config.starts_at,
        ends_at: config.ends_at,
        fairness_alpha: config.fairness_alpha,
        per_user_cap: config.per_user_cap,
        participation_bonus: config.participation_bonus,
        coins_pool: config.coins_pool,
        xp_pool: config.xp_pool,
        placement_shares: config.placement_shares,
        per_member_coins_cap: config.per_member_coins_cap,
      })
      .eq("id", warId);

    if (error) {
      logger.error("Falha ao atualizar guerra", "departmentWarAdminService.update", error);
      return { success: false, reason: describeError(error) };
    }
    return { success: true, war_id: warId };
  },

  /** Transicao de status; o trigger do banco recusa caminhos invalidos. */
  async setStatus(
    warId: string,
    status: Extract<DepartmentWarStatus, "running" | "cancelled">,
  ): Promise<CreateWarResult> {
    const { error } = await supabase
      .from("department_wars")
      .update({ status })
      .eq("id", warId);

    if (error) {
      logger.error("Falha ao alterar status da guerra", "departmentWarAdminService.setStatus", error);
      return { success: false, reason: describeError(error) };
    }
    return { success: true, war_id: warId };
  },

  /** Rascunho pronto para edicao a partir de uma guerra existente. */
  buildDraftFrom(
    war: {
      title: string;
      description: string | null;
      starts_at: string;
      ends_at: string;
      fairness_alpha: number;
      per_user_cap: number;
      participation_bonus: number;
      coins_pool: number;
      xp_pool: number;
      placement_shares: number[];
      per_member_coins_cap: number;
    },
    metrics: { metric_key: string; label: string; weight: number }[],
    departments: { department_id: string; name: string; headcount: number }[],
  ): WarConfigDraft {
    return normalizeWarDraft({
      ...war,
      description: war.description ?? "",
      metrics,
      departments,
    });
  },
};
