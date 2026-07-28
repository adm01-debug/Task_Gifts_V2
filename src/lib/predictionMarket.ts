/**
 * Espelho puro das regras econômicas do Mercado de Previsões (parimutuel).
 *
 * Por que um espelho em TypeScript?
 *   As RPCs SQL (`place_prediction_stake` / `settle_prediction_market`) são a
 *   fonte da verdade em produção, mas regras monetárias precisam ser simuladas
 *   em milhares de cenários antes de tocar o banco. Qualquer divergência entre
 *   este módulo e o SQL indica risco de criação/vazamento de moedas.
 *
 * Invariantes garantidas (validadas em src/test/predictionMarket.simulation.test.ts):
 *   I1. Conservação: soma dos payouts + rake === soma dos aportes.
 *   I2. Nenhum payout negativo e nenhum saldo negativo.
 *   I3. Quem apostou na opção vencedora nunca recebe menos que o próprio aporte
 *       quando o rake é 0 (parimutuel puro).
 *   I4. Mercado anulado/cancelado devolve exatamente o aporte de cada usuário.
 *   I5. Distribuição determinística: o resto da divisão inteira vai para os
 *       maiores aportes (desempate estável por userId), nunca é criado nem
 *       descartado.
 */

export type PredictionStatus = "draft" | "open" | "locked" | "settled" | "voided";

export interface PredictionStake {
  userId: string;
  optionId: string;
  amount: number;
  createdAt: number;
}

export interface PredictionMarket {
  status: PredictionStatus;
  optionIds: string[];
  /** Aporte mínimo por operação. */
  minStake: number;
  /** Teto acumulado por usuário no mercado (0 = sem teto). */
  maxStakePerUser: number;
  /** Taxa da casa em basis points (0..2000 = 0%..20%). */
  rakeBps: number;
  /** Momento em que os aportes fecham (epoch ms). */
  locksAt: number;
}

export type StakeRejection =
  | "market_closed"
  | "unknown_option"
  | "invalid_amount"
  | "below_minimum"
  | "over_user_cap"
  | "insufficient_coins"
  | "option_switch_forbidden";

export interface StakeOutcome {
  accepted: boolean;
  reason?: StakeRejection;
  newBalance: number;
  stake?: PredictionStake;
}

/** Total já aportado por um usuário no mercado. */
export function userTotal(stakes: PredictionStake[], userId: string): number {
  return stakes
    .filter((s) => s.userId === userId)
    .reduce((acc, s) => acc + s.amount, 0);
}

/** Opção onde o usuário já está posicionado (parimutuel não permite hedge). */
export function userOption(
  stakes: PredictionStake[],
  userId: string,
): string | undefined {
  return stakes.find((s) => s.userId === userId)?.optionId;
}

/** Soma aportada em cada opção. */
export function poolByOption(
  market: PredictionMarket,
  stakes: PredictionStake[],
): Record<string, number> {
  const pools: Record<string, number> = {};
  for (const id of market.optionIds) pools[id] = 0;
  for (const s of stakes) pools[s.optionId] = (pools[s.optionId] ?? 0) + s.amount;
  return pools;
}

export function totalPool(stakes: PredictionStake[]): number {
  return stakes.reduce((acc, s) => acc + s.amount, 0);
}

/**
 * Cotação implícita (multiplicador bruto) de uma opção, já descontado o rake.
 * Retorna 1 quando a opção concentra todo o pool (ninguém a quem tomar).
 */
export function impliedOdds(
  market: PredictionMarket,
  stakes: PredictionStake[],
  optionId: string,
): number {
  const pools = poolByOption(market, stakes);
  const side = pools[optionId] ?? 0;
  const total = totalPool(stakes);
  if (side <= 0) return 0;
  const distributable = total - Math.floor((total * market.rakeBps) / 10_000);
  return distributable / side;
}

export function applyStake(
  market: PredictionMarket,
  stakes: PredictionStake[],
  balance: number,
  userId: string,
  optionId: string,
  amount: number,
  now: number,
): StakeOutcome {
  if (market.status !== "open" || now >= market.locksAt) {
    return { accepted: false, reason: "market_closed", newBalance: balance };
  }
  if (!market.optionIds.includes(optionId)) {
    return { accepted: false, reason: "unknown_option", newBalance: balance };
  }
  if (!Number.isInteger(amount) || amount < 1) {
    return { accepted: false, reason: "invalid_amount", newBalance: balance };
  }
  if (amount < market.minStake) {
    return { accepted: false, reason: "below_minimum", newBalance: balance };
  }
  const existing = userOption(stakes, userId);
  if (existing && existing !== optionId) {
    return { accepted: false, reason: "option_switch_forbidden", newBalance: balance };
  }
  if (
    market.maxStakePerUser > 0 &&
    userTotal(stakes, userId) + amount > market.maxStakePerUser
  ) {
    return { accepted: false, reason: "over_user_cap", newBalance: balance };
  }
  if (balance < amount) {
    return { accepted: false, reason: "insufficient_coins", newBalance: balance };
  }
  return {
    accepted: true,
    newBalance: balance - amount,
    stake: { userId, optionId, amount, createdAt: now },
  };
}

