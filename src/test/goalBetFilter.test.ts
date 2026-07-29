import { describe, expect, it } from "vitest";
import { countMarketsByFilter, filterMarkets } from "@/lib/goalBetFilter";
import type {
  PredictionMarketRow,
  PredictionStakeRow,
} from "@/services/predictionMarketService";

function market(overrides: Partial<PredictionMarketRow> = {}): PredictionMarketRow {
  return {
    id: "m1",
    title: "Meta",
    description: null,
    status: "open",
    min_stake: 10,
    max_stake_per_user: 500,
    rake_bps: 0,
    locks_at: "2030-01-01T00:00:00Z",
    resolves_at: null,
    winning_option_id: null,
    total_pool: 0,
    rake_collected: 0,
    settled_at: null,
    created_at: "2029-01-01T00:00:00Z",
    options: [],
    ...overrides,
  };
}

function stake(o: Partial<PredictionStakeRow> = {}): PredictionStakeRow {
  return {
    id: "s1",
    market_id: "m1",
    option_id: "a",
    amount: 100,
    payout: null,
    created_at: "2029-02-01T00:00:00Z",
    ...o,
  };
}

const rows = [
  market({ id: "aberto", status: "open" }),
  market({ id: "travado", status: "locked" }),
  market({ id: "apurado", status: "settled" }),
  market({ id: "anulado", status: "voided" }),
  market({ id: "rascunho", status: "draft" }),
];
const stakes = [stake({ market_id: "apurado" }), stake({ id: "s2", market_id: "travado" })];
const ids = (list: PredictionMarketRow[]) => list.map((m) => m.id);

describe("filterMarkets", () => {
  it("all preserva a ordem recebida", () => {
    expect(ids(filterMarkets(rows, stakes, "all"))).toEqual(ids(rows));
  });

  it("open traz somente mercados abertos", () => {
    expect(ids(filterMarkets(rows, stakes, "open"))).toEqual(["aberto"]);
  });

  it("closed traz apurados e anulados", () => {
    expect(ids(filterMarkets(rows, stakes, "closed"))).toEqual(["apurado", "anulado"]);
  });

  it("mine mantém mercados com aporte, inclusive encerrados", () => {
    expect(ids(filterMarkets(rows, stakes, "mine"))).toEqual(["travado", "apurado"]);
  });

  it("não muta a entrada e tolera listas nulas", () => {
    const input = [...rows];
    filterMarkets(input, stakes, "open");
    expect(ids(input)).toEqual(ids(rows));
    expect(filterMarkets(null, null, "mine")).toEqual([]);
  });
});

describe("countMarketsByFilter", () => {
  it("conta cada faixa corretamente", () => {
    expect(countMarketsByFilter(rows, stakes)).toEqual({
      all: 5,
      open: 1,
      mine: 2,
      closed: 2,
    });
  });

  it("zera tudo sem dados", () => {
    expect(countMarketsByFilter(null, null)).toEqual({
      all: 0,
      open: 0,
      mine: 0,
      closed: 0,
    });
  });
});