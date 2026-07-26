import { describe, expect, it } from "vitest";
import {
  RISK_LEVEL_DEADLINE_DAYS,
  nr1PlanDeadlineDays,
  nr1PlanTargetScore,
  requiresActionPlan,
  riskGrade,
  riskLevel,
  type Nr1RiskLevel,
} from "@/services/nr1RiskService";

const LEVELS: Nr1RiskLevel[] = ["critical", "high", "moderate", "low"];

describe("NR-1 → plano de tratativa (simulação combinatória)", () => {
  it("gera prazo legal coerente para todos os graus possíveis", () => {
    for (let score = 0; score <= 100; score++) {
      for (const weight of [1, 1.5, 2, 2.5, 3]) {
        const grade = riskGrade(score / 10, weight);
        const level = riskLevel(grade);
        const deadline = nr1PlanDeadlineDays(level);
        expect([30, 60, 90]).toContain(deadline);
        if (requiresActionPlan(level)) {
          expect(deadline).toBe(RISK_LEVEL_DEADLINE_DAYS[level]);
        }
      }
    }
  });

  it("prazo é monotonicamente menor conforme o risco cresce", () => {
    const order = LEVELS.map(nr1PlanDeadlineDays);
    expect(order[0]).toBeLessThan(order[1]);
    expect(order[1]).toBeLessThan(order[2]);
    expect(order[2]).toBe(order[3]);
  });

  it("meta de score nunca ultrapassa 10 nem regride", () => {
    for (let i = -50; i <= 150; i++) {
      const score = i / 10;
      const target = nr1PlanTargetScore(score);
      expect(target).toBeLessThanOrEqual(10);
      if (score >= 0 && score <= 8.5) expect(target).toBeGreaterThan(score);
    }
  });

  it("trata entradas inválidas com fallback determinístico", () => {
    for (const bad of [null, undefined, NaN, Infinity, -Infinity]) {
      expect(nr1PlanTargetScore(bad as number)).toBe(6.5);
    }
    expect(nr1PlanDeadlineDays(riskLevel(null))).toBe(90);
  });
});
