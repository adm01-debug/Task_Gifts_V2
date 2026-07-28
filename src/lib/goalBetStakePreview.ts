import type { PredictionMarketRow } from "@/services/predictionMarketService";

/** Motivo pelo qual um aporte não pode ser confirmado. */
export type StakePreviewBlock =
  | "no_market"
  | "no_option"
  | "market_closed"
  | "invalid_amount"
  | "below_min"
  | "above_user_cap";

export interface GoalBetStakePreview {
  /** true quando o aporte pode ser enviado ao servidor. */
  valid: boolean;
  /** Primeiro impedimento encontrado (null quando válido). */
  block: StakePreviewBlock | null;
  /** Mensagem pronta para a UI (sempre preenchida). */
  message: string;
  /** Quanto ainda cabe no teto por usuário (Infinity quando não há teto). */
  remaining: number;
  /** Multiplicador atual da opção, antes do aporte. */
  multiplierBefore: number;
  /** Multiplicador da opção considerando este aporte (sempre <= antes). */
  multiplierAfter: number;
  /** Retorno bruto projetado para o valor aportado agora. */
  projectedReturn: number;
  /** projectedReturn - amount (pode ser negativo). */
  projectedProfit: number;
  /** Queda percentual de odds causada pelo próprio aporte (0..1). */
  dilution: number;
  /** true quando o aporte representa fatia dominante do pool da opção. */
  concentrated: boolean;
}

const CONCENTRATION_THRESHOLD = 0.5;

function base(remaining: number, block: StakePreviewBlock, message: string): GoalBetStakePreview {
  return {
    valid: false,
    block,
    message,
    remaining,
    multiplierBefore: 0,
    multiplierAfter: 0,
    projectedReturn: 0,
    projectedProfit: 0,
    dilution: 0,
    concentrated: false,
  };
}

function multiplier(netPool: number, optionPool: number): number {
  if (optionPool <= 0) return 0;
  return netPool / optionPool;
}

/**
 * Prévia determinística de um aporte em mercado parimutuel: valida limites e
 * projeta odds antes/depois, já descontando o rake. Sem efeitos colaterais —
 * a decisão final continua sendo do servidor.
 */
export function computeGoalBetStakePreview(input: {
  market: PredictionMarketRow | null | undefined;
  optionId: string | null | undefined;
  amount: number;
  alreadyStaked: number;
}): GoalBetStakePreview {
  const { market, optionId, amount } = input;
  const alreadyStaked = Math.max(0, input.alreadyStaked || 0);

  if (!market) return base(0, "no_market", "Mercado indisponível.");

  const cap = market.max_stake_per_user > 0 ? market.max_stake_per_user : Number.POSITIVE_INFINITY;
  const remaining = Number.isFinite(cap) ? Math.max(0, cap - alreadyStaked) : Number.POSITIVE_INFINITY;

  if (!optionId) return base(remaining, "no_option", "Escolha uma opção para apostar.");
  const option = market.options.find((o) => o.id === optionId);
  if (!option) return base(remaining, "no_option", "Opção não encontrada neste mercado.");
  if (market.status !== "open") {
    return base(remaining, "market_closed", "Este mercado não está aceitando aportes.");
  }
  if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0) {
    return base(remaining, "invalid_amount", "Informe um valor inteiro de moedas.");
  }
  if (amount < market.min_stake) {
    return base(remaining, "below_min", `Aporte mínimo de ${market.min_stake} moedas.`);
  }
  if (amount > remaining) {
    return base(
      remaining,
      "above_user_cap",
      remaining <= 0
        ? "Você já atingiu o teto de aporte neste mercado."
        : `Você ainda pode apostar ${remaining} moedas neste mercado.`,
    );
  }

  const rake = Math.max(0, Math.min(10000, market.rake_bps)) / 10000;
  const grossPool = Math.max(
    Math.max(0, market.total_pool),
    market.options.reduce((acc, o) => acc + Math.max(0, o.pool), 0),
  );
  const optionPool = Math.max(0, option.pool);

  const multiplierBefore = multiplier(grossPool * (1 - rake), optionPool);
  const multiplierAfter = multiplier((grossPool + amount) * (1 - rake), optionPool + amount);

  const projectedReturn = Math.max(0, Math.floor(amount * multiplierAfter));
  const dilution =
    multiplierBefore > 0 ? Math.max(0, 1 - multiplierAfter / multiplierBefore) : 0;
  const concentrated = amount / (optionPool + amount) >= CONCENTRATION_THRESHOLD;

  return {
    valid: true,
    block: null,
    message: concentrated
      ? "Você domina o pool desta opção — o retorno tende a ser próximo do aporte."
      : "Aporte válido.",
    remaining,
    multiplierBefore,
    multiplierAfter,
    projectedReturn,
    projectedProfit: projectedReturn - amount,
    dilution,
    concentrated,
  };
}
