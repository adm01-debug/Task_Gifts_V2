import { describe, it, expect } from "vitest";
import { comboService, COMBO_TIERS } from "@/services/comboService";

describe("comboService — tier logic (pure)", () => {
  it("returns Normal tier when actionsCount = 0", () => {
    expect(comboService.getComboTier(0).multiplier).toBe(1.0);
  });

  it("returns correct tier at each threshold boundary", () => {
    expect(comboService.getComboTier(2).multiplier).toBe(1.0);
    expect(comboService.getComboTier(3).multiplier).toBe(1.5);
    expect(comboService.getComboTier(4).multiplier).toBe(1.5);
    expect(comboService.getComboTier(5).multiplier).toBe(2.0);
    expect(comboService.getComboTier(7).multiplier).toBe(2.0);
    expect(comboService.getComboTier(8).multiplier).toBe(2.5);
    expect(comboService.getComboTier(11).multiplier).toBe(2.5);
    expect(comboService.getComboTier(12).multiplier).toBe(3.0);
    expect(comboService.getComboTier(9999).multiplier).toBe(3.0);
  });

  it("caps at LENDÁRIO tier with no next tier", () => {
    expect(comboService.getNextTier(12)).toBeNull();
    expect(comboService.getNextTier(50)).toBeNull();
  });

  it("returns the immediate next tier when below max", () => {
    expect(comboService.getNextTier(0)?.multiplier).toBe(1.5);
    expect(comboService.getNextTier(3)?.multiplier).toBe(2.0);
    expect(comboService.getNextTier(5)?.multiplier).toBe(2.5);
    expect(comboService.getNextTier(8)?.multiplier).toBe(3.0);
  });

  it("has monotonically increasing tiers and multipliers", () => {
    for (let i = 1; i < COMBO_TIERS.length; i++) {
      expect(COMBO_TIERS[i].minActions).toBeGreaterThan(COMBO_TIERS[i - 1].minActions);
      expect(COMBO_TIERS[i].multiplier).toBeGreaterThan(COMBO_TIERS[i - 1].multiplier);
    }
  });

  it("bonus XP formula: bonus = round(baseXp * (multiplier - 1))", () => {
    const baseXp = 100;
    const tier = comboService.getComboTier(5); // 2.0x
    const bonus = Math.round(baseXp * (tier.multiplier - 1));
    expect(bonus).toBe(100);
    expect(baseXp + bonus).toBe(200);
  });

  it("bonus XP is zero at Normal tier", () => {
    const tier = comboService.getComboTier(0);
    expect(Math.round(50 * (tier.multiplier - 1))).toBe(0);
  });

  it("handles negative/edge inputs defensively", () => {
    // Negative should fall back to lowest tier
    expect(comboService.getComboTier(-1).multiplier).toBe(1.0);
  });
});
