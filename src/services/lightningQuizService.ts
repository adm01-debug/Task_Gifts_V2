import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export type LightningDifficulty = "easy" | "medium" | "hard";

export interface LightningQuestion {
  id: string;
  statement: string;
  category: string;
  difficulty: LightningDifficulty;
}

export interface LightningStartResult {
  success: boolean;
  reason?: "daily_limit" | "no_questions";
  replayed?: boolean;
  session_id?: string;
  deadline_at?: string;
  total?: number;
  index?: number;
  correct_count?: number;
  wrong_count?: number;
  current_streak?: number;
  used?: number;
  limit?: number;
  question?: LightningQuestion | null;
}

export interface LightningAnswerResult {
  success: boolean;
  reason?: "not_found" | "finished" | "expired" | "out_of_order" | "completed" | "race";
  is_correct?: boolean;
  expected?: boolean;
  explanation?: string | null;
  elapsed_ms?: number;
  index?: number;
  total?: number;
  correct_count?: number;
  wrong_count?: number;
  current_streak?: number;
  best_streak?: number;
  completed?: boolean;
  question?: LightningQuestion | null;
}

export interface LightningFinishResult {
  success: boolean;
  reason?: "not_found" | "race";
  replayed?: boolean;
  correct_count?: number;
  wrong_count?: number;
  best_streak?: number;
  coins_awarded?: number;
  xp_awarded?: number;
}

export interface LightningSessionRow {
  id: string;
  status: "active" | "finished";
  correct_count: number;
  wrong_count: number;
  best_streak: number;
  coins_awarded: number;
  xp_awarded: number;
  started_at: string;
  finished_at: string | null;
}

/**
 * Camada de acesso do Verdadeiro/Falso Relâmpago.
 *
 * O gabarito nunca é exposto pela Data API: a tabela de afirmações não concede
 * SELECT ao papel `authenticated` e todo o fluxo (sorteio das perguntas,
 * correção, contagem de tempo e crédito) roda em RPC SECURITY DEFINER.
 */
export const lightningQuizService = {
  async start(): Promise<LightningStartResult> {
    const { data, error } = await supabase.rpc("start_lightning_round");
    if (error) {
      logger.error("Falha ao iniciar rodada relâmpago", "lightningQuizService.start", error);
      throw error;
    }
    return (data as unknown as LightningStartResult) ?? { success: false };
  },

  async answer(sessionId: string, index: number, answer: boolean): Promise<LightningAnswerResult> {
    const { data, error } = await supabase.rpc("answer_lightning_question", {
      p_session_id: sessionId,
      p_idx: index,
      p_answer: answer,
    });
    if (error) {
      logger.error("Falha ao responder pergunta relâmpago", "lightningQuizService.answer", error);
      throw error;
    }
    return (data as unknown as LightningAnswerResult) ?? { success: false };
  },

  async finish(sessionId: string): Promise<LightningFinishResult> {
    const { data, error } = await supabase.rpc("finish_lightning_round", { p_session_id: sessionId });
    if (error) {
      logger.error("Falha ao encerrar rodada relâmpago", "lightningQuizService.finish", error);
      throw error;
    }
    return (data as unknown as LightningFinishResult) ?? { success: false };
  },

  async history(): Promise<LightningSessionRow[]> {
    const { data, error } = await supabase
      .from("lightning_quiz_sessions")
      .select("id, status, correct_count, wrong_count, best_streak, coins_awarded, xp_awarded, started_at, finished_at")
      .eq("status", "finished")
      .order("started_at", { ascending: false })
      .limit(10);

    if (error) {
      logger.error("Falha ao listar histórico relâmpago", "lightningQuizService.history", error);
      throw error;
    }
    return (data as LightningSessionRow[]) || [];
  },
};