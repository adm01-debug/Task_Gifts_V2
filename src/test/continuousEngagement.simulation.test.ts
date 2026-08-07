import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  applyReverse,
  type EngagementAnswerFormat,
} from "@/services/continuousEngagementService";

/**
 * Simulação combinatória do motor de pesquisa contínua.
 * Objetivo: expor gaps de normalização, inversão e agregação ANTES da Fase 2,
 * onde esses valores viram score de pilar/fator e alimentam decisões de RH.
 */

const FORMATS: EngagementAnswerFormat[] = [
  "slider",
  "stars",
  "emoji",
  "cards",
  "checkbox",
  "percentage",
  "text",
];

/** Valores hostis que podem chegar do cliente ou de um payload corrompido. */
const HOSTILE_VALUES: unknown[] = [
  null,
  undefined,
  "",
  "5",
  NaN,
  Infinity,
  -Infinity,
  -1,
  -999,
  999,
  0,
  {},
  [],
  true,
  false,
  Number.MAX_SAFE_INTEGER,
  Number.MIN_SAFE_INTEGER,
];

describe("Simulação — invariantes de normalização", () => {
  it("nunca produz valor fora de 0..10 nem NaN, em qualquer formato × valor hostil", () => {
    let assertions = 0;
    for (const format of FORMATS) {
      for (const value of HOSTILE_VALUES) {
        for (const optionCount of [0, 1, 2, 3, 5, 8]) {
          const score = normalizeAnswer(format, value, optionCount);
          assertions++;
          if (score === null) continue;
          expect(Number.isFinite(score)).toBe(true);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(10);
        }
      }
    }
    expect(assertions).toBeGreaterThan(700);
  });

  it("formato de texto nunca gera score numérico", () => {
    for (const value of HOSTILE_VALUES) {
      expect(normalizeAnswer("text", value)).toBeNull();
    }
    expect(normalizeAnswer("text", "opinião longa sobre o ambiente")).toBeNull();
  });

  it("cards com 0 ou 1 opção não divide por zero", () => {
    expect(normalizeAnswer("cards", 0, 0)).toBeNull();
    expect(normalizeAnswer("cards", 0, 1)).toBeNull();
  });
});

describe("Simulação — monotonicidade por formato", () => {
  const RANGES: Partial<Record<EngagementAnswerFormat, number[]>> = {
    slider: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    stars: [1, 2, 3, 4, 5],
    emoji: [1, 2, 3, 4, 5],
    percentage: [0, 10, 25, 50, 75, 90, 100],
    cards: [0, 1, 2, 3, 4],
  };

  it("valores maiores sempre geram scores maiores ou iguais", () => {
    for (const [format, values] of Object.entries(RANGES)) {
      const scores = (values as number[]).map((v) =>
        normalizeAnswer(format as EngagementAnswerFormat, v, 5),
      );
      for (let i = 1; i < scores.length; i++) {
        expect(scores[i]).not.toBeNull();
        expect(scores[i] as number).toBeGreaterThan(scores[i - 1] as number);
      }
    }
  });

  it("os extremos de cada formato mapeiam exatamente para 0 e 10", () => {
    expect(normalizeAnswer("slider", 0)).toBe(0);
    expect(normalizeAnswer("slider", 10)).toBe(10);
    expect(normalizeAnswer("stars", 5)).toBe(10);
    expect(normalizeAnswer("emoji", 1)).toBe(0);
    expect(normalizeAnswer("emoji", 5)).toBe(10);
    expect(normalizeAnswer("percentage", 0)).toBe(0);
    expect(normalizeAnswer("percentage", 100)).toBe(10);
    expect(normalizeAnswer("cards", 0, 5)).toBe(0);
    expect(normalizeAnswer("cards", 4, 5)).toBe(10);
    expect(normalizeAnswer("checkbox", true)).toBe(10);
    expect(normalizeAnswer("checkbox", false)).toBe(0);
  });
});

describe("Simulação — perguntas reversas", () => {
  it("inverter duas vezes retorna ao original, para todo score válido", () => {
    for (let raw = 0; raw <= 100; raw++) {
      const score = raw / 10;
      const twice = applyReverse(applyReverse(score, true), true);
      expect(twice).toBeCloseTo(score, 10);
    }
  });

  it("mantém o resultado dentro de 0..10 e preserva nulo", () => {
    for (let raw = 0; raw <= 100; raw++) {
      const inverted = applyReverse(raw / 10, true) as number;
      expect(inverted).toBeGreaterThanOrEqual(0);
      expect(inverted).toBeLessThanOrEqual(10);
    }
    expect(applyReverse(null, true)).toBeNull();
    expect(applyReverse(null, false)).toBeNull();
  });

  it("uma pergunta reversa muito negativa vira score muito baixo", () => {
    // "Sinto esgotamento emocional" respondido com 10 = pior cenário possível.
    const score = applyReverse(normalizeAnswer("slider", 10), true);
    expect(score).toBe(0);
  });
});

