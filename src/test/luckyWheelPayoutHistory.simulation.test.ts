/**
 * Simulação massiva da série histórica de payout da Roleta.
 *
 * Estratégia: gerador determinístico (LCG) produz centenas de janelas com
 * lacunas, duplicatas, valores hostis (NaN, negativos, strings, datas
 * inválidas) e verificamos as invariantes do motor puro.
 */
import { describe, expect, it } from "vitest";

import {
  buildPayoutTrend,
  isValidDay,
  type PayoutSnapshotRow,
} from "@/lib/luckyWheelPayoutHistory";

function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function day(offset: number, base = "2026-03-01"): string {
  return new Date(Date.parse(`${base}T00:00:00Z`) + offset * 86_400_000)
    .toISOString()
    .slice(0, 10);
}

function makeRow(date: string, rand: () => number): PayoutSnapshotRow {
  const spins = Math.floor(rand() * 400);
  const projectedCoins = Math.floor(rand() * 5_000) + 1;
  return {
    snapshot_date: date,
    spins,
    unique_users: Math.floor(spins * rand()),
    coins_paid: Math.floor(projectedCoins * (0.5 + rand())),
    xp_paid: Math.floor(rand() * 3_000),
    projected_coins: projectedCoins,
    projected_xp: Math.floor(rand() * 3_000) + 1,
    chi_square: rand() * 80,
    degrees_of_freedom: Math.floor(rand() * 9),
    duplicate_spins: Math.floor(rand() * 3),
    unconfigured_spins: Math.floor(rand() * 3),
  };
}

const NUMERIC_KEYS = [
  "spins", "uniqueUsers", "coinsPaid", "xpPaid", "projectedCoins", "projectedXp",
  "chiSquare", "degreesOfFreedom", "duplicateSpins", "unconfiguredSpins",
  "chiWarn", "chiCritical", "coinsDeviation", "xpDeviation",
] as const;

describe("buildPayoutTrend — invariantes estruturais", () => {
  it("devolve série vazia sem linhas utilizáveis", () => {
    const empty = buildPayoutTrend([]);
    expect(empty.points).toHaveLength(0);
    expect(empty.summary.worstDay).toBeNull();
    expect(empty.summary.coinsDeviation).toBe(0);
  });

  it("descarta datas inválidas sem lançar", () => {
    const rows = [
      { snapshot_date: "2024-02-31", spins: 10 },
      { snapshot_date: "abacaxi", spins: 10 },
      { snapshot_date: "", spins: 10 },
      { snapshot_date: "2026-03-05", spins: 10 },
    ] as PayoutSnapshotRow[];
    const result = buildPayoutTrend(rows);
    expect(result.summary.daysWithData).toBe(1);
    expect(result.points.at(-1)?.date).toBe("2026-03-05");
  });

  it("valida o calendário em isValidDay", () => {
    expect(isValidDay("2026-03-01")).toBe(true);
    expect(isValidDay("2024-02-29")).toBe(true);
    expect(isValidDay("2025-02-29")).toBe(false);
    expect(isValidDay("2026-13-01")).toBe(false);
  });

  it("preenche lacunas mantendo ordem cronológica em 200 janelas aleatórias", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const rand = lcg(seed * 7919);
      const span = 5 + Math.floor(rand() * 40);
      const rows: PayoutSnapshotRow[] = [];
      for (let i = 0; i < span; i += 1) {
        if (rand() < 0.35) continue; // lacuna
        rows.push(makeRow(day(i), rand));
      }
      if (rows.length === 0) rows.push(makeRow(day(0), rand));

      const result = buildPayoutTrend(rows, { endDate: day(span - 1), days: span });
      expect(result.points).toHaveLength(span);

      const dates = result.points.map((p) => p.date);
      expect([...dates].sort()).toEqual(dates);
      expect(new Set(dates).size).toBe(dates.length);

      expect(result.summary.daysWithData + result.summary.gaps).toBe(span);

      for (const point of result.points) {
        for (const key of NUMERIC_KEYS) {
          expect(Number.isFinite(point[key])).toBe(true);
        }
        if (!point.present) {
          expect(point.status).toBe("gap");
          expect(point.spins).toBe(0);
        }
      }
    }
  });

  it("soma exata dos totais em 150 cenários", () => {
    for (let seed = 1; seed <= 150; seed += 1) {
      const rand = lcg(seed * 104729);
      const rows = Array.from({ length: 1 + Math.floor(rand() * 20) }, (_, i) =>
        makeRow(day(i), rand),
      );
      const result = buildPayoutTrend(rows);
      const present = result.points.filter((p) => p.present);
      expect(present.reduce((a, p) => a + p.coinsPaid, 0)).toBe(result.summary.totalCoinsPaid);
      expect(present.reduce((a, p) => a + p.spins, 0)).toBe(result.summary.totalSpins);
      expect(present.reduce((a, p) => a + p.projectedXp, 0)).toBe(result.summary.totalProjectedXp);
    }
  });
});

