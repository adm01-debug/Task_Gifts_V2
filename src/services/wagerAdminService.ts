import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import {
  clampMaxStake,
  clampMultiplier,
  normalizeText,
  validateWagerDraft,
  type WagerOptionDraft,
  type WagerQuestionDraft,
} from "@/lib/wagerAuthoring";

export interface AdminWagerQuestion {
  id: string;
  question: string;
  options: WagerOptionDraft[];
  correctOption: string;
  explanation: string | null;
  difficulty: "easy" | "medium" | "hard";
  multiplier: number;
  maxStake: number;
  scheduledDate: string;
  isActive: boolean;
  totalEntries: number;
  correctEntries: number;
  totalStaked: number;
  coinsDelta: number;
}

export interface WagerSaveResponse {
  success: boolean;
  reason?: string;
  id?: string;
  /** Pergunta já respondida: apenas explicação/ativação foram alteradas. */
  locked?: boolean;
  entries?: number;
}

export interface WagerBulkSaveResult {
  saved: number;
  failures: Array<{ date: string; reason: string }>;
}

function toInt(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseOptions(raw: unknown): WagerOptionDraft[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: WagerOptionDraft[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const id = normalizeText(String(record.id ?? ""));
    const label = normalizeText(String(record.label ?? "")) || id;
    if (!id || !label || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, label });
  }
  return out;
}

function parseQuestion(raw: unknown): AdminWagerQuestion | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const id = normalizeText(String(q.id ?? ""));
  if (!id) return null;
  const difficulty = String(q.difficulty ?? "medium");
  return {
    id,
    question: normalizeText(String(q.question ?? "")),
    options: parseOptions(q.options),
    correctOption: normalizeText(String(q.correct_option ?? "")),
    explanation: normalizeText(String(q.explanation ?? "")) || null,
    difficulty: (["easy", "medium", "hard"].includes(difficulty) ? difficulty : "medium") as
      | "easy"
      | "medium"
      | "hard",
    multiplier: clampMultiplier(Number(q.base_multiplier)),
    maxStake: clampMaxStake(toInt(q.max_stake, 100)),
    scheduledDate: String(q.scheduled_date ?? "").slice(0, 10),
    isActive: q.is_active === true,
    totalEntries: Math.max(0, toInt(q.total_entries, 0)),
    correctEntries: Math.max(0, toInt(q.correct_entries, 0)),
    totalStaked: Math.max(0, toInt(q.total_staked, 0)),
    coinsDelta: toInt(q.coins_delta, 0),
  };
}

export const wagerAdminService = {
  /** Agenda das perguntas no intervalo, com estatísticas de participação. */
  async list(from?: string, to?: string): Promise<AdminWagerQuestion[]> {
    const { data, error } = await supabase.rpc("list_wager_questions", {
      p_from: from ?? undefined,
      p_to: to ?? undefined,
    });
    if (error) {
      logger.error("Falha ao listar perguntas do dia", "wagerAdminService.list", error);
      throw error;
    }
    const payload = (data ?? {}) as Record<string, unknown>;
    if (payload.success !== true) {
      throw new Error(String(payload.reason ?? "unknown_error"));
    }
    const rows = Array.isArray(payload.questions) ? payload.questions : [];
    return rows.map(parseQuestion).filter((q): q is AdminWagerQuestion => q !== null);
  },

  /** Persiste o rascunho. A validação final continua sendo do banco. */
  async save(draft: WagerQuestionDraft): Promise<WagerSaveResponse> {
    const validation = validateWagerDraft(draft);
    if (!validation.valid) {
      return { success: false, reason: validation.issues[0]?.message ?? "invalid_draft" };
    }

    const { data, error } = await supabase.rpc("save_wager_question", {
      p_question: normalizeText(draft.question),
      p_options: validation.normalizedOptions as unknown as never,
      p_correct_option: normalizeText(draft.correctOption),
      p_scheduled_date: draft.scheduledDate,
      p_id: draft.id ?? undefined,
      p_explanation: normalizeText(draft.explanation ?? "") || undefined,
      p_difficulty: draft.difficulty,
      p_multiplier: clampMultiplier(draft.multiplier),
      p_max_stake: clampMaxStake(draft.maxStake),
      p_is_active: draft.isActive,
    });

    if (error) {
      logger.error("Falha ao salvar pergunta do dia", "wagerAdminService.save", error);
      throw error;
    }
    return (data as unknown as WagerSaveResponse) ?? { success: false };
  },

  /**
   * Importação em lote: salva sequencialmente para não estourar o rate limit
   * e para que uma linha inválida não derrube as demais.
   */
  async saveMany(drafts: WagerQuestionDraft[]): Promise<WagerBulkSaveResult> {
    const result: WagerBulkSaveResult = { saved: 0, failures: [] };
    for (const draft of drafts) {
      try {
        const response = await wagerAdminService.save(draft);
        if (response.success) {
          result.saved += 1;
        } else {
          result.failures.push({ date: draft.scheduledDate, reason: response.reason ?? "unknown_error" });
        }
      } catch (err: unknown) {
        result.failures.push({
          date: draft.scheduledDate,
          reason: err instanceof Error ? err.message : "unknown_error",
        });
      }
    }
    return result;
  },

  /** Só remove perguntas sem apostas (histórico financeiro é intocável). */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("wager_questions").delete().eq("id", id);
    if (error) {
      logger.error("Falha ao remover pergunta do dia", "wagerAdminService.remove", error);
      throw error;
    }
  },
};