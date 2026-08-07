import { describe, it, expect } from "vitest";
import {
  AUTO_METRIC_KEYS,
  MAX_CONTRIBUTION_AMOUNT,
  deriveWarIntents,
  filterNewIntents,
  normalizeAmount,
  type WarContributionIntent,
  type WarSourceEvent,
} from "@/lib/warAutoHooks";

function uuid(seed: number): string {
  const hex = seed.toString(16).padStart(12, "0");
  return `00000000-0000-4000-8000-${hex}`;
}

function rand(max: number): number {
  return Math.floor(Math.random() * max);
}

const HOSTILE: unknown[] = [
  null,
  undefined,
  NaN,
  Infinity,
  -Infinity,
  -1,
  0,
  0.4,
  "12",
  "abc",
  {},
  [],
  true,
  1e12,
];

function randomEvent(i: number): WarSourceEvent {
  const user = uuid(i % 50);
  const id = uuid(1000 + i);
  const kind = i % 6;
  if (kind === 0) {
    return {
      type: "task_score",
      id,
      user_id: user,
      status: ["completed", "pending", "in_progress", "COMPLETED"][rand(4)],
      is_late: [true, false, null][rand(3)],
      completed_at: [null, new Date().toISOString()][rand(2)],
      previous_completed_at: [null, new Date().toISOString()][rand(2)],
    };
  }
  if (kind === 1) {
    return {
      type: "attendance",
      id,
      user_id: user,
      is_punctual: [true, false, null][rand(3)],
      check_in: [null, new Date().toISOString()][rand(2)],
    };
  }
  if (kind === 2) {
    return {
      type: "trail_enrollment",
      id,
      user_id: user,
      completed_at: [null, new Date().toISOString()][rand(2)],
      previous_completed_at: [null, new Date().toISOString()][rand(2)],
    };
  }
  if (kind === 3) {
    return {
      type: "module_progress",
      id,
      user_id: user,
      completed_at: [null, new Date().toISOString()][rand(2)],
      previous_completed_at: [null, new Date().toISOString()][rand(2)],
    };
  }
  if (kind === 4) {
    return {
      type: "quiz_score",
      id,
      user_id: user,
      correct_answers: [0, 3, 10, -5, null, 1e9][rand(6)] as number | null,
      total_questions: [0, 5, 10, null][rand(4)] as number | null,
    };
  }
  return { type: "kudos", id, user_id: user };
}

