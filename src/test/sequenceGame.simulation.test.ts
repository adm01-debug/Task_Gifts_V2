import { describe, expect, it } from "vitest";
import {
  moveItem,
  renumberSteps,
  scoreSequence,
  SEQUENCE_DAILY_REWARDED_ATTEMPTS,
  SEQUENCE_MAX_COINS,
  SEQUENCE_MAX_STEPS,
  SEQUENCE_MAX_XP,
  shuffleSteps,
  sortByPosition,
  validateOrder,
  type SequenceStep,
} from "@/lib/sequenceGame";

function makeSteps(count: number): SequenceStep[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `s${i + 1}`,
    label: `Etapa ${i + 1}`,
    position: i + 1,
  }));
}

/** Todas as permutações de uma lista pequena — usado na simulação exaustiva. */
function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest]),
  );
}

describe("shuffleSteps", () => {
  it("preserva o conjunto de etapas e é determinístico", () => {
    const steps = makeSteps(8);
    const a = shuffleSteps(steps, "proc-1").map((s) => s.id);
    const b = shuffleSteps(steps, "proc-1").map((s) => s.id);
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual(steps.map((s) => s.id).sort());
  });

  it("nunca entrega a ordem correta de saída", () => {
    for (let size = 2; size <= 10; size += 1) {
      const steps = makeSteps(size);
      const correct = steps.map((s) => s.id).join("|");
      for (let seed = 0; seed < 60; seed += 1) {
        expect(shuffleSteps(steps, `seed-${size}-${seed}`).map((s) => s.id).join("|")).not.toBe(
          correct,
        );
      }
    }
  });

  it("tolera listas triviais e posições fora de ordem na origem", () => {
    expect(shuffleSteps([], "x")).toHaveLength(0);
    expect(shuffleSteps(makeSteps(1), "x")).toHaveLength(1);
    const unsorted = [...makeSteps(4)].reverse();
    expect(sortByPosition(unsorted).map((s) => s.position)).toEqual([1, 2, 3, 4]);
  });
});

describe("validateOrder", () => {
  const steps = makeSteps(4);

  it("aprova a ordem completa e sem repetição", () => {
    expect(validateOrder(steps, ["s2", "s1", "s4", "s3"])).toEqual({ valid: true });
  });

  it("rejeita tamanho errado, duplicata, intruso e lista vazia", () => {
    expect(validateOrder(steps, ["s1", "s2"])).toMatchObject({ reason: "length_mismatch" });
    expect(validateOrder(steps, ["s1", "s1", "s2", "s3"])).toMatchObject({ reason: "duplicate" });
    expect(validateOrder(steps, ["s1", "s2", "s3", "xx"])).toMatchObject({
      reason: "unknown_step",
    });
    expect(validateOrder([], [])).toMatchObject({ reason: "empty" });
  });
});

describe("scoreSequence — simulação exaustiva", () => {
  it("pontua todas as permutações de 3 a 6 etapas dentro dos limites", () => {
    let checked = 0;
    for (let size = 3; size <= 6; size += 1) {
      const steps = makeSteps(size);
      const ids = steps.map((s) => s.id);
      for (const order of permutations(ids)) {
        const score = scoreSequence(steps, order);
        const expectedCorrect = order.filter((id, i) => id === ids[i]).length;

        expect(score.correctPositions).toBe(expectedCorrect);
        expect(score.isPerfect).toBe(expectedCorrect === size);
        expect(score.wrongIndexes).toHaveLength(size - expectedCorrect);
        expect(score.coins).toBeGreaterThanOrEqual(0);
        expect(score.coins).toBeLessThanOrEqual(SEQUENCE_MAX_COINS);
        expect(score.xp).toBeLessThanOrEqual(SEQUENCE_MAX_XP);
        // Nenhuma permutação pode ter exatamente n-1 posições corretas.
        expect(expectedCorrect).not.toBe(size - 1);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(800);
  });

  it("aplica os tetos em procedimentos longos", () => {
    const steps = makeSteps(SEQUENCE_MAX_STEPS);
    const score = scoreSequence(steps, steps.map((s) => s.id));
    expect(score.isPerfect).toBe(true);
    expect(score.coins).toBe(SEQUENCE_MAX_COINS);
    expect(score.xp).toBe(SEQUENCE_MAX_XP);
  });

  it("zera o pagamento após o limite diário, mas mantém a correção", () => {
    const steps = makeSteps(4);
    const order = steps.map((s) => s.id);
    expect(scoreSequence(steps, order, SEQUENCE_DAILY_REWARDED_ATTEMPTS - 1).coins).toBeGreaterThan(
      0,
    );
    const blocked = scoreSequence(steps, order, SEQUENCE_DAILY_REWARDED_ATTEMPTS);
    expect(blocked).toMatchObject({ coins: 0, xp: 0, dailyLimitReached: true, isPerfect: true });
  });

  it("não paga nada em ordem inválida", () => {
    const steps = makeSteps(4);
    const score = scoreSequence(steps, ["s1", "s1", "s2", "s3"]);
    expect(score).toMatchObject({ coins: 0, xp: 0, correctPositions: 0, isPerfect: false });
  });

  it("ignora rewardedToday negativo ou fracionário sem quebrar", () => {
    const steps = makeSteps(3);
    const order = steps.map((s) => s.id);
    expect(scoreSequence(steps, order, -5).coins).toBeGreaterThan(0);
    expect(scoreSequence(steps, order, 2.9).coins).toBeGreaterThan(0);
    expect(scoreSequence(steps, order, 3.9).coins).toBe(0);
  });
});

describe("moveItem e renumberSteps", () => {
  it("reordena corretamente para frente e para trás", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b", "c"], 2, 0)).toEqual(["c", "a", "b"]);
  });

  it("é uma cópia inerte para índices inválidos", () => {
    const list = ["a", "b", "c"];
    for (const [from, to] of [
      [-1, 1],
      [0, 9],
      [1, 1],
      [Number.NaN, 0],
      [0.5, 2],
    ] as const) {
      const result = moveItem(list, from, to);
      expect(result).toEqual(list);
      expect(result).not.toBe(list);
    }
  });

  it("renumera posições sequencialmente a partir de 1", () => {
    const renumbered = renumberSteps([{ position: 9 }, { position: 3 }, { position: 7 }]);
    expect(renumbered.map((s) => s.position)).toEqual([1, 2, 3]);
  });
});