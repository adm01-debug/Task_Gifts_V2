import { describe, expect, it } from "vitest";
import {
  accuracyZScore,
  analyzeWagerIntegrity,
  integritySummary,
  severityLabel,
  sortAnomalies,
  type WagerAnomaly,
} from "@/lib/wagerIntegrity";
import type { WagerLeaderboardRow } from "@/lib/wagerLeaderboard";

const NOW = new Date("2026-07-28T12:00:00.000Z");

function row(partial: Partial<WagerLeaderboardRow> = {}): WagerLeaderboardRow {
  return {
    userId: "u1",
    displayName: "Ana",
    avatarUrl: null,
    entries: 10,
    correctCount: 5,
    accuracy: 50,
    stakedCoins: 100,
    netCoins: 0,
    xpAwarded: 0,
    currentStreak: 0,
    bestStreak: 2,
    lastPlayed: "2026-07-27T12:00:00.000Z",
    rank: 1,
    ...partial,
  };
}

describe("accuracyZScore", () => {
  it("retorna 0 sem amostra", () => {
    expect(accuracyZScore(0, 0, 50)).toBe(0);
  });

  it("retorna 0 para baseline degenerada", () => {
    expect(accuracyZScore(10, 10, 0)).toBe(0);
    expect(accuracyZScore(10, 10, 100)).toBe(0);
  });

  it("é zero quando a acurácia bate exatamente o acaso", () => {
    expect(accuracyZScore(5, 10, 50)).toBe(0);
  });

  it("cresce com acertos acima do acaso", () => {
    expect(accuracyZScore(10, 10, 50)).toBeCloseTo(3.16, 2);
  });

  it("é negativo abaixo do acaso", () => {
    expect(accuracyZScore(0, 10, 50)).toBeLessThan(0);
  });

  it("satura acertos acima do total", () => {
    expect(accuracyZScore(50, 10, 50)).toBe(accuracyZScore(10, 10, 50));
  });

  it("ignora valores não finitos", () => {
    expect(accuracyZScore(Number.NaN, 10, 50)).toBeLessThan(0);
    expect(accuracyZScore(5, Number.NaN, 50)).toBe(0);
  });
});

describe("analyzeWagerIntegrity - robustez de entrada", () => {
  it("aceita lista vazia", () => {
    const report = analyzeWagerIntegrity([], { now: NOW });
    expect(report.anomalies).toEqual([]);
    expect(report.healthScore).toBe(100);
  });

  it("aceita payload inválido sem lançar", () => {
    expect(() =>
      analyzeWagerIntegrity(undefined as unknown as WagerLeaderboardRow[], { now: NOW }),
    ).not.toThrow();
  });

  it("descarta linhas sem userId", () => {
    const report = analyzeWagerIntegrity([row({ userId: "" })], { now: NOW });
    expect(report.evaluated + report.skipped).toBe(0);
  });

  it("usa data atual quando now é inválido", () => {
    const report = analyzeWagerIntegrity([row()], { now: new Date("x") });
    expect(report.evaluated).toBe(1);
  });
});

describe("analyzeWagerIntegrity - amostra mínima", () => {
  it("ignora jogadores abaixo do mínimo", () => {
    const report = analyzeWagerIntegrity([row({ entries: 3, correctCount: 3 })], { now: NOW });
    expect(report.skipped).toBe(1);
    expect(report.evaluated).toBe(0);
    expect(report.anomalies.filter((a) => a.code === "accuracy_outlier")).toHaveLength(0);
  });

  it("respeita minEntries customizado", () => {
    const report = analyzeWagerIntegrity([row({ entries: 3, correctCount: 3, bestStreak: 3 })], {
      now: NOW,
      minEntries: 3,
    });
    expect(report.evaluated).toBe(1);
  });

  it("normaliza minEntries <= 0", () => {
    const report = analyzeWagerIntegrity([row({ entries: 1, correctCount: 1 })], {
      now: NOW,
      minEntries: 0,
    });
    expect(report.evaluated).toBe(1);
  });
});

describe("analyzeWagerIntegrity - deteção de acurácia", () => {
  it("marca crítico acima do z crítico", () => {
    const report = analyzeWagerIntegrity([row({ entries: 20, correctCount: 20, bestStreak: 5 })], {
      now: NOW,
    });
    const found = report.anomalies.find((a) => a.code === "accuracy_outlier");
    expect(found?.severity).toBe("critical");
  });

  it("marca atenção na faixa intermediária", () => {
    const report = analyzeWagerIntegrity([row({ entries: 20, correctCount: 15, bestStreak: 4 })], {
      now: NOW,
    });
    const found = report.anomalies.find((a) => a.code === "accuracy_outlier");
    expect(found?.severity).toBe("warning");
  });

  it("não marca jogador mediano", () => {
    const report = analyzeWagerIntegrity([row({ entries: 20, correctCount: 10 })], { now: NOW });
    expect(report.anomalies.filter((a) => a.code === "accuracy_outlier")).toHaveLength(0);
  });

  it("respeita baseline customizada", () => {
    const report = analyzeWagerIntegrity([row({ entries: 20, correctCount: 15 })], {
      now: NOW,
      baselineAccuracy: 75,
    });
    expect(report.anomalies.filter((a) => a.code === "accuracy_outlier")).toHaveLength(0);
  });
});

