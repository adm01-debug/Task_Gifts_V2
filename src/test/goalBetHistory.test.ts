import { describe, expect, it } from "vitest";
import { computeGoalBetHistory } from "@/lib/goalBetHistory";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

function market(overrides: Partial<PredictionMarketRow> = {}): PredictionMarketRow {
  return {
    id: "m1",
    title: "Meta Q3",
    description: null,
    status: "settled",
    min_stake: 10,
    max_stake_per_user: 500,
    rake_bps: 0,
    locks_at: "2026-01-01T00:00:00Z",
    resolves_at: null,
    winning_option_id: "a",
    total_pool: 1000,
    rake_collected: 0,
    settled_at: "2026-01-02T00:00:00Z",
    created_at: "2025-12-01T00:00:00Z",
    options: [
      { id: "a", market_id: "m1", label: "Ana", sort_order: 0, pool: 400 },
      { id: "b", market_id: "m1", label: "Bruno", sort_order: 1, pool: 600 },
    ],
    ...overrides,
  };
}

function stake(o: Partial<PredictionStakeRow> = {}): PredictionStakeRow {
  return {
    id: "s1",
    market_id: "m1",
    option_id: "a",
    amount: 100,
    payout: 250,
    created_at: "2025-12-02T00:00:00Z",
    ...o,
  };
}

describe("computeGoalBetHistory", () => {
  it("retorna vazio sem dados", () => {
    expect(computeGoalBetHistory([], [stake()]).items).toHaveLength(0);
    expect(computeGoalBetHistory([market()], []).items).toHaveLength(0);
    expect(computeGoalBetHistory(null, null).roi).toBe(0);
  });

  it("ignora mercados ainda abertos ou travados", () => {
    expect(computeGoalBetHistory([market({ status: "open" })], [stake()]).items).toHaveLength(0);
    expect(computeGoalBetHistory([market({ status: "locked" })], [stake()]).items).toHaveLength(0);
  });

  it("computa acerto, lucro e ROI", () => {
    const result = computeGoalBetHistory([market()], [stake()]);
    expect(result.items[0].hit).toBe(true);
    expect(result.items[0].profit).toBe(150);
    expect(result.hitRate).toBe(1);
    expect(result.roi).toBeCloseTo(1.5, 5);
  });

  it("computa erro quando a opção não venceu", () => {
    const result = computeGoalBetHistory(
      [market({ winning_option_id: "b" })],
      [stake({ payout: 0 })],
    );
    expect(result.items[0].hit).toBe(false);
    expect(result.netProfit).toBe(-100);
    expect(result.hitRate).toBe(0);
  });

  it("mercado anulado não conta para taxa de acerto", () => {
    const result = computeGoalBetHistory(
      [market({ status: "voided", winning_option_id: null })],
      [stake({ payout: null })],
    );
    expect(result.items[0].voided).toBe(true);
    expect(result.decided).toBe(0);
    expect(result.hitRate).toBe(0);
    expect(result.netProfit).toBe(0);
  });

  it("ordena do mais recente para o mais antigo de forma estável", () => {
    const older = market({ id: "m0", settled_at: "2025-11-01T00:00:00Z" });
    const newer = market({ id: "m2", settled_at: "2026-02-01T00:00:00Z" });
    const stakes = [
      stake({ id: "s0", market_id: "m0" }),
      stake({ id: "s2", market_id: "m2" }),
    ];
    const result = computeGoalBetHistory([older, newer], stakes);
    expect(result.items.map((i) => i.marketId)).toEqual(["m2", "m0"]);
  });

  it("usa locks_at quando não há data de apuração", () => {
    const result = computeGoalBetHistory([market({ settled_at: null })], [stake()]);
    expect(result.items[0].resolvedAt).toBe("2026-01-01T00:00:00Z");
  });

  it("agrega vários mercados", () => {
    const win = market();
    const loss = market({ id: "m2", winning_option_id: "b" });
    const result = computeGoalBetHistory(
      [win, loss],
      [stake(), stake({ id: "s2", market_id: "m2", payout: 0 })],
    );
    expect(result.decided).toBe(2);
    expect(result.hits).toBe(1);
    expect(result.hitRate).toBe(0.5);
    expect(result.totalStaked).toBe(200);
    expect(result.totalReturned).toBe(250);
    expect(result.netProfit).toBe(50);
  });
});
