import { describe, expect, it } from "vitest";

import {
  defaultCandidates,
  normalizeCandidates,
  simulateBudgetScenarios,
} from "@/lib/luckyWheelBudgetWhatIf";
import { comparePayoutWindows, type WindowComparison } from "@/lib/luckyWheelPayoutComparison";
import { buildPayoutTrend, type PayoutSnapshotRow } from "@/lib/luckyWheelPayoutHistory";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function day(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function rows(
  endDate: string,
  days: number,
  coinsPerSpin: number,
  spinsBase: number,
  seed: number,
): PayoutSnapshotRow[] {
  const rand = rng(seed);
  const out: PayoutSnapshotRow[] = [];
  for (let i = 0; i < days; i++) {
    const spins = Math.max(1, Math.round(spinsBase + (rand() - 0.5) * 10));
    out.push({
      snapshot_date: day(endDate, -i),
      spins,
      unique_users: spins,
      coins_paid: Math.round(spins * (coinsPerSpin + (rand() - 0.5) * 0.2)),
      projected_coins: spins * coinsPerSpin,
      chi_square: 3 + rand(),
      degrees_of_freedom: 5,
    });
  }
  return out;
}

function compare(all: PayoutSnapshotRow[], endDate: string, windowDays = 7): WindowComparison {
  const { points } = buildPayoutTrend(all, { days: windowDays * 2, endDate });
  return comparePayoutWindows(points, { windowDays });
}

describe("simulateBudgetScenarios", () => {
  it("é monotônico: teto maior nunca gera mais alertas (300 cenários)", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const cost = 5 + (seed % 40);
      const comparison = compare(rows("2025-05-20", 14, cost, 150 + (seed % 50), seed), "2025-05-20");
      const report = simulateBudgetScenarios(comparison, defaultCandidates(cost));
      for (let i = 1; i < report.scenarios.length; i++) {
        expect(report.scenarios[i].alertCount).toBeLessThanOrEqual(report.scenarios[i - 1].alertCount);
      }
      expect(report.baselineAlertCount).toBeLessThanOrEqual(report.scenarios[0]?.alertCount ?? 99);
    }
  });

  it("break-even silencia o estouro e um centavo abaixo dispara (150 cenários)", () => {
    for (let seed = 1; seed <= 150; seed++) {
      const cost = 8 + (seed % 25);
      const comparison = compare(rows("2025-06-10", 14, cost, 200, seed), "2025-06-10");
      const report = simulateBudgetScenarios(comparison, []);
      expect(report.breakEvenBudget).not.toBeNull();
      const be = report.breakEvenBudget!;
      const at = simulateBudgetScenarios(comparison, [be]).scenarios[0];
      expect(at.overrun).toBe(false);
      const below = simulateBudgetScenarios(comparison, [Math.max(1, be * 0.5)]).scenarios[0];
      expect(below.overrun).toBe(true);
    }
  });

  it("tolera entradas hostis sem lançar", () => {
    const hostile: unknown[] = [null, undefined, NaN, "abc", -5, 0, Infinity, {}, [], "30,5"];
    expect(() => simulateBudgetScenarios(null, hostile)).not.toThrow();
    expect(simulateBudgetScenarios(undefined, hostile).scenarios).toHaveLength(0);
    expect(normalizeCandidates(hostile)).toEqual([30.5]);
    const comparison = compare(rows("2025-05-20", 14, 20, 200, 7), "2025-05-20");
    expect(() => simulateBudgetScenarios(comparison, hostile)).not.toThrow();
  });

  it("candidatos são deduplicados e ordenados", () => {
    expect(normalizeCandidates([10, "10", 5, 20, 5])).toEqual([5, 10, 20]);
    expect(defaultCandidates(30)).toEqual([15, 22.5, 30, 37.5, 45, 60]);
  });
});
