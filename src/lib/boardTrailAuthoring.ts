/**
 * Validação e simulação puras da autoria da "Trilha Tipo Tabuleiro".
 *
 * O objetivo é impedir que um tabuleiro inconsistente chegue ao banco:
 * buracos de posição (o dado cairia numa casa inexistente), múltiplas
 * chegadas, atalhos que pulam casas de desafio (burlando o bloqueio) e
 * economias impossíveis de custear. Nada aqui credita recompensa — o
 * crédito é exclusivo da RPC `advance_board_trail`.
 */

import {
  BOARD_MAX_COINS_PER_MOVE,
  BOARD_MAX_TILES,
  BOARD_MAX_XP_PER_MOVE,
  BOARD_MIN_TILES,
  applyMove,
  createInitialState,
  normalizeBoard,
  type BoardTile,
  type BoardTileType,
} from "./boardTrail";

export const BOARD_TITLE_MAX = 80;
export const BOARD_DESCRIPTION_MAX = 240;
export const BOARD_LABEL_MAX = 60;
export const BOARD_MIN_MOVES_PER_DAY = 1;
export const BOARD_MAX_MOVES_PER_DAY = 20;

export const BOARD_TILE_TYPES: ReadonlyArray<{ value: BoardTileType; label: string }> = [
  { value: "start", label: "Partida" },
  { value: "neutral", label: "Neutra" },
  { value: "bonus", label: "Bônus" },
  { value: "penalty", label: "Penalidade" },
  { value: "checkpoint", label: "Checkpoint" },
  { value: "challenge", label: "Desafio" },
  { value: "finish", label: "Chegada" },
];

export interface TileDraft {
  /** Ausente em casas ainda não persistidas. */
  id?: string;
  position: number;
  type: BoardTileType;
  label: string;
  coins: number | null;
  xp: number | null;
  moveBy: number | null;
  challengeId: string | null;
}

export interface TrailDraft {
  title: string;
  description: string;
  departmentId: string | null;
  status: "draft" | "active" | "archived";
  maxMovesPerDay: number;
}

export interface BoardIssue {
  /** `trail` para o cabeçalho, ou o índice da casa (`tile:0`). */
  scope: string;
  severity: "error" | "warning";
  message: string;
}

