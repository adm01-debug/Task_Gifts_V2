import { describe, expect, it } from "vitest";
import { goalBetMarketsForCampaign, pickGoalBetMarket } from "@/lib/goalBetShowcase";

function market(id: string, name: string, status: string, locksAt: string) {
  return {
    id,
    title: `Quem bate a meta da campanha "${name}"?`,
    status,
    locks_at: locksAt,
  };
}

describe("goalBetShowcase", () => {
  it("V1: ignora mercados de outras campanhas e títulos comuns", () => {
    const rows = [
      market("a", "Verão", "open", "2026-02-01T00:00:00Z"),
      market("b", "Verão Premium", "open", "2026-02-01T00:00:00Z"),
      { id: "c", title: "Quem vence o duelo?", status: "open", locks_at: "2026-02-01T00:00:00Z" },
    ];
    expect(goalBetMarketsForCampaign(rows, "Verão").map((m) => m.id)).toEqual(["a"]);
  });

  it("V2: prioriza aberto sobre travado, apurado e rascunho", () => {
    const rows = [
      market("draft", "Verão", "draft", "2026-03-01T00:00:00Z"),
      market("settled", "Verão", "settled", "2026-03-01T00:00:00Z"),
      market("locked", "Verão", "locked", "2026-03-01T00:00:00Z"),
      market("open", "Verão", "open", "2026-01-01T00:00:00Z"),
    ];
    expect(pickGoalBetMarket(rows, "Verão")?.id).toBe("open");
  });

  it("V3: desempata pelo travamento mais recente e é determinístico", () => {
    const rows = [
      market("old", "Verão", "open", "2026-01-01T00:00:00Z"),
      market("new", "Verão", "open", "2026-02-01T00:00:00Z"),
    ];
    expect(pickGoalBetMarket(rows, "Verão")?.id).toBe("new");
    expect(pickGoalBetMarket([...rows].reverse(), "Verão")?.id).toBe("new");
  });

  it("retorna null sem correspondência ou com nome vazio", () => {
    expect(pickGoalBetMarket([market("a", "Verão", "open", "2026-01-01T00:00:00Z")], "Inverno")).toBeNull();
    expect(pickGoalBetMarket([market("a", "Verão", "open", "2026-01-01T00:00:00Z")], "  ")).toBeNull();
  });
});