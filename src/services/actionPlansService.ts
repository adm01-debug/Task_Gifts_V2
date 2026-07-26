import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/services/loggingService";
import type { ClimatePillar } from "@/services/climateSurveyService";

export type ActionPlanStatus = "planning" | "active" | "paused" | "completed" | "cancelled";
export type ActionItemStatus = "pending" | "in_progress" | "completed" | "cancelled" | "blocked";
export type ActionItemPriority = "low" | "medium" | "high" | "critical";

export interface ActionPlan {
  id: string;
  title: string;
  description: string | null;
  pillar: ClimatePillar | null;
  status: ActionPlanStatus;
  source: string;
  initial_score: number | null;
  target_score: number | null;
  current_score: number | null;
  progress_percent: number;
  target_date: string;
  department_id: string | null;
  root_cause_summary: string | null;
  created_at: string;
}

export interface ActionPlanItem {
  id: string;
  plan_id: string;
  what_title: string;
  what_description: string | null;
  why_reason: string | null;
  when_start: string | null;
  when_end: string | null;
  how_method: string | null;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  progress_percent: number;
  order_index: number;
}

/** Evita o parsing type-level das strings de select (custo de compilação). */
const sel = (value: string): string => value;

export const PLAN_STATUS_LABEL: Record<ActionPlanStatus, string> = {
  planning: "Planejamento",
  active: "Em execução",
  paused: "Pausado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export const ITEM_STATUS_LABEL: Record<ActionItemStatus, string> = {
  pending: "Pendente",
  in_progress: "Em andamento",
  completed: "Concluída",
  cancelled: "Cancelada",
  blocked: "Bloqueada",
};

export const PRIORITY_LABEL: Record<ActionItemPriority, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

/** Classes semânticas — nunca cores hard-coded. */
export const PRIORITY_CLASS: Record<ActionItemPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  medium: "bg-primary/10 text-primary border-primary/30",
  high: "bg-warning/15 text-warning border-warning/30",
  critical: "bg-destructive/15 text-destructive border-destructive/30",
};

export const actionPlansService = {
  async list(status?: ActionPlanStatus | "all"): Promise<ActionPlan[]> {
    let query = supabase
      .from("action_plans")
      .select(
        sel(
          "id, title, description, pillar, status, source, initial_score, target_score, current_score, progress_percent, target_date, department_id, root_cause_summary, created_at",
        ),
      )
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query.returns<ActionPlan[]>();
    if (error) {
      logger.error("Falha ao listar planos de ação", error.message);
      throw error;
    }
    return data ?? [];
  },

  async listItems(planId: string): Promise<ActionPlanItem[]> {
    const { data, error } = await supabase
      .from("action_plan_items")
      .select(
        sel(
          "id, plan_id, what_title, what_description, why_reason, when_start, when_end, how_method, status, priority, progress_percent, order_index",
        ),
      )
      .eq("plan_id", planId)
      .order("order_index", { ascending: true })
      .returns<ActionPlanItem[]>();

    if (error) {
      logger.error("Falha ao carregar ações do plano", error.message);
      throw error;
    }
    return data ?? [];
  },

  async updateItemStatus(itemId: string, status: ActionItemStatus): Promise<void> {
    const { error } = await supabase
      .from("action_plan_items")
      .update({
        status,
        progress_percent: status === "completed" ? 100 : status === "in_progress" ? 50 : 0,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", itemId);

    if (error) {
      logger.error("Falha ao atualizar ação do plano", error.message);
      throw error;
    }
  },

  async updatePlanStatus(planId: string, status: ActionPlanStatus): Promise<void> {
    const { error } = await supabase
      .from("action_plans")
      .update({
        status,
        completed_at: status === "completed" ? new Date().toISOString() : null,
      })
      .eq("id", planId);

    if (error) {
      logger.error("Falha ao atualizar plano de ação", error.message);
      throw error;
    }
  },
};
