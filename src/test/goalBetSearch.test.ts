import { describe, expect, it } from "vitest";
import {
  buildMarketSearchIndex,
  marketMatchesTerms,
  normalizeSearchText,
  parseSearchTerms,
  searchMarkets,
} from "@/lib/goalBetSearch";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

function makeMarket(overrides: Partial<PredictionMarketRow>): PredictionMarketRow {
  return {
    id: "m1",
    title: "Meta de Vendas",
    description: null,
    status: "open",
    min_stake: 10,
    max_stake_per_user: 100,
    rake_bps: 0,
    locks_at: "2026-01-01T00:00:00Z",
    resolves_at: null,
    winning_option_id: null,
    total_pool: 0,
    rake_collected: 0,
    settled_at: null,
    created_at: "2025-01-01T00:00:00Z",
    options: [],
    ...overrides,
  };
}

describe("normalizeSearchText", () => {
  it("remove acentos, caixa e espaços redundantes", () => {
    expect(normalizeSearchText("  Previsão   DO   Mês ")).toBe("previsao do mes");
  });

  it("tolera valores nulos", () => {
    expect(normalizeSearchText(null)).toBe("");
    expect(normalizeSearchText(undefined)).toBe("");
  });
});

describe("parseSearchTerms", () => {
  it("quebra a consulta em termos normalizados", () => {
    expect(parseSearchTerms("Meta  Vendas")).toEqual(["meta", "vendas"]);
  });

  it("devolve lista vazia para consulta em branco", () => {
    expect(parseSearchTerms("   ")).toEqual([]);
  });
});

describe("buildMarketSearchIndex", () => {
  it("agrega título, descrição e rótulos das opções", () => {
    const index = buildMarketSearchIndex(
      makeMarket({
        title: "Meta de Vendas",
        description: "Quem bate a métrica",
        options: [
          { id: "o1", market_id: "m1", label: "João", sort_order: 0, pool: 0 },
        ],
      }),
    );
    expect(index).toContain("meta de vendas");
    expect(index).toContain("metrica");
    expect(index).toContain("joao");
  });
});

describe("marketMatchesTerms", () => {
  it("exige todos os termos (AND)", () => {
    const market = makeMarket({ title: "Meta de Vendas Julho" });
    expect(marketMatchesTerms(market, ["meta", "julho"])).toBe(true);
    expect(marketMatchesTerms(market, ["meta", "agosto"])).toBe(false);
  });

  it("aceita mercado sem termos", () => {
    expect(marketMatchesTerms(makeMarket({}), [])).toBe(true);
  });
});

describe("searchMarkets", () => {
  const a = makeMarket({ id: "a", title: "Meta de Vendas" });
  const b = makeMarket({ id: "b", title: "Produção Diária" });

  it("filtra ignorando acentos", () => {
    expect(searchMarkets([a, b], "producao").map((m) => m.id)).toEqual(["b"]);
  });

  it("preserva a ordem original", () => {
    expect(searchMarkets([a, b], "a").map((m) => m.id)).toEqual(["a", "b"]);
  });

  it("devolve cópia íntegra quando a consulta é vazia", () => {
    const result = searchMarkets([a, b], "   ");
    expect(result).toEqual([a, b]);
    expect(result).not.toBe([a, b]);
  });

  it("tolera lista nula", () => {
    expect(searchMarkets(null, "meta")).toEqual([]);
    expect(searchMarkets(undefined, null)).toEqual([]);
  });
});
