/**
 * Motor puro da "Trilha Tipo Tabuleiro" (Board Game Path).
 *
 * A fonte de verdade do avanço e do crédito de recompensas é sempre a RPC
 * `advance_board_trail` (SECURITY DEFINER, com dedupe_key idempotente).
 * Este módulo é determinístico e serve para: (a) prever a rolagem na UI,
 * (b) resolver o efeito da casa e (c) calcular progresso/estado do jogador.
 */

export const BOARD_MIN_TILES = 5;
export const BOARD_MAX_TILES = 100;
export const BOARD_DICE_FACES = 6;
export const BOARD_MAX_COINS_PER_MOVE = 500;
export const BOARD_MAX_XP_PER_MOVE = 800;

export type BoardTileType =
  | "start"
  | "bonus"
  | "penalty"
  | "challenge"
  | "neutral"
  | "checkpoint"
  | "finish";

export interface BoardTile {
  id: string;
  /** Posição na trilha, começando em 0 (casa de partida). */
  position: number;
  type: BoardTileType;
  label: string;
  /** Moedas creditadas (bonus) ou debitadas (penalty, valor positivo). */
  coins?: number | null;
  xp?: number | null;
  /** Casas a mover para frente (positivo) ou para trás (negativo). */
  moveBy?: number | null;
  /** Id do desafio/quiz obrigatório para liberar a casa. */
  challengeId?: string | null;
}

export interface BoardPlayerState {
  /** Casa atual (0 = partida). */
  position: number;
  coins: number;
  xp: number;
  /** Casas de checkpoint já alcançadas. */
  checkpoints: number[];
  finished: boolean;
}

export interface BoardMoveOutcome {
  roll: number;
  fromPosition: number;
  /** Posição após a rolagem, antes do efeito da casa. */
  landedPosition: number;
  /** Posição final, após aplicar `moveBy` da casa. */
  finalPosition: number;
  tile: BoardTile | null;
  coinsDelta: number;
  xpDelta: number;
  blockedByChallengeId: string | null;
  finished: boolean;
  state: BoardPlayerState;
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

function toSafeInt(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Normaliza e ordena o tabuleiro, descartando casas inválidas/duplicadas.
 */
export function normalizeBoard(tiles: ReadonlyArray<BoardTile>): BoardTile[] {
  const seen = new Set<number>();
  return [...(tiles ?? [])]
    .filter((tile): tile is BoardTile => Boolean(tile) && typeof tile.id === "string")
    .map((tile) => ({
      ...tile,
      position: toSafeInt(tile.position, 0),
      coins: tile.coins == null ? null : Math.abs(toSafeInt(tile.coins)),
      xp: tile.xp == null ? null : Math.abs(toSafeInt(tile.xp)),
      moveBy: tile.moveBy == null ? null : toSafeInt(tile.moveBy),
      label: (tile.label ?? "").trim() || "Casa",
    }))
    .filter((tile) => tile.position >= 0 && tile.position < BOARD_MAX_TILES)
    .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id))
    .filter((tile) => {
      if (seen.has(tile.position)) return false;
      seen.add(tile.position);
      return true;
    });
}

export function isPlayableBoard(tiles: ReadonlyArray<BoardTile>): boolean {
  const board = normalizeBoard(tiles);
  if (board.length < BOARD_MIN_TILES) return false;
  return board.some((tile) => tile.type === "finish");
}

export function findTile(
  tiles: ReadonlyArray<BoardTile>,
  position: number,
): BoardTile | null {
  return tiles.find((tile) => tile.position === position) ?? null;
}

/** Rolagem determinística de dado (1..faces) a partir de uma semente estável. */
export function rollDice(seed: string | number, faces = BOARD_DICE_FACES): number {
  const safeFaces = clamp(toSafeInt(faces, BOARD_DICE_FACES), 2, 20);
  const random = createRandom(typeof seed === "number" ? seed : seedFromString(seed));
  return 1 + Math.floor(random() * safeFaces);
}

export function createInitialState(): BoardPlayerState {
  return { position: 0, coins: 0, xp: 0, checkpoints: [], finished: false };
}

/**
 * Aplica uma jogada completa: rolagem, deslocamento, efeito da casa e
 * atualização do estado. Nunca deixa a posição sair do tabuleiro e nunca
 * permite saldo negativo de moedas/XP acumulados na trilha.
 */
