import { describe, expect, it } from "vitest";

import {
  comparisonWindowKey,
  decideComparisonAlerts,
} from "@/lib/luckyWheelComparisonAlerts";
import { comparePayoutWindows } from "@/lib/luckyWheelPayoutComparison";
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

function compare(all: PayoutSnapshotRow[], endDate: string, windowDays = 7) {
  const { points } = buildPayoutTrend(all, { days: windowDays * 2, endDate });
  return comparePayoutWindows(points, { windowDays });
}

describe("decideComparisonAlerts", () => {
  it("não alerta em séries estáveis (200 sementes)", () => {
    let alerts = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const comparison = compare(rows("2025-05-20", 14, 20, 200, seed), "2025-05-20");
      alerts += decideComparisonAlerts(comparison).length;
    }
    expect(alerts).toBeLessThan(20);
  });

  it("alerta regressão de custo quando o custo por giro dobra", () => {
    const all = [
      ...rows("2025-05-20", 7, 40, 200, 11),
      ...rows("2025-05-13", 7, 20, 200, 12),
    ];
    const decisions = decideComparisonAlerts(compare(all, "2025-05-20"));
    const cost = decisions.find((d) => d.alertType === "lucky_wheel_window_cost_regression");
    expect(cost).toBeDefined();
    expect(["medium", "high"]).toContain(cost!.severity);
    expect(cost!.dedupeKey).toContain("2025-05-20");
  });

  it("alerta estouro de orçamento mesmo sem significância", () => {
    const comparison = compare(rows("2025-05-20", 14, 30, 200, 5), "2025-05-20");
    const decisions = decideComparisonAlerts(comparison, { coinsPerSpinBudget: 10 });
    const budget = decisions.find((d) => d.alertType === "lucky_wheel_window_budget_overrun");
    expect(budget).toBeDefined();
    expect(budget!.severity).toBe("critical");
    expect(budget!.metadata.budget).toBe(10);
  });

  it("não alerta orçamento quando o custo está dentro do teto", () => {
    const comparison = compare(rows("2025-05-20", 14, 5, 200, 6), "2025-05-20");
    const decisions = decideComparisonAlerts(comparison, { coinsPerSpinBudget: 50 });
    expect(decisions.some((d) => d.alertType === "lucky_wheel_window_budget_overrun")).toBe(false);
  });

  it("alerta queda relevante de participação", () => {
    const all = [
      ...rows("2025-05-20", 7, 20, 40, 21),
      ...rows("2025-05-13", 7, 20, 300, 22),
    ];
    const decisions = decideComparisonAlerts(compare(all, "2025-05-20"));
    const drop = decisions.find((d) => d.alertType === "lucky_wheel_window_volume_drop");
    expect(drop).toBeDefined();
    expect(Number(drop!.metadata.drop)).toBeGreaterThan(0.3);
  });

  it("não alerta quando o custo cai", () => {
    const all = [
      ...rows("2025-05-20", 7, 10, 200, 31),
      ...rows("2025-05-13", 7, 30, 200, 32),
    ];
    const decisions = decideComparisonAlerts(compare(all, "2025-05-20"));
    expect(decisions.some((d) => d.alertType === "lucky_wheel_window_cost_regression")).toBe(false);
  });

  it("mantém chaves de deduplicação estáveis entre execuções", () => {
    const all = [
      ...rows("2025-05-20", 7, 40, 200, 41),
      ...rows("2025-05-13", 7, 20, 200, 42),
    ];
    const a = decideComparisonAlerts(compare(all, "2025-05-20"));
    const b = decideComparisonAlerts(compare(all, "2025-05-20"));
    expect(a.map((d) => d.dedupeKey)).toEqual(b.map((d) => d.dedupeKey));
    expect(new Set(a.map((d) => d.dedupeKey)).size).toBe(a.length);
  });

  it("ordena por severidade decrescente em 100 cenários hostis", () => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 } as const;
    for (let seed = 1; seed <= 100; seed++) {
      const all = [
        ...rows("2025-05-20", 7, 15 + (seed % 40), 30 + (seed % 200), seed),
        ...rows("2025-05-13", 7, 10 + (seed % 5), 200, seed + 500),
      ];
      const decisions = decideComparisonAlerts(compare(all, "2025-05-20"), {
        coinsPerSpinBudget: 25,
      });
      for (let i = 1; i < decisions.length; i++) {
        expect(order[decisions[i].severity]).toBeGreaterThanOrEqual(
          order[decisions[i - 1].severity],
        );
      }
      for (const d of decisions) {
        expect(d.alertType.startsWith("lucky_wheel_")).toBe(true);
        expect(d.description.length).toBeGreaterThan(10);
      }
    }
  });

  it("tolera comparações vazias e opções hostis", () => {
    const empty = comparePayoutWindows([], { windowDays: 7 });
    expect(decideComparisonAlerts(empty)).toEqual([]);
    expect(
      decideComparisonAlerts(empty, {
        coinsPerSpinBudget: -10,
        minEffectSize: -1,
        minCostIncrease: Number.NaN,
        maxVolumeDrop: 0,
      }),
    ).toEqual([]);
    // @ts-expect-error entrada hostil proposital
    expect(decideComparisonAlerts(null)).toEqual([]);
    expect(comparisonWindowKey(empty)).toContain("_");
  });
});