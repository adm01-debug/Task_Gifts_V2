import { describe, expect, it } from "vitest";
import {
  buildWagerScheduleCsv,
  sanitizeExportedCell,
  wagerScheduleFileName,
} from "@/lib/wagerScheduleExport";
import { parseWagerImportCsv } from "@/lib/wagerBulkImport";
import type { AdminWagerQuestion } from "@/services/wagerAdminService";

function question(overrides: Partial<AdminWagerQuestion> = {}): AdminWagerQuestion {
  return {
    id: "q1",
    question: "Qual o prazo padrao de resposta?",
    options: [
      { id: "A", label: "2 horas" },
      { id: "B", label: "4 horas" },
      { id: "C", label: "8 horas" },
    ],
    correctOption: "C",
    explanation: "SLA institucional.",
    difficulty: "hard",
    multiplier: 2.5,
    maxStake: 250,
    scheduledDate: "2026-08-10",
    isActive: true,
    totalEntries: 12,
    correctEntries: 5,
    totalStaked: 900,
    coinsDelta: -150,
    ...overrides,
  };
}

describe("buildWagerScheduleCsv", () => {
  it("gera cabeçalho e uma linha por pergunta", () => {
    const csv = buildWagerScheduleCsv([question()]);
    const lines = csv.split("\r\n");
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('"data"');
    expect(lines[0]).toContain('"saldo_moedas"');
  });

  it("ordena por data agendada", () => {
    const csv = buildWagerScheduleCsv([
      question({ id: "b", scheduledDate: "2026-09-01" }),
      question({ id: "a", scheduledDate: "2026-08-01" }),
    ]);
    expect(csv.split("\r\n")[1]).toContain("2026-08-01");
  });

  it("exporta o gabarito como letra posicional", () => {
    const csv = buildWagerScheduleCsv([question()]);
    expect(csv.split("\r\n")[1]).toContain('"C"');
  });

  it("neutraliza fórmulas (CSV injection)", () => {
    const csv = buildWagerScheduleCsv([question({ question: "=SOMA(A1:A2)" })]);
    expect(csv).toContain("\"'=SOMA(A1:A2)\"");
  });

  it("escapa aspas duplas", () => {
    const csv = buildWagerScheduleCsv([question({ question: 'Prazo "oficial"?' })]);
    expect(csv).toContain('""oficial""');
  });

  it("lida com lista vazia", () => {
    expect(buildWagerScheduleCsv([]).split("\r\n")).toHaveLength(1);
  });

  it("converte dificuldade para pt-BR", () => {
    expect(buildWagerScheduleCsv([question({ difficulty: "easy" })])).toContain('"facil"');
  });

  it("exporta explicação nula como vazio", () => {
    const csv = buildWagerScheduleCsv([question({ explanation: null })]);
    expect(csv.split("\r\n")[1]).toContain('""');
  });

  it("marca inativa como nao", () => {
    expect(buildWagerScheduleCsv([question({ isActive: false })])).toContain('"nao"');
  });
});

describe("round-trip export → import", () => {
  it("reimporta sem erros e preserva os campos", () => {
    const csv = buildWagerScheduleCsv([question()]);
    const report = parseWagerImportCsv(csv);
    expect(report.fatal).toEqual([]);
    expect(report.invalid).toEqual([]);
    const draft = report.valid[0].draft;
    expect(draft.scheduledDate).toBe("2026-08-10");
    expect(draft.question).toBe("Qual o prazo padrao de resposta?");
    expect(draft.options.map((o) => o.label)).toEqual(["2 horas", "4 horas", "8 horas"]);
    expect(draft.correctOption).toBe("C");
    expect(draft.difficulty).toBe("hard");
    expect(draft.multiplier).toBe(2.5);
    expect(draft.maxStake).toBe(250);
    expect(draft.isActive).toBe(true);
  });

  it("round-trip preserva enunciado com fórmula neutralizada", () => {
    const csv = buildWagerScheduleCsv([question({ question: "=Prazo padrao de resposta?" })]);
    const report = parseWagerImportCsv(csv);
    expect(report.valid[0].draft.question).toBe("=Prazo padrao de resposta?");
  });

  it("round-trip preserva delimitador dentro do texto", () => {
    const csv = buildWagerScheduleCsv([question({ question: "Prazo; SLA; resposta?" })]);
    expect(parseWagerImportCsv(csv).valid[0].draft.question).toBe("Prazo; SLA; resposta?");
  });

  it("round-trip de várias perguntas mantém a contagem", () => {
    const csv = buildWagerScheduleCsv([
      question({ id: "a", scheduledDate: "2026-08-01" }),
      question({ id: "b", scheduledDate: "2026-08-02" }),
      question({ id: "c", scheduledDate: "2026-08-03" }),
    ]);
    const report = parseWagerImportCsv(csv);
    expect(report.valid).toHaveLength(3);
  });

  it("round-trip detecta conflito com a agenda atual", () => {
    const csv = buildWagerScheduleCsv([question()]);
    expect(parseWagerImportCsv(csv, ["2026-08-10"]).rows[0].conflict).toBe(true);
  });

  it("round-trip com 6 alternativas", () => {
    const options = ["A", "B", "C", "D", "E", "F"].map((id, i) => ({
      id,
      label: `Opcao ${i + 1}`,
    }));
    const csv = buildWagerScheduleCsv([question({ options, correctOption: "F" })]);
    const draft = parseWagerImportCsv(csv).valid[0].draft;
    expect(draft.options).toHaveLength(6);
    expect(draft.correctOption).toBe("F");
  });
});

describe("utilitários", () => {
  it("sanitizeExportedCell só remove apóstrofo defensivo", () => {
    expect(sanitizeExportedCell("'=A1")).toBe("=A1");
    expect(sanitizeExportedCell("'Bom dia")).toBe("'Bom dia");
    expect(sanitizeExportedCell("")).toBe("");
  });

  it("nome do arquivo usa a data informada", () => {
    expect(wagerScheduleFileName(new Date("2026-08-10T12:00:00Z"))).toBe(
      "perguntas-do-dia-2026-08-10.csv",
    );
  });

  it("nome do arquivo tolera data inválida", () => {
    expect(wagerScheduleFileName(new Date("invalido"))).toMatch(/^perguntas-do-dia-\d{4}-\d{2}-\d{2}\.csv$/);
  });
});