export interface BoardValidation {
  valid: boolean;
  issues: BoardIssue[];
  errors: BoardIssue[];
  warnings: BoardIssue[];
  /** Casas normalizadas e reindexadas de 0..n-1, prontas para persistir. */
  normalizedTiles: TileDraft[];
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizeAmount(value: number | null | undefined, max: number): number | null {
  if (value == null) return null;
  const parsed = toInt(value, 0);
  if (parsed <= 0) return null;
  return Math.min(parsed, max);
}

/** Casas que sempre concedem valor (nunca debitam). */
const REWARD_TYPES: ReadonlyArray<BoardTileType> = ["bonus", "checkpoint", "finish"];

export function validateTrailDraft(
  trail: TrailDraft,
  tiles: ReadonlyArray<TileDraft>,
): BoardValidation {
  const issues: BoardIssue[] = [];
  const title = normalizeText(trail.title);
  const description = normalizeText(trail.description);

  if (!title) {
    issues.push({ scope: "trail", severity: "error", message: "Informe um título para a trilha." });
  } else if (title.length > BOARD_TITLE_MAX) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: `O título deve ter no máximo ${BOARD_TITLE_MAX} caracteres.`,
    });
  }
  if (description.length > BOARD_DESCRIPTION_MAX) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: `A descrição deve ter no máximo ${BOARD_DESCRIPTION_MAX} caracteres.`,
    });
  }

  const movesPerDay = toInt(trail.maxMovesPerDay, 0);
  if (movesPerDay < BOARD_MIN_MOVES_PER_DAY || movesPerDay > BOARD_MAX_MOVES_PER_DAY) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: `As jogadas por dia devem ficar entre ${BOARD_MIN_MOVES_PER_DAY} e ${BOARD_MAX_MOVES_PER_DAY}.`,
    });
  }

  // Reindexa pela ordem informada: a UI mantém as casas em sequência, então a
  // posição real é o índice — isso elimina buracos e duplicidades por construção.
  const normalizedTiles: TileDraft[] = tiles.map((tile, index) => ({
    id: tile.id,
    position: index,
    type: tile.type,
    label: normalizeText(tile.label) || `Casa ${index}`,
    coins: normalizeAmount(tile.coins, BOARD_MAX_COINS_PER_MOVE),
    xp: normalizeAmount(tile.xp, BOARD_MAX_XP_PER_MOVE),
    moveBy: tile.moveBy == null ? null : toInt(tile.moveBy, 0) || null,
    challengeId: normalizeText(tile.challengeId) || null,
  }));

  const total = normalizedTiles.length;
  const last = total - 1;

  if (total < BOARD_MIN_TILES) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: `A trilha precisa de pelo menos ${BOARD_MIN_TILES} casas.`,
    });
  }
  if (total > BOARD_MAX_TILES) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: `A trilha suporta no máximo ${BOARD_MAX_TILES} casas.`,
    });
  }

  const starts = normalizedTiles.filter((t) => t.type === "start");
  const finishes = normalizedTiles.filter((t) => t.type === "finish");

  if (starts.length !== 1 || starts[0]?.position !== 0) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: "A trilha deve ter exatamente uma casa de Partida, na primeira posição.",
    });
  }
  if (finishes.length !== 1) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: "A trilha deve ter exatamente uma casa de Chegada.",
    });
  } else if (finishes[0].position !== last) {
    issues.push({
      scope: "trail",
      severity: "error",
      message: "A casa de Chegada precisa ser a última da trilha.",
    });
  }

  normalizedTiles.forEach((tile, index) => {
    const scope = `tile:${index}`;

    if (tile.label.length > BOARD_LABEL_MAX) {
      issues.push({
        scope,
        severity: "error",
        message: `O rótulo deve ter no máximo ${BOARD_LABEL_MAX} caracteres.`,
      });
    }

    if (tile.type === "challenge" && !tile.challengeId) {
      issues.push({
        scope,
        severity: "error",
        message: "Casa de Desafio exige um desafio vinculado (senão o jogador trava).",
      });
    }
    if (tile.type !== "challenge" && tile.challengeId) {
      issues.push({
        scope,
        severity: "warning",
        message: "O desafio vinculado só tem efeito em casas do tipo Desafio.",
      });
    }

    const hasValue = (tile.coins ?? 0) > 0 || (tile.xp ?? 0) > 0;
    if ((REWARD_TYPES.includes(tile.type) || tile.type === "penalty") && !hasValue) {
      issues.push({
        scope,
        severity: "warning",
        message: "Casa sem moedas nem XP: o jogador não sentirá efeito algum.",
      });
    }
    if ((tile.type === "start" || tile.type === "neutral" || tile.type === "challenge") && hasValue) {
      issues.push({
        scope,
        severity: "warning",
        message: "Moedas/XP são ignorados neste tipo de casa pelo motor de jogo.",
      });
    }

    if (tile.moveBy != null && tile.moveBy !== 0) {
      if (tile.type === "start" || tile.type === "finish") {
        issues.push({
          scope,
          severity: "error",
          message: "Partida e Chegada não podem deslocar o jogador.",
        });
      }
      const target = index + tile.moveBy;
      if (target < 0 || target > last) {
        issues.push({
          scope,
          severity: "error",
          message: "O deslocamento aponta para fora do tabuleiro.",
        });
      } else {
        const targetTile = normalizedTiles[target];
        if (targetTile?.type === "challenge") {
          issues.push({
            scope,
            severity: "error",
            message: "O deslocamento cai numa casa de Desafio e burlaria o bloqueio.",
          });
        }
        if (targetTile?.moveBy) {
          issues.push({
            scope,
            severity: "warning",
            message: "A casa de destino também desloca, mas o motor não encadeia movimentos.",
          });
        }
      }
    }
  });

  const errors = issues.filter((i) => i.severity === "error");
  return {
    valid: errors.length === 0,
    issues,
    errors,
    warnings: issues.filter((i) => i.severity === "warning"),
    normalizedTiles,
  };
}

