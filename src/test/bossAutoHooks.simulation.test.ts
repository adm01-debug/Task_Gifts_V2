import { describe, it, expect } from "vitest";
import {
  applyBossEvent,
  buildBossDedupeKey,
  evaluateAttendanceDamage,
  evaluateTaskScoreDamage,
  evaluateTrailDamage,
  isBattleEligible,
  selectTargetBattle,
  type BossBattleTarget,
  type TaskCompletionStatus,
} from "@/lib/bossAutoHooks";

/** PRNG determinístico (xorshift) — simulações reprodutíveis. */
function rng(seed: number) {
  let s = seed || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return Math.abs(s) / 2147483647;
  };
}

const NOW = new Date("2026-05-10T12:00:00.000Z");

const battle = (over: Partial<BossBattleTarget> = {}): BossBattleTarget => ({
  id: "b1",
  departmentId: null,
  status: "running",
  startsAt: "2026-05-01T00:00:00.000Z",
  endsAt: "2026-05-31T00:00:00.000Z",
  currentHp: 1000,
  ...over,
});

const ctx = (battles: BossBattleTarget[], departmentId: string | null = "dep-1", multiplier = 1) => ({
  battles,
  departmentId,
  at: NOW,
  multiplier,
  maxMultiplier: 3,
});

describe("bossAutoHooks — elegibilidade e seleção de alvo", () => {
  it("rejeita batalhas fora da janela, sem HP ou não iniciadas", () => {
    expect(isBattleEligible(battle(), NOW)).toBe(true);
    expect(isBattleEligible(battle({ status: "draft" }), NOW)).toBe(false);
    expect(isBattleEligible(battle({ currentHp: 0 }), NOW)).toBe(false);
    expect(isBattleEligible(battle({ startsAt: "2026-06-01T00:00:00.000Z" }), NOW)).toBe(false);
    expect(isBattleEligible(battle({ endsAt: "2026-05-02T00:00:00.000Z" }), NOW)).toBe(false);
    expect(isBattleEligible(battle({ endsAt: "não-é-data" }), NOW)).toBe(false);
  });

  it("prioriza batalha do departamento sobre a global", () => {
    const target = selectTargetBattle(
      [battle({ id: "global" }), battle({ id: "dep", departmentId: "dep-1" })],
      "dep-1",
      NOW,
    );
    expect(target?.id).toBe("dep");
  });

  it("ignora batalha de outro departamento", () => {
    const target = selectTargetBattle([battle({ id: "outro", departmentId: "dep-9" })], "dep-1", NOW);
    expect(target).toBeNull();
  });

  it("é determinístico independentemente da ordem de entrada (300 cenários)", () => {
    const rand = rng(31);
    for (let i = 0; i < 300; i++) {
      const battles = Array.from({ length: 1 + Math.floor(rand() * 6) }, (_, k) =>
        battle({
          id: `b${k}`,
          departmentId: rand() > 0.5 ? "dep-1" : null,
          endsAt: new Date(NOW.getTime() + Math.floor(rand() * 10) * 86_400_000).toISOString(),
          currentHp: Math.floor(rand() * 500),
          status: rand() > 0.15 ? "running" : "defeated",
        }),
      );
      const first = selectTargetBattle(battles, "dep-1", NOW);
      const second = selectTargetBattle([...battles].reverse(), "dep-1", NOW);
      expect(second?.id ?? null).toBe(first?.id ?? null);
    }
  });
});

