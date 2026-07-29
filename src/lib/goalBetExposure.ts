import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

/** Nível de risco da exposição do apostador frente ao saldo de moedas. */
export type ExposureLevel = "none" | "safe" | "attention" | "high";

export interface GoalBetExposure {
  /** Moedas presas em mercados ainda não finalizados. */
  exposed: number;
  /** Saldo líquido disponível (nunca negativo). */
  balance: number;
  /** exposed + balance; base do cálculo de risco. */
  bankroll: number;
  /** exposed / bankroll (0..1); 0 quando não há banca. */
  ratio: number;
  /** Quantidade de mercados abertos/travados com aporte do usuário. */
  openMarkets: number;
  level: ExposureLevel;
  /** Mensagem pronta para a UI ("" quando não há exposição). */
  message: string;
}

/** Acima disto pedimos atenção; acima do limite alto, alertamos forte. */
export const EXPOSURE_ATTENTION_RATIO = 0.3;
export const EXPOSURE_HIGH_RATIO = 0.6;

const EMPTY: GoalBetExposure = {
  exposed: 0,
  balance: 0,
  bankroll: 0,
  ratio: 0,
  openMarkets: 0,
  level: "none",
  message: "",
};

const pct = (value: number) => `${Math.round(value * 100)}%`;

function classify(ratio: number): ExposureLevel {
  if (ratio >= EXPOSURE_HIGH_RATIO) return "high";
  if (ratio >= EXPOSURE_ATTENTION_RATIO) return "attention";
  return "safe";
}

function describe(level: ExposureLevel, ratio: number, exposed: number): string {
  const share = pct(ratio);
  const coins = Math.round(exposed).toLocaleString("pt-BR");
  if (level === "high") {
    return `Atenção: ${coins} moedas (${share} da sua banca) estão apostadas em mercados em aberto. Considere aguardar a apuração antes de novos aportes.`;
  }
  if (level === "attention") {
    return `Você tem ${coins} moedas (${share} da sua banca) em mercados em aberto.`;
  }
  return `Exposição sob controle: ${coins} moedas (${share} da sua banca) em mercados em aberto.`;
}

/**
 * Exposição determinística do apostador: soma apenas os aportes em mercados
 * que ainda podem virar prejuízo (rascunho, aberto ou travado). Mercados
 * apurados ou anulados já não representam risco.
 *
 * `extraStake` permite simular o impacto de um aporte antes de confirmá-lo.
 */
export function computeGoalBetExposure(input: {
  markets: readonly PredictionMarketRow[] | null | undefined;
  stakes: readonly PredictionStakeRow[] | null | undefined;
  /** Saldo atual de moedas do usuário. */
  balance: number | null | undefined;
  extraStake?: number;
}): GoalBetExposure {
  const balance = Math.max(0, Number.isFinite(input.balance ?? NaN) ? (input.balance as number) : 0);
  const extra = Number.isFinite(input.extraStake ?? NaN)
    ? Math.max(0, input.extraStake as number)
    : 0;

  const openIds = new Set(
    (input.markets ?? [])
      .filter((m) => m.status !== "settled" && m.status !== "voided")
      .map((m) => m.id),
  );

  const touched = new Set<string>();
  let exposed = extra;

  for (const stake of input.stakes ?? []) {
    if (!openIds.has(stake.market_id)) continue;
    const amount = Number.isFinite(stake.amount) ? Math.max(0, stake.amount) : 0;
    exposed += amount;
    touched.add(stake.market_id);
  }

  if (exposed <= 0) return { ...EMPTY, balance, bankroll: balance };

  // O aporte simulado ainda sairia do saldo: a banca total não muda.
  const bankroll = balance + exposed - extra > 0 ? balance + exposed - extra : exposed;
  const ratio = bankroll > 0 ? Math.min(1, exposed / bankroll) : 0;
  const level = classify(ratio);

  return {
    exposed,
    balance,
    bankroll,
    ratio,
    openMarkets: touched.size,
    level,
    message: describe(level, ratio, exposed),
  };
}
