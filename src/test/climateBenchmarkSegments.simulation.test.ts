import { describe, expect, it } from "vitest";
import {
  BENCHMARK_COMPANY_SIZES,
  BENCHMARK_INDUSTRIES,
  benchmarkFallbackChain,
  companySizeLabel,
  describeAppliedSegment,
  industryLabel,
  normalizeCompanySize,
  normalizeIndustry,
  type PillarBenchmarkRow,
} from "@/lib/climateBenchmark";

const INDUSTRIES = BENCHMARK_INDUSTRIES.map((i) => i.value);
const SIZES = BENCHMARK_COMPANY_SIZES.map((s) => s.value);

function row(over: Partial<PillarBenchmarkRow> = {}): PillarBenchmarkRow {
  return {
    pillar: "recognition",
    score: 7,
    favorability: 70,
    respondents: 12,
    benchmark_average: 6.5,
    benchmark_top_quartile: 7.6,
    benchmark_top_10: 8.5,
    benchmark_sample_size: 1000,
    ...over,
  };
}

describe("normalização de segmento", () => {
  it("aceita todos os valores do catálogo", () => {
    for (const i of INDUSTRIES) expect(normalizeIndustry(i)).toBe(i);
    for (const s of SIZES) expect(normalizeCompanySize(s)).toBe(s);
  });

  it("é tolerante a caixa e espaços", () => {
    for (const i of INDUSTRIES) {
      expect(normalizeIndustry(`  ${i.toUpperCase()} `)).toBe(i);
    }
    for (const s of SIZES) {
      expect(normalizeCompanySize(` ${s.toUpperCase()}  `)).toBe(s);
    }
  });

  it("cai no padrão para lixo de entrada", () => {
    const junk: unknown[] = [null, undefined, "", "  ", 42, {}, [], NaN, "hacker", "TODOS", true];
    for (const value of junk) {
      expect(normalizeIndustry(value)).toBe("geral");
      expect(normalizeCompanySize(value)).toBe("all");
    }
  });

  it("sempre devolve rótulo não vazio", () => {
    for (const i of [...INDUSTRIES, "x", null]) expect(industryLabel(i).length).toBeGreaterThan(0);
    for (const s of [...SIZES, "x", null]) expect(companySizeLabel(s).length).toBeGreaterThan(0);
  });
});

describe("cadeia de fallback (setor × porte)", () => {
  it("cobre todas as 35 combinações sem duplicatas e terminando em geral/all", () => {
    let combos = 0;
    for (const ind of INDUSTRIES) {
      for (const size of SIZES) {
        combos += 1;
        const chain = benchmarkFallbackChain(ind, size);
        const keys = chain.map((c) => `${c.industry}|${c.companySize}`);
        expect(new Set(keys).size).toBe(keys.length);
        expect(keys[0]).toBe(`${ind}|${size}`);
        expect(keys[keys.length - 1]).toBe("geral|all");
        expect(chain.length).toBeGreaterThanOrEqual(1);
        expect(chain.length).toBeLessThanOrEqual(4);
      }
    }
    expect(combos).toBe(INDUSTRIES.length * SIZES.length);
  });

  it("degrada de forma monotônica (nunca troca setor antes de generalizar porte)", () => {
    for (const ind of INDUSTRIES.filter((i) => i !== "geral")) {
      for (const size of SIZES.filter((s) => s !== "all")) {
        const chain = benchmarkFallbackChain(ind, size);
        const specificIdx = chain.findIndex((c) => c.industry === ind && c.companySize === "all");
        const generalIdx = chain.findIndex((c) => c.industry === "geral" && c.companySize === size);
        if (specificIdx >= 0 && generalIdx >= 0) {
          expect(specificIdx).toBeLessThan(generalIdx);
        }
      }
    }
  });

  it("colapsa para 1 entrada no recorte totalmente geral", () => {
    expect(benchmarkFallbackChain("geral", "all")).toHaveLength(1);
    expect(benchmarkFallbackChain("lixo", "lixo")).toHaveLength(1);
  });

  it("é idempotente sob entradas sujas equivalentes", () => {
    for (const ind of INDUSTRIES) {
      for (const size of SIZES) {
        expect(benchmarkFallbackChain(` ${ind.toUpperCase()}`, ` ${size.toUpperCase()} `)).toEqual(
          benchmarkFallbackChain(ind, size),
        );
      }
    }
  });
});

describe("descrição do recorte aplicado", () => {
  it("detecta fallback em todas as combinações divergentes", () => {
    let checked = 0;
    for (const reqInd of INDUSTRIES) {
      for (const reqSize of SIZES) {
        for (const appInd of INDUSTRIES) {
          for (const appSize of SIZES) {
            checked += 1;
            const result = describeAppliedSegment(
              [row({ benchmark_industry: appInd, benchmark_company_size: appSize })],
              reqInd,
              reqSize,
            );
            expect(result.isFallback).toBe(appInd !== reqInd || appSize !== reqSize);
            expect(result.label).toBe(`${industryLabel(appInd)} · ${companySizeLabel(appSize)}`);
          }
        }
      }
    }
    expect(checked).toBe(INDUSTRIES.length ** 2 * SIZES.length ** 2);
  });

  it("assume o recorte pedido quando a RPC não informa origem", () => {
    for (const ind of INDUSTRIES) {
      for (const size of SIZES) {
        const result = describeAppliedSegment([row()], ind, size);
        expect(result.isFallback).toBe(false);
        expect(result.label).toBe(`${industryLabel(ind)} · ${companySizeLabel(size)}`);
      }
    }
  });

  it("não quebra com listas vazias, nulas ou linhas corrompidas", () => {
    const inputs: Array<PillarBenchmarkRow[] | null | undefined> = [
      [],
      null,
      undefined,
      [row({ benchmark_industry: null, benchmark_company_size: null })],
      [row({ benchmark_industry: "inexistente", benchmark_company_size: "gigante" })],
    ];
    for (const input of inputs) {
      const result = describeAppliedSegment(input, "tecnologia", "large");
      expect(result.label).toContain("·");
    }
  });

  it("usa a primeira linha que carrega origem, ignorando linhas sem referência", () => {
    const rows = [
      row({ pillar: "growth", benchmark_industry: null, benchmark_company_size: null }),
      row({ pillar: "peers", benchmark_industry: "saude", benchmark_company_size: "medium" }),
    ];
    const result = describeAppliedSegment(rows, "saude", "enterprise");
    expect(result.label).toBe(`${industryLabel("saude")} · ${companySizeLabel("medium")}`);
    expect(result.isFallback).toBe(true);
  });
});
