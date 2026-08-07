import { describe, it, expect } from "vitest";
import {
  buildEngagementInsights,
  summarizeInsights,
  INSIGHT_MIN_RESPONDENTS,
  INSIGHT_MIN_BENCHMARK_SAMPLE,
  type EngagementInsight,
} from "@/lib/engagementInsights";
import type { PillarBenchmarkComparison } from "@/lib/climateBenchmark";

const SEVERITY_ORDER = ["critical", "high", "medium", "info", "positive"];

function bench(partial: Partial<PillarBenchmarkComparison>): PillarBenchmarkComparison {
  return {
    pillar: "lideranca",
    score: 7,
    favorability: 70,
    respondents: 20,
    average: 7,
    topQuartile: 8,
    top10: 9,
    sampleSize: 100,
    gap: 0,
    position: "above_average",
    ...partial,
  };
}

function assertInvariants(insights: EngagementInsight[]) {
  const ids = new Set<string>();
  let lastSeverity = -1;
  let lastPriority = Number.POSITIVE_INFINITY;
  for (const i of insights) {
    expect(ids.has(i.id)).toBe(false);
    ids.add(i.id);
    expect(i.priority).toBeGreaterThanOrEqual(0);
    expect(i.priority).toBeLessThanOrEqual(100);
    expect(Number.isInteger(i.priority)).toBe(true);
    expect(i.title.length).toBeGreaterThan(0);
    expect(i.recommendation.length).toBeGreaterThan(0);
    expect(i.description).not.toContain("NaN");
    expect(i.description).not.toContain("undefined");
    const rank = SEVERITY_ORDER.indexOf(i.severity);
    expect(rank).toBeGreaterThanOrEqual(0);
    if (rank === lastSeverity) {
      expect(i.priority).toBeLessThanOrEqual(lastPriority);
    } else {
      expect(rank).toBeGreaterThan(lastSeverity);
      lastPriority = Number.POSITIVE_INFINITY;
    }
    lastSeverity = rank;
    lastPriority = Math.min(lastPriority, i.priority);
  }
}

describe("engagementInsights — entradas degeneradas", () => {
  const junk: unknown[] = [
    null,
    undefined,
    {},
    { pillars: null, factors: null, nps: null, benchmark: null, overview: null },
    { pillars: "nope", factors: 42, nps: {}, benchmark: true, overview: 0 },
  ];

  it("nunca lança e sempre devolve array", () => {
    for (const input of junk) {
      const out = buildEngagementInsights(input as never);
      expect(Array.isArray(out)).toBe(true);
      assertInvariants(out);
    }
  });
});

describe("engagementInsights — matriz de pilares", () => {
  const scores = [null, NaN, -5, 0, 3.9, 4, 5.9, 6, 7.4, 8.4, 8.5, 10, 11, "7" as unknown as number];
  const respondentValues = [-3, 0, 1, 4, 5, 40];

  it("cobre score × respondentes sem violar guardas", () => {
    let assertions = 0;
    for (const score of scores) {
      for (const respondents of respondentValues) {
        const out = buildEngagementInsights({
          pillars: [{ pillar: "lideranca", score: score as number, respondents }],
        });
        assertInvariants(out);
        const numeric = typeof score === "string" ? Number(score) : score;
        const valid =
          numeric !== null &&
          numeric !== undefined &&
          Number.isFinite(numeric) &&
          (numeric as number) >= 0 &&
          (numeric as number) <= 10;
        if (respondents < INSIGHT_MIN_RESPONDENTS || !valid) {
          expect(out).toHaveLength(0);
        } else if ((numeric as number) < 6) {
          expect(out[0].kind).toBe("pillar_critical");
          expect(out[0].severity).toBe((numeric as number) < 4 ? "critical" : "high");
        } else if ((numeric as number) >= 8.5) {
          expect(out[0].kind).toBe("strength");
          expect(out[0].severity).toBe("positive");
        } else {
          expect(out).toHaveLength(0);
        }
        assertions += 1;
      }
    }
    expect(assertions).toBe(scores.length * respondentValues.length);
  });

  it("ignora pilar sem nome válido", () => {
    for (const pillar of ["", "   ", null, undefined, 7]) {
      const out = buildEngagementInsights({
        pillars: [{ pillar: pillar as string, score: 2, respondents: 30 }],
      });
      expect(out).toHaveLength(0);
    }
  });
});

describe("engagementInsights — fatores", () => {
  it("só emite abaixo de 6 e com amostra suficiente", () => {
    for (let score = 0; score <= 10; score += 0.5) {
      for (const respondents of [0, 4, 5, 12]) {
        const out = buildEngagementInsights({
          factors: [
            { factor_key: "autonomia", factor_name: "Autonomia", pillar: "gestao", score, respondents },
          ],
        });
        assertInvariants(out);
        if (respondents >= INSIGHT_MIN_RESPONDENTS && score < 6) {
          expect(out).toHaveLength(1);
          expect(out[0].factorKey).toBe("autonomia");
        } else {
          expect(out).toHaveLength(0);
        }
      }
    }
  });

  it("usa a chave como rótulo quando o nome vem vazio", () => {
    const out = buildEngagementInsights({
      factors: [
        { factor_key: "carga_trabalho", factor_name: "  ", pillar: "saude", score: 3, respondents: 9 },
      ],
    });
    expect(out[0].title).toContain("carga_trabalho");
  });
});

