import { describe, expect, it } from "vitest";

import {
  buildPayoutTrend,
  buildPayoutTrendCsv,
  type PayoutSnapshotRow,
} from "@/lib/luckyWheelPayoutHistory";

/** PRNG determinístico para reprodutibilidade das simulações. */
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

function randomRows(seed: number, days: number, endDate: string): PayoutSnapshotRow[] {
  const rand = rng(seed);
  const rows: PayoutSnapshotRow[] = [];
  for (let i = 0; i < days; i++) {
    if (rand() < 0.2) continue; // lacunas
    const spins = Math.floor(rand() * 500);
    rows.push({
      snapshot_date: day(endDate, -i),
      spins,
      unique_users: Math.floor(spins * rand()),
      coins_paid: Math.floor(spins * rand() * 40),
      xp_paid: Math.floor(spins * rand() * 20),
      projected_coins: spins * 25,
      projected_xp: spins * 12,
      chi_square: rand() * 60,
      degrees_of_freedom: Math.floor(rand() * 8),
      duplicate_spins: Math.floor(rand() * 3),
      unconfigured_spins: Math.floor(rand() * 3),
    });
  }
  return rows;
}

const HEADER_COLUMNS = 18;

function seriesRows(csv: string): string[] {
  const lines = csv.split("\n");
  const headerIndex = lines.findIndex((l) => l.startsWith("Dia,Snapshot,Situação"));
  expect(headerIndex).toBeGreaterThan(-1);
  return lines.slice(headerIndex + 1).filter((l) => l.length > 0);
}

/** Divide respeitando aspas para contar colunas com fidelidade. */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

describe("buildPayoutTrendCsv — simulação massiva", () => {
  it("mantém uma linha por dia da janela em 200 cenários aleatórios", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const days = 5 + (seed % 90);
      const endDate = day("2025-06-15", seed % 30);
      const trend = buildPayoutTrend(randomRows(seed, days, endDate), { days, endDate });
      const csv = buildPayoutTrendCsv(trend, { periodLabel: `${days} dias`, generatedAt: "2025-06-16T00:00:00Z" });
      const rows = seriesRows(csv);
      expect(rows).toHaveLength(trend.points.length);
      for (const row of rows) {
        expect(splitCsv(row)).toHaveLength(HEADER_COLUMNS);
      }
    }
  });

  it("nunca emite quebras de linha extras dentro das células", () => {
    const trend = buildPayoutTrend(randomRows(7, 45, "2025-03-01"), { days: 45, endDate: "2025-03-01" });
    const csv = buildPayoutTrendCsv(trend);
    const total = csv.split("\n").length;
    expect(total).toBe(csv.split(/\r?\n/).length);
    expect(csv).not.toContain("\r");
  });

  it("neutraliza tentativas de CSV injection no rótulo do período", () => {
    const trend = buildPayoutTrend([], { days: 3, endDate: "2025-01-10" });
    for (const payload of ["=HYPERLINK(1)", "+cmd", "-2+3", "@SUM(A1)", "\tTAB"]) {
      const csv = buildPayoutTrendCsv(trend, { periodLabel: payload });
      const line = csv.split("\n").find((l) => l.startsWith("Período"))!;
      expect(line).toContain("'");
      expect(line.includes(`,${payload}`)).toBe(false);
    }
  });

  it("escapa vírgulas e aspas preservando o número de colunas", () => {
    const trend = buildPayoutTrend([], { days: 2, endDate: "2025-01-10" });
    const csv = buildPayoutTrendCsv(trend, { periodLabel: 'janela "A", com vírgula' });
    const line = csv.split("\n").find((l) => l.startsWith("Período"))!;
    expect(splitCsv(line)).toHaveLength(2);
    expect(splitCsv(line)[1]).toBe('janela "A", com vírgula');
  });

  it("registra lacunas explicitamente e soma dias com snapshot", () => {
    const rows: PayoutSnapshotRow[] = [
      { snapshot_date: "2025-05-01", spins: 100, coins_paid: 1000, projected_coins: 900, chi_square: 3, degrees_of_freedom: 4 },
      { snapshot_date: "2025-05-04", spins: 80, coins_paid: 700, projected_coins: 800, chi_square: 2, degrees_of_freedom: 4 },
    ];
    const trend = buildPayoutTrend(rows, { days: 5, endDate: "2025-05-05" });
    const csv = buildPayoutTrendCsv(trend);
    const rowsOut = seriesRows(csv).map(splitCsv);
    expect(rowsOut).toHaveLength(5);
    expect(rowsOut.filter((r) => r[1] === "sim")).toHaveLength(2);
    expect(rowsOut.filter((r) => r[1] === "não").every((r) => r[2] === "Sem snapshot")).toBe(true);
  });

  it("é determinístico com generatedAt fixo", () => {
    const trend = buildPayoutTrend(randomRows(42, 30, "2025-02-20"), { days: 30, endDate: "2025-02-20" });
    const a = buildPayoutTrendCsv(trend, { generatedAt: "2025-02-21T10:00:00Z" });
    const b = buildPayoutTrendCsv(trend, { generatedAt: "2025-02-21T10:00:00Z" });
    expect(a).toBe(b);
  });

  it("tolera janela vazia sem quebrar o cabeçalho", () => {
    const trend = buildPayoutTrend([], { days: 1, endDate: "2025-01-01" });
    const csv = buildPayoutTrendCsv(trend);
    expect(csv.startsWith("Série histórica de payout")).toBe(true);
    expect(seriesRows(csv)).toHaveLength(1);
  });
});
