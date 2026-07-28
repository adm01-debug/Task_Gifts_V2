import { describe, expect, it } from "vitest";
import { computeGoalBetPosition } from "@/lib/goalBetPosition";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

function market(overrides: Partial<PredictionMarketRow> = {}): PredictionMarketRow {
  return {
    id: "m1",
    title: "Meta Q3",
    description: null,
    status: "open",
    min_stake: 10,
    max_stake_per_user: 500,
    rake_bps: 500,
    locks_at: "2026-01-01T00:00:00Z",
    resolves_at: null,
    winning_option_id: null,
    total_pool: 1000,
    rake_collected: 0,
    settled_at: null,
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
    payout: null,
    created_at: "2025-12-02T00:00:00Z",
    ...o,
  };
}

describe("computeGoalBetPosition", () => {
  it("retorna vazio sem mercado ou sem aportes", () => {
    expect(computeGoalBetPosition(null, [stake()]).totalStaked).toBe(0);
    expect(computeGoalBetPosition(market(), []).entries).toHaveLength(0);
    expect(computeGoalBetPosition(market(), null).totalStaked).toBe(0);
  });

  it("ignora aportes de outros mercados", () => {
    const result = computeGoalBetPosition(market(), [stake({ market_id: "outro" })]);
    expect(result.totalStaked).toBe(0);
  });

  it("projeta rateio líquido com rake em mercado aberto", () => {
    const result = computeGoalBetPosition(market(), [stake()]);
    // pool líquido 950, participação 100/400 = 0,25 -> 237
    expect(result.entries[0].projectedReturn).toBe(237);
    expect(result.projectedReturn).toBe(237);
    expect(result.projectedProfit).toBe(137);
    expect(result.entries[0].multiplier).toBeCloseTo(2.37, 2);
  });

  it("agrega múltiplos aportes na mesma opção", () => {
    const result = computeGoalBetPosition(market(), [
      stake({ id: "s1", amount: 60 }),
      stake({ id: "s2", amount: 40 }),
    ]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].staked).toBe(100);
  });

  it("usa o melhor cenário quando há aportes em opções diferentes", () => {
    const result = computeGoalBetPosition(market(), [
      stake({ id: "s1", option_id: "a", amount: 100 }),
      stake({ id: "s2", option_id: "b", amount: 100 }),
    ]);
    expect(result.totalStaked).toBe(200);
    expect(result.projectedReturn).toBe(Math.max(...result.entries.map((e) => e.projectedReturn)));
  });

  it("devolve o valor apostado em mercado anulado", () => {
    const result = computeGoalBetPosition(market({ status: "voided" }), [stake()]);
    expect(result.voided).toBe(true);
    expect(result.projectedReturn).toBe(100);
    expect(result.projectedProfit).toBe(0);
  });

  it("prioriza o payout real em mercado apurado", () => {
    const result = computeGoalBetPosition(
      market({ status: "settled", winning_option_id: "a" }),
      [stake({ payout: 300 })],
    );
    expect(result.settled).toBe(true);
    expect(result.projectedReturn).toBe(300);
  });

  it("zera o retorno de opção perdedora apurada", () => {
    const result = computeGoalBetPosition(
      market({ status: "settled", winning_option_id: "b" }),
      [stake({ option_id: "a", amount: 100 })],
    );
    expect(result.entries[0].isWinner).toBe(false);
    expect(result.projectedReturn).toBe(0);
    expect(result.projectedProfit).toBe(-100);
  });

  it("usa o maior entre total_pool e a soma das opções", () => {
    const result = computeGoalBetPosition(
      market({ total_pool: 0 }),
      [stake({ amount: 400 })],
    );
    expect(result.entries[0].projectedReturn).toBe(950);
  });

  it("nunca projeta participação acima de 100% da opção", () => {
    const result = computeGoalBetPosition(
      market({ options: [{ id: "a", market_id: "m1", label: "Ana", sort_order: 0, pool: 10 }] }),
      [stake({ amount: 100 })],
    );
    expect(result.entries[0].share).toBe(1);
  });

  it("tolera rake fora do intervalo válido", () => {
    const result = computeGoalBetPosition(market({ rake_bps: 99999 }), [stake()]);
    expect(result.entries[0].projectedReturn).toBe(0);
  });
});
