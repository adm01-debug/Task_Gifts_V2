import { describe, it, expect } from "vitest";
import { evaluateWinRateGoals } from "@/lib/bossWinRateGoals";
import type { BossHistoryInput } from "@/lib/bossHistory";

const STATUSES = ["draft", "running", "defeated", "expired", "settled"] as const;
const NOW = new Date("2026-07-28T00:00:00Z");

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
  const deps = ["dep-a", "dep-b", "dep-c", null];
  return Array.from({ length: count }, (_, i) => {
    const total = Math.trunc(rand() * 2000) + 1;
    const end = NOW.getTime() - Math.trunc(rand() * 400) * 86_400_000;
    const dated = rand() > 0.1;
    return {
      id: `b-${seed}-${i}`,
      status: STATUSES[Math.trunc(rand() * STATUSES.length)],
      total_hp: total,
      current_hp: Math.trunc(rand() * total),
      starts_at: new Date(end - 3600_000).toISOString(),
      ends_at: dated ? new Date(end).toISOString() : null,
      defeated_at: rand() < 0.5 && dated ? new Date(end).toISOString() : null,
      department_id: deps[Math.trunc(rand() * deps.length)],
    };
  });
}

describe("evaluateWinRateGoals — simulação massiva", () => {
  it("mantém invariantes em 800 cenários", () => {
    for (let seed = 1; seed <= 800; seed++) {
      const result = evaluateWinRateGoals(makeBattles(seed, 20), {
        now: NOW,
        days: seed % 3 === 0 ? 30 : 90,
        target: (seed % 10) / 10,
      });
      expect(Date.parse(result.previousWindow.to)).toBeLessThan(
        Date.parse(result.currentWindow.from),
      );
      let prevSeverity = -1;
      const rank = { critical: 0, warning: 1, watch: 2, none: 3 } as const;
      for (const row of result.rows) {
        expect(row.battles).toBeGreaterThan(0);
        expect(row.winRate).toBeGreaterThanOrEqual(0);
        expect(row.winRate).toBeLessThanOrEqual(1);
        expect(row.gapToTargetPp).toBeGreaterThanOrEqual(0);
        if (row.previousAdjustedWinRate === null) {
          expect(row.deltaPp).toBeNull();
          expect(row.severity).toBe("none");
        }
        expect(rank[row.severity]).toBeGreaterThanOrEqual(prevSeverity);
        prevSeverity = rank[row.severity];
      }
      expect(result.belowTarget).toBeLessThanOrEqual(result.rows.length);
      expect(result.dropping).toBeLessThanOrEqual(result.rows.length);
    }
  });

  it("não sobrepõe janelas: batalha do limite entra em apenas uma", () => {
    const boundary = new Date(NOW.getTime() - 90 * 86_400_000).toISOString();
    const result = evaluateWinRateGoals(
      [{ id: "x", status: "settled", total_hp: 10, current_hp: 0, ends_at: boundary, department_id: "d1" }],
      { now: NOW, days: 90 },
    );
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].previousBattles).toBe(0);
  });

  it("detecta queda crítica de aproveitamento", () => {
    const recent = new Date(NOW.getTime() - 10 * 86_400_000).toISOString();
    const old = new Date(NOW.getTime() - 100 * 86_400_000).toISOString();
    const battles: BossHistoryInput[] = [
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `old-${i}`, status: "settled" as const, total_hp: 10, current_hp: 0,
        ends_at: old, department_id: "d1",
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `new-${i}`, status: "expired" as const, total_hp: 10, current_hp: 5,
        ends_at: recent, department_id: "d1",
      })),
    ];
    const result = evaluateWinRateGoals(battles, { now: NOW, days: 90, target: 0.6 });
    const row = result.rows[0];
    expect(row.severity).toBe("critical");
    expect(row.status).toBe("below_target");
    expect(row.deltaPp).toBeLessThan(-20);
    expect(result.dropping).toBe(1);
  });

  it("marca meta atingida sem alerta", () => {
    const recent = new Date(NOW.getTime() - 5 * 86_400_000).toISOString();
    const battles: BossHistoryInput[] = Array.from({ length: 5 }, (_, i) => ({
      id: `w-${i}`, status: "settled" as const, total_hp: 10, current_hp: 0,
      ends_at: recent, department_id: "d1",
    }));
    const result = evaluateWinRateGoals(battles, { now: NOW, target: 0.6 });
    expect(result.rows[0].status).toBe("on_track");
    expect(result.rows[0].gapToTargetPp).toBe(0);
    expect(result.belowTarget).toBe(0);
  });

  it("usa tolerância para classificar risco", () => {
    const recent = new Date(NOW.getTime() - 5 * 86_400_000).toISOString();
    const battles: BossHistoryInput[] = Array.from({ length: 10 }, (_, i) => ({
      id: `t-${i}`,
      status: (i < 6 ? "settled" : "expired") as BossHistoryInput["status"],
      total_hp: 10, current_hp: i < 6 ? 0 : 5,
      ends_at: recent, department_id: "d1",
    }));
    expect(evaluateWinRateGoals(battles, { now: NOW, target: 0.63, tolerancePp: 5 }).rows[0].status)
      .toBe("at_risk");
    expect(evaluateWinRateGoals(battles, { now: NOW, target: 0.9, tolerancePp: 5 }).rows[0].status)
      .toBe("below_target");
  });
});
