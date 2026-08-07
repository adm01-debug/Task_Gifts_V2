import { describe, expect, it } from "vitest";
import {
  clampMaxStake,
  clampMultiplier,
  estimateExposure,
  isValidISODate,
  optionKeyAt,
  validateWagerDraft,
  wagerSaveMessage,
  type WagerQuestionDraft,
} from "@/lib/wagerAuthoring";

function draft(overrides: Partial<WagerQuestionDraft> = {}): WagerQuestionDraft {
  return {
    question: "Qual é o prazo padrão de resposta a um orçamento?",
    options: [
      { id: "A", label: "2 horas" },
      { id: "B", label: "24 horas" },
    ],
    correctOption: "A",
    explanation: "SLA comercial vigente.",
    difficulty: "medium",
    multiplier: 2,
    maxStake: 100,
    scheduledDate: "2026-08-01",
    isActive: true,
    ...overrides,
  };
}

describe("wagerAuthoring", () => {
  it("aceita um rascunho íntegro", () => {
    const result = validateWagerDraft(draft());
    expect(result.valid).toBe(true);
    expect(result.normalizedOptions).toHaveLength(2);
  });

  it("rejeita enunciado curto", () => {
    expect(validateWagerDraft(draft({ question: "Oi" })).valid).toBe(false);
  });

  it("rejeita enunciado acima de 500 caracteres", () => {
    expect(validateWagerDraft(draft({ question: "a".repeat(501) })).valid).toBe(false);
  });

  it("descarta alternativas vazias sem gerar erro", () => {
    const result = validateWagerDraft(
      draft({
        options: [
          { id: "A", label: "2 horas" },
          { id: "B", label: "24 horas" },
          { id: "C", label: "   " },
        ],
      }),
    );
    expect(result.valid).toBe(true);
    expect(result.normalizedOptions).toHaveLength(2);
  });

  it("bloqueia alternativas duplicadas ignorando acento e caixa", () => {
    const result = validateWagerDraft(
      draft({
        options: [
          { id: "A", label: "Análise" },
          { id: "B", label: "analise" },
        ],
      }),
    );
    expect(result.valid).toBe(false);
  });

  it("exige no mínimo duas alternativas", () => {
    expect(validateWagerDraft(draft({ options: [{ id: "A", label: "Única" }] })).valid).toBe(false);
  });

  it("recusa mais de seis alternativas", () => {
    const options = Array.from({ length: 7 }, (_, i) => ({
      id: optionKeyAt(i),
      label: `Opção ${i}`,
    }));
    expect(validateWagerDraft(draft({ options, correctOption: "A" })).valid).toBe(false);
  });

  it("exige que o gabarito exista entre as alternativas", () => {
    expect(validateWagerDraft(draft({ correctOption: "Z" })).valid).toBe(false);
  });

  it("rejeita datas inexistentes", () => {
    expect(isValidISODate("2026-02-31")).toBe(false);
    expect(isValidISODate("2026-13-01")).toBe(false);
    expect(isValidISODate("01/08/2026")).toBe(false);
    expect(isValidISODate("2026-08-01")).toBe(true);
  });

  it("valida limites de multiplicador e teto de aposta", () => {
    expect(validateWagerDraft(draft({ multiplier: 1 })).valid).toBe(false);
    expect(validateWagerDraft(draft({ multiplier: 5.5 })).valid).toBe(false);
    expect(validateWagerDraft(draft({ maxStake: 5 })).valid).toBe(false);
    expect(validateWagerDraft(draft({ maxStake: 5000 })).valid).toBe(false);
  });

  it("normaliza multiplicador e teto fora da faixa", () => {
    expect(clampMultiplier(0.2)).toBe(1.1);
    expect(clampMultiplier(99)).toBe(5);
    expect(clampMultiplier(Number.NaN)).toBe(2);
    expect(clampMaxStake(1)).toBe(10);
    expect(clampMaxStake(99999)).toBe(1000);
  });

  it("estima a exposição máxima da empresa", () => {
    // 100 moedas a 2.5x => ganho líquido de 150 por jogador.
    expect(estimateExposure(draft({ multiplier: 2.5 }), 10)).toBe(1500);
    expect(estimateExposure(draft(), -5)).toBe(0);
  });

  it("traduz motivos de erro do servidor", () => {
    expect(wagerSaveMessage("forbidden")).toContain("permissão");
    expect(wagerSaveMessage("desconhecido")).toContain("Não foi possível");
    expect(wagerSaveMessage()).toContain("Não foi possível");
  });
});