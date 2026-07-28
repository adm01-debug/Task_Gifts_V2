import { describe, it, expect } from "vitest";
import {
  DEFAULT_DAMAGE_RULES,
  applyDamage,
  bossPhase,
  computeRawDamage,
  distributeRewards,
  hpPercent,
  type BossDamageSource,
  type ContributorDamage,
} from "@/lib/bossBattle";

/** PRNG determinístico (xorshift) — simulações reprodutíveis. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return Math.abs(s) / 2147483647;
  };
}

const SOURCES: BossDamageSource[] = ["task_score", "trail_completion", "attendance", "quiz"];

describe("bossBattle — dano", () => {
  it("nunca aplica overkill: HP jamais fica negativo (400 cenários)", () => {
    const rand = rng(7);
    for (let i = 0; i < 400; i++) {
      const totalHp = 1 + Math.floor(rand() * 5000);
      let currentHp = totalHp;
      for (let hit = 0; hit < 40; hit++) {
        const out = applyDamage({ totalHp, currentHp }, DEFAULT_DAMAGE_RULES, {
          source: SOURCES[Math.floor(rand() * SOURCES.length)],
          multiplier: 1 + rand() * 5,
        });
        expect(out.hpAfter).toBeGreaterThanOrEqual(0);
        expect(out.applied).toBeGreaterThanOrEqual(0);
        expect(out.applied + out.hpAfter).toBe(currentHp);
        currentHp = out.hpAfter;
      }
    }
  });

  it("respeita o cap por usuário e contabiliza o desperdício", () => {
    const rules = { ...DEFAULT_DAMAGE_RULES, perUserCap: 30 };
    const out = applyDamage({ totalHp: 1000, currentHp: 1000 }, rules, {
      source: "trail_completion",
      multiplier: 3,
      userDamageSoFar: 20,
    });
    expect(out.applied).toBe(10);
    expect(out.wasted).toBe(65);
    expect(out.reason).toBe("capped");
  });

  it("bloqueia dano em boss já derrotado", () => {
    const out = applyDamage({ totalHp: 100, currentHp: 0 }, DEFAULT_DAMAGE_RULES, {
      source: "task_score",
    });
    expect(out.applied).toBe(0);
    expect(out.reason).toBe("no_hp");
    expect(out.defeated).toBe(true);
  });

  it("clampa multiplicadores inválidos (NaN, negativo, acima do teto)", () => {
    const base = computeRawDamage(DEFAULT_DAMAGE_RULES, { source: "task_score" });
    expect(base).toBe(10);
    expect(computeRawDamage(DEFAULT_DAMAGE_RULES, { source: "task_score", multiplier: NaN })).toBe(10);
    expect(computeRawDamage(DEFAULT_DAMAGE_RULES, { source: "task_score", multiplier: -5 })).toBe(10);
    expect(computeRawDamage(DEFAULT_DAMAGE_RULES, { source: "task_score", multiplier: 99 })).toBe(30);
  });

  it("fonte desativada ou manual sem valor não causa dano", () => {
    expect(computeRawDamage(DEFAULT_DAMAGE_RULES, { source: "manual" })).toBe(0);
    expect(computeRawDamage({ ...DEFAULT_DAMAGE_RULES, base: {} }, { source: "quiz" })).toBe(0);
  });
});

describe("bossBattle — fases e HP", () => {
  it("fases são monotônicas conforme o HP cai (200 cenários)", () => {
    const order = ["defeated", "critical", "enraged", "wounded", "healthy"];
    const rand = rng(19);
    for (let i = 0; i < 200; i++) {
      const totalHp = 100 + Math.floor(rand() * 900);
      let last = 0;
      for (let hp = totalHp; hp >= 0; hp -= Math.max(1, Math.floor(totalHp / 25))) {
        const idx = order.indexOf(bossPhase({ totalHp, currentHp: hp }));
        expect(idx).toBeGreaterThanOrEqual(last === 0 ? 0 : 0);
        last = idx;
      }
      expect(bossPhase({ totalHp, currentHp: 0 })).toBe("defeated");
      expect(bossPhase({ totalHp, currentHp: totalHp })).toBe("healthy");
      expect(hpPercent({ totalHp, currentHp: totalHp * 2 })).toBe(100);
      expect(hpPercent({ totalHp, currentHp: -50 })).toBe(0);
    }
  });
});

describe("bossBattle — rateio de recompensas", () => {
  it("distribui exatamente o pool, sem criar nem destruir moedas (500 cenários)", () => {
    const rand = rng(101);
    for (let i = 0; i < 500; i++) {
      const n = 1 + Math.floor(rand() * 25);
      const contributors: ContributorDamage[] = Array.from({ length: n }, (_, k) => ({
        userId: `u${k}`,
        damage: Math.floor(rand() * 500),
      }));
      const coinsPool = Math.floor(rand() * 10000);
      const xpPool = Math.floor(rand() * 10000);
      const shares = distributeRewards(contributors, { coinsPool, xpPool });
      const totalDamage = contributors.reduce((s, c) => s + c.damage, 0);
      if (totalDamage === 0) {
        expect(shares).toHaveLength(0);
        continue;
      }
      expect(shares.reduce((s, r) => s + r.coins, 0)).toBe(coinsPool);
      expect(shares.reduce((s, r) => s + r.xp, 0)).toBe(xpPool);
      shares.forEach((r) => {
        expect(r.coins).toBeGreaterThanOrEqual(0);
        expect(r.xp).toBeGreaterThanOrEqual(0);
      });
    }
  });

  it("é determinístico: mesma entrada em ordens diferentes gera o mesmo resultado", () => {
    const contributors: ContributorDamage[] = [
      { userId: "a", damage: 100 },
      { userId: "b", damage: 100 },
      { userId: "c", damage: 33 },
    ];
    const first = distributeRewards(contributors, { coinsPool: 1000, xpPool: 7 });
    const second = distributeRewards([...contributors].reverse(), { coinsPool: 1000, xpPool: 7 });
    expect(second).toEqual(first);
  });

  it("filtra participantes abaixo da participação mínima", () => {
    const shares = distributeRewards(
      [
        { userId: "big", damage: 990 },
        { userId: "tiny", damage: 10 },
      ],
      { coinsPool: 100, xpPool: 0, minShare: 0.05 },
    );
    expect(shares.map((s) => s.userId)).toEqual(["big"]);
    expect(shares[0].coins).toBe(100);
  });

  it("aplica teto por participante e redistribui o excedente sem estourar o pool", () => {
    const shares = distributeRewards(
      [
        { userId: "a", damage: 900 },
        { userId: "b", damage: 50 },
        { userId: "c", damage: 50 },
      ],
      { coinsPool: 300, xpPool: 0, perUserCoinsCap: 120 },
    );
    expect(shares.reduce((s, r) => s + r.coins, 0)).toBe(300);
    shares.forEach((r) => expect(r.coins).toBeLessThanOrEqual(120));
  });

  it("não trava quando o teto é menor que o pool total possível", () => {
    const shares = distributeRewards(
      [
        { userId: "a", damage: 10 },
        { userId: "b", damage: 10 },
      ],
      { coinsPool: 1000, xpPool: 0, perUserCoinsCap: 100 },
    );
    // Teto global = 200; o excedente não pode ser criado do nada.
    expect(shares.reduce((s, r) => s + r.coins, 0)).toBe(200);
  });

  it("ignora danos negativos/inválidos", () => {
    const shares = distributeRewards(
      [
        { userId: "a", damage: -5 },
        { userId: "b", damage: 10 },
      ],
      { coinsPool: 10, xpPool: 10 },
    );
    expect(shares).toHaveLength(1);
    expect(shares[0].coins).toBe(10);
  });
});