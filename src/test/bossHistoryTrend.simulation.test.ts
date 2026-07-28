import { describe, it, expect } from "vitest";
import { buildBossHistoryTrend } from "@/lib/bossHistoryTrend";
import { summarizeBossHistory, type BossHistoryInput } from "@/lib/bossHistory";

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
    const total = Math.trunc(rand() * 4000) + 1;
    const monthOffset = Math.trunc(rand() * 18);
    const end = Date.UTC(2025, monthOffset, 1 + Math.trunc(rand() * 27));
    const hasDate = rand() > 0.1;
    return {
      id: `b-${seed}-${i}`,
      status: STATUSES[Math.trunc(rand() * STATUSES.length)],
      total_hp: total,
      current_hp: Math.trunc(rand() * total),
      starts_at: new Date(end - 86400000).toISOString(),
      ends_at: hasDate ? new Date(end).toISOString() : null,
      defeated_at: rand() < 0.4 && hasDate ? new Date(end).toISOString() : null,
      settled_at: null,
      coins_pool: Math.trunc(rand() * 500),
      xp_pool: Math.trunc(rand() * 500),
      department_id: rand() < 0.5 ? "dep-a" : "dep-b",
    };
  });
}

describe("buildBossHistoryTrend — simulação massiva", () => {
  it("mantém invariantes em 700 cenários", () => {
    for (let seed = 1; seed <= 700; seed++) {
      const battles = makeBattles(seed, 14);
      const dep = seed % 3 === 0 ? "dep-a" : null;
      const trend = buildBossHistoryTrend(battles, { departmentId: dep, months: 0 });
      const summary = summarizeBossHistory(battles, { departmentId: dep, limit: 0 });

      const totalInPoints = trend.points.reduce((acc, p) => acc + p.battles, 0);
      expect(totalInPoints + trend.undated).toBe(summary.concluded);

      let prev = "";
      for (const p of trend.points) {
        expect(p.victories + p.defeats).toBe(p.battles);
        expect(p.winRate).toBeGreaterThanOrEqual(0);
        expect(p.winRate).toBeLessThanOrEqual(1);
        expect(p.month > prev).toBe(true);
        prev = p.month;
      }
      if (trend.bestMonth) expect(trend.bestMonth.battles).toBeGreaterThan(0);
    }
  });

  it("preenche meses vazios entre extremos", () => {
    const trend = buildBossHistoryTrend([
      { id: "a", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-01-10T00:00:00Z" },
      { id: "b", status: "expired", total_hp: 10, current_hp: 4, ends_at: "2025-04-10T00:00:00Z" },
    ], { months: 0 });
    expect(trend.points.map((p) => p.month)).toEqual(["2025-01", "2025-02", "2025-03", "2025-04"]);
    expect(trend.points[1].battles).toBe(0);
    expect(trend.winRateDeltaPp).toBe(null); // mês anterior sem batalhas
  });

  it("calcula delta em pontos percentuais entre meses ativos", () => {
    const trend = buildBossHistoryTrend([
      { id: "a", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-01-10T00:00:00Z" },
      { id: "b", status: "expired", total_hp: 10, current_hp: 5, ends_at: "2025-01-20T00:00:00Z" },
      { id: "c", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-02-10T00:00:00Z" },
    ], { months: 0 });
    expect(trend.winRateDeltaPp).toBe(50);
    expect(trend.bestMonth?.month).toBe("2025-01");
  });

  it("respeita a virada de ano e o limite de meses", () => {
    const trend = buildBossHistoryTrend([
      { id: "a", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2024-11-10T00:00:00Z" },
      { id: "b", status: "settled", total_hp: 10, current_hp: 0, ends_at: "2025-02-10T00:00:00Z" },
    ], { months: 2 });
    expect(trend.points.map((p) => p.month)).toEqual(["2025-01", "2025-02"]);
  });
});
