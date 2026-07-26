import { describe, expect, it } from "vitest";
import { buildNr1ExportRows, nr1ExportFilename } from "@/lib/nr1Export";
import { riskGrade, riskLevel, type Nr1RiskRow } from "@/services/nr1RiskService";

function makeRow(score: number | null, weight: number, i: number): Nr1RiskRow {
  const grade = riskGrade(score, weight);
  return {
    category_id: `c-${i}`,
    category_key: `cat_${i}`,
    category_name: `Categoria ${i}`,
    description: null,
    legal_reference: i % 3 === 0 ? null : "NR-1 item 1.5.3.2",
    severity_weight: weight,
    score,
    probability: score === null ? null : 10 - score,
    risk_grade: grade,
    risk_level: riskLevel(grade),
    respondents: i,
    factors_evaluated: (i % 5) + 1,
  };
}

describe("Exportação NR-1 (simulação combinatória)", () => {
  it("nunca emite célula vazia ou 'undefined' em centenas de combinações", () => {
    const rows: Nr1RiskRow[] = [];
    let i = 0;
    for (let s = 0; s <= 100; s += 5) {
      for (const w of [1, 1.5, 2, 2.5, 3]) rows.push(makeRow(s / 10, w, i++));
    }
    rows.push(makeRow(null, 3, i++));
    const exported = buildNr1ExportRows(rows);
    expect(exported).toHaveLength(rows.length);
    for (const row of exported) {
      for (const value of Object.values(row)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
        expect(value).not.toContain("undefined");
        expect(value).not.toContain("NaN");
      }
    }
  });

  it("marca plano obrigatório exatamente para riscos alto e crítico", () => {
    for (let s = 0; s <= 100; s++) {
      const row = makeRow(s / 10, 3, s);
      const [out] = buildNr1ExportRows([row]);
      const expected = row.risk_level === "critical" || row.risk_level === "high";
      expect(out.plano_obrigatorio).toBe(expected ? "Sim" : "Não");
      if (expected) expect(Number(out.prazo_dias)).toBeLessThanOrEqual(60);
    }
  });

  it("gera nome de arquivo seguro para recortes com acentos e símbolos", () => {
    const at = new Date("2026-07-26T10:30:00Z");
    const cases = ["Toda a empresa", "Operações / Logística", "  ", "P&D — Inovação"];
    for (const scope of cases) {
      const name = nr1ExportFilename({ scope, days: 180, generatedAt: at }, "csv");
      expect(name).toMatch(/^inventario-nr1_[a-z0-9-]+_180d_\d{4}-\d{2}-\d{2}_\d{4}\.csv$/);
      expect(name).not.toMatch(/[^a-z0-9._-]/);
    }
  });
});
