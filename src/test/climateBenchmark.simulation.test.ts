import { describe, it, expect } from "vitest";
import {
  benchmarkPosition,
  buildBenchmarkComparisons,
  formatGap,
  normalizeThresholds,
  safeNumber,
  summarizeBenchmark,
  toComparison,
  type PillarBenchmarkRow,
} from "@/lib/climateBenchmark";

const PILLARS = [
  "recognition",
  "autonomy",
  "growth",
  "leadership",
  "peers",
  "purpose",
  "environment",
  "communication",
  "benefits",
  "balance",
];

function row(overrides: Partial<PillarBenchmarkRow> = {}): PillarBenchmarkRow {
  return {
    pillar: "recognition",
    score: 7,
    favorability: 60,
    respondents: 12,
    benchmark_average: 6.8,
    benchmark_top_quartile: 7.9,
    benchmark_top_10: 8.6,
    benchmark_sample_size: 1200,
    ...overrides,
  };
}

describe("normalizeThresholds — monotonicidade garantida", () => {
  it("corrige limiares invertidos em centenas de combinações", () => {
    let combos = 0;
    for (let avg = 0; avg <= 10; avg += 0.5) {
      for (let tq = 0; tq <= 10; tq += 0.5) {
        for (let t10 = 0; t10 <= 10; t10 += 2.5) {
          combos++;
          const n = normalizeThresholds(avg, tq, t10);
          expect(n.average).toBe(avg);
          expect(n.topQuartile!).toBeGreaterThanOrEqual(n.average!);
          expect(n.top10!).toBeGreaterThanOrEqual(n.topQuartile!);
        }
      }
    }
    expect(combos).toBe(2205);
  });

  it("tolera nulos e lixo", () => {
    expect(normalizeThresholds(null, null, null)).toEqual({
      average: null,
      topQuartile: null,
      top10: null,
    });
    expect(normalizeThresholds("abc", NaN, undefined).average).toBeNull();
    const partial = normalizeThresholds(7, null, 5);
    expect(partial.top10).toBe(7);
  });
});

describe("benchmarkPosition — simulação exaustiva score × limiares", () => {
  it("é monotônico e coerente em todas as faixas", () => {
    let combos = 0;
    const thresholds = normalizeThresholds(6.5, 7.8, 8.7);
    const rank = { below_average: 0, above_average: 1, top_quartile: 2, top_10: 3, unknown: -1 };
    let previous = -1;
    for (let score = 0; score <= 10; score += 0.1) {
      combos++;
      const s = Math.round(score * 10) / 10;
      const position = benchmarkPosition(s, thresholds);
      expect(rank[position]).toBeGreaterThanOrEqual(previous);
      previous = rank[position];
      if (s >= 8.7) expect(position).toBe("top_10");
      else if (s >= 7.8) expect(position).toBe("top_quartile");
      else if (s >= 6.5) expect(position).toBe("above_average");
      else expect(position).toBe("below_average");
    }
    expect(combos).toBe(101);
  });

  it("sem referência de mercado retorna unknown", () => {
    expect(benchmarkPosition(9, { average: null, topQuartile: null, top10: null })).toBe("unknown");
    expect(benchmarkPosition(null, { average: 7, topQuartile: 8, top10: 9 })).toBe("unknown");
  });
});

describe("toComparison — dados sujos", () => {
  it("normaliza score, contagens e gap em centenas de cenários", () => {
    let combos = 0;
    for (const score of [null, NaN, "7.5", 0, 5, 10, -3, 99]) {
      for (const avg of [null, 6.8, "6.8", NaN]) {
        for (const resp of [-5, 0, 12, "9", null]) {
          combos++;
          const c = toComparison(
            row({
              score: score as never,
              benchmark_average: avg as never,
              respondents: resp as never,
            }),
          );
          expect(c.respondents).toBeGreaterThanOrEqual(0);
          expect(Number.isInteger(c.respondents)).toBe(true);
          if (c.score === null || c.average === null) {
            expect(c.gap).toBeNull();
            expect(c.position).toBe("unknown");
          } else {
            expect(c.gap).toBeCloseTo(Math.round((c.score - c.average) * 10) / 10, 6);
          }
        }
      }
    }
    expect(combos).toBe(160);
  });

  it("safeNumber trata strings vazias e objetos", () => {
    expect(safeNumber("")).toBeNull();
    expect(safeNumber({})).toBeNull();
    expect(safeNumber("8.25")).toBe(8.25);
  });
});

