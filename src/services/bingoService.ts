import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { BingoCell } from "@/lib/bingoEngine";

export interface BingoBoardSummary {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  coins_per_line: number;
  xp_per_line: number;
  coins_full_house: number;
  xp_full_house: number;
}

export interface BingoCardResult {
  success: boolean;
  reason?: "no_board" | "insufficient_tasks";
  card_id?: string;
  board?: BingoBoardSummary;
  cells?: BingoCell[];
  lines_awarded?: number;
  full_house_awarded?: boolean;
  coins_awarded?: number;
  xp_awarded?: number;
}

export interface BingoSyncResult {
  success: boolean;
  reason?: "not_found" | "race";
  lines?: number;
  new_lines?: number;
  full_house?: boolean;
  coins_awarded?: number;
  xp_awarded?: number;
  progress?: { position: number; value: number }[];
}

export interface BingoMarkRow {
  position: number;
  metric_key: string;
  observed_value: number;
  marked_at: string;
}

/**
 * Camada de acesso do Bingo de Missões.
 *
 * O cliente nunca marca casas: `sync_bingo_card` recalcula tudo a partir
 * da atividade real do usuário e credita apenas as linhas novas.
 */
export const bingoService = {
  async getOrCreateCard(boardId?: string): Promise<BingoCardResult> {
    const { data, error } = await supabase.rpc("get_or_create_bingo_card", {
      p_board_id: boardId ?? null,
    });
    if (error) {
      logger.error("Falha ao obter cartela de bingo", "bingoService.getOrCreateCard", error);
      throw error;
    }
    return (data as unknown as BingoCardResult) ?? { success: false };
  },

  async sync(cardId: string): Promise<BingoSyncResult> {
    const { data, error } = await supabase.rpc("sync_bingo_card", { p_card_id: cardId });
    if (error) {
      logger.error("Falha ao sincronizar cartela de bingo", "bingoService.sync", error);
      throw error;
    }
    return (data as unknown as BingoSyncResult) ?? { success: false };
  },

  async marks(cardId: string): Promise<BingoMarkRow[]> {
    const { data, error } = await supabase
      .from("bingo_marks")
      .select("position, metric_key, observed_value, marked_at")
      .eq("card_id", cardId)
      .order("position", { ascending: true });

    if (error) {
      logger.error("Falha ao listar marcações de bingo", "bingoService.marks", error);
      throw error;
    }
    return (data as BingoMarkRow[]) || [];
  },
};