describe("analyzeWagerIntegrity - demais detectores", () => {
  it("detecta sequência perfeita", () => {
    const report = analyzeWagerIntegrity(
      [row({ entries: 12, correctCount: 12, bestStreak: 12 })],
      { now: NOW },
    );
    expect(report.anomalies.some((a) => a.code === "perfect_streak")).toBe(true);
  });

  it("não acusa sequência perfeita quando houve erro", () => {
    const report = analyzeWagerIntegrity(
      [row({ entries: 12, correctCount: 11, bestStreak: 11 })],
      { now: NOW },
    );
    expect(report.anomalies.some((a) => a.code === "perfect_streak")).toBe(false);
  });

  it("detecta ganho líquido elevado", () => {
    const report = analyzeWagerIntegrity([row({ netCoins: 5000 })], { now: NOW });
    expect(report.anomalies.some((a) => a.code === "net_drain")).toBe(true);
  });

  it("ignora saldo negativo", () => {
    const report = analyzeWagerIntegrity([row({ netCoins: -5000 })], { now: NOW });
    expect(report.anomalies.some((a) => a.code === "net_drain")).toBe(false);
    expect(report.netDistributed).toBe(-5000);
  });

  it("detecta volume muito acima da mediana", () => {
    const report = analyzeWagerIntegrity(
      [
        row({ userId: "a", entries: 10, correctCount: 5 }),
        row({ userId: "b", entries: 10, correctCount: 5 }),
        row({ userId: "c", entries: 60, correctCount: 30 }),
      ],
      { now: NOW },
    );
    expect(report.anomalies.filter((a) => a.code === "volume_spike")).toHaveLength(1);
  });

  it("detecta top player inativo", () => {
    const report = analyzeWagerIntegrity(
      [row({ rank: 2, lastPlayed: "2026-06-01T00:00:00.000Z" })],
      { now: NOW },
    );
    expect(report.anomalies.some((a) => a.code === "stale_activity")).toBe(true);
  });

  it("não acusa inatividade fora do top 5", () => {
    const report = analyzeWagerIntegrity(
      [row({ rank: 9, lastPlayed: "2026-06-01T00:00:00.000Z" })],
      { now: NOW },
    );
    expect(report.anomalies.some((a) => a.code === "stale_activity")).toBe(false);
  });

  it("trata lastPlayed nulo ou inválido", () => {
    const report = analyzeWagerIntegrity(
      [row({ lastPlayed: null }), row({ userId: "z", lastPlayed: "não-é-data" })],
      { now: NOW },
    );
    expect(report.anomalies.some((a) => a.code === "stale_activity")).toBe(false);
  });

  it("clampa datas futuras em 0 dia", () => {
    const report = analyzeWagerIntegrity([row({ lastPlayed: "2030-01-01T00:00:00.000Z" })], {
      now: NOW,
    });
    expect(report.anomalies.some((a) => a.code === "stale_activity")).toBe(false);
  });
});

describe("healthScore e resumo", () => {
  it("é 100 sem anomalias", () => {
    expect(analyzeWagerIntegrity([row()], { now: NOW }).healthScore).toBe(100);
  });

  it("nunca fica negativo", () => {
    const rows = Array.from({ length: 30 }, (_, i) =>
      row({ userId: `u${i}`, entries: 20, correctCount: 20, bestStreak: 20, netCoins: 9999 }),
    );
    expect(analyzeWagerIntegrity(rows, { now: NOW }).healthScore).toBe(0);
  });

  it("é determinístico", () => {
    const rows = [row({ entries: 20, correctCount: 18, bestStreak: 6 })];
    expect(analyzeWagerIntegrity(rows, { now: NOW })).toEqual(
      analyzeWagerIntegrity(rows, { now: NOW }),
    );
  });

  it("resume ausência de amostra", () => {
    const report = analyzeWagerIntegrity([row({ entries: 1 })], { now: NOW });
    expect(integritySummary(report)).toContain("Sem amostra");
  });

  it("resume período saudável", () => {
    expect(integritySummary(analyzeWagerIntegrity([row()], { now: NOW }))).toContain(
      "Nenhuma anomalia",
    );
  });

  it("resume período com crítico", () => {
    const report = analyzeWagerIntegrity([row({ entries: 20, correctCount: 20, bestStreak: 20 })], {
      now: NOW,
    });
    expect(integritySummary(report)).toContain("crítico");
  });

  it("soma o saldo líquido de todos os jogadores", () => {
    const report = analyzeWagerIntegrity(
      [row({ userId: "a", netCoins: 100 }), row({ userId: "b", netCoins: -40 })],
      { now: NOW },
    );
    expect(report.netDistributed).toBe(60);
  });
});

describe("ordenação e rótulos", () => {
  const base: WagerAnomaly = {
    code: "net_drain",
    severity: "info",
    userId: "x",
    displayName: "Bruno",
    title: "t",
    detail: "d",
    metric: 1,
  };

  it("prioriza severidade", () => {
    const sorted = sortAnomalies([
      base,
      { ...base, severity: "critical", metric: 0 },
      { ...base, severity: "warning", metric: 100 },
    ]);
    expect(sorted.map((a) => a.severity)).toEqual(["critical", "warning", "info"]);
  });

  it("desempata pela métrica e depois pelo nome", () => {
    const sorted = sortAnomalies([
      { ...base, displayName: "Carla", metric: 5 },
      { ...base, displayName: "Ana", metric: 5 },
      { ...base, displayName: "Zeca", metric: 9 },
    ]);
    expect(sorted.map((a) => a.displayName)).toEqual(["Zeca", "Ana", "Carla"]);
  });

  it("não muta a lista original", () => {
    const list = [base, { ...base, severity: "critical" as const }];
    const copy = [...list];
    sortAnomalies(list);
    expect(list).toEqual(copy);
  });

  it("traduz severidades", () => {
    expect(severityLabel("critical")).toBe("Crítico");
    expect(severityLabel("warning")).toBe("Atenção");
    expect(severityLabel("info")).toBe("Informativo");
  });
});