import { describe, expect, it } from "vitest";
import {
  parseWagerImportCsv,
  splitCsvLines,
  WAGER_IMPORT_MAX_ROWS,
  WAGER_IMPORT_TEMPLATE,
} from "@/lib/wagerBulkImport";

const HEADER =
  "data;pergunta;alternativa_a;alternativa_b;alternativa_c;correta;dificuldade;multiplicador;teto;explicacao;ativo";

function row(overrides: Partial<Record<string, string>> = {}): string {
  const base: Record<string, string> = {
    data: "2026-08-01",
    pergunta: "Qual o prazo padrao de resposta?",
    a: "2 horas",
    b: "4 horas",
    c: "8 horas",
    correta: "A",
    dificuldade: "media",
    multiplicador: "2",
    teto: "100",
    explicacao: "SLA institucional.",
    ativo: "sim",
  };
  const v = { ...base, ...overrides };
  return [v.data, v.pergunta, v.a, v.b, v.c, v.correta, v.dificuldade, v.multiplicador, v.teto, v.explicacao, v.ativo].join(";");
}

describe("parseWagerImportCsv", () => {
  it("importa uma linha válida", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row()}`);
    expect(report.fatal).toEqual([]);
    expect(report.valid).toHaveLength(1);
    expect(report.valid[0].draft.correctOption).toBe("A");
    expect(report.valid[0].draft.options).toHaveLength(3);
  });

  it("rejeita arquivo vazio", () => {
    expect(parseWagerImportCsv("").fatal[0]).toBe("Arquivo vazio.");
  });

  it("exige colunas obrigatórias", () => {
    const report = parseWagerImportCsv("pergunta;alternativa_a\nx;y");
    expect(report.fatal.some((f) => f.includes("data"))).toBe(true);
  });

  it("aceita cabeçalho vazio de corpo", () => {
    expect(parseWagerImportCsv(`${HEADER}\n`).fatal[0]).toBe("Nenhuma pergunta encontrada.");
  });

  it("detecta delimitador vírgula", () => {
    const csv = `${HEADER.replace(/;/g, ",")}\n${row().replace(/;/g, ",")}`;
    const report = parseWagerImportCsv(csv);
    expect(report.delimiter).toBe(",");
    expect(report.valid).toHaveLength(1);
  });

  it("respeita aspas com delimitador interno", () => {
    const csv = `${HEADER}\n${row({ pergunta: '"Prazo; SLA e resposta?"' })}`;
    const report = parseWagerImportCsv(csv);
    expect(report.valid[0].draft.question).toBe("Prazo; SLA e resposta?");
  });

  it("remove BOM e suporta CRLF", () => {
    const report = parseWagerImportCsv(`\uFEFF${HEADER}\r\n${row()}\r\n`);
    expect(report.valid).toHaveLength(1);
  });

  it("converte data pt-BR", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ data: "05/09/2026" })}`);
    expect(report.valid[0].draft.scheduledDate).toBe("2026-09-05");
  });

  it("rejeita data inexistente", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ data: "2026-02-31" })}`);
    expect(report.invalid).toHaveLength(1);
  });

  it("acusa data duplicada no arquivo", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row()}\n${row()}`);
    expect(report.invalid).toHaveLength(1);
    expect(report.invalid[0].errors.join()).toContain("Data repetida");
  });

  it("marca conflito com datas já agendadas", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row()}`, ["2026-08-01"]);
    expect(report.rows[0].conflict).toBe(true);
    expect(report.rows[0].errors).toEqual([]);
  });

  it("aceita gabarito pelo texto da alternativa", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ correta: "8 HORAS" })}`);
    expect(report.valid[0].draft.correctOption).toBe("C");
  });

  it("rejeita gabarito inexistente", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ correta: "Z" })}`);
    expect(report.invalid[0].errors.join()).toContain("Gabarito");
  });

  it("aceita multiplicador com vírgula decimal", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ multiplicador: "2,5" })}`);
    expect(report.valid[0].draft.multiplier).toBe(2.5);
  });

  it("sinaliza multiplicador não numérico", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ multiplicador: "abc" })}`);
    expect(report.invalid[0].errors.join()).toContain("Multiplicador");
  });

  it("aplica clamp no teto de aposta", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ teto: "999999" })}`);
    expect(report.valid[0].draft.maxStake).toBe(1000);
  });

  it("interpreta 'nao' como inativo", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ ativo: "não" })}`);
    expect(report.valid[0].draft.isActive).toBe(false);
  });

  it("mapeia dificuldade desconhecida para média", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ dificuldade: "xyz" })}`);
    expect(report.valid[0].draft.difficulty).toBe("medium");
  });

  it("rejeita alternativas duplicadas", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ b: "2 Horas" })}`);
    expect(report.invalid[0].errors.join().toLowerCase()).toContain("repetida");
  });

  it("rejeita menos de duas alternativas", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row({ b: "", c: "" })}`);
    expect(report.invalid).toHaveLength(1);
  });

  it("bloqueia acima do limite de linhas", () => {
    const body = Array.from({ length: WAGER_IMPORT_MAX_ROWS + 1 }, (_, i) =>
      row({ data: `2026-0${(i % 9) + 1}-01`, pergunta: `Pergunta ${i}` }),
    ).join("\n");
    expect(parseWagerImportCsv(`${HEADER}\n${body}`).fatal.join()).toContain("Limite");
  });

  it("ignora linhas em branco intermediárias", () => {
    const report = parseWagerImportCsv(`${HEADER}\n${row()}\n\n${row({ data: "2026-08-02" })}`);
    expect(report.rows).toHaveLength(2);
  });

  it("o modelo oficial é importável", () => {
    const report = parseWagerImportCsv(WAGER_IMPORT_TEMPLATE);
    expect(report.fatal).toEqual([]);
    expect(report.valid).toHaveLength(1);
  });

  it("splitCsvLines respeita quebra dentro de aspas", () => {
    expect(splitCsvLines('a;"linha\nquebrada";c')).toHaveLength(1);
  });
});