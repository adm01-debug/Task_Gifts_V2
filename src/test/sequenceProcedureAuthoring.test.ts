import { describe, expect, it } from "vitest";
import {
  summarizeChanges,
  validateProcedureDraft,
  SOP_HINT_MAX,
  SOP_LABEL_MAX,
  SOP_MAX_STEPS,
  type ProcedureDraft,
  type StepDraft,
} from "@/lib/sequenceProcedureAuthoring";

const draft: ProcedureDraft = {
  title: "Abertura do Galpão",
  description: "Rotina matinal",
  departmentId: null,
  isActive: true,
};

const steps = (labels: string[]): StepDraft[] => labels.map((label) => ({ label }));

describe("validateProcedureDraft", () => {
  it("aceita um rascunho mínimo válido", () => {
    const result = validateProcedureDraft(draft, steps(["A", "B", "C"]));
    expect(result.valid).toBe(true);
    expect(result.usableSteps).toBe(3);
    expect(result.normalizedSteps[0].hint).toBeNull();
  });

  it("exige título", () => {
    const result = validateProcedureDraft({ ...draft, title: "   " }, steps(["A", "B", "C"]));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.scope === "procedure")).toBe(true);
  });

  it("exige o mínimo de etapas", () => {
    expect(validateProcedureDraft(draft, steps(["A", "B"])).valid).toBe(false);
  });

  it("bloqueia mais que o máximo de etapas", () => {
    const many = steps(Array.from({ length: SOP_MAX_STEPS + 1 }, (_, i) => `Etapa ${i}`));
    expect(validateProcedureDraft(draft, many).valid).toBe(false);
  });

  it("ignora linhas totalmente vazias", () => {
    const result = validateProcedureDraft(draft, [
      { label: "A" },
      { label: "B" },
      { label: "C" },
      { label: "  ", hint: "" },
    ]);
    expect(result.valid).toBe(true);
    expect(result.usableSteps).toBe(3);
  });

  it("acusa dica sem rótulo", () => {
    const result = validateProcedureDraft(draft, [
      { label: "A" },
      { label: "B" },
      { label: "C" },
      { label: "", hint: "dica órfã" },
    ]);
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.scope === "step:3")).toBe(true);
  });

  it("detecta duplicidade ignorando caixa e acento", () => {
    const result = validateProcedureDraft(draft, steps(["Ligar máquina", "LIGAR MAQUINA", "C"]));
    expect(result.valid).toBe(false);
    expect(result.issues.some((i) => i.message.includes("repetida"))).toBe(true);
  });

  it("normaliza espaços redundantes", () => {
    const result = validateProcedureDraft(draft, [
      { label: "  Abrir   portão " },
      { label: "B" },
      { label: "C" },
    ]);
    expect(result.normalizedSteps[0].label).toBe("Abrir portão");
  });

  it("limita tamanho de rótulo e dica", () => {
    const longLabel = "x".repeat(SOP_LABEL_MAX + 1);
    const longHint = "y".repeat(SOP_HINT_MAX + 1);
    expect(validateProcedureDraft(draft, [{ label: longLabel }, { label: "B" }, { label: "C" }]).valid).toBe(false);
    expect(
      validateProcedureDraft(draft, [
        { label: "A", hint: longHint },
        { label: "B" },
        { label: "C" },
      ]).valid,
    ).toBe(false);
  });
});

describe("summarizeChanges", () => {
  const persisted = [
    { id: "1", label: "A", hint: null, position: 1 },
    { id: "2", label: "B", hint: null, position: 2 },
    { id: "3", label: "C", hint: null, position: 3 },
  ];

  it("reporta ausência de mudanças", () => {
    const result = summarizeChanges(persisted, [
      { id: "1", label: "A", hint: null },
      { id: "2", label: "B", hint: null },
      { id: "3", label: "C", hint: null },
    ]);
    expect(result).toMatchObject({ inserted: 0, updated: 0, removed: 0, unchanged: 3, reordered: false });
  });

  it("detecta reordenação", () => {
    const result = summarizeChanges(persisted, [
      { id: "2", label: "B", hint: null },
      { id: "1", label: "A", hint: null },
      { id: "3", label: "C", hint: null },
    ]);
    expect(result.reordered).toBe(true);
    expect(result.updated).toBe(2);
    expect(result.unchanged).toBe(1);
  });

  it("conta inserções e remoções", () => {
    const result = summarizeChanges(persisted, [
      { id: "1", label: "A", hint: null },
      { label: "Nova", hint: null },
      { id: "3", label: "C", hint: null },
    ]);
    expect(result.inserted).toBe(1);
    expect(result.removed).toBe(1);
    expect(result.reordered).toBe(true);
  });

  it("trata procedimento novo (sem etapas persistidas)", () => {
    const result = summarizeChanges([], [{ label: "A" }, { label: "B" }, { label: "C" }]);
    expect(result).toMatchObject({ inserted: 3, updated: 0, removed: 0, unchanged: 0 });
  });
});
