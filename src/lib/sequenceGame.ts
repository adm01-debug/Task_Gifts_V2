/**
 * Motor puro do jogo "Ordene a Sequência" (procedimentos operacionais).
 *
 * A fonte de verdade da correção e do crédito é a RPC `submit_sequence_attempt`
 * (SECURITY DEFINER). Aqui apenas (a) embaralhamos as etapas de forma
 * determinística, (b) espelhamos a pontuação para prever o resultado na UI e
 * (c) validamos a ordem antes de gastar uma ida ao servidor.
 */

export const SEQUENCE_COINS_PER_CORRECT = 8;
export const SEQUENCE_XP_PER_CORRECT = 12;
export const SEQUENCE_PERFECT_COIN_BONUS = 40;
export const SEQUENCE_PERFECT_XP_BONUS = 60;
export const SEQUENCE_MAX_COINS = 150;
export const SEQUENCE_MAX_XP = 250;
export const SEQUENCE_DAILY_REWARDED_ATTEMPTS = 3;
export const SEQUENCE_MIN_STEPS = 3;
export const SEQUENCE_MAX_STEPS = 20;

export interface SequenceStep {
  id: string;
  label: string;
  hint?: string | null;
  /** Posição correta, começando em 1. */
  position: number;
}

/** PRNG determinístico (mulberry32). */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash FNV-1a de 32 bits. */
export function seedFromString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Ordena por `position` — a resposta correta canônica. */
export function sortByPosition(steps: ReadonlyArray<SequenceStep>): SequenceStep[] {
  return [...steps].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
}

/**
 * Embaralha as etapas garantindo que a ordem inicial não seja a correta
 * (com 2+ etapas), para o jogador nunca receber a resposta pronta.
 */
export function shuffleSteps(
  steps: ReadonlyArray<SequenceStep>,
  seed: string | number,
): SequenceStep[] {
  const ordered = sortByPosition(steps);
  if (ordered.length < 2) return ordered;

  const random = createRandom(typeof seed === "number" ? seed : seedFromString(seed));
  const shuffled = [...ordered];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const isCorrect = shuffled.every((step, index) => step.id === ordered[index].id);
  if (isCorrect) {
    [shuffled[0], shuffled[shuffled.length - 1]] = [
      shuffled[shuffled.length - 1],
      shuffled[0],
    ];
  }
  return shuffled;
}

/** Move um item de índice para outro, sem mutar a lista original. */
export function moveItem<T>(list: ReadonlyArray<T>, from: number, to: number): T[] {
  const result = [...list];
  if (
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 0 ||
    to < 0 ||
    from >= result.length ||
    to >= result.length ||
    from === to
  ) {
    return result;
  }
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item);
  return result;
}

export type OrderValidation =
  | { valid: true }
  | { valid: false; reason: "empty" | "length_mismatch" | "duplicate" | "unknown_step" };

/** Espelha a validação da RPC: mesma cardinalidade, sem repetição, sem intruso. */
export function validateOrder(
  steps: ReadonlyArray<SequenceStep>,
  order: ReadonlyArray<string>,
): OrderValidation {
  if (steps.length === 0) return { valid: false, reason: "empty" };
  if (order.length !== steps.length) return { valid: false, reason: "length_mismatch" };
  if (new Set(order).size !== order.length) return { valid: false, reason: "duplicate" };

  const known = new Set(steps.map((s) => s.id));
  if (order.some((id) => !known.has(id))) return { valid: false, reason: "unknown_step" };
  return { valid: true };
}

export interface SequenceScore {
  stepsTotal: number;
  correctPositions: number;
  isPerfect: boolean;
  /** Índices (0-based) da ordem enviada que estão na posição errada. */
  wrongIndexes: number[];
  coins: number;
  xp: number;
  dailyLimitReached: boolean;
}

/** Espelha exatamente `submit_sequence_attempt`. */
export function scoreSequence(
  steps: ReadonlyArray<SequenceStep>,
  order: ReadonlyArray<string>,
  rewardedToday = 0,
): SequenceScore {
  const validation = validateOrder(steps, order);
  const stepsTotal = steps.length;

  if (!validation.valid) {
    return {
      stepsTotal,
      correctPositions: 0,
      isPerfect: false,
      wrongIndexes: order.map((_, i) => i),
      coins: 0,
      xp: 0,
      dailyLimitReached: false,
    };
  }

  const positionById = new Map(steps.map((s) => [s.id, s.position]));
  const wrongIndexes: number[] = [];
  let correct = 0;

  order.forEach((id, index) => {
    if (positionById.get(id) === index + 1) correct += 1;
    else wrongIndexes.push(index);
  });

  const isPerfect = correct === stepsTotal && stepsTotal > 0;
  const limitReached =
    Math.max(0, Math.floor(rewardedToday)) >= SEQUENCE_DAILY_REWARDED_ATTEMPTS;

  return {
    stepsTotal,
    correctPositions: correct,
    isPerfect,
    wrongIndexes,
    coins: limitReached
      ? 0
      : Math.min(
          SEQUENCE_MAX_COINS,
          correct * SEQUENCE_COINS_PER_CORRECT +
            (isPerfect ? SEQUENCE_PERFECT_COIN_BONUS : 0),
        ),
    xp: limitReached
      ? 0
      : Math.min(
          SEQUENCE_MAX_XP,
          correct * SEQUENCE_XP_PER_CORRECT + (isPerfect ? SEQUENCE_PERFECT_XP_BONUS : 0),
        ),
    dailyLimitReached: limitReached,
  };
}

/** Normaliza posições 1..N depois de reordenar etapas na tela de autoria. */
export function renumberSteps<T extends { position: number }>(steps: ReadonlyArray<T>): T[] {
  return steps.map((step, index) => ({ ...step, position: index + 1 }));
}