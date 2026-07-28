import { describe, expect, it } from "vitest";
import {
  buildGoalBetHistoryCsv,
  escapeCsvField,
  goalBetHistoryCsvFilename,
} from "@/lib/goalBetHistoryCsv";
import type { GoalBetHistorySummary } from "@/lib/goalBetHistory";

const summary: GoalBetHistorySummary = {
  items: [
    {
      marketId: "m1",
      title: "Meta Janeiro",
      resolvedAt: "2030-01-05T12:00:00Z",
      staked: 100,
      returned: 250,
      profit: 150,
      voided: false,
      hit: true,
    },
    {
      marketId: "m2",
      title: "=CMD();Ranking",
      resolvedAt: "invalid",
      staked: 50,
      returned: 50,
      profit: 0,
      voided: true,
      hit: false,
    },
  ],
  decided: 1,
  hits: 1,
  hitRate: 1,
  totalStaked: 150,
  totalReturned: 300,
  netProfit: 150,
  roi: 1,
};

describe("buildGoalBetHistoryCsv", () => {
  it("gera cabeçalho, linhas e totais", () => {
    const rows = buildGoalBetHistoryCsv(summary).split("\r\n");
    expect(rows[0]).toBe("data;mercado;apostado;retornado;lucro;resultado");
    expect(rows[1]).toBe("2030-01-05;Meta Janeiro;100;250;150;Acerto");
    expect(rows[3]).toBe(";TOTAL;150;300;150;1/1");
  });

  it("neutraliza injeção de fórmula e escapa separador", () => {
    const rows = buildGoalBetHistoryCsv(summary).split("\r\n");
    expect(rows[2]).toContain(`"'=CMD();Ranking"`);
  });

  it("data inválida vira campo vazio e anulado é rotulado", () => {
    const rows = buildGoalBetHistoryCsv(summary).split("\r\n");
    expect(rows[2].startsWith(";")).toBe(true);
    expect(rows[2].endsWith("Anulado")).toBe(true);
  });

  it("histórico vazio ainda emite cabeçalho e totais zerados", () => {
    const rows = buildGoalBetHistoryCsv({
      ...summary,
      items: [],
      decided: 0,
      hits: 0,
      totalStaked: 0,
      totalReturned: 0,
      netProfit: 0,
    }).split("\r\n");
    expect(rows).toHaveLength(2);
    expect(rows[1]).toBe(";TOTAL;0;0;0;0/0");
  });

  it("escapa aspas duplicando", () => {
    expect(escapeCsvField('a"b')).toBe('"a""b"');
  });

  it("nome do arquivo é estável e tolera data inválida", () => {
    expect(goalBetHistoryCsvFilename(new Date("2030-02-03T00:00:00Z"))).toBe(
      "apostas-historico-2030-02-03.csv",
    );
    expect(goalBetHistoryCsvFilename(new Date("nope"))).toBe(
      "apostas-historico-sem-data.csv",
    );
  });
});