describe("warAutoHooks — invariantes gerais (900 cenarios)", () => {
  it("nunca lanca e sempre devolve intents validos", () => {
    for (let i = 0; i < 900; i++) {
      const intents = deriveWarIntents(randomEvent(i));
      expect(Array.isArray(intents)).toBe(true);
      for (const it of intents) {
        expect(AUTO_METRIC_KEYS).toContain(it.metric_key as never);
        expect(Number.isInteger(it.amount)).toBe(true);
        expect(it.amount).toBeGreaterThan(0);
        expect(it.amount).toBeLessThanOrEqual(MAX_CONTRIBUTION_AMOUNT);
        expect(it.dedupe_key.length).toBeGreaterThan(0);
        expect(it.dedupe_key.length).toBeLessThanOrEqual(180);
        expect(it.user_id).toMatch(/^[0-9a-f-]{36}$/i);
      }
    }
  });

  it("e deterministico: mesmo evento, mesmo resultado", () => {
    for (let i = 0; i < 200; i++) {
      const event = randomEvent(i);
      expect(deriveWarIntents(event)).toEqual(deriveWarIntents(event));
    }
  });

  it("dedupe keys sao unicas dentro de um mesmo evento", () => {
    for (let i = 0; i < 300; i++) {
      const intents = deriveWarIntents(randomEvent(i));
      const keys = intents.map((x) => x.dedupe_key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
});

describe("warAutoHooks — entradas hostis", () => {
  it("descarta eventos sem forma valida", () => {
    for (const bad of HOSTILE) {
      expect(deriveWarIntents(bad as never)).toEqual([]);
    }
  });

  it("descarta ids e user_ids nao-uuid", () => {
    for (const bad of HOSTILE) {
      expect(
        deriveWarIntents({
          type: "kudos",
          id: bad as never,
          user_id: uuid(1),
        } as WarSourceEvent),
      ).toEqual([]);
      expect(
        deriveWarIntents({
          type: "kudos",
          id: uuid(1),
          user_id: bad as never,
        } as WarSourceEvent),
      ).toEqual([]);
    }
  });

  it("normalizeAmount nunca devolve valor fora do dominio", () => {
    for (const bad of HOSTILE) {
      const value = normalizeAmount(bad);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(MAX_CONTRIBUTION_AMOUNT);
    }
    for (let i = 0; i < 500; i++) {
      const value = normalizeAmount(Math.random() * 4_000_000 - 1_000_000);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(MAX_CONTRIBUTION_AMOUNT);
    }
  });
});

describe("warAutoHooks — regras de negocio por origem", () => {
  it("tarefa so pontua na transicao para concluida", () => {
    const base = {
      type: "task_score" as const,
      id: uuid(1),
      user_id: uuid(2),
      status: "completed",
      is_late: false,
      completed_at: "2026-01-01T00:00:00Z",
    };
    expect(deriveWarIntents({ ...base, previous_completed_at: null })).toHaveLength(2);
    expect(
      deriveWarIntents({ ...base, previous_completed_at: "2025-12-01T00:00:00Z" }),
    ).toHaveLength(0);
    expect(
      deriveWarIntents({ ...base, completed_at: null, previous_completed_at: null }),
    ).toHaveLength(0);
    expect(
      deriveWarIntents({ ...base, status: "pending", previous_completed_at: null }),
    ).toHaveLength(0);
  });

  it("tarefa atrasada pontua conclusao mas nao pontualidade", () => {
    const intents = deriveWarIntents({
      type: "task_score",
      id: uuid(3),
      user_id: uuid(2),
      status: "completed",
      is_late: true,
      completed_at: "2026-01-01T00:00:00Z",
      previous_completed_at: null,
    });
    expect(intents.map((x) => x.metric_key)).toEqual(["tarefa_concluida"]);
  });

  it("is_late nulo (desconhecido) nao concede bonus de prazo", () => {
    const intents = deriveWarIntents({
      type: "task_score",
      id: uuid(4),
      user_id: uuid(2),
      status: "completed",
      is_late: null,
      completed_at: "2026-01-01T00:00:00Z",
      previous_completed_at: null,
    });
    expect(intents.map((x) => x.metric_key)).toEqual(["tarefa_concluida"]);
  });

  it("check-in atrasado ou sem horario nao pontua", () => {
    expect(
      deriveWarIntents({
        type: "attendance",
        id: uuid(5),
        user_id: uuid(2),
        is_punctual: false,
        check_in: "2026-01-01T08:00:00Z",
      }),
    ).toHaveLength(0);
    expect(
      deriveWarIntents({
        type: "attendance",
        id: uuid(6),
        user_id: uuid(2),
        is_punctual: true,
        check_in: null,
      }),
    ).toHaveLength(0);
  });

  it("quiz nunca pontua mais acertos do que perguntas", () => {
    for (let i = 0; i < 400; i++) {
      const total = rand(50);
      const correct = rand(200);
      const intents = deriveWarIntents({
        type: "quiz_score",
        id: uuid(7000 + i),
        user_id: uuid(2),
        correct_answers: correct,
        total_questions: total,
      });
      if (correct <= 0) {
        expect(intents).toHaveLength(0);
      } else {
        expect(intents[0].amount).toBeLessThanOrEqual(
          total > 0 ? total : MAX_CONTRIBUTION_AMOUNT,
        );
      }
    }
  });
});

describe("warAutoHooks — idempotencia sob replay", () => {
  it("reprocessar o mesmo lote nao cria contribuicao nova", () => {
    const events = Array.from({ length: 300 }, (_, i) => randomEvent(i));
    const seen = new Set<string>();
    const first: WarContributionIntent[] = [];
    for (const event of events) {
      for (const it of filterNewIntents(deriveWarIntents(event), seen)) {
        seen.add(`${it.user_id}:${it.dedupe_key}`);
        first.push(it);
      }
    }
    let replayed = 0;
    for (const event of [...events, ...events]) {
      replayed += filterNewIntents(deriveWarIntents(event), seen).length;
    }
    expect(replayed).toBe(0);
    expect(first.length).toBeGreaterThan(0);
  });

  it("usuarios diferentes com mesma origem nao colidem", () => {
    const a = deriveWarIntents({ type: "kudos", id: uuid(9), user_id: uuid(1) });
    const b = deriveWarIntents({ type: "kudos", id: uuid(9), user_id: uuid(2) });
    const seen = new Set<string>();
    expect(filterNewIntents([...a], seen)).toHaveLength(1);
    seen.add(`${a[0].user_id}:${a[0].dedupe_key}`);
    expect(filterNewIntents([...b], seen)).toHaveLength(1);
  });
});