import { describe, expect, it } from "vitest";
import {
  applyGrant,
  buildPackDedupeKey,
  CARD_PACK_MAX_SIZE,
  evaluateAttendanceStreakPack,
  evaluateTaskScorePack,
  evaluateTrailEnrollmentPack,
  highestStreakMilestone,
  PACK_SIZE_STREAK_MILESTONE,
  PACK_SIZE_TASK_ON_TIME,
  PACK_SIZE_TRAIL_COMPLETED,
  STREAK_MILESTONE_MAX,
  type TaskCompletionStatus,
  type TaskScoreRow,
} from "@/lib/cardPackTriggers";

const STATUSES: TaskCompletionStatus[] = ["pending", "on_time", "late", "rejected", "rework"];

describe("gatilho de tarefa no prazo", () => {
  it("cobre todas as transições de status (25 cenários)", () => {
    for (const from of STATUSES) {
      for (const to of STATUSES) {
        const next: TaskScoreRow = { id: "t1", userId: "u1", status: to };
        const result = evaluateTaskScorePack({ id: "t1", userId: "u1", status: from }, next);
        const shouldGrant = to === "on_time" && from !== "on_time";
        expect(Boolean(result)).toBe(shouldGrant);
        if (result) expect(result.size).toBe(PACK_SIZE_TASK_ON_TIME);
      }
    }
  });

  it("insert já concluído paga uma única vez", () => {
    const keys = new Set<string>();
    const row: TaskScoreRow = { id: "t9", userId: "u1", status: "on_time" };
    expect(applyGrant(keys, evaluateTaskScorePack(null, row)).granted).toBe(true);
    expect(applyGrant(keys, evaluateTaskScorePack({ ...row, status: "rework" }, row)).replayed).toBe(true);
  });

  it("rejeita entrega com atraso ou retrabalho (200 cenários)", () => {
    for (let late = 0; late < 2; late += 1) {
      for (let rework = 0; rework <= 99; rework += 1) {
        const row: TaskScoreRow = {
          id: `t${rework}`,
          userId: "u1",
          status: "on_time",
          isLate: late === 1,
          reworkCount: rework,
        };
        const result = evaluateTaskScorePack(null, row);
        expect(Boolean(result)).toBe(late === 0 && rework === 0);
      }
    }
  });

  it("ignora linhas sem identificador", () => {
    expect(evaluateTaskScorePack(null, { id: "  ", userId: "u1", status: "on_time" })).toBeNull();
    expect(evaluateTaskScorePack(null, { id: "t1", userId: "", status: "on_time" })).toBeNull();
  });
});

describe("gatilho de trilha concluída", () => {
  it("só a transição nulo → data paga (4 cenários)", () => {
    const cases: Array<[string | null, string | null, boolean]> = [
      [null, "2026-01-01", true],
      [null, null, false],
      ["2025-12-01", "2026-01-01", false],
      ["2025-12-01", null, false],
    ];
    for (const [before, after, expected] of cases) {
      const result = evaluateTrailEnrollmentPack(
        { userId: "u1", trailId: "tr1", completedAt: before },
        { userId: "u1", trailId: "tr1", completedAt: after },
      );
      expect(Boolean(result)).toBe(expected);
      if (result) expect(result.size).toBe(PACK_SIZE_TRAIL_COMPLETED);
    }
  });

  it("trilhas distintas pagam pacotes distintos (300 cenários)", () => {
    const keys = new Set<string>();
    let granted = 0;
    for (let i = 0; i < 300; i += 1) {
      const g = evaluateTrailEnrollmentPack(null, {
        userId: `u${i % 10}`,
        trailId: `tr${i}`,
        completedAt: "2026-01-01",
      });
      if (applyGrant(keys, g).granted) granted += 1;
    }
    expect(granted).toBe(300);
  });

  it("reprocessar a mesma conclusão não duplica (100 cenários)", () => {
    const keys = new Set<string>();
    let granted = 0;
    for (let i = 0; i < 100; i += 1) {
      const g = evaluateTrailEnrollmentPack(null, { userId: "u1", trailId: "tr1", completedAt: "2026-01-01" });
      if (applyGrant(keys, g).granted) granted += 1;
    }
    expect(granted).toBe(1);
  });
});

