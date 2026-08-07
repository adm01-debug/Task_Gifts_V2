import { describe, expect, it } from "vitest";
import {
  LIGHTNING_MAX_COINS,
  LIGHTNING_MAX_XP,
  LIGHTNING_QUESTIONS_PER_ROUND,
  accuracyPercent,
  bestStreakOf,
  calculateLightningReward,
  secondsRemaining,
} from "@/lib/lightningQuizScoring";

/** Gerador determinístico (mulberry32) para simulações reproduzíveis. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Verdadeiro/Falso Relâmpago — motor de recompensa", () => {
  it("cobre exaustivamente as 121 combinações de acertos x sequência", () => {
    for (let correct = 0; correct <= LIGHTNING_QUESTIONS_PER_ROUND; correct++) {
      for (let streak = 0; streak <= LIGHTNING_QUESTIONS_PER_ROUND; streak++) {
        const reward = calculateLightningReward({ correctCount: correct, bestStreak: streak });

        expect(reward.coins).toBeGreaterThanOrEqual(0);
        expect(reward.xp).toBeGreaterThanOrEqual(0);
        expect(reward.coins).toBeLessThanOrEqual(LIGHTNING_MAX_COINS);
        expect(reward.xp).toBeLessThanOrEqual(LIGHTNING_MAX_XP);
        expect(Number.isInteger(reward.coins)).toBe(true);
        expect(Number.isInteger(reward.xp)).toBe(true);
        expect(reward.streakBonusApplied).toBe(streak >= 5);
      }
    }
  });

  it("é monotônico: mais acertos nunca reduzem a recompensa", () => {
    for (let streak = 0; streak <= LIGHTNING_QUESTIONS_PER_ROUND; streak++) {
      let prevCoins = -1;
      let prevXp = -1;
      for (let correct = 0; correct <= LIGHTNING_QUESTIONS_PER_ROUND; correct++) {
        const { coins, xp } = calculateLightningReward({ correctCount: correct, bestStreak: streak });
        expect(coins).toBeGreaterThanOrEqual(prevCoins);
        expect(xp).toBeGreaterThanOrEqual(prevXp);
        prevCoins = coins;
        prevXp = xp;
      }
    }
  });

  it("não paga nada em rodada zerada e respeita o teto na rodada perfeita", () => {
    expect(calculateLightningReward({ correctCount: 0, bestStreak: 0 })).toEqual({
      coins: 0,
      xp: 0,
      streakBonusApplied: false,
    });

    const perfect = calculateLightningReward({ correctCount: 10, bestStreak: 10 });
    expect(perfect.coins).toBe(75);
    expect(perfect.xp).toBe(100);
  });

  it("sanitiza entradas hostis (negativas, fracionárias, NaN, infinitas, acima do total)", () => {
    const hostile = [-999, -1, 0.9, 3.7, Number.NaN, Number.POSITIVE_INFINITY, 1e9];
    for (const correct of hostile) {
      for (const streak of hostile) {
        const reward = calculateLightningReward({ correctCount: correct, bestStreak: streak });
        expect(reward.coins).toBeGreaterThanOrEqual(0);
        expect(reward.coins).toBeLessThanOrEqual(LIGHTNING_MAX_COINS);
        expect(reward.xp).toBeGreaterThanOrEqual(0);
        expect(reward.xp).toBeLessThanOrEqual(LIGHTNING_MAX_XP);
        expect(Number.isFinite(reward.coins)).toBe(true);
        expect(Number.isFinite(reward.xp)).toBe(true);
      }
    }
  });

  it("simula 5.000 rodadas aleatórias mantendo custo médio econômico sob controle", () => {
    const random = rng(20260727);
    let totalCoins = 0;
    let totalXp = 0;
    const rounds = 5000;

    for (let i = 0; i < rounds; i++) {
      const skill = random();
      const results: boolean[] = [];
      for (let q = 0; q < LIGHTNING_QUESTIONS_PER_ROUND; q++) {
        results.push(random() < skill);
      }
      const correctCount = results.filter(Boolean).length;
      const streak = bestStreakOf(results);

      expect(streak).toBeLessThanOrEqual(correctCount);

      const reward = calculateLightningReward({ correctCount, bestStreak: streak });
      totalCoins += reward.coins;
      totalXp += reward.xp;
    }

    const avgCoins = totalCoins / rounds;
    const avgXp = totalXp / rounds;

    // Teto de exposição: 3 rodadas/dia jamais podem passar de 225 moedas.
    expect(avgCoins).toBeGreaterThan(0);
    expect(avgCoins).toBeLessThan(50);
    expect(avgXp).toBeLessThan(70);
    expect(avgCoins * 3).toBeLessThan(225);
  });
});

describe("Verdadeiro/Falso Relâmpago — utilitários de sessão", () => {
  it("calcula a melhor sequência em padrões conhecidos e aleatórios", () => {
    expect(bestStreakOf([])).toBe(0);
    expect(bestStreakOf([false, false])).toBe(0);
    expect(bestStreakOf([true, true, false, true, true, true])).toBe(3);
    expect(bestStreakOf(Array.from({ length: 10 }, () => true))).toBe(10);

    const random = rng(7);
    for (let i = 0; i < 300; i++) {
      const results = Array.from({ length: 10 }, () => random() < 0.5);
      const streak = bestStreakOf(results);
      expect(streak).toBeGreaterThanOrEqual(0);
      expect(streak).toBeLessThanOrEqual(results.filter(Boolean).length);
    }
  });

  it("calcula precisão sem divisão por zero", () => {
    expect(accuracyPercent(0, 0)).toBe(0);
    expect(accuracyPercent(5, 10)).toBe(50);
    expect(accuracyPercent(-3, 10)).toBe(0);
    expect(accuracyPercent(10, 10)).toBe(100);
  });

  it("nunca retorna tempo negativo nem quebra com data inválida", () => {
    const now = Date.parse("2026-07-27T12:00:00.000Z");
    expect(secondsRemaining("2026-07-27T12:00:30.000Z", now)).toBe(30);
    expect(secondsRemaining("2026-07-27T11:59:00.000Z", now)).toBe(0);
    expect(secondsRemaining("não é data", now)).toBe(0);
    expect(secondsRemaining("", now)).toBe(0);
  });
});