describe("Simulação — agregação ponderada de pilar", () => {
  interface SimAnswer {
    score: number | null;
    weight: number;
    isReverse: boolean;
  }

  /** Réplica da agregação que a Fase 2 executará no banco. */
  function aggregate(answers: SimAnswer[]): number | null {
    const valid = answers
      .map((a) => ({ score: applyReverse(a.score, a.isReverse), weight: a.weight }))
      .filter((a): a is { score: number; weight: number } => a.score !== null && a.weight > 0);
    if (valid.length === 0) return null;
    const totalWeight = valid.reduce((sum, a) => sum + a.weight, 0);
    return valid.reduce((sum, a) => sum + a.score * a.weight, 0) / totalWeight;
  }

  it("permanece em 0..10 em 500 amostras aleatórias", () => {
    let seed = 42;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let sample = 0; sample < 500; sample++) {
      const size = 1 + Math.floor(rand() * 12);
      const answers: SimAnswer[] = Array.from({ length: size }, () => ({
        score: rand() < 0.15 ? null : Math.round(rand() * 100) / 10,
        weight: rand() < 0.1 ? 0 : Math.round(rand() * 3 * 10) / 10,
        isReverse: rand() < 0.3,
      }));
      const result = aggregate(answers);
      if (result === null) continue;
      expect(Number.isFinite(result)).toBe(true);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(10);
    }
  });

  it("retorna nulo quando só há respostas textuais ou peso zero", () => {
    expect(aggregate([{ score: null, weight: 1, isReverse: false }])).toBeNull();
    expect(aggregate([{ score: 8, weight: 0, isReverse: false }])).toBeNull();
    expect(aggregate([])).toBeNull();
  });

  it("peso maior desloca a média na direção esperada", () => {
    const light = aggregate([
      { score: 10, weight: 1, isReverse: false },
      { score: 0, weight: 1, isReverse: false },
    ]);
    const heavy = aggregate([
      { score: 10, weight: 3, isReverse: false },
      { score: 0, weight: 1, isReverse: false },
    ]);
    expect(light).toBeCloseTo(5, 6);
    expect(heavy as number).toBeGreaterThan(light as number);
  });
});

describe("Simulação — guarda de anonimato (regra da Fase 2)", () => {
  const MIN_RESPONDENTS = 5;
  const isVisible = (respondents: number) => respondents >= MIN_RESPONDENTS;

  it("bloqueia todo recorte abaixo do mínimo, de 0 a 200 respondentes", () => {
    for (let n = 0; n <= 200; n++) {
      expect(isVisible(n)).toBe(n >= MIN_RESPONDENTS);
    }
  });

  it("um único respondente nunca é exposto", () => {
    expect(isVisible(1)).toBe(false);
  });
});

describe("Simulação — eNPS e LNPS", () => {
  /** Score = %promotores - %detratores, sobre a escala 0..10. */
  function npsFrom(scores: number[]): number | null {
    if (scores.length === 0) return null;
    const promoters = scores.filter((s) => s >= 9).length;
    const detractors = scores.filter((s) => s <= 6).length;
    return Math.round(((promoters - detractors) / scores.length) * 100);
  }

  it("permanece entre -100 e 100 em 300 amostras aleatórias", () => {
    let seed = 7;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let sample = 0; sample < 300; sample++) {
      const size = 1 + Math.floor(rand() * 50);
      const scores = Array.from({ length: size }, () => Math.floor(rand() * 11));
      const nps = npsFrom(scores) as number;
      expect(nps).toBeGreaterThanOrEqual(-100);
      expect(nps).toBeLessThanOrEqual(100);
    }
  });

  it("todos promotores = 100 e todos detratores = -100", () => {
    expect(npsFrom([9, 10, 10, 9])).toBe(100);
    expect(npsFrom([0, 3, 6, 6])).toBe(-100);
    expect(npsFrom([7, 8, 7, 8])).toBe(0);
    expect(npsFrom([])).toBeNull();
  });
});