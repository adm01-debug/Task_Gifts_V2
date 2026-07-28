import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export type AuctionStatus = "draft" | "active" | "closed" | "cancelled";
export type AuctionBidStatus = "active" | "refunded" | "won";

export interface Auction {
  id: string;
  reward_id: string | null;
  title: string;
  description: string | null;
  image_url: string | null;
  starting_bid: number;
  min_increment: number;
  starts_at: string;
  ends_at: string;
  status: AuctionStatus;
  winner_id: string | null;
  winning_bid: number | null;
  total_bids: number;
  closed_at: string | null;
  created_at: string;
}

export interface AuctionBid {
  id: string;
  auction_id: string;
  amount: number;
  escrow_coins: number;
  status: AuctionBidStatus;
  created_at: string;
}

export interface AuctionSummary {
  success: boolean;
  reason?: string;
  id?: string;
  status?: AuctionStatus;
  ends_at?: string;
  starting_bid?: number;
  min_increment?: number;
  participants?: number;
  my_bid?: number | null;
  my_status?: AuctionBidStatus | null;
  min_next_bid?: number;
  winner_id?: string | null;
  winning_bid?: number | null;
}

export interface PlaceBidResult {
  success: boolean;
  replayed?: boolean;
  reason?:
    | "unauthenticated"
    | "invalid_amount"
    | "not_found"
    | "not_open"
    | "below_minimum"
    | "insufficient_coins"
    | "profile_missing";
  min_required?: number;
  required?: number;
  balance?: number;
  amount?: number;
  escrow?: number;
}

const AUCTION_COLUMNS =
  "id, reward_id, title, description, image_url, starting_bid, min_increment, starts_at, ends_at, status, winner_id, winning_bid, total_bids, closed_at, created_at";

export interface CreateAuctionInput {
  title: string;
  description?: string | null;
  starting_bid: number;
  min_increment: number;
  starts_at: string;
  ends_at: string;
  reward_id?: string | null;
}

export type AuctionAdminAction =
  | "draft_created"
  | "published"
  | "settled"
  | "cancelled"
  | "stock_reserved"
  | "stock_unavailable";

export interface AuctionAdminEvent {
  id: string;
  auction_id: string | null;
  actor_id: string | null;
  action: AuctionAdminAction;
  details: Record<string, unknown>;
  created_at: string;
}

/** Motivos devolvidos pelas RPCs de governança — traduzidos na camada de UI. */
export type AuctionAdminReason =
  | "invalid_title"
  | "invalid_economics"
  | "invalid_window"
  | "reward_unavailable"
  | "not_found"
  | "not_draft"
  | "window_expired";

interface AuctionRpcResult {
  success: boolean;
  reason?: AuctionAdminReason;
  replayed?: boolean;
  id?: string;
}

const ADMIN_REASON_LABELS: Record<AuctionAdminReason, string> = {
  invalid_title: "Título inválido (mínimo de 3 caracteres).",
  invalid_economics: "Lance inicial e incremento precisam ser de pelo menos 1 moeda.",
  invalid_window: "A janela do leilão é inválida: o término deve ser após o início.",
  reward_unavailable: "O item da loja vinculado não existe mais ou está inativo.",
  not_found: "Leilão não encontrado.",
  not_draft: "Somente rascunhos podem ser publicados.",
  window_expired: "A janela do leilão já expirou — ajuste as datas antes de publicar.",
};

export class AuctionAdminError extends Error {
  constructor(public readonly reason: AuctionAdminReason | "unknown") {
    super(
      reason === "unknown"
        ? "Não foi possível concluir a operação do leilão."
        : ADMIN_REASON_LABELS[reason],
    );
    this.name = "AuctionAdminError";
  }
}

/**
 * Leilão de lance às cegas. O débito/estorno de moedas ocorre exclusivamente
 * em RPC SECURITY DEFINER — o cliente apenas dispara e exibe o estado.
 */
