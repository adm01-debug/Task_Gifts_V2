import { describe, expect, it } from "vitest";
import {
  formatDuration,
  listHistoryDepartments,
  summarizeBossHistory,
  toHistoryRow,
  type BossHistoryInput,
  type BossHistoryStatus,
} from "@/lib/bossHistory";

/** PRNG determinístico (mulberry32) para reprodutibilidade das simulações. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const STATUSES: BossHistoryStatus[] = ["draft", "running", "defeated", "expired", "settled"];

function makeBattle(rand: () => number, index: number): BossHistoryInput {
  const status = STATUSES[Math.floor(rand() * STATUSES.length)];
  const totalHp = Math.floor(rand() * 100_000);
  const victory = status === "defeated" || status === "settled";
  const currentHp = victory ? 0 : Math.floor(rand() * (totalHp + 1));
  const start = new Date(1_700_000_000_000 + index * 86_400_000).toISOString();
  const kill = victory
    ? new Date(1_700_000_000_000 + index * 86_400_000 + Math.floor(rand() * 172_800_000)).toISOString()
    : null;
  return {
    id: `b-${index}`,
    title: rand() > 0.9 ? "" : `Chefão ${index}`,
    status,
    total_hp: totalHp,
    current_hp: currentHp,
    starts_at: start,
    ends_at: new Date(1_700_000_000_000 + index * 86_400_000 + 259_200_000).toISOString(),
    defeated_at: kill,
    settled_at: status === "settled" ? kill : null,
    coins_pool: Math.floor(rand() * 5_000),
    xp_pool: Math.floor(rand() * 10_000),
    department_id: rand() > 0.5 ? "dep-a" : "dep-b",
  };
}

describe("bossHistory — regras determinísticas", () => {
  it("ignora rascunhos e batalhas em andamento", () => {
    expect(toHistoryRow({ id: "x", status: "draft", total_hp: 10, current_hp: 10 })).toBeNull();
    expect(toHistoryRow({ id: "x", status: "running", total_hp: 10, current_hp: 5 })).toBeNull();
  });

  it("limita HP destruído entre 0 e o total mesmo com dados inconsistentes", () => {
    const row = toHistoryRow({ id: "x", status: "expired", total_hp: 100, current_hp: -500 })!;
    expect(row.hpDestroyed).toBe(100);
    expect(row.hpDestroyedPct).toBe(1);

    const inverted = toHistoryRow({ id: "y", status: "expired", total_hp: 100, current_hp: 400 })!;
    expect(inverted.hpDestroyed).toBe(0);
    expect(inverted.hpDestroyedPct).toBe(0);
  });

  it("descarta duração de abate negativa ou ausente", () => {
    const row = toHistoryRow({
      id: "x",
      status: "defeated",
      total_hp: 10,
      current_hp: 0,
      starts_at: "2024-05-10T00:00:00Z",
      defeated_at: "2024-05-09T00:00:00Z",
    })!;
    expect(row.killDurationMs).toBeNull();
  });

  it("conta apenas vitórias apuradas como recompensa paga", () => {
    const summary = summarizeBossHistory([
      { id: "1", status: "defeated", total_hp: 10, current_hp: 0, coins_pool: 100, xp_pool: 50 },
      { id: "2", status: "settled", total_hp: 10, current_hp: 0, coins_pool: 200, xp_pool: 80 },
    ]);
    expect(summary.coinsAwarded).toBe(200);
    expect(summary.xpAwarded).toBe(80);
    expect(summary.awaitingSettlement).toBe(1);
  });

  it("calcula sequência de vitórias na ordem cronológica", () => {
    const base = (id: string, status: BossHistoryStatus, day: number): BossHistoryInput => ({
      id,
      status,
      total_hp: 10,
      current_hp: status === "expired" ? 4 : 0,
      ends_at: `2024-05-${String(day).padStart(2, "0")}T00:00:00Z`,
    });
    const summary = summarizeBossHistory([
      base("d", "settled", 4),
      base("a", "settled", 1),
      base("c", "settled", 3),
      base("b", "expired", 2),
    ]);
    expect(summary.longestVictoryStreak).toBe(2);
    expect(summary.currentVictoryStreak).toBe(2);
    expect(summary.rows[0].id).toBe("d");
  });

  it("retorna zeros seguros sem histórico", () => {
    const summary = summarizeBossHistory([]);
    expect(summary.winRate).toBe(0);
    expect(summary.avgHpDestroyedPct).toBe(0);
    expect(summary.fastestKillMs).toBeNull();
    expect(summary.rows).toHaveLength(0);
  });

  it("filtra por departamento", () => {
    const summary = summarizeBossHistory(
      [
        { id: "1", status: "settled", total_hp: 10, current_hp: 0, department_id: "dep-a" },
        { id: "2", status: "settled", total_hp: 10, current_hp: 0, department_id: "dep-b" },
      ],
      { departmentId: "dep-a" },
    );
    expect(summary.concluded).toBe(1);
  });

  it("formata durações de forma legível", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(-5)).toBe("—");
    expect(formatDuration(30 * 60_000)).toBe("30min");
    expect(formatDuration(3 * 3_600_000 + 20 * 60_000)).toBe("3h 20min");
    expect(formatDuration(50 * 3_600_000)).toBe("2d 2h");
  });

  it("lista apenas departamentos com batalhas concluídas", () => {
    const options = listHistoryDepartments([
      { id: "1", status: "running", total_hp: 10, current_hp: 5, department_id: "dep-a" },
      { id: "2", status: "settled", total_hp: 10, current_hp: 0, department_id: "dep-b" },
      { id: "3", status: "expired", total_hp: 10, current_hp: 3, department_id: "dep-b" },
      { id: "4", status: "settled", total_hp: 10, current_hp: 0, department_id: null },
    ]);
    expect(options).toEqual([{ id: "dep-b", concluded: 2 }]);
  });
});

describe("bossHistory — simulação de 600 cenários", () => {
  it("mantém invariantes em históricos aleatórios", () => {
    for (let scenario = 0; scenario < 600; scenario += 1) {
      const rand = rng(scenario + 1);
      const size = Math.floor(rand() * 40);
      const battles = Array.from({ length: size }, (_, i) => makeBattle(rand, i));
      const summary = summarizeBossHistory(battles, { limit: 10 });

      expect(summary.victories + summary.defeats).toBe(summary.concluded);
      expect(summary.winRate).toBeGreaterThanOrEqual(0);
      expect(summary.winRate).toBeLessThanOrEqual(1);
      expect(summary.avgHpDestroyedPct).toBeGreaterThanOrEqual(0);
      expect(summary.avgHpDestroyedPct).toBeLessThanOrEqual(1);
      expect(summary.rows.length).toBeLessThanOrEqual(10);
      expect(summary.currentVictoryStreak).toBeLessThanOrEqual(summary.longestVictoryStreak);
      expect(summary.awaitingSettlement).toBeLessThanOrEqual(summary.victories);
      expect(summary.totalHpDestroyed).toBeGreaterThanOrEqual(0);
      if (summary.fastestKillMs !== null) {
        expect(summary.fastestKillMs).toBeGreaterThanOrEqual(0);
        expect(summary.avgKillMs).toBeGreaterThanOrEqual(summary.fastestKillMs);
      }
      // Idempotência: recalcular não muda o resultado.
      expect(summarizeBossHistory(battles, { limit: 10 })).toEqual(summary);
      // Ordem de entrada não altera o agregado.
      const shuffled = [...battles].reverse();
      const other = summarizeBossHistory(shuffled, { limit: 10 });
      expect(other.victories).toBe(summary.victories);
      expect(other.totalHpDestroyed).toBe(summary.totalHpDestroyed);
      expect(other.longestVictoryStreak).toBe(summary.longestVictoryStreak);

      // Cada filtro de departamento oferecido precisa render resultado não vazio.
      for (const option of listHistoryDepartments(battles)) {
        const scoped = summarizeBossHistory(battles, { departmentId: option.id });
        expect(scoped.concluded).toBe(option.concluded);
      }
    }
  });
});