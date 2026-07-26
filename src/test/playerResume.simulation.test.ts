import { beforeEach, describe, expect, it } from "vitest";
import {
  RESUME_TTL_MS,
  clearResume,
  describeResume,
  loadResume,
  normalizeResume,
  resumeKey,
  safeResumePosition,
  saveResume,
  type ResumeState,
} from "@/lib/playerResume";

const NOW = 1_800_000_000_000;

function base(overrides: Partial<ResumeState> = {}): ResumeState {
  return {
    moduleId: "11111111-2222-3333-4444-555555555555",
    contentType: "quiz",
    position: 3,
    updatedAt: NOW - 1000,
    ...overrides,
  };
}

describe("retomada do player — simulação", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("isola a chave por usuário e módulo (400 combinações)", () => {
    const keys = new Set<string>();
    for (let u = 0; u < 20; u++) {
      for (let m = 0; m < 20; m++) {
        keys.add(resumeKey(`user-${u}`, `mod-${m}`));
      }
    }
    expect(keys.size).toBe(400);
    expect(resumeKey(null, "m")).toContain(":anon:");
    expect(resumeKey("   ", "m")).toContain(":anon:");
  });

  it("rejeita payloads hostis ou malformados", () => {
    const hostile: unknown[] = [
      null,
      undefined,
      42,
      "string",
      [],
      {},
      { moduleId: "" },
      { moduleId: "m", contentType: "hack" },
      { moduleId: "m", contentType: "quiz" },
      { moduleId: "m", contentType: "quiz", updatedAt: 0 },
      { moduleId: "m", contentType: "quiz", updatedAt: -5 },
      { moduleId: "m", contentType: "quiz", updatedAt: NaN },
    ];
    for (const raw of hostile) {
      expect(normalizeResume(raw, NOW)).toBeNull();
    }
  });

  it("descarta sessões expiradas e relógios adiantados (300 cenários)", () => {
    for (let i = 0; i < 150; i++) {
      const fresh = normalizeResume(base({ updatedAt: NOW - i * 60_000 }), NOW);
      expect(fresh).not.toBeNull();

      const stale = normalizeResume(
        base({ updatedAt: NOW - RESUME_TTL_MS - 1 - i }),
        NOW,
      );
      expect(stale).toBeNull();
    }
    expect(normalizeResume(base({ updatedAt: NOW + 5 * 60_000 }), NOW)).toBeNull();
  });

  it("clampa posições e respostas absurdas (500 cenários)", () => {
    for (let i = 0; i < 500; i++) {
      const state = normalizeResume(
        base({
          position: (i % 2 === 0 ? -1 : 1) * i * 999,
          answers: [-99, i, Number.POSITIVE_INFINITY, NaN] as number[],
          progressRatio: i % 3 === 0 ? -2 : 7.5,
        }),
        NOW,
      );
      expect(state).not.toBeNull();
      expect(state!.position).toBeGreaterThanOrEqual(0);
      expect(state!.position).toBeLessThanOrEqual(10_000);
      for (const a of state!.answers ?? []) {
        expect(a).toBeGreaterThanOrEqual(-1);
        expect(a).toBeLessThanOrEqual(50);
        expect(Number.isInteger(a)).toBe(true);
      }
      expect(state!.progressRatio).toBeGreaterThanOrEqual(0);
      expect(state!.progressRatio).toBeLessThanOrEqual(1);
    }
  });

  it("deduplica e ordena itens marcados do checklist", () => {
    const state = normalizeResume(
      base({ contentType: "checklist", checked: [5, 1, 5, 3, 1, -4] }),
      NOW,
    );
    expect(state!.checked).toEqual([0, 1, 3, 5]);
  });

  it("faz round-trip de salvar/carregar/limpar (200 módulos)", () => {
    for (let i = 0; i < 200; i++) {
      const state = base({ moduleId: `mod-${i}`, position: i % 17 });
      expect(saveResume("user-1", state)).toBe(true);
      const loaded = loadResume("user-1", `mod-${i}`, NOW);
      expect(loaded?.position).toBe(i % 17);
      // Outro usuário nunca enxerga o progresso alheio.
      expect(loadResume("user-2", `mod-${i}`, NOW)).toBeNull();
      clearResume("user-1", `mod-${i}`);
      expect(loadResume("user-1", `mod-${i}`, NOW)).toBeNull();
    }
  });

  it("auto-limpa registros corrompidos no storage", () => {
    window.localStorage.setItem(resumeKey("u", "m"), "{não é json");
    expect(loadResume("u", "m", NOW)).toBeNull();
    window.localStorage.setItem(resumeKey("u", "m"), JSON.stringify({ foo: 1 }));
    expect(loadResume("u", "m", NOW)).toBeNull();
    expect(window.localStorage.getItem(resumeKey("u", "m"))).toBeNull();
  });

  it("nunca retoma além do conteúdo atual quando o módulo encolhe (600 combinações)", () => {
    for (let pos = 0; pos < 30; pos++) {
      for (let total = 0; total < 20; total++) {
        const safe = safeResumePosition(base({ position: pos }), total);
        expect(safe).toBeGreaterThanOrEqual(0);
        if (total > 0) expect(safe).toBeLessThan(total);
        else expect(safe).toBe(0);
      }
    }
    expect(safeResumePosition(null, 10)).toBe(0);
  });

  it("descreve a retomada sem estourar o total", () => {
    expect(describeResume(base({ position: 40 }), 5)).toBe("Retomar do item 5 de 5");
    expect(describeResume(base({ position: 2 }))).toContain("item 3");
  });
});