describe("buildPayoutTrend — robustez a entradas hostis", () => {
  const hostile: unknown[] = [NaN, Infinity, -Infinity, -500, "abc", null, undefined, "12", true, {}];

  it("neutraliza valores não numéricos em todas as colunas", () => {
    for (const value of hostile) {
      const row = {
        snapshot_date: "2026-03-10",
        spins: value, unique_users: value, coins_paid: value, xp_paid: value,
        projected_coins: value, projected_xp: value, chi_square: value,
        degrees_of_freedom: value, duplicate_spins: value, unconfigured_spins: value,
      } as unknown as PayoutSnapshotRow;

      const result = buildPayoutTrend([row]);
      const point = result.points[0];
      for (const key of NUMERIC_KEYS) {
        expect(Number.isFinite(point[key])).toBe(true);
        expect(point[key]).toBeGreaterThanOrEqual(key.includes("Deviation") ? -1 : 0);
      }
    }
  });

  it("consolida duplicatas do mesmo dia sem inflar χ²", () => {
    const base: PayoutSnapshotRow = {
      snapshot_date: "2026-03-11", spins: 100, coins_paid: 500, projected_coins: 400,
      chi_square: 12, degrees_of_freedom: 5,
    };
    const result = buildPayoutTrend([base, { ...base, chi_square: 30 }]);
    expect(result.summary.daysWithData).toBe(1);
    expect(result.points[0].spins).toBe(200);
    expect(result.points[0].coinsPaid).toBe(1_000);
    expect(result.points[0].chiSquare).toBe(30);
  });

  it("ignora array inválido", () => {
    expect(buildPayoutTrend(null as unknown as PayoutSnapshotRow[]).points).toHaveLength(0);
  });
});

describe("buildPayoutTrend — classificação estatística", () => {
  it("marca dia sem amostra suficiente como insufficient", () => {
    const result = buildPayoutTrend(
      [{ snapshot_date: "2026-03-12", spins: 10, chi_square: 999, degrees_of_freedom: 5 }],
      { minSpins: 50 },
    );
    expect(result.points[0].status).toBe("insufficient");
    expect(result.summary.criticalDays).toBe(0);
  });

  it("marca crítico acima do limite e ok abaixo", () => {
    const ok = buildPayoutTrend(
      [{ snapshot_date: "2026-03-13", spins: 500, chi_square: 1, degrees_of_freedom: 5 }],
    );
    expect(ok.points[0].status).toBe("ok");

    const critical = buildPayoutTrend(
      [{ snapshot_date: "2026-03-13", spins: 500, chi_square: 10_000, degrees_of_freedom: 5 }],
    );
    expect(critical.points[0].status).toBe("critical");
    expect(critical.summary.criticalDays).toBe(1);
    expect(critical.summary.worstDay?.date).toBe("2026-03-13");
  });

  it("respeita a monotonicidade dos limites (warn <= critical)", () => {
    for (let df = 1; df <= 40; df += 1) {
      const result = buildPayoutTrend(
        [{ snapshot_date: "2026-03-14", spins: 500, chi_square: 5, degrees_of_freedom: df }],
      );
      const point = result.points[0];
      expect(point.chiWarn).toBeGreaterThan(0);
      expect(point.chiCritical).toBeGreaterThanOrEqual(point.chiWarn);
    }
  });

  it("detecta tendência de custo crescente e decrescente", () => {
    const rising = buildPayoutTrend(
      Array.from({ length: 10 }, (_, i) => ({
        snapshot_date: day(i), spins: 100, coins_paid: 100 * (i + 1), projected_coins: 100,
      })),
    );
    expect(rising.summary.coinsTrendPerDay).toBeGreaterThan(0);

    const falling = buildPayoutTrend(
      Array.from({ length: 10 }, (_, i) => ({
        snapshot_date: day(i), spins: 100, coins_paid: 1_000 - 50 * i, projected_coins: 100,
      })),
    );
    expect(falling.summary.coinsTrendPerDay).toBeLessThan(0);
  });

  it("calcula desvio agregado corretamente", () => {
    const result = buildPayoutTrend([
      { snapshot_date: day(0), spins: 10, coins_paid: 150, projected_coins: 100 },
      { snapshot_date: day(1), spins: 10, coins_paid: 50, projected_coins: 100 },
    ]);
    expect(result.summary.totalCoinsPaid).toBe(200);
    expect(result.summary.coinsDeviation).toBeCloseTo(0, 10);
    expect(result.summary.avgCoinsPerSpin).toBeCloseTo(10, 10);
  });

  it("não divide por zero quando não há projeção", () => {
    const result = buildPayoutTrend([
      { snapshot_date: day(0), spins: 10, coins_paid: 500, projected_coins: 0, projected_xp: 0 },
    ]);
    expect(result.points[0].coinsDeviation).toBe(0);
    expect(result.points[0].xpDeviation).toBe(0);
    expect(result.summary.coinsDeviation).toBe(0);
  });

  it("limita a janela solicitada a 365 dias", () => {
    const result = buildPayoutTrend([{ snapshot_date: day(0), spins: 1 }], { days: 5_000 });
    expect(result.points.length).toBe(365);
    expect(result.points.at(-1)?.date).toBe(day(0));
  });
});