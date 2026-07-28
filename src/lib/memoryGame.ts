/**
 * Motor puro do Jogo da Memória (pareamento).
 *
 * IMPORTANTE: a fonte de verdade do crédito é a RPC `finish_memory_session`
 * (SECURITY DEFINER). Este módulo apenas (a) monta o tabuleiro embaralhado de
 * forma determinística e (b) espelha a fórmula de recompensa para prever o
 * resultado na UI e permitir simulação exaustiva em teste.
 */

export const MEMORY_COINS_PER_PAIR = 10;
export const MEMORY_XP_PER_PAIR = 15;
export const MEMORY_PERFECT_COIN_BONUS = 30;
export const MEMORY_PERFECT_XP_BONUS = 40;
export const MEMORY_SPEED_COIN_BONUS = 20;
export const MEMORY_SPEED_XP_BONUS = 25;
export const MEMORY_MAX_COINS = 200;
export const MEMORY_MAX_XP = 300;
/** Tolerância de jogadas para o bônus de precisão: pares * 1.5, arredondado para cima. */
export const MEMORY_PERFECT_MOVE_FACTOR = 1.5;
/** Tempo máximo por par para o bônus de velocidade. */
export const MEMORY_SPEED_MS_PER_PAIR = 6_000;
export const MEMORY_DAILY_REWARDED_SESSIONS = 3;

export interface MemoryPair {
  id: string;
  term: string;
  match: string;
}

export interface MemoryCard {
  /** Identificador único da carta no tabuleiro. */
  id: string;
  /** Par ao qual a carta pertence — duas cartas com o mesmo `pairId` casam. */
  pairId: string;
  label: string;
  side: "term" | "match";
}

/** PRNG determinístico (mulberry32): mesmo seed ⇒ mesmo tabuleiro. */
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

/** Hash estável de string para semente numérica (FNV-1a de 32 bits). */
export function seedFromString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * Monta o tabuleiro: cada par vira duas cartas (termo e correspondência),
 * embaralhadas com Fisher-Yates determinístico.
 */
export function buildMemoryBoard(
  pairs: ReadonlyArray<MemoryPair>,
  seed: string | number,
  maxPairs = 8,
): MemoryCard[] {
  const random = createRandom(typeof seed === "number" ? seed : seedFromString(seed));

  const usable = pairs.filter(
    (p) => p.term.trim().length > 0 && p.match.trim().length > 0,
  );
  const pool = [...usable];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.max(0, Math.floor(maxPairs)));
  const cards: MemoryCard[] = selected.flatMap((pair) => [
    { id: `${pair.id}:term`, pairId: pair.id, label: pair.term.trim(), side: "term" as const },
    { id: `${pair.id}:match`, pairId: pair.id, label: pair.match.trim(), side: "match" as const },
  ]);

  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export interface MemoryRewardInput {
  pairsTotal: number;
  matchedPairs: number;
  moves: number;
  durationMs: number;
  /** Sessões já premiadas hoje, antes desta. */
  rewardedToday?: number;
}

export interface MemoryReward {
  coins: number;
  xp: number;
  perfectBonus: boolean;
  speedBonus: boolean;
  dailyLimitReached: boolean;
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

/** Espelha exatamente `finish_memory_session`. */
export function calculateMemoryReward(input: MemoryRewardInput): MemoryReward {
  const total = clampInt(input.pairsTotal, 0, 64);
  const matched = clampInt(input.matchedPairs, 0, total);
  const moves = Math.max(clampInt(input.moves, 0, 10_000), matched);
  const duration = clampInt(input.durationMs, 0, 3_600_000);
  const rewardedToday = clampInt(input.rewardedToday ?? 0, 0, 1_000);

  const dailyLimitReached = rewardedToday >= MEMORY_DAILY_REWARDED_SESSIONS;
  if (dailyLimitReached) {
    return { coins: 0, xp: 0, perfectBonus: false, speedBonus: false, dailyLimitReached };
  }

  const complete = total > 0 && matched === total;
  const perfectBonus = complete && moves <= Math.ceil(total * MEMORY_PERFECT_MOVE_FACTOR);
  const speedBonus = complete && duration <= total * MEMORY_SPEED_MS_PER_PAIR;

  return {
    coins: Math.min(
      MEMORY_MAX_COINS,
      matched * MEMORY_COINS_PER_PAIR +
        (perfectBonus ? MEMORY_PERFECT_COIN_BONUS : 0) +
        (speedBonus ? MEMORY_SPEED_COIN_BONUS : 0),
    ),
    xp: Math.min(
      MEMORY_MAX_XP,
      matched * MEMORY_XP_PER_PAIR +
        (perfectBonus ? MEMORY_PERFECT_XP_BONUS : 0) +
        (speedBonus ? MEMORY_SPEED_XP_BONUS : 0),
    ),
    perfectBonus,
    speedBonus,
    dailyLimitReached,
  };
}