export const auctionService = {
  async list(): Promise<Auction[]> {
    const { data, error } = await supabase
      .from("auctions")
      .select(AUCTION_COLUMNS)
      .neq("status", "draft")
      .order("ends_at", { ascending: true })
      .limit(60);

    if (error) {
      logger.apiError("listAuctions", error, "auctionService");
      throw error;
    }
    return (data ?? []) as Auction[];
  },

  /** Lances do próprio usuário (RLS impede leitura de lances alheios). */
  async myBids(): Promise<AuctionBid[]> {
    const { data, error } = await supabase
      .from("auction_bids")
      .select("id, auction_id, amount, escrow_coins, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      logger.apiError("listMyAuctionBids", error, "auctionService");
      throw error;
    }
    return (data ?? []) as AuctionBid[];
  },

  async summary(auctionId: string): Promise<AuctionSummary> {
    const { data, error } = await supabase.rpc("get_auction_summary", {
      p_auction_id: auctionId,
    });
    if (error) {
      logger.apiError("getAuctionSummary", error, "auctionService");
      throw error;
    }
    return (data as unknown as AuctionSummary) ?? { success: false };
  },

  /** `dedupeKey` garante que duplo toque/retry não retenha moedas duas vezes. */
  async placeBid(auctionId: string, amount: number, dedupeKey?: string): Promise<PlaceBidResult> {
    const { data, error } = await supabase.rpc("place_auction_bid", {
      p_auction_id: auctionId,
      p_amount: amount,
      ...(dedupeKey ? { p_dedupe_key: dedupeKey } : {}),
    });
    if (error) {
      logger.apiError("placeAuctionBid", error, "auctionService");
      throw error;
    }
    return (data as unknown as PlaceBidResult) ?? { success: false };
  },
};

export const auctionAdminService = {
  async listAll(): Promise<Auction[]> {
    const { data, error } = await supabase
      .from("auctions")
      .select(AUCTION_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(120);

    if (error) {
      logger.apiError("listAllAuctions", error, "auctionAdminService");
      throw error;
    }
    return (data ?? []) as Auction[];
  },

  /**
   * Cria o leilão como rascunho via RPC validada no servidor. A RPC é a única
   * fonte de verdade das regras econômicas e registra a trilha auditável.
   */
  async create(input: CreateAuctionInput): Promise<string> {
    const { data, error } = await supabase.rpc("create_auction_draft", {
      p_title: input.title.trim(),
      p_description: input.description?.trim() ?? "",
      p_starting_bid: input.starting_bid,
      p_min_increment: input.min_increment,
      p_starts_at: input.starts_at,
      p_ends_at: input.ends_at,
      ...(input.reward_id ? { p_reward_id: input.reward_id } : {}),
    });

    if (error) {
      logger.apiError("createAuction", error, "auctionAdminService");
      throw error;
    }
    const result = (data as unknown as AuctionRpcResult) ?? { success: false };
    if (!result.success || !result.id) {
      throw new AuctionAdminError(result.reason ?? "unknown");
    }
    return result.id;
  },

  /** Publica um rascunho. A RPC revalida janela, economia e item vinculado. */
  async publish(auctionId: string): Promise<void> {
    const { data, error } = await supabase.rpc("publish_auction", {
      p_auction_id: auctionId,
    });

    if (error) {
      logger.apiError("publishAuction", error, "auctionAdminService");
      throw error;
    }
    const result = (data as unknown as AuctionRpcResult) ?? { success: false };
    if (!result.success) {
      throw new AuctionAdminError(result.reason ?? "unknown");
    }
  },

  async close(auctionId: string): Promise<void> {
    const { error } = await supabase.rpc("close_auction", { p_auction_id: auctionId });
    if (error) {
      logger.apiError("closeAuction", error, "auctionAdminService");
      throw error;
    }
  },

  async cancel(auctionId: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_auction", { p_auction_id: auctionId });
    if (error) {
      logger.apiError("cancelAuction", error, "auctionAdminService");
      throw error;
    }
  },

  /** Trilha auditável append-only (somente leitura, restrita a admins pela RLS). */
  async events(limit = 50): Promise<AuctionAdminEvent[]> {
    const { data, error } = await supabase
      .from("auction_admin_events")
      .select("id, auction_id, actor_id, action, details, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.apiError("listAuctionAdminEvents", error, "auctionAdminService");
      throw error;
    }
    return (data ?? []) as unknown as AuctionAdminEvent[];
  },
};
