import { describe, expect, it } from "vitest";

import {
  hasBlockingIssues,
  projectBudget,
  projectWheel,
  resolvePrizeIndex,
  validateWheelConfig,
  type OddsPrize,
} from "@/lib/luckyWheelOdds";

const prize = (over: Partial<OddsPrize> = {}): OddsPrize => ({
  id: over.id ?? `p-${Math.random().toString(36).slice(2, 10)}`,
  label: "Prêmio",
  prize_type: "coins",
  amount: 10,
  weight: 10,
  rarity: "common",
  is_active: true,
  achievement_id: null,
  ...over,
});

/** PRNG determinístico (mulberry32) para reprodutibilidade das simulações. */
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const baseline: OddsPrize[] = [
  prize({ id: "a", label: "10 moedas", prize_type: "coins", amount: 10, weight: 300 }),
  prize({ id: "b", label: "25 moedas", prize_type: "coins", amount: 25, weight: 200 }),
  prize({ id: "c", label: "50 XP", prize_type: "xp", amount: 50, weight: 200 }),
  prize({ id: "d", label: "Quase lá!", prize_type: "nothing", amount: 0, weight: 250 }),
  prize({ id: "e", label: "Jackpot", prize_type: "coins", amount: 500, weight: 10, rarity: "legendary" }),
  prize({ id: "f", label: "Inativo", prize_type: "coins", amount: 9999, weight: 999, is_active: false }),
];

describe("resolvePrizeIndex — paridade com o laço da RPC", () => {
  it("cobre exaustivamente todas as faixas de roll do baseline", () => {
    const projection = projectWheel(baseline);
    expect(projection.totalWeight).toBe(960);

    for (let roll = 0; roll < projection.totalWeight; roll += 1) {
      const index = resolvePrizeIndex(baseline, roll);
      const odds = projection.odds[index];
      expect(odds, `roll ${roll} sem setor`).toBeDefined();
      expect(roll).toBeGreaterThanOrEqual(odds.rangeStart);
      expect(roll).toBeLessThanOrEqual(odds.rangeEnd);
    }
  });

  it("nunca sorteia prêmio inativo em 200 mil giros", () => {
    const projection = projectWheel(baseline);
    const rng = makeRng(20260727);
    for (let i = 0; i < 200_000; i += 1) {
      const roll = Math.floor(rng() * projection.totalWeight);
      const index = resolvePrizeIndex(baseline, roll);
      expect(projection.odds[index].id).not.toBe("f");
    }
  });

  it("frequência empírica converge para o peso configurado (tolerância 1,5%)", () => {
    const projection = projectWheel(baseline);
    const counts = new Map<string, number>();
    const rng = makeRng(4242);
    const spins = 300_000;

    for (let i = 0; i < spins; i += 1) {
      const roll = Math.floor(rng() * projection.totalWeight);
      const id = projection.odds[resolvePrizeIndex(baseline, roll)].id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }

    for (const odds of projection.odds) {
      const empirical = (counts.get(odds.id) ?? 0) / spins;
      expect(Math.abs(empirical - odds.probability)).toBeLessThan(0.015);
    }
  });

  it("é determinístico: mesmo roll devolve sempre o mesmo setor", () => {
    for (let roll = 0; roll < 960; roll += 7) {
      const first = resolvePrizeIndex(baseline, roll);
      for (let repeat = 0; repeat < 5; repeat += 1) {
        expect(resolvePrizeIndex(baseline, roll)).toBe(first);
      }
    }
  });

  it("blinda rolls hostis (negativo, acima do total, NaN, fracionário, Infinity)", () => {
    const hostile = [-1, -9999, 960, 100_000, Number.NaN, Number.POSITIVE_INFINITY, 12.9, 0.4];
    for (const roll of hostile) {
      const index = resolvePrizeIndex(baseline, roll);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(projectWheel(baseline).activeCount);
    }
    expect(resolvePrizeIndex(baseline, -5)).toBe(0);
    expect(resolvePrizeIndex(baseline, 10_000)).toBe(4);
  });

  it("retorna -1 quando não há setor sorteável", () => {
    expect(resolvePrizeIndex([], 0)).toBe(-1);
    expect(resolvePrizeIndex([prize({ is_active: false })], 0)).toBe(-1);
    expect(resolvePrizeIndex([prize({ weight: 0 })], 0)).toBe(-1);
  });

  it("mantém coerência em 400 configurações aleatórias de pesos", () => {
    const rng = makeRng(777);
    for (let scenario = 0; scenario < 400; scenario += 1) {
      const size = 1 + Math.floor(rng() * 12);
      const prizes = Array.from({ length: size }, (_, i) =>
        prize({
          id: `s${scenario}-${i}`,
          label: `Setor ${i}`,
          weight: 1 + Math.floor(rng() * 500),
          amount: Math.floor(rng() * 200),
          prize_type: rng() > 0.8 ? "nothing" : rng() > 0.5 ? "xp" : "coins",
          is_active: rng() > 0.15,
        }),
      );
      const projection = projectWheel(prizes);
      if (projection.activeCount === 0) {
        expect(resolvePrizeIndex(prizes, 0)).toBe(-1);
        continue;
      }

      const sumProb = projection.odds.reduce((s, o) => s + o.probability, 0);
      expect(sumProb).toBeCloseTo(1, 10);
      expect(projection.odds[projection.odds.length - 1].rangeEnd).toBe(projection.totalWeight - 1);

      for (let attempt = 0; attempt < 40; attempt += 1) {
        const roll = Math.floor(rng() * projection.totalWeight);
        const odds = projection.odds[resolvePrizeIndex(prizes, roll)];
        expect(roll).toBeGreaterThanOrEqual(odds.rangeStart);
        expect(roll).toBeLessThanOrEqual(odds.rangeEnd);
      }
    }
  });
});

