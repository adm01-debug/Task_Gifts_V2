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

  /** Cria o leilão como rascunho — publicação é uma ação explícita e auditável. */
  async create(input: CreateAuctionInput): Promise<Auction> {
    const { data, error } = await supabase
      .from("auctions")
      .insert({
        title: input.title.trim(),
        description: input.description?.trim() || null,
        starting_bid: input.starting_bid,
        min_increment: input.min_increment,
        starts_at: input.starts_at,
        ends_at: input.ends_at,
        status: "draft",
      })
      .select(AUCTION_COLUMNS)
      .single();

    if (error) {
      logger.apiError("createAuction", error, "auctionAdminService");
      throw error;
    }
    return data as Auction;
  },

  /** Publica um rascunho. Só rascunhos são elegíveis (validado também no cliente). */
  async publish(auctionId: string): Promise<void> {
    const { error } = await supabase
      .from("auctions")
      .update({ status: "active" })
      .eq("id", auctionId)
      .eq("status", "draft");

    if (error) {
      logger.apiError("publishAuction", error, "auctionAdminService");
      throw error;
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
};
