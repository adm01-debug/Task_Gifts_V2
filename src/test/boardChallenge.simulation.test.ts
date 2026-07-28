import { describe, expect, it } from "vitest";
import {
  BOARD_CHALLENGE_MAX_ATTEMPTS,
  buildChallengeDedupeKey,
  challengeRewardFactor,
  resolveChallenge,
} from "@/lib/boardChallenge";
import { BOARD_MAX_COINS_PER_MOVE, BOARD_MAX_XP_PER_MOVE } from "@/lib/boardTrail";

const tile = { type: "challenge" as const, coins: 40, xp: 60, challengeId: "q1" };

describe("resolveChallenge", () => {
  it("credita a recompensa integral no acerto de primeira", () => {
    const out = resolveChallenge({ tile, attempt: 1, isCorrect: true });
    expect(out).toMatchObject({ unblocked: true, allowRetry: false, coinsDelta: 40, xpDelta: 60 });
  });

  it("credita metade na segunda tentativa", () => {
    const out = resolveChallenge({ tile, attempt: 2, isCorrect: true });
    expect(out.coinsDelta).toBe(20);
    expect(out.xpDelta).toBe(30);
  });

  it("mantém travado com tentativa restante", () => {
    const out = resolveChallenge({ tile, attempt: 1, isCorrect: false });
    expect(out).toMatchObject({ unblocked: false, allowRetry: true, coinsDelta: 0, xpDelta: 0 });
  });

  it("desbloqueia sem prêmio ao esgotar tentativas", () => {
    const out = resolveChallenge({ tile, attempt: BOARD_CHALLENGE_MAX_ATTEMPTS, isCorrect: false });
    expect(out).toMatchObject({ unblocked: true, allowRetry: false, coinsDelta: 0, xpDelta: 0 });
  });

  it("nunca trava para sempre, mesmo com tentativa fora de faixa", () => {
    for (const attempt of [0, -5, 3, 99, Number.NaN, Number.POSITIVE_INFINITY]) {
      const out = resolveChallenge({ tile, attempt: attempt as number, isCorrect: false });
      expect(out.unblocked || out.allowRetry).toBe(true);
      if (attempt >= BOARD_CHALLENGE_MAX_ATTEMPTS) expect(out.unblocked).toBe(true);
    }
  });

  it("sanitiza valores hostis das casas", () => {
    const hostile = [
      { coins: -999, xp: -999 },
      { coins: 10_000_000, xp: 10_000_000 },
      { coins: null, xp: null },
      { coins: Number.NaN, xp: Number.NaN },
      { coins: "50" as unknown as number, xp: "abc" as unknown as number },
    ];
    for (const patch of hostile) {
      const out = resolveChallenge({
        tile: { type: "challenge", challengeId: "q", ...patch },
        attempt: 1,
        isCorrect: true,
      });
      expect(out.coinsDelta).toBeGreaterThanOrEqual(0);
      expect(out.xpDelta).toBeGreaterThanOrEqual(0);
      expect(out.coinsDelta).toBeLessThanOrEqual(BOARD_MAX_COINS_PER_MOVE);
      expect(out.xpDelta).toBeLessThanOrEqual(BOARD_MAX_XP_PER_MOVE);
      expect(Number.isInteger(out.coinsDelta)).toBe(true);
      expect(Number.isInteger(out.xpDelta)).toBe(true);
    }
  });

  it("simula 600 partidas sem violar invariantes econômicas", () => {
    let totalCoins = 0;
    let stuck = 0;
    for (let i = 0; i < 600; i += 1) {
      const coins = i % 7 === 0 ? 0 : (i * 13) % 250;
      const xp = (i * 29) % 400;
      let blocked = true;
      let attempt = 1;
      let earned = 0;
      while (blocked && attempt <= BOARD_CHALLENGE_MAX_ATTEMPTS + 1) {
        const correct = (i + attempt) % 3 === 0;
        const out = resolveChallenge({
          tile: { type: "challenge", coins, xp, challengeId: `q${i}` },
          attempt,
          isCorrect: correct,
        });
        earned += out.coinsDelta;
        expect(out.coinsDelta).toBeLessThanOrEqual(coins);
        expect(out.xpDelta).toBeLessThanOrEqual(xp);
        blocked = !out.unblocked;
        attempt += 1;
      }
      if (blocked) stuck += 1;
      totalCoins += earned;
      expect(earned).toBeLessThanOrEqual(coins);
    }
    expect(stuck).toBe(0);
    expect(totalCoins).toBeGreaterThan(0);
  });

  it("gera chaves idempotentes distintas por tentativa e estáveis por repetição", () => {
    const a = buildChallengeDedupeKey("t", "u", "c", 1);
    const b = buildChallengeDedupeKey("t", "u", "c", 2);
    expect(a).not.toBe(b);
    expect(buildChallengeDedupeKey("t", "u", "c", 1)).toBe(a);
    expect(buildChallengeDedupeKey("t", "u", "c", 0)).toBe(a);
  });

  it("fator de recompensa é monotônico e limitado", () => {
    expect(challengeRewardFactor(1)).toBe(1);
    expect(challengeRewardFactor(2)).toBe(0.5);
    expect(challengeRewardFactor(50)).toBe(0.5);
  });
});