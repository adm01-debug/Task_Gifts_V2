import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { WagerAnomalyCode } from "@/lib/wagerIntegrity";
import type { WagerLeaderboardWindow } from "@/lib/wagerLeaderboard";
import type { WagerReviewStatus } from "./wagerIntegrityReviewService";

/**
 * Trilha imutável de mudanças de desfecho das apurações antifraude.
 * A escrita é feita exclusivamente por trigger no banco; o cliente só lê.
 */
export interface WagerIntegrityReviewEvent {
  id: string;
  targetUserId: string;
  anomalyCode: WagerAnomalyCode;
  windowDays: WagerLeaderboardWindow;
  previousStatus: WagerReviewStatus | null;
  newStatus: WagerReviewStatus;
  notes: string | null;
  changedBy: string | null;
  changedByName: string | null;
  createdAt: string;
}

const VALID_STATUS: readonly WagerReviewStatus[] = [
  "investigating",
  "confirmed",
  "false_positive",
];

function normalizeWindow(value: unknown): WagerLeaderboardWindow {
  const n = Math.trunc(Number(value));
  return n === 7 || n === 90 ? n : 30;
}

function asStatus(value: unknown): WagerReviewStatus | null {
  return VALID_STATUS.includes(value as WagerReviewStatus)
    ? (value as WagerReviewStatus)
    : null;
}

export const wagerIntegrityReviewEventService = {
  /** Histórico do período, do mais recente para o mais antigo. */
  async list(
    windowDays: WagerLeaderboardWindow,
    limit = 200,
  ): Promise<WagerIntegrityReviewEvent[]> {
    const { data, error } = await supabase
      .from("wager_integrity_review_events")
      .select(
        "id, target_user_id, anomaly_code, window_days, previous_status, new_status, notes, changed_by, created_at",
      )
      .eq("window_days", windowDays)
      .order("created_at", { ascending: false })
      .limit(Math.min(Math.max(1, Math.trunc(limit)), 500));

    if (error) {
      logger.error("wagerIntegrityReviewEventService.list", error.message);
      throw error;
    }

    const rows = (data || []) as Array<Record<string, unknown>>;

    // Resolve nomes em uma única consulta; falha aqui não invalida o histórico.
    const ids = Array.from(
      new Set(
        rows
          .map((row) => (typeof row.changed_by === "string" ? row.changed_by : ""))
          .filter((id): id is string => id.length > 0),
      ),
    );
    const names = new Map<string, string>();
    if (ids.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", ids);
      if (profileError) {
        logger.warn("Falha ao resolver autores do histórico", "wagerIntegrityReviewEventService", profileError.message);
      }
      for (const profile of profiles || []) {
        const record = profile as Record<string, unknown>;
        if (typeof record.id === "string" && typeof record.display_name === "string") {
          names.set(record.id, record.display_name);
        }
      }
    }

    const events: WagerIntegrityReviewEvent[] = [];
    for (const row of rows) {
      const newStatus = asStatus(row.new_status);
      const id = typeof row.id === "string" ? row.id : "";
      const targetUserId = typeof row.target_user_id === "string" ? row.target_user_id : "";
      if (!id || !targetUserId || !newStatus) continue;

      const changedBy = typeof row.changed_by === "string" ? row.changed_by : null;
      events.push({
        id,
        targetUserId,
        anomalyCode: row.anomaly_code as WagerAnomalyCode,
        windowDays: normalizeWindow(row.window_days),
        previousStatus: asStatus(row.previous_status),
        newStatus,
        notes: typeof row.notes === "string" && row.notes.trim() ? row.notes.trim() : null,
        changedBy,
        changedByName: changedBy ? names.get(changedBy) ?? null : null,
        createdAt: typeof row.created_at === "string" ? row.created_at : "",
      });
    }
    return events;
  },
};