export interface BoardEconomics {
  runs: number;
  /** Partidas que alcançaram a Chegada dentro do limite de jogadas. */
  completedRuns: number;
  avgMoves: number;
  avgCoins: number;
  avgXp: number;
  maxCoins: number;
  /** Custo estimado em moedas por jogador que percorre a trilha inteira. */
  projectedCoinsPerPlayer: number;
}

/**
 * Simula partidas determinísticas para estimar o custo da trilha antes de
 * publicar. Usa o mesmo motor da UI, então reflete penalidades e atalhos.
 */
export function simulateBoardEconomics(
  tiles: ReadonlyArray<BoardTile>,
  runs = 200,
  maxMovesPerRun = 200,
): BoardEconomics {
  const board = normalizeBoard(tiles);
  const safeRuns = Math.max(1, Math.min(2000, toInt(runs, 200)));
  let completedRuns = 0;
  let totalMoves = 0;
  let totalCoins = 0;
  let totalXp = 0;
  let maxCoins = 0;

  for (let run = 0; run < safeRuns; run += 1) {
    let state = createInitialState();
    let moves = 0;
    while (!state.finished && moves < maxMovesPerRun) {
      const outcome = applyMove(board, state, `sim:${run}:${moves}`);
      moves += 1;
      // Casa de desafio retém o jogador: assumimos que ele conclui o desafio
      // e segue na jogada seguinte (o custo total não muda).
      state = outcome.state;
      if (outcome.blockedByChallengeId) continue;
      if (outcome.finished) break;
    }
    if (state.finished) completedRuns += 1;
    totalMoves += moves;
    totalCoins += state.coins;
    totalXp += state.xp;
    maxCoins = Math.max(maxCoins, state.coins);
  }

  const avgCoins = totalCoins / safeRuns;
  return {
    runs: safeRuns,
    completedRuns,
    avgMoves: Math.round((totalMoves / safeRuns) * 10) / 10,
    avgCoins: Math.round(avgCoins),
    avgXp: Math.round(totalXp / safeRuns),
    maxCoins,
    projectedCoinsPerPlayer: Math.round(avgCoins),
  };
}

/** Converte casas persistidas em rascunho editável. */
export function tilesToDrafts(tiles: ReadonlyArray<BoardTile>): TileDraft[] {
  return [...tiles]
    .sort((a, b) => a.position - b.position)
    .map((tile, index) => ({
      id: tile.id,
      position: index,
      type: tile.type,
      label: tile.label,
      coins: tile.coins ?? null,
      xp: tile.xp ?? null,
      moveBy: tile.moveBy ?? null,
      challengeId: tile.challengeId ?? null,
    }));
}

/** Converte rascunhos em casas do motor (para simular antes de salvar). */
export function draftsToTiles(drafts: ReadonlyArray<TileDraft>): BoardTile[] {
  return drafts.map((draft, index) => ({
    id: draft.id ?? `draft-${index}`,
    position: index,
    type: draft.type,
    label: draft.label,
    coins: draft.coins,
    xp: draft.xp,
    moveBy: draft.moveBy,
    challengeId: draft.challengeId,
  }));
}

/** Tabuleiro inicial sugerido ao criar uma trilha nova. */
export function createStarterTiles(): TileDraft[] {
  return [
    { position: 0, type: "start", label: "Partida", coins: null, xp: null, moveBy: null, challengeId: null },
    { position: 1, type: "bonus", label: "Bônus rápido", coins: 20, xp: 30, moveBy: null, challengeId: null },
    { position: 2, type: "neutral", label: "Respiro", coins: null, xp: null, moveBy: null, challengeId: null },
    { position: 3, type: "checkpoint", label: "Checkpoint", coins: 30, xp: 50, moveBy: null, challengeId: null },
    { position: 4, type: "penalty", label: "Retrabalho", coins: 15, xp: null, moveBy: null, challengeId: null },
    { position: 5, type: "finish", label: "Chegada", coins: 100, xp: 200, moveBy: null, challengeId: null },
  ];
}