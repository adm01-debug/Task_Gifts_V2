import { describe, expect, it } from "vitest";
import {
  formatDuration,
  parseSequenceProcedureStats,
  weakestSteps,
} from "@/lib/sequenceProcedureStats";

describe("parseSequenceProcedureStats", () => {
  it("devolve estrutura vazia para payloads inválidos", () => {
    for (const payload of [null, undefined, 42, "x", [], {}]) {
      const stats = parseSequenceProcedureStats(payload);
      expect(stats.summary.attempts).toBe(0);
      expect(stats.summary.perfectRate).toBe(0);
      expect(stats.leaderboard).toEqual([]);
      expect(stats.steps).toEqual([]);
      expect(stats.daily).toEqual([]);
      expect(stats.recent).toEqual([]);
    }
  });

  it("sanea números negativos, NaN e acertos maiores que a amostra", () => {
    const stats = parseSequenceProcedureStats({
      summary: {
        attempts: 10,
        players: -3,
        perfect_attempts: 99,
        avg_accuracy: 250,
        avg_duration_ms: "4500",
        best_duration_ms: Number.NaN,
        coins_awarded: 120,
        xp_awarded: null,
      },
      steps: [
        { step_id: "s1", label: "A", position: 2, evaluated: 4, correct: 10 },
        { step_id: "", label: "sem id", position: 1, evaluated: 1, correct: 1 },
        { step_id: "s2", label: "B", position: 1, evaluated: 0, correct: 0 },
      ],
    });

    expect(stats.summary.players).toBe(0);
    expect(stats.summary.perfectAttempts).toBe(10);
    expect(stats.summary.perfectRate).toBe(100);
    expect(stats.summary.avgAccuracy).toBe(100);
    expect(stats.summary.avgDurationMs).toBe(4500);
    expect(stats.summary.bestDurationMs).toBe(0);
    expect(stats.summary.xpAwarded).toBe(0);

    expect(stats.steps.map((s) => s.stepId)).toEqual(["s2", "s1"]);
    expect(stats.steps[1].correct).toBe(4);
    expect(stats.steps[1].accuracy).toBe(100);
    expect(stats.steps[0].noSample).toBe(true);
  });

  it("ordena a série diária e descarta linhas sem chave", () => {
    const stats = parseSequenceProcedureStats({
      daily: [
        { day: "2026-02-03", attempts: 2, perfect_attempts: 1 },
        { day: "", attempts: 9, perfect_attempts: 9 },
        { day: "2026-01-30", attempts: 5, perfect_attempts: 0 },
      ],
      leaderboard: [
        { user_id: "u1", display_name: "  Ana  ", attempts: 3, perfect_attempts: 2, best_accuracy: 88.44 },
        { user_id: "", display_name: "fantasma" },
      ],
      recent: [{ id: "a1", is_perfect: "sim", steps_total: 5, correct_positions: 5 }],
    });

    expect(stats.daily.map((d) => d.day)).toEqual(["2026-01-30", "2026-02-03"]);
    expect(stats.leaderboard).toHaveLength(1);
    expect(stats.leaderboard[0].displayName).toBe("Ana");
    expect(stats.leaderboard[0].bestAccuracy).toBe(88.4);
    expect(stats.recent[0].isPerfect).toBe(false);
    expect(stats.recent[0].displayName).toBe("Participante");
  });
});

describe("weakestSteps", () => {
  const stats = parseSequenceProcedureStats({
    steps: [
      { step_id: "s1", label: "A", position: 1, evaluated: 10, correct: 10 },
      { step_id: "s2", label: "B", position: 2, evaluated: 10, correct: 3 },
      { step_id: "s3", label: "C", position: 3, evaluated: 10, correct: 3 },
      { step_id: "s4", label: "D", position: 4, evaluated: 0, correct: 0 },
      { step_id: "s5", label: "E", position: 5, evaluated: 10, correct: 7 },
    ],
  });

  it("ignora etapas perfeitas e sem amostra, com desempate por posição", () => {
    const weak = weakestSteps(stats.steps);
    expect(weak.map((s) => s.stepId)).toEqual(["s2", "s3", "s5"]);
  });

  it("respeita o limite", () => {
    expect(weakestSteps(stats.steps, 1)).toHaveLength(1);
    expect(weakestSteps(stats.steps, 0)).toHaveLength(0);
  });
});

describe("formatDuration", () => {
  it("formata minutos e segundos com padding", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(9_000)).toBe("0:09");
    expect(formatDuration(61_500)).toBe("1:02");
    expect(formatDuration(-5)).toBe("0:00");
    expect(formatDuration(Number.NaN)).toBe("0:00");
  });
});