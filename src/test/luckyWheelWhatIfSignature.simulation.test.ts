import { describe, it, expect } from "vitest";
import { buildWhatIfSignature, simulateBudgetScenarios, defaultCandidates } from "@/lib/luckyWheelBudgetWhatIf";
import type { WindowComparison } from "@/lib/luckyWheelPayoutComparison";

function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function aggregate(label: string, start: string, end: string, coinsPerSpin: number, spinsPerDay: number) {
  return {
    label, startDate: start, endDate: end, days: 7, daysWithData: 7,
    spins: Math.round(spinsPerDay * 7), uniqueUsers: 50, coinsPaid: Math.round(coinsPerSpin * spinsPerDay * 7),
    xpPaid: 100, projectedCoins: coinsPerSpin * spinsPerDay * 7, coinsPerSpin, spinsPerDay,
    coinsDeviation: 0, chiPerDf: 1,
  };
}

function comparison(curStart: string, curEnd: string, cps: number): WindowComparison {
  return {
    current: aggregate("Atual", curStart, curEnd, cps, 40),
    previous: aggregate("Anterior", "2026-07-01", "2026-07-07", 20, 40),
    tests: [], verdict: "stable", notes: [],
  } as WindowComparison;
}

describe("what-if — assinatura de auditoria", () => {
  it("é determinística para a mesma entrada", () => {
    const c = comparison("2026-07-08", "2026-07-14", 32);
    const report = simulateBudgetScenarios(c, defaultCandidates(30));
    expect(buildWhatIfSignature(c, 30, report)).toBe(buildWhatIfSignature(c, 30, report));
  });

  it("muda quando janela, teto ou grade mudam", () => {
    const c1 = comparison("2026-07-08", "2026-07-14", 32);
    const c2 = comparison("2026-07-09", "2026-07-15", 32);
    const r30 = simulateBudgetScenarios(c1, defaultCandidates(30));
    const r40 = simulateBudgetScenarios(c1, defaultCandidates(40));
    expect(buildWhatIfSignature(c1, 30, r30)).not.toBe(buildWhatIfSignature(c2, 30, r30));
    expect(buildWhatIfSignature(c1, 30, r30)).not.toBe(buildWhatIfSignature(c1, 40, r40));
  });

  it("tolera comparação nula sem lançar", () => {
    const report = simulateBudgetScenarios(null, defaultCandidates(30));
    expect(() => buildWhatIfSignature(null, "abc", report)).not.toThrow();
    expect(buildWhatIfSignature(null, "abc", report)).toContain("-::-");
  });

  it("300 cenários aleatórios: colisão apenas quando entradas coincidem", () => {
    const rand = rng(4242);
    const seen = new Map<string, string>();
    for (let i = 0; i < 300; i++) {
      const day = 1 + Math.floor(rand() * 27);
      const start = `2026-07-${String(day).padStart(2, "0")}`;
      const end = `2026-07-${String(Math.min(28, day + 6)).padStart(2, "0")}`;
      const budget = Math.round(rand() * 200) / 2;
      const cps = Math.round(rand() * 100) / 2;
      const c = comparison(start, end, cps);
      const report = simulateBudgetScenarios(c, defaultCandidates(budget));
      const sig = buildWhatIfSignature(c, budget, report);
      const key = `${start}|${end}|${(Math.max(0.5, Math.min(1000, budget))).toFixed(2)}`;
      const prev = seen.get(sig);
      if (prev) expect(prev).toBe(key);
      else seen.set(sig, key);
      expect(sig.split("::")).toHaveLength(6);
    }
  });
});
