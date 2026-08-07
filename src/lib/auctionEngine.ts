/**
 * Espelho puro das regras econômicas do leilão implementadas na RPC
 * `place_auction_bid` / `settle_auction`. Serve para simulação e testes:
 * qualquer divergência aqui indica risco de fraude ou vazamento de moedas.
 */

export interface EngineBid {
  userId: string;
  amount: number;
  escrow: number;
  createdAt: number;
  status: "active" | "refunded" | "won";
}

export interface EngineAuction {
  startingBid: number;
  minIncrement: number;
}

/** Menor lance aceitável para o usuário, considerando um lance anterior dele. */
export function minNextBid(auction: EngineAuction, current?: EngineBid): number {
  return Math.max(
    auction.startingBid,
    current ? current.amount + auction.minIncrement : 0,
  );
}

/** Moedas adicionais a reter: caução é incremental, nunca cobra o valor cheio de novo. */
export function escrowDelta(amount: number, current?: EngineBid): number {
  return amount - (current?.escrow ?? 0);
}

export type BidRejection =
  | "invalid_amount"
  | "below_minimum"
  | "insufficient_coins";

export interface BidOutcome {
  accepted: boolean;
  reason?: BidRejection;
  newBalance: number;
  bid?: EngineBid;
}

export function applyBid(
  auction: EngineAuction,
  balance: number,
  amount: number,
  now: number,
  userId: string,
  current?: EngineBid,
): BidOutcome {
  if (!Number.isInteger(amount) || amount < 1) {
    return { accepted: false, reason: "invalid_amount", newBalance: balance };
  }
  if (amount < minNextBid(auction, current)) {
    return { accepted: false, reason: "below_minimum", newBalance: balance };
  }
  const delta = escrowDelta(amount, current);
  if (balance < delta) {
    return { accepted: false, reason: "insufficient_coins", newBalance: balance };
  }
  return {
    accepted: true,
    newBalance: balance - delta,
    bid: {
      userId,
      amount,
      escrow: amount,
      createdAt: current?.createdAt ?? now,
      status: "active",
    },
  };
}

export interface SettlementResult {
  winner?: EngineBid;
  refunds: Array<{ userId: string; coins: number }>;
}

/** Maior lance vence; empate resolvido por quem lançou primeiro. */
export function settle(bids: readonly EngineBid[]): SettlementResult {
  const active = bids.filter((bid) => bid.status === "active");
  if (active.length === 0) return { refunds: [] };

  const winner = [...active].sort(
    (a, b) => b.amount - a.amount || a.createdAt - b.createdAt,
  )[0];

  return {
    winner,
    refunds: active
      .filter((bid) => bid !== winner)
      .map((bid) => ({ userId: bid.userId, coins: bid.escrow })),
  };
}

/** Cancelamento devolve 100% da caução ativa. */
export function cancelRefunds(bids: readonly EngineBid[]): Array<{ userId: string; coins: number }> {
  return bids
    .filter((bid) => bid.status === "active")
    .map((bid) => ({ userId: bid.userId, coins: bid.escrow }));
}
