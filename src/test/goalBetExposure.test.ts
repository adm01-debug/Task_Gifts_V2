import { describe, expect, it } from "vitest";
import { computeGoalBetExposure } from "@/lib/goalBetExposure";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

function market(overrides: Partial<PredictionMarketRow> = {}): PredictionMarketRow {
  return {
    id: "m1",
    title: "Meta",
    description: null,
    status: "open",
    min_stake: 10,
    max_stake_per_user: 500,
    rake_bps: 0,
    locks_at: "2030-01-01T00:00:00Z",
    resolves_at: null,
    winning_option_id: null,
    total_pool: 100,
    rake_collected: 0,
    settled_at: null,
    created_at: "2029-01-01T00:00:00Z",
    options: [{ id: "a", market_id: "m1", label: "Ana", sort_order: 0, pool: 100 }],
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
    created_at: "2029-02-01T00:00:00Z",
    ...o,
  };
}

describe("computeGoalBetExposure", () => {
  it("sem aportes não há exposição", () => {
    const r = computeGoalBetExposure({ markets: [market()], stakes: [], balance: 500 });
    expect(r.level).toBe("none");
    expect(r.exposed).toBe(0);
    expect(r.balance).toBe(500);
    expect(r.message).toBe("");
  });

  it("ignora mercados já apurados ou anulados", () => {
    const r = computeGoalBetExposure({
      markets: [market({ status: "settled" }), market({ id: "m2", status: "voided" })],
      stakes: [stake(), stake({ id: "s2", market_id: "m2" })],
      balance: 100,
    });
    expect(r.exposed).toBe(0);
  });

  it("classifica exposição segura", () => {
    const r = computeGoalBetExposure({ markets: [market()], stakes: [stake()], balance: 900 });
    expect(r.ratio).toBeCloseTo(0.1, 5);
    expect(r.level).toBe("safe");
    expect(r.openMarkets).toBe(1);
  });

  it("classifica atenção e risco alto", () => {
    const atencao = computeGoalBetExposure({
      markets: [market()],
      stakes: [stake()],
      balance: 200,
    });
    expect(atencao.level).toBe("attention");

    const alto = computeGoalBetExposure({
      markets: [market()],
      stakes: [stake()],
      balance: 50,
    });
    expect(alto.level).toBe("high");
    expect(alto.message).toMatch(/Atenção/);
  });

  it("simula o impacto de um novo aporte sem alterar a banca", () => {
    const base = computeGoalBetExposure({
      markets: [market()],
      stakes: [stake()],
      balance: 300,
    });
    const simulado = computeGoalBetExposure({
      markets: [market()],
      stakes: [stake()],
      balance: 300,
      extraStake: 200,
    });
    expect(base.bankroll).toBe(400);
    expect(simulado.bankroll).toBe(400);
    expect(simulado.exposed).toBe(300);
    expect(simulado.level).toBe("high");
  });

  it("tolera valores ausentes ou inválidos", () => {
    const r = computeGoalBetExposure({
      markets: null,
      stakes: null,
      balance: Number.NaN,
      extraStake: Number.NaN,
    });
    expect(r.exposed).toBe(0);
    expect(r.bankroll).toBe(0);
    expect(r.ratio).toBe(0);
  });

  it("saldo zero com aporte aberto satura o índice em 100%", () => {
    const r = computeGoalBetExposure({ markets: [market()], stakes: [stake()], balance: 0 });
    expect(r.ratio).toBe(1);
    expect(r.level).toBe("high");
  });

  it("agrega múltiplos mercados abertos", () => {
    const r = computeGoalBetExposure({
      markets: [market(), market({ id: "m2", status: "locked" })],
      stakes: [stake(), stake({ id: "s2", market_id: "m2", amount: 50 })],
      balance: 1000,
    });
    expect(r.exposed).toBe(150);
    expect(r.openMarkets).toBe(2);
  });
});
