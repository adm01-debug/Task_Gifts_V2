/**
 * Motor puro de pontuação do Verdadeiro/Falso Relâmpago.
 *
 * IMPORTANTE: a fonte de verdade do crédito é a RPC `finish_lightning_round`
 * (SECURITY DEFINER). Este módulo é um espelho determinístico da mesma fórmula,
 * usado apenas para (a) prever a recompensa na UI e (b) permitir simulação
 * exaustiva de cenários em teste. Qualquer divergência aqui é cosmética e
 * jamais gera moedas/XP — o servidor recalcula do zero.
 */

export const LIGHTNING_ROUND_SECONDS = 60;
export const LIGHTNING_QUESTIONS_PER_ROUND = 10;
export const LIGHTNING_DAILY_ROUNDS = 3;

export const LIGHTNING_COINS_PER_CORRECT = 5;
export const LIGHTNING_XP_PER_CORRECT = 8;
export const LIGHTNING_STREAK_THRESHOLD = 5;
export const LIGHTNING_STREAK_COIN_BONUS = 25;
export const LIGHTNING_STREAK_XP_BONUS = 20;
export const LIGHTNING_MAX_COINS = 200;
export const LIGHTNING_MAX_XP = 300;

export interface LightningRewardInput {
  correctCount: number;
  bestStreak: number;
}

export interface LightningReward {
  coins: number;
  xp: number;
  streakBonusApplied: boolean;
}

function normalizeCount(value: number, max: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.floor(value)));
}

/**
 * Espelha `finish_lightning_round`: 5 moedas + 8 XP por acerto,
 * bônus fixo a partir de 5 acertos consecutivos, com teto rígido.
 */
export function calculateLightningReward(input: LightningRewardInput): LightningReward {
  const correct = normalizeCount(input.correctCount, LIGHTNING_QUESTIONS_PER_ROUND);
  const streak = normalizeCount(input.bestStreak, LIGHTNING_QUESTIONS_PER_ROUND);
  const bonus = streak >= LIGHTNING_STREAK_THRESHOLD;

  return {
    coins: Math.min(
      LIGHTNING_MAX_COINS,
      correct * LIGHTNING_COINS_PER_CORRECT + (bonus ? LIGHTNING_STREAK_COIN_BONUS : 0),
    ),
    xp: Math.min(
      LIGHTNING_MAX_XP,
      correct * LIGHTNING_XP_PER_CORRECT + (bonus ? LIGHTNING_STREAK_XP_BONUS : 0),
    ),
    streakBonusApplied: bonus,
  };
}

/** Sequência máxima observada numa lista de acertos/erros. */
export function bestStreakOf(results: readonly boolean[]): number {
  let best = 0;
  let current = 0;
  for (const ok of results) {
    current = ok ? current + 1 : 0;
    if (current > best) best = current;
  }
  return best;
}

/** Precisão em % inteiro, seguro contra divisão por zero. */
export function accuracyPercent(correct: number, answered: number): number {
  if (answered <= 0) return 0;
  return Math.round((Math.max(0, correct) / answered) * 100);
}

/** Segundos restantes até o prazo, nunca negativo. */
export function secondsRemaining(deadlineIso: string, nowMs: number = Date.now()): number {
  const deadline = Date.parse(deadlineIso);
  if (!Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - nowMs) / 1000));
}