describe("bossAutoHooks — regras de transição", () => {
  it("tarefa no prazo bate uma única vez; reprocesso é duplicata", () => {
    const keys = new Set<string>();
    const row = { id: "t1", userId: "u1", status: "on_time" as TaskCompletionStatus };
    const first = evaluateTaskScoreDamage({ ...row, status: "pending" }, row, ctx([battle()]));
    expect(applyBossEvent(keys, first).dispatched).toBe(true);
    const again = evaluateTaskScoreDamage(row, row, ctx([battle()]));
    expect(again).toBeNull();
    const replay = evaluateTaskScoreDamage({ ...row, status: "rework" }, row, ctx([battle()]));
    expect(applyBossEvent(keys, replay)).toEqual({ dispatched: false, duplicate: true });
  });

  it("tarefa atrasada, rejeitada ou com retrabalho não causa dano", () => {
    const base = { id: "t1", userId: "u1" };
    expect(evaluateTaskScoreDamage(null, { ...base, status: "late" }, ctx([battle()]))).toBeNull();
    expect(evaluateTaskScoreDamage(null, { ...base, status: "rejected" }, ctx([battle()]))).toBeNull();
    expect(
      evaluateTaskScoreDamage(null, { ...base, status: "on_time", isLate: true }, ctx([battle()])),
    ).toBeNull();
    expect(
      evaluateTaskScoreDamage(null, { ...base, status: "on_time", reworkCount: 2 }, ctx([battle()])),
    ).toBeNull();
  });

  it("trilha só bate na transição para concluída", () => {
    const next = { userId: "u1", trailId: "tr1", completedAt: "2026-05-10T10:00:00Z" };
    expect(evaluateTrailDamage(null, next, ctx([battle()]))?.source).toBe("trail_completion");
    expect(evaluateTrailDamage({ ...next, completedAt: "2026-05-01T10:00:00Z" }, next, ctx([battle()]))).toBeNull();
    expect(evaluateTrailDamage(null, { ...next, completedAt: null }, ctx([battle()]))).toBeNull();
  });

  it("presença paga uma vez por dia e volta a pagar no dia seguinte", () => {
    const keys = new Set<string>();
    const d1 = { userId: "u1", currentStreak: 3, lastPunctualDate: "2026-05-10" };
    const d2 = { userId: "u1", currentStreak: 4, lastPunctualDate: "2026-05-11" };
    expect(applyBossEvent(keys, evaluateAttendanceDamage(null, d1, ctx([battle()]))).dispatched).toBe(true);
    expect(evaluateAttendanceDamage(d1, d1, ctx([battle()]))).toBeNull();
    expect(applyBossEvent(keys, evaluateAttendanceDamage(d1, d2, ctx([battle()]))).dispatched).toBe(true);
    expect(
      evaluateAttendanceDamage(null, { userId: "u1", currentStreak: 0, lastPunctualDate: "2026-05-12" }, ctx([battle()])),
    ).toBeNull();
  });

  it("sem batalha ativa nenhum evento é gerado", () => {
    const none = ctx([battle({ status: "expired" })]);
    expect(evaluateTaskScoreDamage(null, { id: "t", userId: "u", status: "on_time" }, none)).toBeNull();
  });
});

describe("bossAutoHooks — chaves e clamps", () => {
  it("clampa multiplicadores inválidos dentro de [1, maxMultiplier]", () => {
    const mk = (m: number) =>
      evaluateTaskScoreDamage(null, { id: "t", userId: "u", status: "on_time" }, ctx([battle()], "dep-1", m))!
        .multiplier;
    expect(mk(Number.NaN)).toBe(1);
    expect(mk(-4)).toBe(1);
    expect(mk(99)).toBe(3);
    expect(mk(2)).toBe(2);
  });

  it("chave é pura, prefixada e limitada em tamanho", () => {
    expect(buildBossDedupeKey("quiz", " x ")).toBe("boss:quiz:x");
    expect(buildBossDedupeKey("quiz", null)).toBe("boss:quiz:none");
    const huge = "z".repeat(300);
    expect(
      evaluateTrailDamage(null, { userId: huge, trailId: huge, completedAt: "2026-05-10T00:00:00Z" }, ctx([battle()])),
    ).toBeNull();
  });

  it("nenhum evento duplicado sobrevive em 500 cenários aleatórios de replay", () => {
    const rand = rng(97);
    for (let i = 0; i < 500; i++) {
      const keys = new Set<string>();
      let dispatched = 0;
      const taskId = `t${Math.floor(rand() * 5)}`;
      for (let k = 0; k < 12; k++) {
        const prevStatus: TaskCompletionStatus = rand() > 0.5 ? "pending" : "on_time";
        const ev = evaluateTaskScoreDamage(
          { id: taskId, userId: "u1", status: prevStatus },
          { id: taskId, userId: "u1", status: "on_time" },
          ctx([battle()]),
        );
        if (applyBossEvent(keys, ev).dispatched) dispatched += 1;
      }
      expect(dispatched).toBeLessThanOrEqual(1);
    }
  });
});