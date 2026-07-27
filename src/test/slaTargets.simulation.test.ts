import { describe, it, expect } from "vitest";
import {
  validateSlaDraft, parseMinutes, draftToRow, rowToDraft, formatMinutes,
  MAX_SLA_MINUTES, MIN_SLA_MINUTES,
} from "@/lib/slaTargets";

/** PRNG determinístico (mulberry32) para reprodutibilidade das simulações. */
function rng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const HOSTILE: unknown[] = [
  "", "  ", "abc", "NaN", null, undefined, {}, [], true, false,
  Infinity, -Infinity, NaN, "1e400", "-0", "0", "12,5", " 42 ", "1e3",
];

describe("slaTargets — parseMinutes", () => {
  it("rejeita entradas não numéricas", () => {
    for (const v of ["", " ", "abc", null, undefined, {}, [], NaN, Infinity]) {
      expect(parseMinutes(v as unknown)).toBeNull();
    }
  });
  it("aceita vírgula decimal e espaços", () => {
    expect(parseMinutes("12,5")).toBe(13);
    expect(parseMinutes(" 42 ")).toBe(42);
    expect(parseMinutes("1e3")).toBe(1000);
  });
});

describe("slaTargets — validação hostil (cartesiano)", () => {
  it("nunca lança e sempre devolve normalized dentro dos limites", () => {
    let count = 0;
    for (const a of HOSTILE) {
      for (const b of HOSTILE) {
        const res = validateSlaDraft({ alertType: "generic", mttaMinutes: a, mttrMinutes: b });
        expect(res.normalized.mttaMinutes).toBeGreaterThanOrEqual(MIN_SLA_MINUTES);
        expect(res.normalized.mttaMinutes).toBeLessThanOrEqual(MAX_SLA_MINUTES);
        expect(res.normalized.mttrMinutes).toBeGreaterThanOrEqual(MIN_SLA_MINUTES);
        expect(res.normalized.mttrMinutes).toBeLessThanOrEqual(MAX_SLA_MINUTES);
        count++;
      }
    }
    expect(count).toBe(HOSTILE.length * HOSTILE.length); // 361 cenários
  });

  it("exige alertType não vazio", () => {
    expect(validateSlaDraft({ alertType: "   ", mttaMinutes: 5, mttrMinutes: 10 }).valid).toBe(false);
  });

  it("rejeita MTTA > MTTR", () => {
    const res = validateSlaDraft({ alertType: "x", mttaMinutes: 120, mttrMinutes: 60 });
    expect(res.valid).toBe(false);
    expect(res.errors.join(" ")).toMatch(/MTTA/);
  });
});

describe("slaTargets — 500 cenários aleatórios", () => {
  it("mantém invariantes e round-trip minutos↔segundos", () => {
    const rand = rng(20260727);
    for (let i = 0; i < 500; i++) {
      const mtta = Math.floor(rand() * 100000) - 20000;
      const mttr = Math.floor(rand() * 100000) - 20000;
      const res = validateSlaDraft({ alertType: `type_${i}`, mttaMinutes: mtta, mttrMinutes: mttr, notes: "x".repeat(900) });

      // Notas truncadas
      expect((res.normalized.notes ?? "").length).toBeLessThanOrEqual(500);

      if (res.valid) {
        expect(res.normalized.mttaMinutes).toBeLessThanOrEqual(res.normalized.mttrMinutes);
        const row = draftToRow(res.normalized);
        expect(row.mtta_target_seconds).toBeGreaterThan(0);
        expect(row.mttr_target_seconds).toBeGreaterThan(0);
        const back = rowToDraft(row);
        expect(back.mttaMinutes).toBe(res.normalized.mttaMinutes);
        expect(back.mttrMinutes).toBe(res.normalized.mttrMinutes);
      }
    }
  });
});

describe("slaTargets — formatMinutes", () => {
  it("formata faixas conhecidas", () => {
    expect(formatMinutes(30)).toBe("30min");
    expect(formatMinutes(60)).toBe("1h");
    expect(formatMinutes(90)).toBe("1h30");
    expect(formatMinutes(1440)).toBe("1d");
    expect(formatMinutes(1500)).toBe("1d1h");
  });
  it("é resiliente a entradas inválidas", () => {
    expect(formatMinutes(NaN)).toBe("0min");
    expect(formatMinutes(-10)).toBe("0min");
  });
});