describe("projectWheel — economia", () => {
  it("calcula valor esperado de moedas e XP", () => {
    const projection = projectWheel(baseline);
    // (300*10 + 200*25 + 10*500) / 960
    expect(projection.expectedCoinsPerSpin).toBeCloseTo(13000 / 960, 6);
    expect(projection.expectedXpPerSpin).toBeCloseTo((200 * 50) / 960, 6);
    expect(projection.emptyProbability).toBeCloseTo(250 / 960, 6);
  });

  it("trata roleta vazia sem divisão por zero", () => {
    const projection = projectWheel([]);
    expect(projection.totalWeight).toBe(0);
    expect(projection.expectedCoinsPerSpin).toBe(0);
    expect(projection.emptyProbability).toBe(0);
    expect(Number.isNaN(projection.expectedXpPerSpin)).toBe(false);
  });

  it("conta setor de valor zero como vazio mesmo com tipo premiado", () => {
    const projection = projectWheel([
      prize({ id: "x", prize_type: "coins", amount: 0, weight: 1 }),
      prize({ id: "y", prize_type: "coins", amount: 10, weight: 1 }),
    ]);
    expect(projection.emptyProbability).toBeCloseTo(0.5, 10);
  });

  it("projeta orçamento com entradas hostis sem produzir NaN", () => {
    const projection = projectWheel(baseline);
    const cases = [
      { activeUsers: 500, participationRate: 0.4, days: 30 },
      { activeUsers: -10, participationRate: 0.5, days: 30 },
      { activeUsers: 100, participationRate: 5, days: 30 },
      { activeUsers: 100, participationRate: -2, days: 30 },
      { activeUsers: 100, participationRate: 0.5, days: -7 },
      { activeUsers: 0, participationRate: 1, days: 365 },
    ];
    for (const input of cases) {
      const budget = projectBudget(projection, input);
      expect(Number.isFinite(budget.coins)).toBe(true);
      expect(budget.spins).toBeGreaterThanOrEqual(0);
      expect(budget.coins).toBeGreaterThanOrEqual(0);
      expect(budget.xp).toBeGreaterThanOrEqual(0);
    }
    expect(projectBudget(projection, { activeUsers: 100, participationRate: 5, days: 30 }).spins).toBe(3000);
  });
});

