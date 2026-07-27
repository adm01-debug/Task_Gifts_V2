import { describe, expect, it } from "vitest";

import {
  DEFAULT_COINS_PER_SPIN_BUDGET,
  MAX_COINS_PER_SPIN_BUDGET,
  MIN_COINS_PER_SPIN_BUDGET,
  loadBudget,
  parseBudget,
  saveBudget,
} from "@/lib/luckyWheelBudget";

describe("luckyWheelBudget", () => {
  it("rejeita entradas hostis", () => {
    for (const raw of [null, undefined, "", "abc", NaN, Infinity, -1, 0, {}, []]) {
      expect(parseBudget(raw)).toBeNull();
    }
  });

  it("aceita vírgula decimal e arredonda em 2 casas", () => {
    expect(parseBudget("12,345")).toBe(12.35);
    expect(parseBudget(7.129)).toBe(7.13);
  });

  it("mantém limites em 500 cenários aleatórios", () => {
    for (let i = 0; i < 500; i++) {
      const raw = (Math.random() - 0.2) * 50_000;
      const parsed = parseBudget(raw);
      if (parsed === null) {
        expect(raw).toBeLessThanOrEqual(0);
      } else {
        expect(parsed).toBeGreaterThanOrEqual(MIN_COINS_PER_SPIN_BUDGET);
        expect(parsed).toBeLessThanOrEqual(MAX_COINS_PER_SPIN_BUDGET);
      }
    }
  });

  it("persiste e recarrega o valor aplicado", () => {
    expect(saveBudget(45)).toBe(45);
    expect(loadBudget()).toBe(45);
    expect(saveBudget("lixo")).toBe(DEFAULT_COINS_PER_SPIN_BUDGET);
    expect(loadBudget()).toBe(DEFAULT_COINS_PER_SPIN_BUDGET);
  });
});