describe("engagementInsights — benchmark de mercado", () => {
  it("exige amostra mínima e gap relevante", () => {
    for (const gap of [null, NaN, -3, -1.5, -1.4, -0.6, -0.5, 0, 2]) {
      for (const sampleSize of [0, 29, 30, 500]) {
        const out = buildEngagementInsights({ benchmark: [bench({ gap: gap as number, sampleSize })] });
        assertInvariants(out);
        const valid = gap !== null && Number.isFinite(gap as number) && (gap as number) < -0.5;
        if (sampleSize >= INSIGHT_MIN_BENCHMARK_SAMPLE && valid) {
          expect(out).toHaveLength(1);
          expect(out[0].kind).toBe("market_gap");
          expect(out[0].severity).toBe(Math.abs(gap as number) >= 1.5 ? "high" : "medium");
          expect(out[0].description).toContain("-");
        } else {
          expect(out).toHaveLength(0);
        }
      }
    }
  });
});

describe("engagementInsights — NPS", () => {
  it("dispara em score negativo ou queda >= 10 pontos", () => {
    const currents = [-100, -40, -1, 0, 5, 30, 100];
    const previous = [null, -50, 0, 10, 40, 200];
    for (const score of currents) {
      for (const prev of previous) {
        const out = buildEngagementInsights({
          nps: [{ metric: "eNPS", score, respondents: 12, previousScore: prev }],
        });
        assertInvariants(out);
        const prevValid = prev !== null && prev >= -100 && prev <= 100 ? prev : null;
        const delta = prevValid === null ? null : score - prevValid;
        const expected = score < 0 || (delta !== null && delta <= -10);
        expect(out.length).toBe(expected ? 1 : 0);
        if (expected) {
          expect(out[0].severity).toBe(score < 0 ? "critical" : "high");
        }
      }
    }
  });

  it("respeita amostra mínima", () => {
    const out = buildEngagementInsights({ nps: [{ metric: "eNPS", score: -50, respondents: 4 }] });
    expect(out).toHaveLength(0);
  });
});

describe("engagementInsights — participação", () => {
  it("usa taxa declarada válida e cai para a calculada quando inválida", () => {
    for (const declared of [null, NaN, -10, 0, 29, 30, 59, 60, 100, 140]) {
      for (const [respondents, eligible] of [[0, 0], [1, 100], [45, 100], [80, 100], [5, 5]]) {
        const out = buildEngagementInsights({
          overview: { participation_rate: declared as number, respondents, eligible_users: eligible },
        });
        assertInvariants(out);
        if (eligible <= 0) {
          expect(out).toHaveLength(0);
          continue;
        }
        const valid = declared !== null && Number.isFinite(declared as number) && (declared as number) >= 0 && (declared as number) <= 100;
        const rate = valid ? (declared as number) : (respondents / eligible) * 100;
        if (rate < 60) {
          expect(out).toHaveLength(1);
          expect(out[0].severity).toBe(rate < 30 ? "critical" : "high");
        } else {
          expect(out).toHaveLength(0);
        }
      }
    }
  });
});

describe("engagementInsights — integração e ordenação", () => {
  it("dedupe mantém a maior prioridade", () => {
    const out = buildEngagementInsights({
      pillars: [
        { pillar: "lideranca", score: 5.5, respondents: 10 },
        { pillar: "lideranca", score: 2, respondents: 10 },
      ],
    });
    expect(out).toHaveLength(1);
    expect(out[0].severity).toBe("critical");
  });

  it("cenário combinatório completo mantém invariantes", () => {
    let cases = 0;
    for (const pScore of [2, 5, 7, 9]) {
      for (const fScore of [1, 5.5, 8]) {
        for (const gap of [-2, -0.2, 1]) {
          for (const nps of [-30, 10]) {
            for (const rate of [20, 50, 85]) {
              const out = buildEngagementInsights({
                overview: { participation_rate: rate, respondents: rate, eligible_users: 100 },
                pillars: [{ pillar: "lideranca", score: pScore, respondents: 20 }],
                factors: [
                  { factor_key: "f1", factor_name: "Fator 1", pillar: "lideranca", score: fScore, respondents: 20 },
                ],
                benchmark: [bench({ gap })],
                nps: [{ metric: "eNPS", score: nps, respondents: 20, previousScore: 20 }],
              });
              assertInvariants(out);
              const summary = summarizeInsights(out);
              expect(summary.total).toBe(out.length);
              expect(summary.critical).toBeLessThanOrEqual(summary.total);
              if (summary.actionable > 0) expect(summary.topPriority).not.toBeNull();
              cases += 1;
            }
          }
        }
      }
    }
    expect(cases).toBe(4 * 3 * 3 * 2 * 3);
  });

  it("ordenação é determinística e idempotente", () => {
    const input = {
      pillars: [
        { pillar: "b", score: 3, respondents: 10 },
        { pillar: "a", score: 3, respondents: 10 },
        { pillar: "c", score: 9, respondents: 10 },
      ],
    };
    const first = buildEngagementInsights(input);
    const second = buildEngagementInsights(input);
    expect(first.map((i) => i.id)).toEqual(second.map((i) => i.id));
    expect(first[0].id).toBe("pillar_critical:a");
  });

  it("summarizeInsights tolera entrada inválida", () => {
    const s = summarizeInsights(null as never);
    expect(s.total).toBe(0);
    expect(s.topPriority).toBeNull();
  });
});
