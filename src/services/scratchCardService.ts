import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export type ScratchPrizeType = "coins" | "xp" | "nothing";
export type ScratchRarity = "common" | "rare" | "epic" | "legendary";
export type ScratchCardSource = "task" | "training" | "quest" | "campaign" | "manual";

export interface ScratchCard {
  id: string;
  source: ScratchCardSource;
  source_ref: string | null;
  status: "pending" | "revealed";
  prize_label: string | null;
  prize_type: ScratchPrizeType | null;
  amount: number;
  rarity: ScratchRarity | null;
  revealed_at: string | null;
  created_at: string;
}

export interface ScratchRevealResult {
  success: boolean;
  reason?: "not_found" | "no_prizes" | "race";
  replayed?: boolean;
  prize_id?: string;
  prize_label?: string;
  prize_type?: ScratchPrizeType;
  amount?: number;
  rarity?: ScratchRarity;
}

export interface ScratchGrantResult {
  success: boolean;
  replayed?: boolean;
  card_id?: string;
}

/**
 * Camada de acesso da Raspadinha Digital.
 * O sorteio e o crédito ocorrem exclusivamente em RPC SECURITY DEFINER no servidor —
 * o cliente apenas dispara e exibe o resultado já persistido.
 */
export const scratchCardService = {
  async list(): Promise<ScratchCard[]> {
    const { data, error } = await supabase
      .from("scratch_cards")
      .select("id, source, source_ref, status, prize_label, prize_type, amount, rarity, revealed_at, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("scratchCardService.list", error);
      throw error;
    }
    return (data as ScratchCard[]) || [];
  },

  async grant(source: ScratchCardSource, sourceRef?: string): Promise<ScratchGrantResult> {
    const { data, error } = await supabase.rpc("grant_scratch_card", {
      p_source: source,
      p_source_ref: sourceRef ?? null,
    });

    if (error) {
      logger.error("scratchCardService.grant", error);
      throw error;
    }
    return (data as unknown as ScratchGrantResult) ?? { success: false };
  },

  async reveal(cardId: string): Promise<ScratchRevealResult> {
    const { data, error } = await supabase.rpc("reveal_scratch_card", { p_card_id: cardId });

    if (error) {
      logger.error("scratchCardService.reveal", error);
      throw error;
    }
    return (data as unknown as ScratchRevealResult) ?? { success: false };
  },
};