describe("gatilho de sequência de presença", () => {
  it("marco é sempre múltiplo de 5 e limitado (0..300)", () => {
    for (let s = 0; s <= 300; s += 1) {
      const m = highestStreakMilestone(s);
      expect(m % 5).toBe(0);
      expect(m).toBeLessThanOrEqual(STREAK_MILESTONE_MAX);
      if (s < 5) expect(m).toBe(0);
    }
  });

  it("uma sequência crescente de 1..120 paga exatamente 20 pacotes", () => {
    const keys = new Set<string>();
    let granted = 0;
    let prev = { userId: "u1", currentStreak: 0 };
    for (let s = 1; s <= 120; s += 1) {
      const next = { userId: "u1", currentStreak: s };
      if (applyGrant(keys, evaluateAttendanceStreakPack(prev, next)).granted) granted += 1;
      prev = next;
    }
    expect(granted).toBe(STREAK_MILESTONE_MAX / 5);
  });

  it("queda e recuperação não repagam (200 ciclos)", () => {
    const keys = new Set<string>();
    let granted = 0;
    for (let cycle = 0; cycle < 200; cycle += 1) {
      let prev = { userId: "u1", currentStreak: 0 };
      for (const s of [5, 10, 0, 5, 10]) {
        const next = { userId: "u1", currentStreak: s };
        if (applyGrant(keys, evaluateAttendanceStreakPack(prev, next)).granted) granted += 1;
        prev = next;
      }
    }
    expect(granted).toBe(2);
  });

  it("salto direto de 0 para 37 paga só o marco 35", () => {
    const g = evaluateAttendanceStreakPack({ userId: "u1", currentStreak: 0 }, { userId: "u1", currentStreak: 37 });
    expect(g?.sourceRef).toBe("u1:35");
    expect(g?.size).toBe(PACK_SIZE_STREAK_MILESTONE);
  });

  it("usuários diferentes não colidem de chave (500 cenários)", () => {
    const keys = new Set<string>();
    let granted = 0;
    for (let i = 0; i < 500; i += 1) {
      const g = evaluateAttendanceStreakPack({ userId: `u${i}`, currentStreak: 0 }, { userId: `u${i}`, currentStreak: 5 });
      if (applyGrant(keys, g).granted) granted += 1;
    }
    expect(granted).toBe(500);
  });

  it("valores inválidos não geram pacote", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -50, -1]) {
      expect(evaluateAttendanceStreakPack(null, { userId: "u1", currentStreak: bad })).toBeNull();
    }
  });
});

describe("chave de idempotência", () => {
  it("é determinística e normaliza vazios", () => {
    expect(buildPackDedupeKey("task", "  abc  ")).toBe("pack:task:abc");
    expect(buildPackDedupeKey("manual", "")).toBe("pack:manual:none");
    expect(buildPackDedupeKey("manual", null)).toBe("pack:manual:none");
  });

  it("recusa referência absurdamente longa", () => {
    const long = "x".repeat(400);
    expect(evaluateTrailEnrollmentPack(null, { userId: "u1", trailId: long, completedAt: "2026-01-01" })).toBeNull();
  });

  it("tamanho concedido respeita o teto do banco", () => {
    for (const size of [PACK_SIZE_TASK_ON_TIME, PACK_SIZE_TRAIL_COMPLETED, PACK_SIZE_STREAK_MILESTONE]) {
      expect(size).toBeGreaterThanOrEqual(1);
      expect(size).toBeLessThanOrEqual(CARD_PACK_MAX_SIZE);
    }
  });
});
