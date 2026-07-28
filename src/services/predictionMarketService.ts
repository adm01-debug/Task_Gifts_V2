import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { StakeRejection } from "@/lib/predictionMarket";

export type PredictionMarketStatus =
  | "draft"
  | "open"
  | "locked"
  | "settled"
  | "voided";

export interface PredictionOptionRow {
  id: string;
  market_id: string;
  label: string;
  sort_order: number;
  pool: number;
}

export interface PredictionMarketRow {
  id: string;
  title: string;
  description: string | null;
  status: PredictionMarketStatus;
  min_stake: number;
  max_stake_per_user: number;
  rake_bps: number;
  locks_at: string;
  resolves_at: string | null;
  winning_option_id: string | null;
  total_pool: number;
  rake_collected: number;
  settled_at: string | null;
  created_at: string;
  options: PredictionOptionRow[];
}

export interface PredictionStakeRow {
  id: string;
  market_id: string;
  option_id: string;
  amount: number;
  payout: number | null;
  created_at: string;
}

export interface PlaceStakeResult {
  ok: boolean;
  duplicate?: boolean;
  reason?: StakeRejection | "unauthenticated" | "market_not_found";
  stake_id?: string;
  new_balance?: number;
  user_total?: number;
}

export interface SettleResult {
  ok: boolean;
  reason?: string;
  refunded?: boolean;
  total?: number;
  paid?: number;
  rake?: number;
  conserved?: boolean;
  already_settled?: boolean;
}

const MARKET_COLUMNS =
  "id, title, description, status, min_stake, max_stake_per_user, rake_bps, locks_at, resolves_at, winning_option_id, total_pool, rake_collected, settled_at, created_at, options:prediction_options(id, market_id, label, sort_order, pool)";

function sortOptions(rows: PredictionMarketRow[]): PredictionMarketRow[] {
  return rows.map((row) => ({
    ...row,
    options: [...(row.options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));
}

export const predictionMarketService = {
  /** Mercados visíveis ao usuário (RLS já oculta rascunhos para não-admins). */
  async list(): Promise<PredictionMarketRow[]> {
    const { data, error } = await supabase
      .from("prediction_markets")
      .select(MARKET_COLUMNS)
      .order("locks_at", { ascending: false })
      .limit(50);
    if (error) {
      logger.error("Falha ao listar mercados de previsão", error);
      throw error;
    }
    return sortOptions((data ?? []) as unknown as PredictionMarketRow[]);
  },

  /** Aportes do próprio usuário — RLS garante o escopo. */
  async myStakes(): Promise<PredictionStakeRow[]> {
    const { data, error } = await supabase
      .from("prediction_stakes")
      .select("id, market_id, option_id, amount, payout, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      logger.error("Falha ao carregar aportes de previsão", error);
      throw error;
    }
    return (data ?? []) as PredictionStakeRow[];
  },

  async placeStake(
    marketId: string,
    optionId: string,
    amount: number,
    dedupeKey?: string,
  ): Promise<PlaceStakeResult> {
    const { data, error } = await supabase.rpc("place_prediction_stake", {
      p_market_id: marketId,
      p_option_id: optionId,
      p_amount: amount,
      p_dedupe_key: dedupeKey ?? null,
    });
    if (error) {
      logger.error("Falha ao registrar aporte de previsão", error);
      throw error;
    }
    return (data ?? { ok: false }) as unknown as PlaceStakeResult;
  },

  async settle(marketId: string, winningOptionId: string | null): Promise<SettleResult> {
    const { data, error } = await supabase.rpc("settle_prediction_market", {
      p_market_id: marketId,
      p_winning_option_id: winningOptionId,
    });
    if (error) {
      logger.error("Falha ao apurar mercado de previsão", error);
      throw error;
    }
    return (data ?? { ok: false }) as unknown as SettleResult;
  },
};

export const STAKE_REJECTION_MESSAGES: Record<string, string> = {
  unauthenticated: "Faça login para participar.",
  market_not_found: "Mercado não encontrado.",
  market_closed: "Este mercado já está fechado para novos aportes.",
  unknown_option: "Opção inválida para este mercado.",
  invalid_amount: "Informe um valor inteiro de moedas.",
  below_minimum: "Valor abaixo do aporte mínimo.",
  over_user_cap: "Você atingiu o teto de aporte deste mercado.",
  insufficient_coins: "Moedas insuficientes para este aporte.",
  option_switch_forbidden: "Você já apostou em outra opção deste mercado.",
};
