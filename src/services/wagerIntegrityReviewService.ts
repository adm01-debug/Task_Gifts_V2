import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { WagerAnomalyCode } from "@/lib/wagerIntegrity";
import type { WagerLeaderboardWindow } from "@/lib/wagerLeaderboard";

export type WagerReviewStatus = "investigating" | "confirmed" | "false_positive";

export interface WagerIntegrityReview {
  id: string;
  targetUserId: string;
  anomalyCode: WagerAnomalyCode;
  windowDays: WagerLeaderboardWindow;
  status: WagerReviewStatus;
  notes: string | null;
  metric: number;
  updatedAt: string | null;
}

const VALID_STATUS: readonly WagerReviewStatus[] = [
  "investigating",
  "confirmed",
  "false_positive",
];

const VALID_CODES: readonly WagerAnomalyCode[] = [
  "accuracy_outlier",
  "perfect_streak",
  "net_drain",
  "volume_spike",
  "stale_activity",
];

/** Chave estável usada para casar anomalia detectada com apuração salva. */
export function reviewKey(
  targetUserId: string,
  anomalyCode: string,
  windowDays: number,
): string {
  return `${targetUserId}:${anomalyCode}:${windowDays}`;
}

function normalizeWindow(value: unknown): WagerLeaderboardWindow {
  const n = Math.trunc(Number(value));
  return n === 7 || n === 90 ? n : 30;
}

function normalizeRow(raw: Record<string, unknown>): WagerIntegrityReview | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  const targetUserId = typeof raw.target_user_id === "string" ? raw.target_user_id : "";
  const anomalyCode = raw.anomaly_code as WagerAnomalyCode;
  if (!id || !targetUserId || !VALID_CODES.includes(anomalyCode)) return null;

  const status = raw.status as WagerReviewStatus;
  const metric = Number(raw.metric);

  return {
    id,
    targetUserId,
    anomalyCode,
    windowDays: normalizeWindow(raw.window_days),
    status: VALID_STATUS.includes(status) ? status : "investigating",
    notes: typeof raw.notes === "string" && raw.notes.trim() ? raw.notes.trim() : null,
    metric: Number.isFinite(metric) ? metric : 0,
    updatedAt: typeof raw.updated_at === "string" ? raw.updated_at : null,
  };
}

export const wagerIntegrityReviewService = {
  /** Lista as apurações registradas para o período informado. */
  async list(windowDays: WagerLeaderboardWindow): Promise<WagerIntegrityReview[]> {
    const { data, error } = await supabase
      .from("wager_integrity_reviews")
      .select("id, target_user_id, anomaly_code, window_days, status, notes, metric, updated_at")
      .eq("window_days", windowDays)
      .order("updated_at", { ascending: false });

    if (error) {
      logger.error("wagerIntegrityReviewService.list", error.message);
      throw error;
    }

    return (data || [])
      .map((row) => normalizeRow(row as Record<string, unknown>))
      .filter((row): row is WagerIntegrityReview => row !== null);
  },

  /** Cria ou atualiza a apuração de uma anomalia (somente administradores). */
  async upsert(input: {
    targetUserId: string;
    anomalyCode: WagerAnomalyCode;
    windowDays: WagerLeaderboardWindow;
    status: WagerReviewStatus;
    notes?: string | null;
    metric?: number;
  }): Promise<WagerIntegrityReview> {
    const { data: auth } = await supabase.auth.getUser();
    const reviewerId = auth?.user?.id ?? null;
    if (!reviewerId) throw new Error("Sessão expirada. Entre novamente para registrar a apuração.");

    const notes = (input.notes ?? "").trim().slice(0, 2000);
    const metric = Number(input.metric);

    const { data, error } = await supabase
      .from("wager_integrity_reviews")
      .upsert(
        {
          target_user_id: input.targetUserId,
          anomaly_code: input.anomalyCode,
          window_days: input.windowDays,
          status: VALID_STATUS.includes(input.status) ? input.status : "investigating",
          notes: notes ? notes : null,
          metric: Number.isFinite(metric) ? metric : 0,
          reviewed_by: reviewerId,
        },
        { onConflict: "target_user_id,anomaly_code,window_days" },
      )
      .select("id, target_user_id, anomaly_code, window_days, status, notes, metric, updated_at")
      .maybeSingle();

    if (error) {
      logger.error("wagerIntegrityReviewService.upsert", error.message);
      throw error;
    }

    const normalized = data ? normalizeRow(data as Record<string, unknown>) : null;
    if (!normalized) throw new Error("Não foi possível registrar a apuração.");
    return normalized;
  },
};