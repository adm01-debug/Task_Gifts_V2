import { describe, it, expect } from "vitest";
import {
  compareDepartments,
  lastDaysWindow,
  NO_DEPARTMENT,
} from "@/lib/bossDepartmentComparison";
import type { BossHistoryInput } from "@/lib/bossHistory";

const STATUSES = ["draft", "running", "defeated", "expired", "settled"] as const;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function makeBattles(seed: number, count: number): BossHistoryInput[] {
  const rand = rng(seed);
  return Array.from({ length: count }, (_, i) => {
    const total = Math.trunc(rand() * 3000) + 1;
    const end = Date.UTC(2025, Math.trunc(rand() * 12), 1 + Math.trunc(rand() * 27));
    const dated = rand() > 0.12;
    const deps = ["dep-a", "dep-b", "dep-c", null];
    return {
      id: `b-${seed}-${i}`,
      status: STATUSES[Math.trunc(rand() * STATUSES.length)],
      total_hp: total,
      current_hp: Math.trunc(rand() * total),
      starts_at: new Date(end - 3600_000).toISOString(),
      ends_at: dated ? new Date(end).toISOString() : null,
      defeated_at: rand() < 0.5 && dated ? new Date(end).toISOString() : null,
      coins_pool: Math.trunc(rand() * 400),
      xp_pool: Math.trunc(rand() * 400),
      department_id: deps[Math.trunc(rand() * deps.length)],
    };
  });
}

describe("compareDepartments — simulação massiva", () => {
  it("mantém invariantes em 800 cenários", () => {
    for (let seed = 1; seed <= 800; seed++) {
      const battles = makeBattles(seed, 16);
      const window = seed % 4 === 0
        ? { from: "2025-04-01T00:00:00Z", to: "2025-09-30T23:59:59Z" }
        : {};
      const result = compareDepartments(battles, window);

      const sum = result.rows.reduce((acc, r) => acc + r.battles, 0);
      expect(sum).toBeLessThanOrEqual(result.totalBattles);

      let prevScore = Infinity;
      let prevRank = 0;
      for (const row of result.rows) {
        expect(row.victories + row.defeats).toBe(row.battles);
        expect(row.winRate).toBeGreaterThanOrEqual(0);
        expect(row.winRate).toBeLessThanOrEqual(1);
        expect(row.adjustedWinRate).toBeGreaterThanOrEqual(0);
        expect(row.adjustedWinRate).toBeLessThanOrEqual(1);
        expect(row.adjustedWinRate).toBeLessThanOrEqual(prevScore + 1e-12);
        expect(row.rank).toBeGreaterThanOrEqual(prevRank);
        prevScore = row.adjustedWinRate;
        prevRank = row.rank;
      }
      expect(result.globalWinRate).toBeGreaterThanOrEqual(0);
      expect(result.globalWinRate).toBeLessThanOrEqual(1);
    }
  });

  it("normaliza janela invertida", () => {
    const battles: BossHistoryInput[] = [
      { id: "a", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-05-10T00:00:00Z", department_id: "d1" },
    ];
    const normal = compareDepartments(battles, { from: "2025-01-01T00:00:00Z", to: "2025-12-01T00:00:00Z" });
    const inverted = compareDepartments(battles, { from: "2025-12-01T00:00:00Z", to: "2025-01-01T00:00:00Z" });
    expect(inverted.totalBattles).toBe(normal.totalBattles);
    expect(inverted.from).toBe(normal.from);
  });

  it("agrupa batalhas sem departamento em bucket explícito", () => {
    const result = compareDepartments([
      { id: "a", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-05-10T00:00:00Z" },
    ]);
    expect(result.rows[0].departmentId).toBe(NO_DEPARTMENT);
  });

  it("suaviza aproveitamento de amostras pequenas", () => {
    const battles: BossHistoryInput[] = [
      { id: "s1", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-05-01T00:00:00Z", department_id: "small" },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `b${i}`,
        status: (i < 8 ? "settled" : "expired") as BossHistoryInput["status"],
        total_hp: 10,
        current_hp: i < 8 ? 0 : 5,
        ends_at: "2025-05-02T00:00:00Z",
        department_id: "big",
      })),
    ];
    const result = compareDepartments(battles, { priorWeight: 5 });
    expect(result.rows[0].departmentId).toBe("big");
  });

  it("exclui batalhas sem data do comparativo", () => {
    const result = compareDepartments([
      { id: "x", status: "settled", total_hp: 10, current_hp: 0, department_id: "d1" },
    ]);
    expect(result.excludedUndated).toBe(1);
    expect(result.rows).toHaveLength(0);
  });

  it("gera janela relativa consistente", () => {
    const w = lastDaysWindow(30, new Date("2026-07-28T00:00:00Z"));
    expect(w.from).toBe("2026-06-28T00:00:00.000Z");
    expect(w.to).toBe("2026-07-28T00:00:00.000Z");
  });
});