export interface Payout {
  userId: string;
  /** Total devolvido/creditado ao usuário (inclui o próprio aporte). */
  amount: number;
  /** Lucro líquido (amount - aporte); negativo para quem perdeu. */
  profit: number;
}

export interface SettlementResult {
  payouts: Payout[];
  /** Retido pela casa (0 em reembolsos). */
  rake: number;
  /** Total movimentado no mercado. */
  total: number;
  /** true quando todos foram reembolsados (sem vencedor ou mercado anulado). */
  refunded: boolean;
}

/** Agrupa aportes por usuário preservando ordem estável. */
function aggregate(stakes: PredictionStake[]): { userId: string; amount: number }[] {
  const map = new Map<string, number>();
  for (const s of stakes) map.set(s.userId, (map.get(s.userId) ?? 0) + s.amount);
  return [...map.entries()].map(([userId, amount]) => ({ userId, amount }));
}

/** Reembolso integral — usado em anulação e em mercado sem vencedores. */
export function refundAll(stakes: PredictionStake[]): SettlementResult {
  const rows = aggregate(stakes);
  return {
    payouts: rows.map((r) => ({ userId: r.userId, amount: r.amount, profit: 0 })),
    rake: 0,
    total: totalPool(stakes),
    refunded: true,
  };
}

/**
 * Apuração parimutuel com distribuição inteira e resto determinístico.
 * O resto (centavos de moeda) é entregue aos maiores aportes; empate resolvido
 * por userId para manter o resultado reproduzível entre SQL e TypeScript.
 */
export function settleMarket(
  market: PredictionMarket,
  stakes: PredictionStake[],
  winningOptionId: string | null,
): SettlementResult {
  const total = totalPool(stakes);
  if (stakes.length === 0) {
    return { payouts: [], rake: 0, total: 0, refunded: true };
  }
  if (!winningOptionId || !market.optionIds.includes(winningOptionId)) {
    return refundAll(stakes);
  }
  const winners = aggregate(stakes.filter((s) => s.optionId === winningOptionId));
  if (winners.length === 0) {
    // Ninguém acertou: devolver tudo é mais justo que confiscar.
    return refundAll(stakes);
  }
  const winnerPool = winners.reduce((acc, w) => acc + w.amount, 0);
  if (winnerPool >= total) {
    // Todo o dinheiro está do lado vencedor: sem contraparte, sem rake.
    return {
      payouts: winners.map((w) => ({ userId: w.userId, amount: w.amount, profit: 0 })),
      rake: 0,
      total,
      refunded: true,
    };
  }

  const rake = Math.floor((total * market.rakeBps) / 10_000);
  const distributable = total - rake;

  const base = winners.map((w) => ({
    userId: w.userId,
    stake: w.amount,
    amount: Math.floor((distributable * w.amount) / winnerPool),
  }));

  let remainder = distributable - base.reduce((acc, b) => acc + b.amount, 0);
  const order = [...base].sort(
    (a, b) => b.stake - a.stake || a.userId.localeCompare(b.userId),
  );
  let i = 0;
  while (remainder > 0 && order.length > 0) {
    order[i % order.length].amount += 1;
    remainder -= 1;
    i += 1;
  }

  const winnerIds = new Set(base.map((b) => b.userId));
  const losers = aggregate(stakes.filter((s) => !winnerIds.has(s.userId)));

  return {
    payouts: [
      ...base.map((b) => ({ userId: b.userId, amount: b.amount, profit: b.amount - b.stake })),
      ...losers.map((l) => ({ userId: l.userId, amount: 0, profit: -l.amount })),
    ],
    rake,
    total,
    refunded: false,
  };
}

/** Verificação de conservação usada em testes e no painel administrativo. */
export function isConserved(result: SettlementResult): boolean {
  const paid = result.payouts.reduce((acc, p) => acc + p.amount, 0);
  return paid + result.rake === result.total;
}
