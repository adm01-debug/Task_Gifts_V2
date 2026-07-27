import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeSafe } from "@/lib/requestId";
import type { RiskFactor, RiskLevel } from "@/lib/purchaseRisk";

export type ApprovalAction =
  | "requested"
  | "ai_review"
  | "approve"
  | "first_approval"
  | "reject"
  | "deliver"
  | "cancel"
  | "reopen";

export interface PurchaseApprovalEntry {
  id: string;
  purchase_id: string;
  actor_id: string | null;
  action: ApprovalAction;
  from_status: string | null;
  to_status: string | null;
  reason: string | null;
  risk_snapshot: Record<string, unknown>;
  created_at: string;
  actor_name?: string | null;
}

export interface RiskAnalysisResult {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
  summary: string;
  recommendation: "approve" | "review" | "reject";
  requires_dual_approval: boolean;
  ai_available: boolean;
}

export interface ReviewResult {
  status: string;
  awaiting_second_approval: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export const purchaseGovernanceService = {
  /** Trilha auditável completa de um resgate, do mais recente ao mais antigo. */
  async getTrail(purchaseId: string): Promise<PurchaseApprovalEntry[]> {
    const { data, error } = await supabase
      .from("purchase_approvals")
      .select("*")
      .eq("purchase_id", purchaseId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    const entries = (data || []).map((row) => ({
      ...row,
      risk_snapshot: asRecord(row.risk_snapshot),
    })) as PurchaseApprovalEntry[];

    const actorIds = Array.from(
      new Set(entries.map((e) => e.actor_id).filter((id): id is string => Boolean(id)))
    );
    if (actorIds.length === 0) return entries;

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);

    const nameById = new Map((profiles || []).map((p) => [p.id, p.display_name]));
    return entries.map((e) => ({
      ...e,
      actor_name: e.actor_id ? nameById.get(e.actor_id) ?? null : null,
    }));
  },

  /** Dispara a análise de risco por IA (server-side, service role). */
  async analyzeRisk(purchaseId: string): Promise<RiskAnalysisResult> {
    const { data, error } = await invokeEdgeSafe<RiskAnalysisResult & { error?: string }>(
      "reward-approval-review",
      { body: { purchase_id: purchaseId } },
    );

    if (error) throw new Error(error.message);
    const result = data;
    if (!result || typeof result !== "object") {
      throw new Error("Resposta inválida do serviço de análise de risco.");
    }
    if (result?.error) throw new Error(result.error);
    return result;
  },

  /**
   * Executa uma decisão de governança. Toda a validação (papel, máquina de
   * estados, dupla aprovação, estorno de moedas/estoque) acontece no banco.
   */
  async review(
    purchaseId: string,
    action: "approve" | "reject" | "deliver" | "cancel",
    reason?: string
  ): Promise<ReviewResult> {
    const { data, error } = await supabase.rpc("review_purchase", {
      p_purchase_id: purchaseId,
      p_action: action,
      p_reason: reason?.trim() ? reason.trim() : undefined,
    });

    if (error) throw new Error(error.message);
    const payload = asRecord(data);
    return {
      status: String(payload.status ?? "pending"),
      awaiting_second_approval: payload.awaiting_second_approval === true,
    };
  },
};