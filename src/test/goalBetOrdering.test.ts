import { describe, expect, it } from "vitest";
import { sortMarketsByUrgency } from "@/lib/goalBetOrdering";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

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

const ids = (rows: PredictionMarketRow[]) => rows.map((r) => r.id);

describe("sortMarketsByUrgency", () => {
  it("coloca abertos antes de travados, apurados, anulados e rascunhos", () => {
    const rows = sortMarketsByUrgency([
      market({ id: "draft", status: "draft" }),
      market({ id: "voided", status: "voided" }),
      market({ id: "settled", status: "settled" }),
      market({ id: "locked", status: "locked" }),
      market({ id: "open", status: "open" }),
    ]);
    expect(ids(rows)).toEqual(["open", "locked", "settled", "voided", "draft"]);
  });

  it("dentro dos abertos, quem fecha antes vem primeiro", () => {
    const rows = sortMarketsByUrgency([
      market({ id: "tarde", locks_at: "2030-03-01T00:00:00Z" }),
      market({ id: "cedo", locks_at: "2030-01-05T00:00:00Z" }),
      market({ id: "meio", locks_at: "2030-02-01T00:00:00Z" }),
    ]);
    expect(ids(rows)).toEqual(["cedo", "meio", "tarde"]);
  });

  it("encerrados saem do mais recente para o mais antigo", () => {
    const rows = sortMarketsByUrgency([
      market({ id: "antigo", status: "settled", created_at: "2028-01-01T00:00:00Z" }),
      market({ id: "novo", status: "settled", created_at: "2029-06-01T00:00:00Z" }),
    ]);
    expect(ids(rows)).toEqual(["novo", "antigo"]);
  });

  it("datas inválidas não furam a fila da urgência", () => {
    const rows = sortMarketsByUrgency([
      market({ id: "invalido", locks_at: "nao-e-data" }),
      market({ id: "valido", locks_at: "2031-01-01T00:00:00Z" }),
    ]);
    expect(ids(rows)).toEqual(["valido", "invalido"]);
  });

  it("empates são resolvidos pelo id e a entrada não é mutada", () => {
    const input = [market({ id: "b" }), market({ id: "a" })];
    const rows = sortMarketsByUrgency(input);
    expect(ids(rows)).toEqual(["a", "b"]);
    expect(ids(input)).toEqual(["b", "a"]);
  });

  it("tolera lista nula", () => {
    expect(sortMarketsByUrgency(null)).toEqual([]);
    expect(sortMarketsByUrgency(undefined)).toEqual([]);
  });
});