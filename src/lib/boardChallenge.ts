/**
 * Motor puro de resolução das casas de desafio da Trilha Tabuleiro.
 *
 * Invariantes de negócio (replicados na RPC `resolve_board_challenge`):
 *  - Recompensa só existe em acerto; erro nunca credita nem debita.
 *  - A segunda tentativa vale metade da recompensa (piso), nunca negativa.
 *  - Após esgotar as tentativas o jogador é desbloqueado sem prêmio, para que
 *    o tabuleiro jamais trave permanentemente.
 *  - Todos os valores são saneados e limitados aos tetos por jogada.
 */
import {
  BOARD_MAX_COINS_PER_MOVE,
  BOARD_MAX_XP_PER_MOVE,
  type BoardTile,
} from "./boardTrail";

export const BOARD_CHALLENGE_MAX_ATTEMPTS = 2;

export interface BoardChallengeInput {
  /** Casa de desafio em que o jogador está travado. */
  tile: Pick<BoardTile, "type" | "coins" | "xp" | "challengeId">;
  /** Tentativa atual, 1-based. */
  attempt: number;
  isCorrect: boolean;
}

export interface BoardChallengeOutcome {
  /** Se o jogador deixa de estar travado nessa casa. */
  unblocked: boolean;
  /** Ainda há tentativa disponível (só ocorre em erro). */
  allowRetry: boolean;
  coinsDelta: number;
  xpDelta: number;
  /** Fração da recompensa aplicada (1 = integral, 0.5 = segunda tentativa). */
  rewardFactor: number;
}

function toSafeInt(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function clampReward(value: unknown, max: number): number {
  const raw = Math.abs(toSafeInt(value, 0));
  return Math.min(raw, max);
}

export function challengeRewardFactor(attempt: number): number {
  const safe = Math.min(
    Math.max(toSafeInt(attempt, 1), 1),
    BOARD_CHALLENGE_MAX_ATTEMPTS,
  );
  return safe === 1 ? 1 : 0.5;
}

export function resolveChallenge(input: BoardChallengeInput): BoardChallengeOutcome {
  const attempt = Math.max(toSafeInt(input.attempt, 1), 1);
  const isLastAttempt = attempt >= BOARD_CHALLENGE_MAX_ATTEMPTS;
  const factor = challengeRewardFactor(attempt);

  if (!input.isCorrect) {
    return {
      unblocked: isLastAttempt,
      allowRetry: !isLastAttempt,
      coinsDelta: 0,
      xpDelta: 0,
      rewardFactor: 0,
    };
  }

  const coins = Math.floor(clampReward(input.tile?.coins, BOARD_MAX_COINS_PER_MOVE) * factor);
  const xp = Math.floor(clampReward(input.tile?.xp, BOARD_MAX_XP_PER_MOVE) * factor);

  return {
    unblocked: true,
    allowRetry: false,
    coinsDelta: coins,
    xpDelta: xp,
    rewardFactor: factor,
  };
}

/** Chave idempotente da resolução — protege contra duplo clique e retry. */
export function buildChallengeDedupeKey(
  trailId: string,
  userId: string,
  challengeId: string,
  attempt: number,
): string {
  return `board-challenge:${trailId}:${userId}:${challengeId}:${Math.max(1, toSafeInt(attempt, 1))}`;
}