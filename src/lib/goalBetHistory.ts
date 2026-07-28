import { computeGoalBetPosition } from "@/lib/goalBetPosition";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

export interface GoalBetHistoryItem {
  marketId: string;
  title: string;
  /** Data usada para ordenar: apuração quando existir, senão travamento. */
  resolvedAt: string;
  staked: number;
  returned: number;
  profit: number;
  /** true quando o mercado foi anulado (aporte devolvido, sem acerto/erro). */
  voided: boolean;
  hit: boolean;
}

export interface GoalBetHistorySummary {
  items: GoalBetHistoryItem[];
  /** Mercados apurados considerados (anulados não contam para acerto). */
  decided: number;
  hits: number;
  /** hits / decided (0..1); 0 quando não há mercados decididos. */
  hitRate: number;
  totalStaked: number;
  totalReturned: number;
  netProfit: number;
  /** Retorno sobre investimento; 0 quando nada foi apostado. */
  roi: number;
}

const EMPTY: GoalBetHistorySummary = {
  items: [],
  decided: 0,
  hits: 0,
  hitRate: 0,
  totalStaked: 0,
  totalReturned: 0,
  netProfit: 0,
  roi: 0,
};

/**
 * Histórico determinístico do apostador: considera apenas mercados já
 * finalizados (apurados ou anulados). Mercados anulados entram na lista mas
 * ficam fora do cálculo de taxa de acerto, pois não houve decisão.
 */
export function computeGoalBetHistory(
  markets: readonly PredictionMarketRow[] | null | undefined,
  stakes: readonly PredictionStakeRow[] | null | undefined,
): GoalBetHistorySummary {
  if (!markets?.length || !stakes?.length) return EMPTY;

  const items: GoalBetHistoryItem[] = [];

  for (const market of markets) {
    if (market.status !== "settled" && market.status !== "voided") continue;
    const position = computeGoalBetPosition(market, stakes);
    if (position.entries.length === 0) continue;

    const voided = position.voided;
    const hit = !voided && position.entries.some((e) => e.isWinner && e.staked > 0);

    items.push({
      marketId: market.id,
      title: market.title,
      resolvedAt: market.settled_at ?? market.resolves_at ?? market.locks_at,
      staked: position.totalStaked,
      returned: position.projectedReturn,
      profit: position.projectedReturn - position.totalStaked,
      voided,
      hit,
    });
  }

  if (items.length === 0) return EMPTY;

  // Mais recentes primeiro; empate resolvido pelo id para ser estável.
  items.sort((a, b) =>
    a.resolvedAt === b.resolvedAt
      ? a.marketId.localeCompare(b.marketId)
      : a.resolvedAt < b.resolvedAt
        ? 1
        : -1,
  );

  const decidedItems = items.filter((i) => !i.voided);
  const hits = decidedItems.filter((i) => i.hit).length;
  const totalStaked = items.reduce((acc, i) => acc + i.staked, 0);
  const totalReturned = items.reduce((acc, i) => acc + i.returned, 0);

  return {
    items,
    decided: decidedItems.length,
    hits,
    hitRate: decidedItems.length > 0 ? hits / decidedItems.length : 0,
    totalStaked,
    totalReturned,
    netProfit: totalReturned - totalStaked,
    roi: totalStaked > 0 ? (totalReturned - totalStaked) / totalStaked : 0,
  };
}