describe("validateWheelConfig — guarda de configuração", () => {
  it("aprova o baseline sem erros bloqueantes", () => {
    const issues = validateWheelConfig(baseline);
    expect(hasBlockingIssues(issues)).toBe(false);
  });

  it("bloqueia roleta sem prêmios ativos", () => {
    const issues = validateWheelConfig([prize({ is_active: false })]);
    expect(hasBlockingIssues(issues)).toBe(true);
    expect(issues[0].code).toBe("no_active_prizes");
  });

  it("bloqueia peso, valor, rótulo e conquista inválidos", () => {
    const issues = validateWheelConfig([
      prize({ id: "1", label: "  ", weight: 10 }),
      prize({ id: "2", label: "Peso zero", weight: 0 }),
      prize({ id: "3", label: "Peso fracionário", weight: 2.5 }),
      prize({ id: "4", label: "Valor negativo", amount: -5 }),
      prize({ id: "5", label: "Conquista", prize_type: "achievement", amount: 0, achievement_id: null }),
    ]);
    const codes = issues.filter((i) => i.level === "error").map((i) => i.code);
    expect(codes).toContain("empty_label");
    expect(codes).toContain("invalid_weight");
    expect(codes).toContain("invalid_amount");
    expect(codes).toContain("achievement_missing");
    expect(hasBlockingIssues(issues)).toBe(true);
  });

  it("bloqueia roleta 100% vazia e alerta frustração alta", () => {
    const allEmpty = validateWheelConfig([
      prize({ id: "a", label: "Nada 1", prize_type: "nothing", amount: 0 }),
      prize({ id: "b", label: "Nada 2", prize_type: "nothing", amount: 0 }),
      prize({ id: "c", label: "Nada 3", prize_type: "nothing", amount: 0 }),
    ]);
    expect(allEmpty.map((i) => i.code)).toContain("all_empty");

    const frustrating = validateWheelConfig([
      prize({ id: "a", label: "Nada", prize_type: "nothing", amount: 0, weight: 80 }),
      prize({ id: "b", label: "10 moedas", amount: 10, weight: 10 }),
      prize({ id: "c", label: "20 moedas", amount: 20, weight: 10 }),
    ]);
    expect(frustrating.map((i) => i.code)).toContain("high_empty_rate");
    expect(hasBlockingIssues(frustrating)).toBe(false);
  });

  it("alerta ausência de setor vazio, duplicidade e excesso de setores", () => {
    const issues = validateWheelConfig([
      prize({ id: "a", label: "10 moedas", amount: 10 }),
      prize({ id: "b", label: "10 Moedas", amount: 10 }),
      prize({ id: "c", label: "20 moedas", amount: 20 }),
    ]);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("no_empty_sector");
    expect(codes).toContain("duplicate_label");

    const many = Array.from({ length: 14 }, (_, i) =>
      prize({ id: `m${i}`, label: `Setor ${i}`, amount: i === 0 ? 0 : 10, prize_type: i === 0 ? "nothing" : "coins" }),
    );
    expect(validateWheelConfig(many).map((i) => i.code)).toContain("too_many_sectors");
  });

  it("alerta inflação econômica e lendário comum demais", () => {
    const issues = validateWheelConfig([
      prize({ id: "a", label: "Nada", prize_type: "nothing", amount: 0, weight: 10 }),
      prize({ id: "b", label: "Jackpot", amount: 1000, weight: 90, rarity: "legendary" }),
      prize({ id: "c", label: "Bônus", amount: 100, weight: 10 }),
    ]);
    const codes = issues.map((i) => i.code);
    expect(codes).toContain("economy_inflation");
    expect(codes).toContain("legendary_too_common");
  });

  it("varre 200 configurações aleatórias sem lançar exceção", () => {
    const rng = makeRng(31337);
    for (let scenario = 0; scenario < 200; scenario += 1) {
      const size = Math.floor(rng() * 16);
      const prizes = Array.from({ length: size }, (_, i) =>
        prize({
          id: `v${scenario}-${i}`,
          label: rng() > 0.9 ? "" : `Setor ${Math.floor(rng() * 4)}`,
          weight: Math.floor(rng() * 300) - 20,
          amount: Math.floor(rng() * 800) - 50,
          rarity: rng() > 0.85 ? "legendary" : "common",
          prize_type: rng() > 0.75 ? "nothing" : rng() > 0.6 ? "achievement" : "coins",
          is_active: rng() > 0.1,
        }),
      );
      expect(() => validateWheelConfig(prizes)).not.toThrow();
      const issues = validateWheelConfig(prizes);
      for (const issue of issues) {
        expect(issue.message.length).toBeGreaterThan(0);
        expect(["error", "warning"]).toContain(issue.level);
      }
    }
  });
});
