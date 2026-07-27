import { describe, expect, it } from "vitest";

import {
  comparePayoutWindows,
  erf,
  normalCdf,
  tTestPValue,
  welchTest,
} from "@/lib/luckyWheelPayoutComparison";
import { buildPayoutTrend, type PayoutSnapshotRow } from "@/lib/luckyWheelPayoutHistory";

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function day(base: string, offset: number): string {
  const d = new Date(`${base}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

function points(rows: PayoutSnapshotRow[], days: number, endDate: string) {
  return buildPayoutTrend(rows, { days, endDate }).points;
}

/** Série estável: mesmo custo por giro nas duas janelas. */
function stableRows(endDate: string, days: number, coinsPerSpin: number, seed: number): PayoutSnapshotRow[] {
  const rand = rng(seed);
  const rows: PayoutSnapshotRow[] = [];
  for (let i = 0; i < days; i++) {
    const spins = 200 + Math.floor(rand() * 20);
    rows.push({
      snapshot_date: day(endDate, -i),
      spins,
      unique_users: spins,
      coins_paid: Math.round(spins * (coinsPerSpin + (rand() - 0.5) * 0.2)),
      projected_coins: spins * coinsPerSpin,
      chi_square: 3 + rand(),
      degrees_of_freedom: 5,
    });
  }
  return rows;
}

describe("funções estatísticas", () => {
  it("erf é ímpar e limitada", () => {
    for (let i = -60; i <= 60; i++) {
      const x = i / 10;
      const v = erf(x);
      expect(v).toBeGreaterThanOrEqual(-1.0001);
      expect(v).toBeLessThanOrEqual(1.0001);
      expect(v + erf(-x)).toBeCloseTo(0, 6);
    }
  });

  it("normalCdf bate com valores tabelados", () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.645)).toBeCloseTo(0.95, 3);
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3);
    expect(normalCdf(2.576)).toBeCloseTo(0.995, 3);
  });

  it("tTestPValue é monotônica e sempre em [0,1]", () => {
    for (const df of [1, 3, 5, 10, 30, 120, 5000]) {
      let last = 1.0001;
      for (let t = 0; t <= 8; t += 0.25) {
        const p = tTestPValue(t, df);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
        expect(p).toBeLessThanOrEqual(last + 1e-9);
        last = p;
      }
    }
  });

  it("aproxima os valores críticos clássicos de t", () => {
    // t crítico bicaudal a 5%: df=10 -> 2.228 ; df=30 -> 2.042
    expect(tTestPValue(2.228, 10)).toBeCloseTo(0.05, 2);
    expect(tTestPValue(2.042, 30)).toBeCloseTo(0.05, 2);
  });

  it("welchTest devolve zeros seguros para amostras degeneradas", () => {
    expect(welchTest([], [])).toEqual({ statistic: 0, degreesOfFreedom: 0, pValue: 1, effectSize: 0 });
    expect(welchTest([1], [2]).pValue).toBe(1);
    const equal = welchTest([5, 5, 5], [5, 5, 5]);
    expect(equal.pValue).toBe(1);
    expect(Number.isFinite(equal.statistic)).toBe(true);
  });
});

describe("comparePayoutWindows — simulação massiva", () => {
  it("não acusa falso positivo em 200 séries estáveis", () => {
    let falsePositives = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const rows = stableRows("2025-05-20", 14, 20, seed);
      const result = comparePayoutWindows(points(rows, 14, "2025-05-20"), { windowDays: 7 });
      if (result.tests.find((t) => t.metric === "coinsPerSpin")!.verdict === "significant") {
        falsePositives++;
      }
    }
    // Com alpha = 0,05 esperamos < 10% de falsos positivos.
    expect(falsePositives).toBeLessThan(20);
  });

  it("detecta um salto real de custo por giro", () => {
    const rows = [
      ...stableRows("2025-05-20", 7, 40, 11), // janela atual (custo dobrado)
      ...stableRows("2025-05-13", 7, 20, 12), // janela anterior
    ];
    const result = comparePayoutWindows(points(rows, 14, "2025-05-20"), { windowDays: 7 });
    const test = result.tests.find((t) => t.metric === "coinsPerSpin")!;
    expect(test.verdict).toBe("significant");
    expect(test.delta).toBeGreaterThan(0);
    expect(result.verdict).toBe("significant");
    expect(result.notes.join(" ")).toContain("alta");
  });

  it("mantém janelas contíguas e não sobrepostas em 150 combinações", () => {
    for (let seed = 1; seed <= 150; seed++) {
      const windowDays = 1 + (seed % 14);
      const total = windowDays * 2 + (seed % 5);
      const rows = stableRows("2025-04-30", total, 15, seed);
      const result = comparePayoutWindows(points(rows, total, "2025-04-30"), { windowDays });
      if (result.previous.days > 0 && result.current.days > 0) {
        expect(result.previous.endDate < result.current.startDate).toBe(true);
      }
      expect(result.current.days).toBeLessThanOrEqual(windowDays);
      expect(result.previous.days).toBeLessThanOrEqual(windowDays);
      for (const test of result.tests) {
        expect(test.pValue).toBeGreaterThanOrEqual(0);
        expect(test.pValue).toBeLessThanOrEqual(1);
        expect(Number.isFinite(test.statistic)).toBe(true);
        expect(Number.isFinite(test.effectSize)).toBe(true);
        expect(Number.isFinite(test.deltaRatio)).toBe(true);
      }
    }
  });

  it("classifica como insuficiente quando falta amostra", () => {
    const rows: PayoutSnapshotRow[] = [
      { snapshot_date: "2025-05-20", spins: 5, coins_paid: 50, projected_coins: 40 },
      { snapshot_date: "2025-05-10", spins: 4, coins_paid: 40, projected_coins: 40 },
    ];
    const result = comparePayoutWindows(points(rows, 14, "2025-05-20"), { windowDays: 7 });
    expect(result.verdict).toBe("insufficient");
    expect(result.tests.every((t) => t.verdict === "insufficient")).toBe(true);
    expect(result.notes[0]).toContain("Amostra insuficiente");
  });

  it("tolera série vazia sem quebrar", () => {
    const result = comparePayoutWindows([], { windowDays: 7 });
    expect(result.current.days).toBe(0);
    expect(result.previous.days).toBe(0);
    expect(result.verdict).toBe("insufficient");
  });

  it("ignora lacunas ao calcular médias por dia", () => {
    const rows: PayoutSnapshotRow[] = [
      { snapshot_date: "2025-05-20", spins: 100, coins_paid: 2000, projected_coins: 2000, degrees_of_freedom: 4, chi_square: 4 },
      { snapshot_date: "2025-05-19", spins: 100, coins_paid: 2000, projected_coins: 2000, degrees_of_freedom: 4, chi_square: 4 },
    ];
    const result = comparePayoutWindows(points(rows, 14, "2025-05-20"), { windowDays: 7 });
    expect(result.current.daysWithData).toBe(2);
    expect(result.current.spinsPerDay).toBe(100);
    expect(result.current.coinsPerSpin).toBe(20);
    expect(result.current.chiPerDf).toBe(1);
  });

  it("respeita alpha configurado", () => {
    const rows = [...stableRows("2025-05-20", 7, 22, 3), ...stableRows("2025-05-13", 7, 20, 4)];
    const p = points(rows, 14, "2025-05-20");
    const observed = comparePayoutWindows(p, { windowDays: 7 }).tests.find(
      (t) => t.metric === "coinsPerSpin",
    )!.pValue;

    // alpha logo abaixo do p observado nunca deve acusar significância...
    if (observed > 1e-6) {
      const strict = comparePayoutWindows(p, { windowDays: 7, alpha: observed / 2 });
      expect(strict.tests.find((t) => t.metric === "coinsPerSpin")!.verdict).toBe("stable");
    }

    // ...e logo acima deve acusar.
    const loose = comparePayoutWindows(p, { windowDays: 7, alpha: Math.min(0.5, observed * 2 + 1e-6) });
    expect(loose.tests.find((t) => t.metric === "coinsPerSpin")!.verdict).toBe("significant");
  });

  it("sanitiza opções hostis", () => {
    const rows = stableRows("2025-05-20", 14, 20, 9);
    const p = points(rows, 14, "2025-05-20");
    const result = comparePayoutWindows(p, {
      windowDays: -5,
      alpha: 99,
      minDaysWithData: -3,
      minSpins: -100,
    });
    expect(result.current.days).toBe(1);
    expect(result.tests).toHaveLength(3);
  });
});
