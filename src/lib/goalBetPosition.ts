import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

/** Linha da posição do usuário em uma opção específica do mercado. */
export interface GoalBetPositionEntry {
  optionId: string;
  label: string;
  /** Total apostado pelo usuário nessa opção. */
  staked: number;
  /** Pool total da opção (todos os apostadores), nunca menor que o do usuário. */
  optionPool: number;
  /** Participação do usuário dentro da opção (0..1). */
  share: number;
  /** Retorno estimado (ou realizado, se já apurado) em moedas. */
  projectedReturn: number;
  /** Multiplicador implícito sobre o valor apostado (odds). */
  multiplier: number;
  /** Verdadeiro quando a opção é a vencedora de um mercado apurado. */
  isWinner: boolean;
}

export interface GoalBetPositionSummary {
  totalStaked: number;
  /** Soma dos retornos projetados/realizados das opções ainda vivas. */
  projectedReturn: number;
  /** projectedReturn - totalStaked (pode ser negativo). */
  projectedProfit: number;
  /** true quando o mercado já foi apurado ou anulado (valores são realizados). */
  settled: boolean;
  /** true quando o mercado foi anulado — tudo é devolvido. */
  voided: boolean;
  entries: GoalBetPositionEntry[];
}

const EMPTY: GoalBetPositionSummary = {
  totalStaked: 0,
  projectedReturn: 0,
  projectedProfit: 0,
  settled: false,
  voided: false,
  entries: [],
};

function round(value: number): number {
  // Moedas são inteiras no servidor; arredondamos para baixo para nunca
  // prometer mais do que o rateio pode pagar.
  return Math.max(0, Math.floor(value));
}

/**
 * Calcula a posição do usuário em um mercado parimutuel, de forma determinística
 * e sem efeitos colaterais. Regras:
 * - mercado anulado: devolve exatamente o valor apostado (sem rake);
 * - mercado apurado: usa o payout real quando disponível, senão rateia o pool
 *   líquido entre os vencedores;
 * - mercado aberto/travado: projeta o rateio com os pools atuais.
 */
export function computeGoalBetPosition(
  market: PredictionMarketRow | null | undefined,
  stakes: readonly PredictionStakeRow[] | null | undefined,
): GoalBetPositionSummary {
  if (!market) return EMPTY;

  const mine = (stakes ?? []).filter((s) => s.market_id === market.id);
  if (mine.length === 0) return EMPTY;

  const voided = market.status === "voided";
  const settled = market.status === "settled" || voided;

  const totalStaked = mine.reduce((acc, s) => acc + Math.max(0, s.amount), 0);
  const rake = Math.max(0, Math.min(10000, market.rake_bps)) / 10000;
  const grossPool = Math.max(
    market.total_pool,
    market.options.reduce((acc, o) => acc + Math.max(0, o.pool), 0),
  );
  const netPool = grossPool * (1 - rake);

  const byOption = new Map<string, { staked: number; payout: number | null }>();
  for (const stake of mine) {
    const current = byOption.get(stake.option_id) ?? { staked: 0, payout: null };
    current.staked += Math.max(0, stake.amount);
    if (stake.payout != null) current.payout = (current.payout ?? 0) + stake.payout;
    byOption.set(stake.option_id, current);
  }

  const entries: GoalBetPositionEntry[] = [];
  for (const option of market.options) {
    const mineOnOption = byOption.get(option.id);
    if (!mineOnOption) continue;

    const staked = mineOnOption.staked;
    const optionPool = Math.max(option.pool, staked);
    const share = optionPool > 0 ? staked / optionPool : 0;
    const isWinner = market.winning_option_id === option.id;

    let projectedReturn: number;
    if (voided) {
      projectedReturn = staked;
    } else if (settled) {
      projectedReturn =
        mineOnOption.payout != null
          ? round(mineOnOption.payout)
          : isWinner
            ? round(netPool * share)
            : 0;
    } else {
      projectedReturn = round(netPool * share);
    }

    entries.push({
      optionId: option.id,
      label: option.label,
      staked,
      optionPool,
      share,
      projectedReturn,
      multiplier: staked > 0 ? projectedReturn / staked : 0,
      isWinner,
    });
  }

  // Opções órfãs (removidas do mercado) ainda contam no total apostado, mas não
  // geram linha — evitamos exibir dados que não podemos rotular.
  const projectedReturn = settled
    ? entries.reduce((acc, e) => acc + e.projectedReturn, 0)
    : entries.reduce((acc, e) => Math.max(acc, e.projectedReturn), 0);

  return {
    totalStaked,
    projectedReturn,
    projectedProfit: projectedReturn - totalStaked,
    settled,
    voided,
    entries,
  };
}
