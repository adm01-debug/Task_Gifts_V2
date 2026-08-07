import { describe, expect, it } from "vitest";
import { DEFAULT_DAMAGE_RULES } from "@/lib/bossBattle";
import {
  DEFAULT_PACE,
  projectCapacity,
  suggestTotalHp,
  validateBossPlan,
  windowDays,
  type BossPlanInput,
} from "@/lib/bossBattlePlanner";

const DAY = 86_400_000;
const BASE_START = new Date("2026-01-05T09:00:00.000Z").getTime();

function plan(overrides: Partial<BossPlanInput> = {}): BossPlanInput {
  return {
    title: "Chefão do Trimestre",
    description: null,
    departmentId: null,
    totalHp: 5000,
    startsAt: new Date(BASE_START).toISOString(),
    endsAt: new Date(BASE_START + 14 * DAY).toISOString(),
    rules: DEFAULT_DAMAGE_RULES,
    perUserCap: 0,
    coinsPool: 1000,
    xpPool: 2000,
    minShare: 0,
    perUserCoinsCap: 0,
    expectedParticipants: 12,
    ...overrides,
  };
}

/** LCG determinística para varreduras reprodutíveis. */
function lcg(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe("windowDays", () => {
  it("retorna 0 para janelas invertidas ou inválidas", () => {
    expect(windowDays("invalid", "also-invalid")).toBe(0);
    expect(
      windowDays(new Date(BASE_START).toISOString(), new Date(BASE_START - DAY).toISOString()),
    ).toBe(0);
  });

  it("arredonda janelas parciais para cima", () => {
    expect(
      windowDays(new Date(BASE_START).toISOString(), new Date(BASE_START + DAY / 2).toISOString()),
    ).toBe(1);
    expect(
      windowDays(new Date(BASE_START).toISOString(), new Date(BASE_START + 7 * DAY).toISOString()),
    ).toBe(7);
  });
});

describe("projectCapacity", () => {
  it("cresce monotonicamente com pessoas e com dias", () => {
    let previousPeople = -1;
    for (let people = 1; people <= 60; people += 1) {
      const capacity = projectCapacity(plan({ expectedParticipants: people })).capacity;
      expect(capacity).toBeGreaterThan(previousPeople);
      previousPeople = capacity;
    }

    let previousDays = -1;
    for (let days = 1; days <= 60; days += 1) {
      const capacity = projectCapacity(
        plan({ endsAt: new Date(BASE_START + days * DAY).toISOString() }),
      ).capacity;
      expect(capacity).toBeGreaterThan(previousDays);
      previousDays = capacity;
    }
  });

  it("nunca projeta acima do teto individual", () => {
    for (let cap = 10; cap <= 2000; cap += 10) {
      const projection = projectCapacity(plan({ perUserCap: cap }));
      expect(projection.perPersonCapacity).toBeLessThanOrEqual(cap);
      expect(projection.capacity).toBeLessThanOrEqual(cap * 12);
    }
  });

  it("é imune a entradas não numéricas (NaN/Infinity)", () => {
    const projection = projectCapacity(
      plan({
        totalHp: Number.NaN,
        expectedParticipants: Number.NaN,
        perUserCap: Number.POSITIVE_INFINITY,
      }),
    );
    expect(Number.isFinite(projection.capacity)).toBe(true);
    expect(projection.capacity).toBe(0);
    expect(projection.estimatedDefeatDay).toBeNull();
  });

  it("mantém o dia estimado de derrota dentro da janela em 600 cenários", () => {
    const rand = lcg(20260728);
    for (let i = 0; i < 600; i += 1) {
      const days = 1 + Math.floor(rand() * 60);
      const people = 1 + Math.floor(rand() * 200);
      const totalHp = 100 + Math.floor(rand() * 200_000);
      const projection = projectCapacity(
        plan({
          totalHp,
          expectedParticipants: people,
          endsAt: new Date(BASE_START + days * DAY).toISOString(),
        }),
      );
      if (projection.estimatedDefeatDay !== null) {
        expect(projection.estimatedDefeatDay).toBeGreaterThanOrEqual(1);
        expect(projection.estimatedDefeatDay).toBeLessThanOrEqual(projection.windowDays);
        expect(totalHp).toBeLessThanOrEqual(projection.capacity);
      } else {
        expect(totalHp).toBeGreaterThan(projection.capacity);
      }
    }
  });

  it("classifica o veredito de forma coerente com a razão de dificuldade", () => {
    const rand = lcg(777);
    for (let i = 0; i < 400; i += 1) {
      const projection = projectCapacity(
        plan({
          totalHp: 50 + Math.floor(rand() * 80_000),
          expectedParticipants: 1 + Math.floor(rand() * 80),
        }),
      );
      const ratio = projection.difficultyRatio;
      if (projection.verdict === "equilibrado") {
        expect(ratio).toBeGreaterThanOrEqual(0.45);
        expect(ratio).toBeLessThanOrEqual(0.85);
      }
      if (projection.verdict === "impossivel") expect(ratio).toBeGreaterThan(1.2);
      if (projection.verdict === "trivial") expect(ratio).toBeLessThan(0.2);
    }
  });
});

describe("validateBossPlan", () => {
  it("aprova um plano equilibrado sem erros", () => {
    const input = plan();
    const review = validateBossPlan({ ...input, totalHp: suggestTotalHp(input) });
    expect(review.valid).toBe(true);
    expect(review.issues.filter((issue) => issue.level === "error")).toHaveLength(0);
    expect(review.projection.verdict).toBe("equilibrado");
  });

  it("bloqueia campos inválidos com mensagens específicas", () => {
    const review = validateBossPlan(
      plan({
        title: "x",
        totalHp: 0,
        endsAt: new Date(BASE_START - DAY).toISOString(),
        expectedParticipants: 0,
        coinsPool: -5,
        minShare: 2,
        perUserCoinsCap: -1,
        perUserCap: -10,
      }),
    );
    expect(review.valid).toBe(false);
    const fields = new Set(review.issues.filter((i) => i.level === "error").map((i) => i.field));
    expect(fields).toContain("title");
    expect(fields).toContain("totalHp");
    expect(fields).toContain("endsAt");
    expect(fields).toContain("expectedParticipants");
    expect(fields).toContain("coinsPool");
    expect(fields).toContain("minShare");
    expect(fields).toContain("perUserCoinsCap");
    expect(fields).toContain("perUserCap");
  });

  it("rejeita batalha sem nenhuma fonte de dano ativa", () => {
    const review = validateBossPlan(
      plan({
        rules: {
          base: { task_score: 0, trail_completion: 0, attendance: 0, quiz: 0, manual: 0 },
          maxMultiplier: 1,
          perUserCap: 0,
        },
      }),
    );
    expect(review.valid).toBe(false);
    expect(review.issues.some((issue) => issue.field === "rules")).toBe(true);
  });

  it("rejeita HP inalcançável e aceita o HP sugerido no lugar", () => {
    const impossible = plan({ totalHp: 5_000_000, expectedParticipants: 5 });
    expect(validateBossPlan(impossible).valid).toBe(false);
    const fixed = { ...impossible, totalHp: suggestTotalHp(impossible) };
    expect(validateBossPlan(fixed).valid).toBe(true);
  });

  it("avisa (sem bloquear) sobre janelas extremas e prêmio zerado", () => {
    const oneDay = validateBossPlan(
      plan({ endsAt: new Date(BASE_START + DAY).toISOString(), totalHp: 100 }),
    );
    expect(oneDay.issues.some((i) => i.field === "endsAt" && i.level === "warning")).toBe(true);

    const noPrize = plan({ coinsPool: 0, xpPool: 0 });
    const review = validateBossPlan({ ...noPrize, totalHp: suggestTotalHp(noPrize) });
    expect(review.valid).toBe(true);
    expect(review.issues.some((i) => i.field === "coinsPool" && i.level === "warning")).toBe(true);
  });

  it("nunca lança e sempre devolve projeção finita em 500 cenários aleatórios", () => {
    const rand = lcg(4242);
    for (let i = 0; i < 500; i += 1) {
      const input = plan({
        title: rand() > 0.1 ? "Chefão" : "",
        totalHp: Math.floor(rand() * 12_000_000),
        expectedParticipants: Math.floor(rand() * 300),
        perUserCap: Math.floor(rand() * 5000),
        coinsPool: Math.floor(rand() * 100_000),
        xpPool: Math.floor(rand() * 100_000),
        minShare: Math.round(rand() * 100) / 100,
        perUserCoinsCap: Math.floor(rand() * 5000),
        endsAt: new Date(BASE_START + Math.floor(rand() * 200) * DAY).toISOString(),
      });
      const review = validateBossPlan(input, {
        ...DEFAULT_PACE,
        tasksPerPersonPerDay: rand() * 4,
        attendanceRate: rand(),
      });
      expect(typeof review.valid).toBe("boolean");
      expect(Number.isNaN(review.projection.capacity)).toBe(false);
      expect(review.projection.capacity).toBeGreaterThanOrEqual(0);
      if (review.valid) {
        expect(review.issues.every((issue) => issue.level === "warning")).toBe(true);
      }
    }
  });

  it("suggestTotalHp sempre gera um plano publicável quando há capacidade", () => {
    const rand = lcg(98765);
    for (let i = 0; i < 200; i += 1) {
      const days = 2 + Math.floor(rand() * 60);
      const input = plan({
        expectedParticipants: 1 + Math.floor(rand() * 150),
        endsAt: new Date(BASE_START + days * DAY).toISOString(),
      });
      const hp = suggestTotalHp(input);
      expect(hp).toBeGreaterThan(0);
      const review = validateBossPlan({ ...input, totalHp: hp });
      expect(review.issues.filter((issue) => issue.level === "error")).toHaveLength(0);
    }
  });
});