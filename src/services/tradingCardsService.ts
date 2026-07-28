import { supabase } from "@/integrations/supabase/client";
import type { CardRarity } from "@/lib/tradingCards";
import { logger } from "./loggingService";

export type CardPackSource = "task" | "training" | "quest" | "campaign" | "manual" | "streak";
export type CardTradeStatus = "pending" | "accepted" | "declined" | "cancelled" | "expired";

export interface CardDefinitionRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  rarity: CardRarity;
  set_code: string;
  image_url: string | null;
  is_active: boolean;
}

export interface UserCardRow {
  card_id: string;
  quantity: number;
  first_obtained_at: string;
}

export interface CardPackRow {
  id: string;
  source: CardPackSource;
  source_ref: string | null;
  size: number;
  status: "sealed" | "opened";
  opened_at: string | null;
  result: OpenedCard[] | null;
  created_at: string;
}

export interface OpenedCard {
  card_id: string;
  rarity: CardRarity;
  is_new: boolean;
}

export interface CardTradeRow {
  id: string;
  proposer_id: string;
  responder_id: string;
  offered_card_id: string;
  requested_card_id: string;
  status: CardTradeStatus;
  message: string | null;
  expires_at: string;
  created_at: string;
}

export interface OpenPackResult {
  success: boolean;
  reason?: "not_found" | "no_cards";
  replayed?: boolean;
  cards?: OpenedCard[];
}

export interface TradeActionResult {
  success: boolean;
  reason?: string;
  trade_id?: string;
  status?: CardTradeStatus;
}

/**
 * Camada de acesso do Álbum de Cartas.
 * O sorteio do pacote e a transferência entre coleções acontecem exclusivamente
 * em RPCs `SECURITY DEFINER` — o cliente apenas dispara e exibe o resultado.
 */
export const tradingCardsService = {
  async listDefinitions(): Promise<CardDefinitionRow[]> {
    const { data, error } = await supabase
      .from("card_definitions")
      .select("id, code, name, description, rarity, set_code, image_url, is_active")
      .eq("is_active", true)
      .order("code");

    if (error) {
      logger.error("Falha ao listar catálogo de cartas", "tradingCardsService.listDefinitions", error);
      throw error;
    }
    return (data as CardDefinitionRow[]) || [];
  },

  async listOwned(): Promise<UserCardRow[]> {
    const { data, error } = await supabase
      .from("user_cards")
      .select("card_id, quantity, first_obtained_at")
      .gt("quantity", 0);

    if (error) {
      logger.error("Falha ao listar coleção", "tradingCardsService.listOwned", error);
      throw error;
    }
    return (data as UserCardRow[]) || [];
  },

  async listPacks(): Promise<CardPackRow[]> {
    const { data, error } = await supabase
      .from("card_packs")
      .select("id, source, source_ref, size, status, opened_at, result, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Falha ao listar pacotes", "tradingCardsService.listPacks", error);
      throw error;
    }
    return ((data as unknown as CardPackRow[]) || []).map((pack) => ({
      ...pack,
      result: Array.isArray(pack.result) ? pack.result : null,
    }));
  },

  async listTrades(): Promise<CardTradeRow[]> {
    const { data, error } = await supabase
      .from("card_trades")
      .select(
        "id, proposer_id, responder_id, offered_card_id, requested_card_id, status, message, expires_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Falha ao listar trocas", "tradingCardsService.listTrades", error);
      throw error;
    }
    return (data as CardTradeRow[]) || [];
  },

  async openPack(packId: string): Promise<OpenPackResult> {
    const { data, error } = await supabase.rpc("open_card_pack", { p_pack_id: packId });

    if (error) {
      logger.error("Falha ao abrir pacote", "tradingCardsService.openPack", error);
      throw error;
    }
    return (data as unknown as OpenPackResult) ?? { success: false };
  },

  async proposeTrade(params: {
    responderId: string;
    offeredCardId: string;
    requestedCardId: string;
    message?: string;
  }): Promise<TradeActionResult> {
    const { data, error } = await supabase.rpc("propose_card_trade", {
      p_responder_id: params.responderId,
      p_offered_card_id: params.offeredCardId,
      p_requested_card_id: params.requestedCardId,
      ...(params.message ? { p_message: params.message } : {}),
    });

    if (error) {
      logger.error("Falha ao propor troca", "tradingCardsService.proposeTrade", error);
      throw error;
    }
    return (data as unknown as TradeActionResult) ?? { success: false };
  },

  async respondTrade(tradeId: string, action: "accept" | "decline" | "cancel"): Promise<TradeActionResult> {
    const { data, error } = await supabase.rpc("respond_card_trade", {
      p_trade_id: tradeId,
      p_action: action,
    });

    if (error) {
      logger.error("Falha ao responder troca", "tradingCardsService.respondTrade", error);
      throw error;
    }
    return (data as unknown as TradeActionResult) ?? { success: false };
  },
};