describe("buildBenchmarkComparisons — ordenação determinística", () => {
  it("coloca o pior gap primeiro e os sem referência por último", () => {
    const rows: PillarBenchmarkRow[] = [
      row({ pillar: "growth", score: 5, benchmark_average: 7 }),
      row({ pillar: "peers", score: 9, benchmark_average: 7 }),
      row({ pillar: "purpose", score: null, benchmark_average: 7 }),
      row({ pillar: "autonomy", score: 6, benchmark_average: 7 }),
    ];
    const list = buildBenchmarkComparisons(rows);
    expect(list.map((c) => c.pillar)).toEqual(["growth", "autonomy", "peers", "purpose"]);
  });

  it("é estável sob embaralhamento (200 permutações)", () => {
    const base: PillarBenchmarkRow[] = PILLARS.map((p, i) =>
      row({ pillar: p, score: 4 + (i % 5), benchmark_average: 7 }),
    );
    const expected = buildBenchmarkComparisons(base).map((c) => c.pillar);
    for (let i = 0; i < 200; i++) {
      const shuffled = [...base].sort(() => (i % 3) - 1);
      expect(buildBenchmarkComparisons(shuffled).map((c) => c.pillar)).toEqual(expected);
    }
  });

  it("aceita entradas inválidas sem quebrar", () => {
    expect(buildBenchmarkComparisons(null)).toEqual([]);
    expect(buildBenchmarkComparisons(undefined)).toEqual([]);
    expect(buildBenchmarkComparisons([] as PillarBenchmarkRow[])).toEqual([]);
  });
});

describe("summarizeBenchmark — sumário executivo", () => {
  it("mantém invariantes em centenas de cenários gerados", () => {
    let combos = 0;
    for (let offset = -3; offset <= 3; offset += 0.5) {
      for (let size = 1; size <= 10; size++) {
        combos++;
        const rows = PILLARS.slice(0, size).map((p, i) =>
          row({ pillar: p, score: 7 + offset + i * 0.1, benchmark_average: 7 }),
        );
        const summary = summarizeBenchmark(buildBenchmarkComparisons(rows));
        expect(summary.comparable).toBe(size);
        expect(summary.aboveMarket + summary.belowMarket).toBe(size);
        expect(summary.strongest!.gap!).toBeGreaterThanOrEqual(summary.weakest!.gap!);
        expect(summary.averageGap!).toBeGreaterThanOrEqual(summary.weakest!.gap!);
        expect(summary.averageGap!).toBeLessThanOrEqual(summary.strongest!.gap!);
      }
    }
    expect(combos).toBe(130);
  });

  it("retorna sumário vazio sem base comparável", () => {
    const summary = summarizeBenchmark(
      buildBenchmarkComparisons([row({ score: null, benchmark_average: null })]),
    );
    expect(summary).toEqual({
      comparable: 0,
      aboveMarket: 0,
      belowMarket: 0,
      topPerformers: 0,
      averageGap: null,
      strongest: null,
      weakest: null,
    });
  });
});

describe("formatGap — rótulos", () => {
  it("usa sinal explícito e vírgula decimal", () => {
    expect(formatGap(null)).toBe("—");
    expect(formatGap(0)).toBe("0,0");
    expect(formatGap(1.24)).toBe("+1,2");
    expect(formatGap(-2.35)).toBe("−2,4");
    for (let g = -5; g <= 5; g += 0.1) {
      const label = formatGap(Math.round(g * 10) / 10);
      expect(label).toMatch(/^(—|0,0|[+−]\d+,\d)$/);
    }
  });
});
