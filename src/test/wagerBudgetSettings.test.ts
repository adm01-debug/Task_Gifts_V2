import { describe, expect, it } from "vitest";
import { clampBudget, clampPlayers, WAGER_BUDGET_DEFAULTS } from "@/services/wagerBudgetService";

describe("clampBudget", () => {
  it("mantém valores válidos", () => expect(clampBudget(15000)).toBe(15000));
  it("trunca decimais", () => expect(clampBudget(1500.9)).toBe(1500));
  it("bloqueia negativos", () => expect(clampBudget(-10)).toBe(0));
  it("respeita o teto do banco", () => expect(clampBudget(99_999_999)).toBe(10_000_000));
  it("cai no padrão com lixo", () =>
    expect(clampBudget("abc")).toBe(WAGER_BUDGET_DEFAULTS.monthlyCoinBudget));
  it("cai no padrão com null", () =>
    expect(clampBudget(null)).toBe(WAGER_BUDGET_DEFAULTS.monthlyCoinBudget));
  it("aceita string numérica", () => expect(clampBudget("2500")).toBe(2500));
});

describe("clampPlayers", () => {
  it("mantém valores válidos", () => expect(clampPlayers(30)).toBe(30));
  it("bloqueia negativos", () => expect(clampPlayers(-1)).toBe(0));
  it("respeita o teto", () => expect(clampPlayers(500000)).toBe(100000));
  it("cai no padrão com NaN", () =>
    expect(clampPlayers(Number.NaN)).toBe(WAGER_BUDGET_DEFAULTS.expectedPlayers));
  it("cai no padrão com Infinity", () =>
    expect(clampPlayers(Number.POSITIVE_INFINITY)).toBe(WAGER_BUDGET_DEFAULTS.expectedPlayers));
});