export function applyMove(
  board: ReadonlyArray<BoardTile>,
  state: BoardPlayerState,
  seed: string | number,
): BoardMoveOutcome {
  const tiles = normalizeBoard(board);
  const lastPosition = tiles.length ? tiles[tiles.length - 1].position : 0;
  const current: BoardPlayerState = {
    position: clamp(toSafeInt(state?.position, 0), 0, lastPosition),
    coins: Math.max(0, toSafeInt(state?.coins, 0)),
    xp: Math.max(0, toSafeInt(state?.xp, 0)),
    checkpoints: Array.isArray(state?.checkpoints)
      ? [...new Set(state.checkpoints.map((p) => toSafeInt(p, 0)))].sort((a, b) => a - b)
      : [],
    finished: Boolean(state?.finished),
  };

  const roll = rollDice(seed);

  // Trilha concluída ou tabuleiro inválido: jogada nula, sem crédito.
  if (current.finished || tiles.length < BOARD_MIN_TILES) {
    return {
      roll,
      fromPosition: current.position,
      landedPosition: current.position,
      finalPosition: current.position,
      tile: findTile(tiles, current.position),
      coinsDelta: 0,
      xpDelta: 0,
      blockedByChallengeId: null,
      finished: current.finished,
      state: current,
    };
  }

  const landedPosition = clamp(current.position + roll, 0, lastPosition);
  const tile = findTile(tiles, landedPosition);

  // Casa de desafio: o avanço fica retido até a conclusão do desafio.
  if (tile?.type === "challenge" && tile.challengeId) {
    return {
      roll,
      fromPosition: current.position,
      landedPosition,
      finalPosition: landedPosition,
      tile,
      coinsDelta: 0,
      xpDelta: 0,
      blockedByChallengeId: tile.challengeId,
      finished: false,
      state: { ...current, position: landedPosition },
    };
  }

  let coinsDelta = 0;
  let xpDelta = 0;

  if (tile?.type === "penalty") {
    coinsDelta = -Math.min(clamp(tile.coins ?? 0, 0, BOARD_MAX_COINS_PER_MOVE), current.coins);
    xpDelta = -Math.min(clamp(tile.xp ?? 0, 0, BOARD_MAX_XP_PER_MOVE), current.xp);
  } else if (tile?.type === "bonus" || tile?.type === "finish" || tile?.type === "checkpoint") {
    coinsDelta = clamp(tile.coins ?? 0, 0, BOARD_MAX_COINS_PER_MOVE);
    xpDelta = clamp(tile.xp ?? 0, 0, BOARD_MAX_XP_PER_MOVE);
  }

  // `moveBy` só desloca uma vez (sem cascata) para evitar laços infinitos.
  const finalPosition = clamp(landedPosition + (tile?.moveBy ?? 0), 0, lastPosition);
  const finalTile = findTile(tiles, finalPosition);
  const finished = finalTile?.type === "finish" || tile?.type === "finish";

  const checkpoints = [...current.checkpoints];
  for (const candidate of [tile, finalTile]) {
    if (candidate?.type === "checkpoint" && !checkpoints.includes(candidate.position)) {
      checkpoints.push(candidate.position);
    }
  }
  checkpoints.sort((a, b) => a - b);

  const nextState: BoardPlayerState = {
    position: finalPosition,
    coins: Math.max(0, current.coins + coinsDelta),
    xp: Math.max(0, current.xp + xpDelta),
    checkpoints,
    finished,
  };

  return {
    roll,
    fromPosition: current.position,
    landedPosition,
    finalPosition,
    tile,
    coinsDelta,
    xpDelta,
    blockedByChallengeId: null,
    finished,
    state: nextState,
  };
}

/** Percentual de avanço (0-100) do jogador na trilha. */
export function boardProgressPercent(
  board: ReadonlyArray<BoardTile>,
  state: BoardPlayerState,
): number {
  const tiles = normalizeBoard(board);
  const lastPosition = tiles.length ? tiles[tiles.length - 1].position : 0;
  if (lastPosition <= 0) return state?.finished ? 100 : 0;
  const position = clamp(toSafeInt(state?.position, 0), 0, lastPosition);
  return Math.round((position / lastPosition) * 100);
}

/**
 * Chave idempotente de uma jogada — deve ser enviada à RPC para garantir que
 * um duplo clique (ou retry de rede) nunca credite recompensa duas vezes.
 */
export function buildMoveDedupeKey(
  trailId: string,
  userId: string,
  moveIndex: number,
): string {
  return `board:${trailId}:${userId}:${Math.max(0, toSafeInt(moveIndex, 0))}`;
}