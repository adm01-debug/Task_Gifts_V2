import { describe, expect, it } from "vitest";
import {
  comparisonKey,
  diffPairs,
  MEMORY_CARD_TEXT_MAX,
  MEMORY_MAX_PAIRS_PER_DECK,
  MEMORY_MIN_PAIRS,
  MEMORY_TITLE_MAX,
  normalizeCardText,
  validateDeckDraft,
  type PairDraft,
} from "@/lib/memoryDeckAuthoring";

const deck = { title: "Baralho", description: "", isActive: true };

function pairs(count: number, offset = 0): PairDraft[] {
  return Array.from({ length: count }, (_, i) => ({
    term: `Termo ${i + offset}`,
    match: `Match ${i + offset}`,
  }));
}

describe("normalização", () => {
  it("colapsa espaços e remove pontas", () => {
    expect(normalizeCardText("  Capacete   de   obra ")).toBe("Capacete de obra");
    expect(normalizeCardText("\n\t ")).toBe("");
  });

  it("compara ignorando caixa e acento", () => {
    expect(comparisonKey("Óculos")).toBe(comparisonKey("oculos"));
    expect(comparisonKey("Ação")).not.toBe(comparisonKey("acoes"));
  });
});

describe("validateDeckDraft", () => {
  it("aceita um rascunho mínimo válido", () => {
    const result = validateDeckDraft(deck, pairs(MEMORY_MIN_PAIRS));
    expect(result.valid).toBe(true);
    expect(result.usablePairs).toBe(MEMORY_MIN_PAIRS);
  });

  it("exige título e respeita o limite de tamanho", () => {
    expect(validateDeckDraft({ ...deck, title: "   " }, pairs(4)).valid).toBe(false);
    expect(
      validateDeckDraft({ ...deck, title: "a".repeat(MEMORY_TITLE_MAX) }, pairs(4)).valid,
    ).toBe(true);
    expect(
      validateDeckDraft({ ...deck, title: "a".repeat(MEMORY_TITLE_MAX + 1) }, pairs(4)).valid,
    ).toBe(false);
  });

  it("ignora linhas totalmente vazias mas rejeita linhas pela metade", () => {
    const withBlank = validateDeckDraft(deck, [...pairs(4), { term: "", match: "" }]);
    expect(withBlank.valid).toBe(true);
    expect(withBlank.usablePairs).toBe(4);

    const halfFilled = validateDeckDraft(deck, [...pairs(4), { term: "Sozinho", match: " " }]);
    expect(halfFilled.valid).toBe(false);
    expect(halfFilled.issues.some((i) => i.scope === "pair:4")).toBe(true);
  });

  it("bloqueia ambiguidade: termo ou correspondência repetidos", () => {
    const dupTerm = validateDeckDraft(deck, [
      ...pairs(4),
      { term: "termo 0", match: "Outro" },
    ]);
    expect(dupTerm.valid).toBe(false);

    const dupMatch = validateDeckDraft(deck, [
      ...pairs(4),
      { term: "Novo", match: "MATCH 1" },
    ]);
    expect(dupMatch.valid).toBe(false);
  });

  it("bloqueia par espelhado (os dois lados iguais)", () => {
    const result = validateDeckDraft(deck, [...pairs(4), { term: "EPI", match: " epi " }]);
    expect(result.valid).toBe(false);
  });

  it("respeita as fronteiras de quantidade de pares", () => {
    expect(validateDeckDraft(deck, pairs(MEMORY_MIN_PAIRS - 1)).valid).toBe(false);
    expect(validateDeckDraft(deck, pairs(MEMORY_MAX_PAIRS_PER_DECK)).valid).toBe(true);
    expect(validateDeckDraft(deck, pairs(MEMORY_MAX_PAIRS_PER_DECK + 1)).valid).toBe(false);
  });

  it("respeita a fronteira de tamanho de carta", () => {
    const long = "a".repeat(MEMORY_CARD_TEXT_MAX);
    expect(validateDeckDraft(deck, [...pairs(3), { term: long, match: "ok" }]).valid).toBe(true);
    expect(
      validateDeckDraft(deck, [...pairs(3), { term: `${long}a`, match: "ok" }]).valid,
    ).toBe(false);
  });

  it("tolera entradas nulas sem lançar em centenas de combinações", () => {
    const values = ["", " ", "ok", "OK", "ó", "a".repeat(70), "  duplo  espaço "];
    let checked = 0;
    for (const term of values) {
      for (const match of values) {
        for (const title of ["", "Título", "t".repeat(200)]) {
          for (const extra of [0, 3, 4]) {
            const result = validateDeckDraft({ ...deck, title }, [
              ...pairs(extra, 100),
              { term, match },
            ]);
            expect(Array.isArray(result.issues)).toBe(true);
            expect(result.usablePairs).toBeGreaterThanOrEqual(0);
            expect(result.valid).toBe(result.issues.length === 0);
            checked += 1;
          }
        }
      }
    }
    expect(checked).toBeGreaterThan(400);
  });
});

describe("diffPairs", () => {
  const existing = [
    { id: "a", term: "Capacete", match: "Cabeça" },
    { id: "b", term: "Luva", match: "Mão" },
    { id: "c", term: "Bota", match: "Pé" },
  ];

  it("classifica inserções, atualizações e remoções", () => {
    const diff = diffPairs(existing, [
      { id: "a", term: "Capacete", match: "Cabeça" },
      { id: "b", term: "Luva de raspa", match: "Mão" },
      { term: "Óculos", match: "Olhos" },
    ]);
    expect(diff.unchanged).toBe(1);
    expect(diff.toUpdate).toEqual([{ id: "b", term: "Luva de raspa", match: "Mão" }]);
    expect(diff.toInsert).toEqual([{ term: "Óculos", match: "Olhos" }]);
    expect(diff.toDeleteIds).toEqual(["c"]);
  });

  it("trata diferença apenas de espaçamento como inalterado", () => {
    const diff = diffPairs(existing, existing.map((p) => ({ ...p, term: `  ${p.term}  ` })));
    expect(diff.unchanged).toBe(3);
    expect(diff.toUpdate).toHaveLength(0);
  });

  it("ignora rascunhos incompletos e remove tudo quando o rascunho é vazio", () => {
    expect(diffPairs(existing, [{ term: "x", match: "" }]).toInsert).toHaveLength(0);
    expect(diffPairs(existing, []).toDeleteIds).toEqual(["a", "b", "c"]);
    expect(diffPairs([], []).toInsert).toHaveLength(0);
  });

  it("trata id inexistente como inserção, sem quebrar", () => {
    const diff = diffPairs(existing, [{ id: "zzz", term: "Novo", match: "Par" }]);
    expect(diff.toInsert).toEqual([{ term: "Novo", match: "Par" }]);
    expect(diff.toDeleteIds).toHaveLength(3);
  });
});