import { describe, it, expect } from "vitest";
import {
  recommendBalancing,
  computeGini,
  median,
  mean,
  type XpDistributionSample,
} from "@/services/xpBalancingService";

const sample = (xp: number, daysActive = 30, level = 1): XpDistributionSample => ({
  userId: `u-${xp}`,
  xp,
  level,
  daysActive,
});

describe("xpBalancingService", () => {
  it("computeGini retorna 0 para distribuição uniforme", () => {
    expect(computeGini([100, 100, 100, 100])).toBeCloseTo(0, 2);
  });

  it("computeGini retorna alto para distribuição desigual", () => {
    const gini = computeGini([0, 0, 0, 0, 1000]);
    expect(gini).toBeGreaterThan(0.6);
  });

  it("median e mean funcionam", () => {
    expect(median([1, 2, 3, 4, 5])).toBe(3);
    expect(mean([10, 20, 30])).toBe(20);
  });

  it("retorna stagnant sem amostras", () => {
    const r = recommendBalancing([]);
    expect(r.health).toBe("stagnant");
    expect(r.questMultiplierSuggestion).toBe(1.0);
  });

  it("detecta economia inflacionada (XP/dia alto)", () => {
    const samples = Array.from({ length: 20 }, () => sample(15000, 30));
    const r = recommendBalancing(samples);
    expect(r.health).toBe("inflated");
    expect(r.questMultiplierSuggestion).toBeLessThan(1);
    expect(r.shopPriceAdjustment).toBeGreaterThan(0);
  });

  it("detecta economia estagnada (XP/dia baixo)", () => {
    const samples = Array.from({ length: 20 }, () => sample(100, 30));
    const r = recommendBalancing(samples);
    expect(r.health).toBe("stagnant");
    expect(r.questMultiplierSuggestion).toBeGreaterThan(1);
    expect(r.shopPriceAdjustment).toBeLessThan(0);
  });

  it("detecta desbalanceamento (Gini alto)", () => {
    const samples: XpDistributionSample[] = [
      ...Array.from({ length: 18 }, () => sample(500, 30)),
      sample(500000, 30),
      sample(400000, 30),
    ];
    const r = recommendBalancing(samples);
    expect(r.health).toBe("unbalanced");
    expect(r.gini).toBeGreaterThan(0.6);
  });

  it("classifica economia saudável", () => {
    const samples = Array.from({ length: 20 }, (_, i) => sample(5000 + i * 200, 30));
    const r = recommendBalancing(samples);
    expect(r.health).toBe("healthy");
    expect(r.questMultiplierSuggestion).toBe(1);
  });

  it("é determinístico para o mesmo input", () => {
    const samples = Array.from({ length: 10 }, (_, i) => sample(1000 * (i + 1), 20));
    const a = recommendBalancing(samples);
    const b = recommendBalancing(samples);
    expect(a).toEqual(b);
  });

  it("trata XP negativo com segurança", () => {
    const samples = [sample(-100, 10), sample(200, 10)];
    const r = recommendBalancing(samples);
    expect(r.meanXp).toBeGreaterThanOrEqual(0);
    expect(r.gini).toBeGreaterThanOrEqual(0);
  });
});