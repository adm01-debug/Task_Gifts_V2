import { describe, expect, it } from "vitest";
import { computeGoalBetStakePreview } from "@/lib/goalBetStakePreview";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

function market(overrides: Partial<PredictionMarketRow> = {}): PredictionMarketRow {
  return {
    id: "m1",
    title: "Meta",
    description: null,
    status: "open",
    min_stake: 10,
    max_stake_per_user: 100,
    rake_bps: 0,
    locks_at: "2030-01-01T00:00:00Z",
    resolves_at: null,
    winning_option_id: null,
    total_pool: 300,
    rake_collected: 0,
    settled_at: null,
    created_at: "2029-01-01T00:00:00Z",
    options: [
      { id: "a", market_id: "m1", label: "Ana", sort_order: 0, pool: 100 },
      { id: "b", market_id: "m1", label: "Bia", sort_order: 1, pool: 200 },
    ],
    ...overrides,
  };
}

const call = (over: Partial<Parameters<typeof computeGoalBetStakePreview>[0]> = {}) =>
  computeGoalBetStakePreview({
    market: market(),
    optionId: "a",
    amount: 50,
    alreadyStaked: 0,
    ...over,
  });

describe("computeGoalBetStakePreview", () => {
  it("bloqueia sem mercado", () => {
    expect(call({ market: null }).block).toBe("no_market");
  });

  it("bloqueia opção inexistente", () => {
    expect(call({ optionId: "zzz" }).block).toBe("no_option");
  });

  it("bloqueia mercado fora de 'open'", () => {
    expect(call({ market: market({ status: "locked" }) }).block).toBe("market_closed");
  });

  it("bloqueia valor não inteiro ou zero", () => {
    expect(call({ amount: 12.5 }).block).toBe("invalid_amount");
    expect(call({ amount: 0 }).block).toBe("invalid_amount");
    expect(call({ amount: Number.NaN }).block).toBe("invalid_amount");
  });

  it("bloqueia abaixo do mínimo", () => {
    expect(call({ amount: 5 }).block).toBe("below_min");
  });

  it("respeita o teto por usuário considerando aportes anteriores", () => {
    const r = call({ amount: 60, alreadyStaked: 70 });
    expect(r.block).toBe("above_user_cap");
    expect(r.remaining).toBe(30);
  });

  it("teto esgotado gera mensagem específica", () => {
    expect(call({ alreadyStaked: 100 }).message).toMatch(/teto/i);
  });

  it("sem teto configurado, remaining é infinito", () => {
    const r = call({ market: market({ max_stake_per_user: 0 }), amount: 5000 });
    expect(r.remaining).toBe(Number.POSITIVE_INFINITY);
    expect(r.valid).toBe(true);
  });

  it("dilui as odds ao aportar na própria opção", () => {
    const r = call({ amount: 100 });
    expect(r.multiplierBefore).toBeCloseTo(300 / 100);
    expect(r.multiplierAfter).toBeCloseTo(400 / 200);
    expect(r.dilution).toBeGreaterThan(0);
    expect(r.projectedReturn).toBe(200);
    expect(r.projectedProfit).toBe(100);
  });

  it("aplica rake no retorno projetado", () => {
    const r = call({ market: market({ rake_bps: 1000 }), amount: 100 });
    expect(r.multiplierAfter).toBeCloseTo((400 * 0.9) / 200);
    expect(r.projectedReturn).toBe(180);
  });

  it("marca concentração quando domina o pool da opção", () => {
    const m = market({
      max_stake_per_user: 0,
      options: [
        { id: "a", market_id: "m1", label: "Ana", sort_order: 0, pool: 0 },
        { id: "b", market_id: "m1", label: "Bia", sort_order: 1, pool: 200 },
      ],
    });
    const r = call({ market: m, amount: 100 });
    expect(r.concentrated).toBe(true);
    expect(r.multiplierBefore).toBe(0);
    expect(r.dilution).toBe(0);
  });

  it("usa a soma dos pools quando total_pool está defasado", () => {
    const r = call({ market: market({ total_pool: 0 }), amount: 100 });
    expect(r.multiplierAfter).toBeCloseTo(2);
  });
});
