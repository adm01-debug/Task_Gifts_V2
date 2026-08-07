import { describe, expect, it } from "vitest";
import {
  buildMemoryBoard,
  calculateMemoryReward,
  MEMORY_DAILY_REWARDED_SESSIONS,
  MEMORY_MAX_COINS,
  MEMORY_MAX_XP,
  MEMORY_SPEED_MS_PER_PAIR,
  seedFromString,
  type MemoryPair,
} from "@/lib/memoryGame";

function makePairs(count: number): MemoryPair[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i}`,
    term: `Termo ${i}`,
    match: `Match ${i}`,
  }));
}

describe("buildMemoryBoard", () => {
  it("gera duas cartas por par e limita o tamanho do tabuleiro", () => {
    const board = buildMemoryBoard(makePairs(20), "seed", 8);
    expect(board).toHaveLength(16);
    expect(new Set(board.map((c) => c.pairId)).size).toBe(8);
    expect(new Set(board.map((c) => c.id)).size).toBe(16);
  });

  it("é determinístico para o mesmo seed e varia entre seeds", () => {
    const a = buildMemoryBoard(makePairs(10), "sessao-a").map((c) => c.id);
    const b = buildMemoryBoard(makePairs(10), "sessao-a").map((c) => c.id);
    const c = buildMemoryBoard(makePairs(10), "sessao-b").map((c) => c.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  it("descarta pares com texto vazio e tolera baralhos menores que o limite", () => {
    const board = buildMemoryBoard(
      [{ id: "ok", term: "A", match: "B" }, { id: "bad", term: "  ", match: "B" }],
      1,
      8,
    );
    expect(board).toHaveLength(2);
    expect(board.every((c) => c.pairId === "ok")).toBe(true);
  });

  it("retorna tabuleiro vazio sem pares utilizáveis", () => {
    expect(buildMemoryBoard([], "x")).toHaveLength(0);
    expect(buildMemoryBoard(makePairs(4), "x", 0)).toHaveLength(0);
  });

  it("seedFromString é estável e não negativo", () => {
    expect(seedFromString("abc")).toBe(seedFromString("abc"));
    expect(seedFromString("abc")).toBeGreaterThanOrEqual(0);
  });
});

describe("calculateMemoryReward — simulação exaustiva", () => {
  it("nunca ultrapassa os tetos em centenas de cenários", () => {
    for (let total = 0; total <= 16; total += 1) {
      for (let matched = 0; matched <= total; matched += 1) {
        for (const moves of [0, matched, total, total * 3, 10_000]) {
          for (const duration of [0, total * 3_000, total * 6_000, 3_600_000, -50]) {
            const reward = calculateMemoryReward({
              pairsTotal: total,
              matchedPairs: matched,
              moves,
              durationMs: duration,
            });
            expect(reward.coins).toBeGreaterThanOrEqual(0);
            expect(reward.xp).toBeGreaterThanOrEqual(0);
            expect(reward.coins).toBeLessThanOrEqual(MEMORY_MAX_COINS);
            expect(reward.xp).toBeLessThanOrEqual(MEMORY_MAX_XP);
            if (matched < total) {
              expect(reward.perfectBonus).toBe(false);
              expect(reward.speedBonus).toBe(false);
            }
          }
        }
      }
    }
  });

  it("concede os dois bônus na partida perfeita e rápida", () => {
    const reward = calculateMemoryReward({
      pairsTotal: 8,
      matchedPairs: 8,
      moves: 12,
      durationMs: 8 * MEMORY_SPEED_MS_PER_PAIR,
    });
    expect(reward.perfectBonus).toBe(true);
    expect(reward.speedBonus).toBe(true);
    expect(reward.coins).toBe(8 * 10 + 30 + 20);
    expect(reward.xp).toBe(Math.min(MEMORY_MAX_XP, 8 * 15 + 40 + 25));
  });

  it("perde o bônus de precisão uma jogada além da tolerância", () => {
    const base = { pairsTotal: 8, matchedPairs: 8, durationMs: 0 };
    expect(calculateMemoryReward({ ...base, moves: 12 }).perfectBonus).toBe(true);
    expect(calculateMemoryReward({ ...base, moves: 13 }).perfectBonus).toBe(false);
  });

  it("perde o bônus de velocidade um milissegundo além do limite", () => {
    const base = { pairsTotal: 5, matchedPairs: 5, moves: 5 };
    expect(calculateMemoryReward({ ...base, durationMs: 30_000 }).speedBonus).toBe(true);
    expect(calculateMemoryReward({ ...base, durationMs: 30_001 }).speedBonus).toBe(false);
  });

  it("zera a recompensa após o limite diário", () => {
    const input = { pairsTotal: 8, matchedPairs: 8, moves: 8, durationMs: 1000 };
    expect(
      calculateMemoryReward({ ...input, rewardedToday: MEMORY_DAILY_REWARDED_SESSIONS - 1 }).coins,
    ).toBeGreaterThan(0);
    const blocked = calculateMemoryReward({
      ...input,
      rewardedToday: MEMORY_DAILY_REWARDED_SESSIONS,
    });
    expect(blocked).toMatchObject({ coins: 0, xp: 0, dailyLimitReached: true });
  });

  it("sanea entradas inválidas sem lançar", () => {
    const reward = calculateMemoryReward({
      pairsTotal: Number.NaN,
      matchedPairs: 99,
      moves: Number.POSITIVE_INFINITY,
      durationMs: Number.NaN,
    });
    expect(reward.coins).toBe(0);
    expect(reward.xp).toBe(0);
  });
});