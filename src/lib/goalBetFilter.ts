import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

/** Filtros rápidos da vitrine de mercados. */
export type GoalBetFilter = "all" | "open" | "mine" | "closed";

export const GOAL_BET_FILTER_LABELS: Record<GoalBetFilter, string> = {
  all: "Todos",
  open: "Abertos",
  mine: "Minhas apostas",
  closed: "Encerrados",
};

/** Ordem canônica dos botões de filtro na UI. */
export const GOAL_BET_FILTERS: readonly GoalBetFilter[] = [
  "all",
  "open",
  "mine",
  "closed",
] as const;

function isClosed(market: PredictionMarketRow): boolean {
  return market.status === "settled" || market.status === "voided";
}

/**
 * Aplica o filtro preservando a ordem recebida (a ordenação por urgência
 * acontece antes). "Minhas apostas" considera qualquer aporte do usuário,
 * inclusive em mercados já apurados, para não sumir com o resultado.
 */
export function filterMarkets(
  markets: readonly PredictionMarketRow[] | null | undefined,
  stakes: readonly PredictionStakeRow[] | null | undefined,
  filter: GoalBetFilter,
): PredictionMarketRow[] {
  const rows = [...(markets ?? [])];
  if (filter === "all") return rows;
  if (filter === "open") return rows.filter((m) => m.status === "open");
  if (filter === "closed") return rows.filter(isClosed);

  const mine = new Set((stakes ?? []).map((s) => s.market_id));
  return rows.filter((m) => mine.has(m.id));
}

/** Contagem por filtro, usada nos selos dos botões. */
export function countMarketsByFilter(
  markets: readonly PredictionMarketRow[] | null | undefined,
  stakes: readonly PredictionStakeRow[] | null | undefined,
): Record<GoalBetFilter, number> {
  const rows = markets ?? [];
  const mine = new Set((stakes ?? []).map((s) => s.market_id));
  return {
    all: rows.length,
    open: rows.filter((m) => m.status === "open").length,
    mine: rows.filter((m) => mine.has(m.id)).length,
    closed: rows.filter(isClosed).length,
  };
}