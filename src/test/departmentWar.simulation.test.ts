import { describe, expect, it } from "vitest";
import {
  computeWarStandings,
  distributeWarRewards,
  normalizeScoringConfig,
  warProgress,
  type WarContributionInput,
  type WarDepartmentInput,
} from "@/lib/departmentWar";

/** PRNG deterministico (mulberry32) para simulacoes reproduziveis. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const METRICS = ["task_done", "checkin", "trail_completed", "kudos_sent", "quiz_win"];

function buildScenario(seed: number) {
  const rand = rng(seed);
  const deptCount = 2 + Math.floor(rand() * 12);
  const departments: WarDepartmentInput[] = [];
  for (let i = 0; i < deptCount; i += 1) {
    departments.push({
      department_id: `dept-${i}`,
      name: `Departamento ${String.fromCharCode(65 + (i % 26))}${i}`,
      headcount: 1 + Math.floor(rand() * 140),
    });
  }

  const contributions: WarContributionInput[] = [];
  for (const dept of departments) {
    const active = Math.floor(rand() * (dept.headcount + 1));
    for (let u = 0; u < active; u += 1) {
      const events = 1 + Math.floor(rand() * 8);
      for (let e = 0; e < events; e += 1) {
        contributions.push({
          department_id: dept.department_id,
          user_id: `${dept.department_id}-user-${u}`,
          metric_key: METRICS[Math.floor(rand() * METRICS.length)],
          amount: 1 + Math.floor(rand() * 20),
        });
      }
    }
  }

  const config = {
    fairness_alpha: Math.round(rand() * 100) / 100,
    weights: METRICS.map((metric_key) => ({
      metric_key,
      weight: Math.round(rand() * 500) / 100,
    })),
    per_user_cap: rand() > 0.5 ? Math.floor(rand() * 200) : 0,
    participation_bonus: Math.round(rand() * 50) / 100,
  };

  return { departments, contributions, config, rand };
}

describe("Guerra de Departamentos - simulacao massiva", () => {
  it("mantem invariantes em 400 cenarios aleatorios", () => {
    for (let seed = 1; seed <= 400; seed += 1) {
      const { departments, contributions, config } = buildScenario(seed);
      const standings = computeWarStandings(departments, contributions, config);

      expect(standings).toHaveLength(departments.length);

      for (const standing of standings) {
        expect(standing.score).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(standing.score)).toBe(true);
        expect(standing.raw_score).toBeGreaterThanOrEqual(0);
        expect(standing.capped_out).toBeGreaterThanOrEqual(0);
        expect(standing.participation_rate).toBeGreaterThanOrEqual(0);
        expect(standing.participation_rate).toBeLessThanOrEqual(1);
        expect(standing.contributors).toBeLessThanOrEqual(standing.headcount);
        expect(standing.position).toBeGreaterThanOrEqual(1);
      }

      // Ordenacao decrescente estrita por score.
      for (let i = 1; i < standings.length; i += 1) {
        expect(standings[i - 1].score).toBeGreaterThanOrEqual(standings[i].score);
      }
    }
  });

  it("e deterministico independentemente da ordem das contribuicoes", () => {
    for (let seed = 500; seed < 600; seed += 1) {
      const { departments, contributions, config, rand } = buildScenario(seed);
      const shuffled = [...contributions];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(rand() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const a = computeWarStandings(departments, contributions, config);
      const b = computeWarStandings(departments, shuffled, config);
      expect(b.map((s) => s.department_id)).toEqual(a.map((s) => s.department_id));
      expect(b.map((s) => s.score)).toEqual(a.map((s) => s.score));
    }
  });

  it("nunca distribui mais do que o pool configurado (300 cenarios)", () => {
    for (let seed = 1000; seed < 1300; seed += 1) {
      const rand = rng(seed);
      const { departments, contributions, config } = buildScenario(seed);
      const standings = computeWarStandings(departments, contributions, config);
      const rewardConfig = {
        coins_pool: Math.floor(rand() * 100_000),
        xp_pool: Math.floor(rand() * 100_000),
        placement_shares: [0.5, 0.3, 0.2].slice(0, 1 + Math.floor(rand() * 3)),
        per_member_coins_cap: rand() > 0.6 ? Math.floor(rand() * 50) : 0,
      };
      const rewards = distributeWarRewards(standings, rewardConfig);

      const coins = rewards.reduce((acc, r) => acc + r.coins_total, 0);
      const xp = rewards.reduce((acc, r) => acc + r.xp_total, 0);
      expect(coins).toBeLessThanOrEqual(rewardConfig.coins_pool);
      expect(xp).toBeLessThanOrEqual(rewardConfig.xp_pool);

      for (const reward of rewards) {
        expect(Number.isInteger(reward.coins_per_member)).toBe(true);
        expect(Number.isInteger(reward.xp_per_member)).toBe(true);
        expect(reward.coins_per_member).toBeGreaterThanOrEqual(0);
        expect(reward.xp_per_member).toBeGreaterThanOrEqual(0);
        expect(reward.coins_returned).toBeGreaterThanOrEqual(0);
        expect(reward.xp_returned).toBeGreaterThanOrEqual(0);
        if (rewardConfig.per_member_coins_cap > 0) {
          expect(reward.coins_per_member).toBeLessThanOrEqual(
            rewardConfig.per_member_coins_cap,
          );
        }
      }
    }
  });
});

describe("Guerra de Departamentos - justica entre tamanhos", () => {
  const big: WarDepartmentInput = { department_id: "big", name: "Big", headcount: 100 };
  const small: WarDepartmentInput = { department_id: "small", name: "Small", headcount: 4 };

  // Big: 100 pessoas x 1 ponto. Small: 4 pessoas x 10 pontos.
  const contributions: WarContributionInput[] = [
    ...Array.from({ length: 100 }, (_, i) => ({
      department_id: "big",
      user_id: `b${i}`,
      metric_key: "task_done",
      amount: 1,
    })),
    ...Array.from({ length: 4 }, (_, i) => ({
      department_id: "small",
      user_id: `s${i}`,
      metric_key: "task_done",
      amount: 10,
    })),
  ];

  it("alpha=0 (soma bruta) favorece o departamento grande", () => {
    const standings = computeWarStandings([big, small], contributions, {
      fairness_alpha: 0,
      participation_bonus: 0,
    });
    expect(standings[0].department_id).toBe("big");
  });

  it("alpha=1 (por capita) favorece o departamento pequeno", () => {
    const standings = computeWarStandings([big, small], contributions, {
      fairness_alpha: 1,
      participation_bonus: 0,
    });
    expect(standings[0].department_id).toBe("small");
  });

  it("participacao total gera bonus maximo", () => {
    const standings = computeWarStandings([big, small], contributions, {
      fairness_alpha: 1,
      participation_bonus: 0.5,
    });
    for (const standing of standings) {
      expect(standing.participation_rate).toBe(1);
    }
  });
});

describe("Guerra de Departamentos - anti-fraude e bordas", () => {
  const dept: WarDepartmentInput = { department_id: "d1", name: "D1", headcount: 10 };

  it("aplica teto por colaborador e registra o excedente", () => {
    const standings = computeWarStandings(
      [dept],
      [
        { department_id: "d1", user_id: "u1", metric_key: "task_done", amount: 1000 },
        { department_id: "d1", user_id: "u2", metric_key: "task_done", amount: 5 },
      ],
      { fairness_alpha: 0, per_user_cap: 100, participation_bonus: 0 },
    );
    expect(standings[0].raw_score).toBe(105);
    expect(standings[0].capped_out).toBe(900);
  });

  it("ignora contribuicoes negativas, zeradas e nao numericas", () => {
    const standings = computeWarStandings(
      [dept],
      [
        { department_id: "d1", user_id: "u1", metric_key: "task_done", amount: -50 },
        { department_id: "d1", user_id: "u2", metric_key: "task_done", amount: 0 },
        {
          department_id: "d1",
          user_id: "u3",
          metric_key: "task_done",
          amount: Number.NaN,
        },
      ],
      { fairness_alpha: 0 },
    );
    expect(standings[0].raw_score).toBe(0);
    expect(standings[0].contributors).toBe(0);
  });

  it("ignora contribuicoes de departamentos fora da guerra", () => {
    const standings = computeWarStandings(
      [dept],
      [{ department_id: "outro", user_id: "u1", metric_key: "task_done", amount: 99 }],
      { fairness_alpha: 0 },
    );
    expect(standings).toHaveLength(1);
    expect(standings[0].raw_score).toBe(0);
  });

  it("ignora metricas sem peso configurado", () => {
    const standings = computeWarStandings(
      [dept],
      [
        { department_id: "d1", user_id: "u1", metric_key: "desconhecida", amount: 100 },
        { department_id: "d1", user_id: "u2", metric_key: "task_done", amount: 2 },
      ],
      { fairness_alpha: 0, weights: [{ metric_key: "task_done", weight: 3 }] },
    );
    expect(standings[0].raw_score).toBe(6);
    expect(standings[0].contributors).toBe(1);
  });

  it("headcount zero nao gera divisao por zero", () => {
    const standings = computeWarStandings(
      [{ department_id: "z", name: "Zerado", headcount: 0 }],
      [{ department_id: "z", user_id: "u1", metric_key: "x", amount: 10 }],
      { fairness_alpha: 1 },
    );
    expect(Number.isFinite(standings[0].score)).toBe(true);
    expect(standings[0].participation_rate).toBe(0);
  });

  it("empates compartilham a mesma colocacao", () => {
    const standings = computeWarStandings(
      [
        { department_id: "a", name: "Alfa", headcount: 5 },
        { department_id: "b", name: "Beta", headcount: 5 },
      ],
      [
        { department_id: "a", user_id: "u1", metric_key: "x", amount: 10 },
        { department_id: "b", user_id: "u2", metric_key: "x", amount: 10 },
      ],
      { fairness_alpha: 0.5 },
    );
    expect(standings[0].position).toBe(1);
    expect(standings[1].position).toBe(1);
    expect(standings[0].department_id).toBe("a");
  });

  it("sanitiza configuracao invalida", () => {
    const config = normalizeScoringConfig({
      fairness_alpha: 42,
      participation_bonus: -3,
      per_user_cap: -10,
      weights: null as never,
    });
    expect(config.fairness_alpha).toBe(1);
    expect(config.participation_bonus).toBe(0);
    expect(config.per_user_cap).toBe(0);
    expect(config.weights).toEqual([]);
  });

  it("pool zerado nao credita nada", () => {
    const standings = computeWarStandings(
      [{ department_id: "a", name: "Alfa", headcount: 5 }],
      [{ department_id: "a", user_id: "u1", metric_key: "x", amount: 1 }],
    );
    const rewards = distributeWarRewards(standings, { coins_pool: 0, xp_pool: 0 });
    expect(rewards[0].coins_per_member).toBe(0);
    expect(rewards[0].xp_per_member).toBe(0);
  });

  it("progresso temporal fica sempre entre 0 e 1", () => {
    const start = "2026-01-01T00:00:00Z";
    const end = "2026-01-31T00:00:00Z";
    expect(warProgress(start, end, new Date("2025-12-01T00:00:00Z"))).toBe(0);
    expect(warProgress(start, end, new Date("2026-01-16T00:00:00Z"))).toBeCloseTo(0.5, 1);
    expect(warProgress(start, end, new Date("2027-01-01T00:00:00Z"))).toBe(1);
    expect(warProgress(end, start)).toBe(0);
  });
});