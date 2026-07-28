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

export interface PredictionAdminEventRow {
  id: string;
  market_id: string;
  action: string;
  actor_id: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
}

export interface CreateMarketInput {
  title: string;
  description?: string | null;
  options: string[];
  minStake: number;
  maxStakePerUser: number;
  rakeBps: number;
  locksAt: string;
  resolvesAt?: string | null;
}

export interface AdminActionResult {
  ok: boolean;
  reason?: string;
  market_id?: string;
  action?: string;
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
      logger.error("Falha ao listar mercados de previsão", "predictionMarketService", error);
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
      logger.error("Falha ao carregar aportes de previsão", "predictionMarketService", error);
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
      p_dedupe_key: dedupeKey ?? undefined,
    });
    if (error) {
      logger.error("Falha ao registrar aporte de previsão", "predictionMarketService", error);
      throw error;
    }
    return (data ?? { ok: false }) as unknown as PlaceStakeResult;
  },

  async settle(marketId: string, winningOptionId: string | null): Promise<SettleResult> {
    const { data, error } = await supabase.rpc("settle_prediction_market", {
      p_market_id: marketId,
      p_winning_option_id: winningOptionId ?? undefined,
    });
    if (error) {
      logger.error("Falha ao apurar mercado de previsão", "predictionMarketService", error);
      throw error;
    }
    return (data ?? { ok: false }) as unknown as SettleResult;
  },

  /** Cria mercado + opções em uma única transação auditada (admin-only). */
  async createMarket(input: CreateMarketInput): Promise<AdminActionResult> {
    const { data, error } = await supabase.rpc("create_prediction_market", {
      p_title: input.title,
      // A RPC normaliza string vazia para NULL; o tipo gerado não aceita undefined.
      p_description: input.description ?? "",
      p_options: input.options,
      p_min_stake: input.minStake,
      p_max_stake_per_user: input.maxStakePerUser,
      p_rake_bps: input.rakeBps,
      p_locks_at: input.locksAt,
      p_resolves_at: input.resolvesAt ?? undefined,
    });
    if (error) {
      logger.error("Falha ao criar mercado de previsão", "predictionMarketService", error);
      throw error;
    }
    return (data ?? { ok: false }) as unknown as AdminActionResult;
  },

  async transition(
    marketId: string,
    action: "publish" | "lock" | "void",
  ): Promise<AdminActionResult> {
    const { data, error } = await supabase.rpc("transition_prediction_market", {
      p_market_id: marketId,
      p_action: action,
    });
    if (error) {
      logger.error("Falha na transição do mercado de previsão", "predictionMarketService", error);
      throw error;
    }
    return (data ?? { ok: false }) as unknown as AdminActionResult;
  },

  /** Trilha auditável — RLS restringe a administradores. */
  async adminEvents(marketId?: string): Promise<PredictionAdminEventRow[]> {
    let query = supabase
      .from("prediction_admin_events")
      .select("id, market_id, action, actor_id, payload, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    if (marketId) query = query.eq("market_id", marketId);
    const { data, error } = await query;
    if (error) {
      logger.error("Falha ao carregar trilha de previsões", "predictionMarketService", error);
      throw error;
    }
    return (data ?? []) as unknown as PredictionAdminEventRow[];
  },
};

/**
 * Série histórica agregada de um mercado. Cada linha é a soma dos aportes de
 * uma opção dentro de uma faixa de tempo — nunca um aporte individual.
 */
export interface OddsHistoryRow {
  bucket_end: string;
  option_id: string;
  amount: number;
}

export async function fetchOddsHistory(
  marketId: string,
  buckets = 40,
): Promise<OddsHistoryRow[]> {
  const { data, error } = await supabase.rpc("get_prediction_odds_history", {
    p_market_id: marketId,
    p_buckets: buckets,
  });
  if (error) {
    logger.error("Falha ao carregar histórico de cotações", "predictionMarketService", error);
    throw error;
  }
  return ((data ?? []) as unknown as OddsHistoryRow[]).map((row) => ({
    ...row,
    amount: Number(row.amount),
  }));
}

/** Linha crua devolvida pela agregação server-side do ranking Oráculo. */
interface OracleAggregateRow {
  user_id: string;
  markets: number;
  stakes: number;
  total_staked: number | string;
  total_payout: number | string;
  hits: number;
  weighted_edge: number | string;
  weighted_brier: number | string;
}

export async function fetchOracleAggregates(): Promise<OracleAggregate[]> {
  const { data, error } = await supabase.rpc("get_prediction_oracle_aggregates");
  if (error) {
    logger.error("Falha ao carregar ranking Oráculo", "predictionMarketService", error);
    throw error;
  }
  // bigint e numeric chegam como string no protocolo; converter é obrigatório
  // para não somar textos silenciosamente mais adiante.
  return ((data ?? []) as unknown as OracleAggregateRow[]).map((row) => ({
    userId: row.user_id,
    markets: Number(row.markets),
    stakes: Number(row.stakes),
    totalStaked: Number(row.total_staked),
    totalPayout: Number(row.total_payout),
    hits: Number(row.hits),
    weightedEdge: Number(row.weighted_edge),
    weightedBrier: Number(row.weighted_brier),
  }));
}

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

export const ADMIN_REJECTION_MESSAGES: Record<string, string> = {
  need_two_options: "O mercado precisa de ao menos 2 opções distintas.",
  too_many_options: "O mercado aceita no máximo 6 opções.",
  invalid_title: "A pergunta precisa ter entre 5 e 140 caracteres.",
  invalid_min_stake: "O aporte mínimo deve ser um inteiro positivo.",
  invalid_user_cap: "Teto por usuário inválido para o aporte mínimo definido.",
  invalid_rake: "A taxa da casa deve ficar entre 0% e 20%.",
  invalid_window: "O travamento precisa estar ao menos 15 minutos no futuro.",
  invalid_resolves_at: "A apuração não pode ocorrer antes do travamento.",
  market_not_found: "Mercado não encontrado.",
  market_terminal: "Este mercado já foi apurado ou anulado.",
  not_draft: "Apenas rascunhos podem ser publicados.",
  not_open: "Apenas mercados abertos podem ser travados.",
  window_expired: "A janela de aportes já venceu — ajuste a data antes de publicar.",
  unknown_action: "Ação administrativa desconhecida.",
};
