import { describe, it, expect } from "vitest";
import {
  riskGrade,
  riskLevel,
  requiresActionPlan,
  RISK_THRESHOLDS,
  RISK_LEVEL_DEADLINE_DAYS,
  RISK_LEVEL_LABEL,
  RISK_LEVEL_CLASS,
  type Nr1RiskLevel,
} from "@/services/nr1RiskService";

/**
 * Simulação combinatória do motor de riscos psicossociais (NR-1 / ISO 45003).
 * Cobre 101 scores x 9 severidades = 909 combinações + cenários de borda.
 */

const SCORES = Array.from({ length: 101 }, (_, i) => i / 10); // 0.0 .. 10.0
const SEVERITIES = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];

describe("NR-1 :: matriz probabilidade x severidade", () => {
  it("grau permanece dentro do domínio teórico 0..30 em todas as combinações", () => {
    for (const s of SCORES) {
      for (const w of SEVERITIES) {
        const g = riskGrade(s, w);
        expect(g).not.toBeNull();
        expect(g as number).toBeGreaterThanOrEqual(0);
        expect(g as number).toBeLessThanOrEqual(30);
      }
    }
  });

  it("é monotonicamente decrescente em relação ao score", () => {
    for (const w of SEVERITIES) {
      let prev = Infinity;
      for (const s of SCORES) {
        const g = riskGrade(s, w) as number;
        expect(g).toBeLessThanOrEqual(prev + 1e-9);
        prev = g;
      }
    }
  });

  it("é monotonicamente crescente em relação à severidade", () => {
    for (const s of SCORES) {
      let prev = -Infinity;
      for (const w of SEVERITIES) {
        const g = riskGrade(s, w) as number;
        expect(g).toBeGreaterThanOrEqual(prev - 1e-9);
        prev = g;
      }
    }
  });

  it("score perfeito zera o risco independentemente da severidade", () => {
    for (const w of SEVERITIES) expect(riskGrade(10, w)).toBe(0);
  });

  it("faz clamp de scores fora da faixa 0..10 (defesa contra dados corrompidos)", () => {
    for (const w of SEVERITIES) {
      expect(riskGrade(-4, w)).toBe(riskGrade(0, w));
      expect(riskGrade(42, w)).toBe(riskGrade(10, w));
    }
  });

  it("retorna null para entradas inválidas em vez de propagar NaN", () => {
    expect(riskGrade(null, 2)).toBeNull();
    expect(riskGrade(undefined, 2)).toBeNull();
    expect(riskGrade(Number.NaN, 2)).toBeNull();
    expect(riskGrade(Infinity, 2)).toBeNull();
    expect(riskGrade(5, 0)).toBeNull();
    expect(riskGrade(5, -1)).toBeNull();
    expect(riskGrade(5, Number.NaN)).toBeNull();
  });
});

describe("NR-1 :: classificação de nível", () => {
  it("respeita exatamente os limiares do banco em todas as combinações", () => {
    for (const s of SCORES) {
      for (const w of SEVERITIES) {
        const g = riskGrade(s, w) as number;
        const expected: Nr1RiskLevel =
          g >= RISK_THRESHOLDS.critical
            ? "critical"
            : g >= RISK_THRESHOLDS.high
              ? "high"
              : g >= RISK_THRESHOLDS.moderate
                ? "moderate"
                : "low";
        expect(riskLevel(g)).toBe(expected);
      }
    }
  });

  it("classifica os pontos de fronteira de forma inclusiva no limiar superior", () => {
    expect(riskLevel(RISK_THRESHOLDS.critical)).toBe("critical");
    expect(riskLevel(RISK_THRESHOLDS.critical - 0.01)).toBe("high");
    expect(riskLevel(RISK_THRESHOLDS.high)).toBe("high");
    expect(riskLevel(RISK_THRESHOLDS.high - 0.01)).toBe("moderate");
    expect(riskLevel(RISK_THRESHOLDS.moderate)).toBe("moderate");
    expect(riskLevel(RISK_THRESHOLDS.moderate - 0.01)).toBe("low");
  });

  it("degrada com segurança para 'low' quando o grau é desconhecido", () => {
    expect(riskLevel(null)).toBe("low");
    expect(riskLevel(undefined)).toBe("low");
    expect(riskLevel(Number.NaN)).toBe("low");
  });

  it("nunca produz um nível fora do enum conhecido", () => {
    const allowed = new Set<Nr1RiskLevel>(["critical", "high", "moderate", "low"]);
    for (const s of SCORES) {
      for (const w of SEVERITIES) {
        expect(allowed.has(riskLevel(riskGrade(s, w)))).toBe(true);
      }
    }
  });
});

describe("NR-1 :: obrigações legais derivadas", () => {
  it("exige plano de ação somente para risco alto ou crítico", () => {
    expect(requiresActionPlan("critical")).toBe(true);
    expect(requiresActionPlan("high")).toBe(true);
    expect(requiresActionPlan("moderate")).toBe(false);
    expect(requiresActionPlan("low")).toBe(false);
  });

  it("associa prazos decrescentes conforme a criticidade aumenta", () => {
    expect(RISK_LEVEL_DEADLINE_DAYS.critical).toBeLessThan(RISK_LEVEL_DEADLINE_DAYS.high as number);
    expect(RISK_LEVEL_DEADLINE_DAYS.high).toBeLessThan(RISK_LEVEL_DEADLINE_DAYS.moderate as number);
    expect(RISK_LEVEL_DEADLINE_DAYS.low).toBeNull();
  });

  it("todo nível possui rótulo em PT-BR e classe de token semântico", () => {
    for (const level of ["critical", "high", "moderate", "low"] as Nr1RiskLevel[]) {
      expect(RISK_LEVEL_LABEL[level]).toBeTruthy();
      expect(RISK_LEVEL_CLASS[level]).toBeTruthy();
      expect(RISK_LEVEL_CLASS[level]).not.toMatch(/#[0-9a-f]{3,6}|(bg|text)-(red|blue|green|yellow|amber)-\d/i);
    }
  });

  it("cenário regulatório: clima crítico em categoria de severidade máxima é sempre acionável", () => {
    for (let s = 0; s <= 5; s += 0.5) {
      const level = riskLevel(riskGrade(s, 3));
      expect(requiresActionPlan(level)).toBe(true);
    }
  });

  it("cenário saudável: clima >= 8.5 em severidade baixa nunca gera obrigação", () => {
    for (let s = 8.5; s <= 10; s += 0.1) {
      const level = riskLevel(riskGrade(s, 1));
      expect(requiresActionPlan(level)).toBe(false);
    }
  });
});
