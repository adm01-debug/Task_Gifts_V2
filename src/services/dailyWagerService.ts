import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import { parseDailyWager, type DailyWagerState } from "@/lib/dailyWager";
import {
  parseWagerLeaderboard,
  type WagerLeaderboardRow,
  type WagerLeaderboardWindow,
} from "@/lib/wagerLeaderboard";

export interface WagerSubmitResult {
  success: boolean;
  reason?: string;
  entry_id?: string;
  is_correct?: boolean;
  stake_coins?: number;
  multiplier?: number;
  coins_delta?: number;
  xp_awarded?: number;
  balance?: number;
  correct_option?: string | null;
  explanation?: string | null;
  max_stake?: number;
}

export interface WagerHistoryRow {
  id: string;
  stake_coins: number;
  chosen_option: string;
  is_correct: boolean;
  coins_delta: number;
  xp_awarded: number;
  created_at: string;
  wager_questions: { question: string; scheduled_date: string } | null;
}

export const dailyWagerService = {
  /** Pergunta do dia + aposta do usuário + saldo, tudo resolvido no servidor. */
  async getToday(): Promise<DailyWagerState> {
    const { data, error } = await supabase.rpc("get_daily_wager");
    if (error) {
      logger.error("Falha ao carregar pergunta do dia", "dailyWagerService.getToday", error);
      throw error;
    }
    return parseDailyWager(data);
  },

  /** Registra a aposta. Validações finais (saldo, limite, duplicidade) são do banco. */
  async submit(questionId: string, optionId: string, stake: number): Promise<WagerSubmitResult> {
    const { data, error } = await supabase.rpc("submit_daily_wager", {
      p_question_id: questionId,
      p_option: optionId,
      p_stake: Math.max(1, Math.trunc(stake)),
    });
    if (error) {
      logger.error("Falha ao registrar aposta", "dailyWagerService.submit", error);
      throw error;
    }
    return (data as unknown as WagerSubmitResult) ?? { success: false };
  },

  /** Histórico pessoal (a RLS já restringe às próprias apostas). */
  async history(limit = 10): Promise<WagerHistoryRow[]> {
    const { data, error } = await supabase
      .from("wager_entries")
      .select(
        "id, stake_coins, chosen_option, is_correct, coins_delta, xp_awarded, created_at, wager_questions(question, scheduled_date)",
      )
      .order("created_at", { ascending: false })
      .limit(Math.min(50, Math.max(1, Math.trunc(limit))));

    if (error) {
      logger.error("Falha ao carregar histórico de apostas", "dailyWagerService.history", error);
      throw error;
    }
    return (data as unknown as WagerHistoryRow[]) || [];
  },

  /** Ranking de apostadores do período (agregação e sequências calculadas no banco). */
  async leaderboard(
    days: WagerLeaderboardWindow = 7,
    limit = 20,
  ): Promise<WagerLeaderboardRow[]> {
    const { data, error } = await supabase.rpc("get_wager_leaderboard", {
      p_days: days,
      p_limit: Math.min(100, Math.max(1, Math.trunc(limit))),
    });

    if (error) {
      logger.error(
        "Falha ao carregar ranking de apostadores",
        "dailyWagerService.leaderboard",
        error,
      );
      throw error;
    }
    return parseWagerLeaderboard(data);
  },
};