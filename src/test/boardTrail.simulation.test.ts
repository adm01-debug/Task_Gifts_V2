import { describe, it, expect } from "vitest";
import {
  applyMove,
  boardProgressPercent,
  buildMoveDedupeKey,
  createInitialState,
  isPlayableBoard,
  normalizeBoard,
  rollDice,
  BOARD_DICE_FACES,
  type BoardTile,
} from "@/lib/boardTrail";

function buildBoard(): BoardTile[] {
  return [
    { id: "t0", position: 0, type: "start", label: "Partida" },
    { id: "t1", position: 1, type: "bonus", label: "Bônus", coins: 20, xp: 30 },
    { id: "t2", position: 2, type: "penalty", label: "Penalidade", coins: 15, xp: 10 },
    { id: "t3", position: 3, type: "challenge", label: "Desafio", challengeId: "quiz-1" },
    { id: "t4", position: 4, type: "neutral", label: "Neutra" },
    { id: "t5", position: 5, type: "checkpoint", label: "Checkpoint", coins: 10 },
    { id: "t6", position: 6, type: "bonus", label: "Atalho", moveBy: 2 },
    { id: "t7", position: 7, type: "neutral", label: "Neutra" },
    { id: "t8", position: 8, type: "finish", label: "Chegada", coins: 100, xp: 200 },
  ];
}

describe("boardTrail — normalização", () => {
  it("ordena, deduplica posições e sanea valores", () => {
    const board = normalizeBoard([
      { id: "b", position: 2, type: "bonus", label: " ", coins: -50, xp: Number.NaN },
      { id: "a", position: 2, type: "penalty", label: "Dup" },
      { id: "c", position: 0, type: "start", label: "Partida" },
      { id: "d", position: -3, type: "bonus", label: "Fora" },
    ]);
    expect(board.map((t) => t.position)).toEqual([0, 2]);
    expect(board[1].id).toBe("a");
    expect(board[1].label).toBe("Dup");
  });

  it("rejeita tabuleiros curtos ou sem chegada", () => {
    expect(isPlayableBoard([])).toBe(false);
    expect(isPlayableBoard(buildBoard().filter((t) => t.type !== "finish"))).toBe(false);
    expect(isPlayableBoard(buildBoard())).toBe(true);
  });
});

describe("boardTrail — dado determinístico", () => {
  it("é reprodutível e sempre dentro da faixa", () => {
    for (let i = 0; i < 300; i += 1) {
      const value = rollDice(`seed-${i}`);
      expect(value).toBe(rollDice(`seed-${i}`));
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(BOARD_DICE_FACES);
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});

describe("boardTrail — jogadas", () => {
  const board = buildBoard();

  it("retém o jogador na casa de desafio sem creditar", () => {
    const outcome = applyMove(board, { ...createInitialState(), position: 2 }, 1);
    if (outcome.tile?.type === "challenge") {
      expect(outcome.blockedByChallengeId).toBe("quiz-1");
      expect(outcome.coinsDelta).toBe(0);
      expect(outcome.xpDelta).toBe(0);
    }
  });

  it("nunca gera saldo negativo em casa de penalidade", () => {
    const outcome = applyMove(board, { ...createInitialState(), position: 1 }, "pen");
    expect(outcome.state.coins).toBeGreaterThanOrEqual(0);
    expect(outcome.state.xp).toBeGreaterThanOrEqual(0);
  });

  it("bloqueia novas jogadas após a conclusão", () => {
    const finished = { ...createInitialState(), position: 8, finished: true };
    const outcome = applyMove(board, finished, "x");
    expect(outcome.finalPosition).toBe(8);
    expect(outcome.coinsDelta).toBe(0);
  });

  it("simula 400 partidas mantendo invariantes", () => {
    for (let game = 0; game < 400; game += 1) {
      let state = createInitialState();
      for (let move = 0; move < 30 && !state.finished; move += 1) {
        const outcome = applyMove(board, state, `g${game}-m${move}`);
        expect(outcome.finalPosition).toBeGreaterThanOrEqual(0);
        expect(outcome.finalPosition).toBeLessThanOrEqual(8);
        expect(outcome.state.coins).toBeGreaterThanOrEqual(0);
        expect(outcome.state.xp).toBeGreaterThanOrEqual(0);
        expect(new Set(outcome.state.checkpoints).size).toBe(outcome.state.checkpoints.length);
        if (outcome.blockedByChallengeId) {
          expect(outcome.coinsDelta).toBe(0);
          state = { ...outcome.state, position: outcome.landedPosition + 1 };
          continue;
        }
        state = outcome.state;
      }
      expect(boardProgressPercent(board, state)).toBeLessThanOrEqual(100);
    }
  });

  it("tolera estado corrompido vindo do banco", () => {
    const outcome = applyMove(
      board,
      // @ts-expect-error simulação de payload inválido
      { position: "abc", coins: null, xp: undefined, checkpoints: null, finished: 0 },
      "corrupt",
    );
    expect(outcome.fromPosition).toBe(0);
    expect(outcome.state.coins).toBe(0);
    expect(Array.isArray(outcome.state.checkpoints)).toBe(true);
  });
});

describe("boardTrail — idempotência", () => {
  it("gera a mesma chave para a mesma jogada", () => {
    expect(buildMoveDedupeKey("tr", "us", 3)).toBe("board:tr:us:3");
    expect(buildMoveDedupeKey("tr", "us", -9)).toBe("board:tr:us:0");
  });
});