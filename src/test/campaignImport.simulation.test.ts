/**
 * Simulacao exaustiva do motor de ingestao de resultados de campanhas.
 * Objetivo: provar que nenhuma planilha hostil produz credito indevido,
 * duplicidade silenciosa ou excecao nao tratada.
 */
import { describe, it, expect } from "vitest";
import {
  buildDedupeKey,
  buildDirectoryIndex,
  buildResultRows,
  detectColumns,
  normalizeHeader,
  normalizeSellerIdentifier,
  parseAmount,
  parseReferenceDate,
  resolveRows,
  summarizeBySeller,
  MAX_IMPORT_ROWS,
  type DirectoryEntry,
} from "@/lib/campaignImport";

describe("normalizeHeader", () => {
  it("remove acentos, caixa e espacos redundantes", () => {
    expect(normalizeHeader("  Matrícula  ")).toBe("matricula");
    expect(normalizeHeader("E-MAIL")).toBe("e-mail");
    expect(normalizeHeader("Data   da    Venda")).toBe("data da venda");
  });

  it("nunca lanca para entradas nao textuais", () => {
    [null, undefined, 42, {}, [], true, Symbol.iterator].forEach((v) => {
      expect(() => normalizeHeader(v as unknown)).not.toThrow();
    });
  });
});

describe("detectColumns", () => {
  const variants: Array<[string[], Partial<Record<string, string>>]> = [
    [["email", "valor", "data", "referencia"], { seller: "email", amount: "valor" }],
    [["Matrícula", "Quantidade", "Data da Venda", "Pedido"], { seller: "Matrícula", amount: "Quantidade" }],
    [["CPF", "Total", "competencia", "NF"], { seller: "CPF", amount: "Total" }],
    [["Vendedor", "Resultado"], { seller: "Vendedor", amount: "Resultado" }],
    [["login", "pontos"], { seller: "login", amount: "pontos" }],
  ];

  it.each(variants)("mapeia %j corretamente", (headers, expected) => {
    const cols = detectColumns(headers as string[]);
    Object.entries(expected).forEach(([field, value]) => {
      expect(cols[field as keyof typeof cols]).toBe(value);
    });
  });

  it("nunca atribui a mesma coluna a dois campos", () => {
    const cols = detectColumns(["identificador", "identificador valor"]);
    const used = Object.values(cols).filter(Boolean);
    expect(new Set(used).size).toBe(used.length);
  });

  it("retorna nulos quando nada casa", () => {
    expect(detectColumns(["alfa", "beta", "gama"])).toEqual({
      seller: null, amount: null, date: null, reference: null,
    });
  });
});

describe("parseAmount — matriz combinatoria", () => {
  const cases: Array<[unknown, number | null]> = [
    ["1.234,56", 1234.56],
    ["1,234.56", 1234.56],
    ["1234.56", 1234.56],
    ["1234,56", 1234.56],
    ["R$ 1.000,00", 1000],
    ["R$1.000", 1000],
    ["  980,50 ", 980.5],
    ["(500,00)", -500],
    ["-250,25", -250.25],
    ["+300", 300],
    ["1.000", 1000],
    ["1.0000", 1], // 4 casas: ponto e decimal, nao milhar
    ["12,345,678", 12345678],
    ["0,01", 0.01],
    [1500, 1500],
    [-1500.75, -1500.75],
    ["", null],
    ["   ", null],
    ["abc", null],
    [null, null],
    [undefined, null],
    [NaN, null],
    [Infinity, null],
    ["R$", null],
    ["--", null],
  ];

  it.each(cases)("parseAmount(%j) === %j", (input, expected) => {
    const got = parseAmount(input);
    if (expected === null) expect(got).toBeNull();
    else expect(got).toBeCloseTo(expected as number, 6);
  });

  it("e total: 1000 entradas aleatorias nunca lancam", () => {
    const alphabet = "0123456789.,-+()R$ abc\u00a0";
    for (let i = 0; i < 1000; i++) {
      let s = "";
      const len = i % 12;
      for (let j = 0; j <= len; j++) s += alphabet[(i * 7 + j * 13) % alphabet.length];
      expect(() => parseAmount(s)).not.toThrow();
      const v = parseAmount(s);
      expect(v === null || Number.isFinite(v)).toBe(true);
    }
  });
});

describe("parseReferenceDate — matriz combinatoria", () => {
  const cases: Array<[unknown, string | null]> = [
    ["01/07/2026", "2026-07-01"],
    ["1/7/2026", "2026-07-01"],
    ["31/12/1999", "1999-12-31"],
    ["01-07-2026", "2026-07-01"],
    ["2026-07-01", "2026-07-01"],
    ["2026-7-1", "2026-07-01"],
    ["01/07/26", "2026-07-01"],
    ["01/07/95", "1995-07-01"],
    [45839, "2025-07-01"],
    ["", null],
    [null, null],
    ["32/01/2026", null],
    ["01/13/2026", null],
    ["29/02/2025", null],
    ["29/02/2024", "2024-02-29"],
    ["ontem", null],
    [0, null],
    [999999, null],
  ];

  it.each(cases)("parseReferenceDate(%j) === %j", (input, expected) => {
    expect(parseReferenceDate(input)).toBe(expected);
  });

  it("aceita objeto Date valido e rejeita invalido", () => {
    expect(parseReferenceDate(new Date(Date.UTC(2026, 6, 1)))).toBe("2026-07-01");
    expect(parseReferenceDate(new Date("nao-e-data"))).toBeNull();
  });

  it("varredura de 366 dias mantem ida e volta consistente", () => {
    for (let i = 0; i < 366; i++) {
      const d = new Date(Date.UTC(2024, 0, 1 + i));
      const iso = d.toISOString().slice(0, 10);
      const [y, m, day] = iso.split("-");
      expect(parseReferenceDate(`${day}/${m}/${y}`)).toBe(iso);
      expect(parseReferenceDate(iso)).toBe(iso);
    }
  });
});

describe("normalizeSellerIdentifier", () => {
  it("normaliza e-mails, documentos e nomes", () => {
    expect(normalizeSellerIdentifier(" Joao@Empresa.COM ")).toBe("joao@empresa.com");
    expect(normalizeSellerIdentifier("123.456.789-00")).toBe("12345678900");
    expect(normalizeSellerIdentifier("00123456")).toBe("00123456");
    expect(normalizeSellerIdentifier("Maria Silva")).toBe("maria silva");
    expect(normalizeSellerIdentifier(null)).toBe("");
  });
});

describe("buildDedupeKey", () => {
  it("a referencia externa e soberana", () => {
    const a = buildDedupeKey({ sellerIdentifier: "A@x.com", amount: 10, referenceDate: "2026-01-01", externalReference: "PED-1" });
    const b = buildDedupeKey({ sellerIdentifier: "a@X.com", amount: 999, referenceDate: "2026-02-02", externalReference: "ped-1" });
    expect(a).toBe(b);
  });

  it("sem referencia, distingue por data e valor", () => {
    const base = { sellerIdentifier: "a@x.com", externalReference: null };
    const k1 = buildDedupeKey({ ...base, amount: 10, referenceDate: "2026-01-01" });
    const k2 = buildDedupeKey({ ...base, amount: 10, referenceDate: "2026-01-02" });
    const k3 = buildDedupeKey({ ...base, amount: 11, referenceDate: "2026-01-01" });
    expect(new Set([k1, k2, k3]).size).toBe(3);
  });

  it("colisao entre 500 combinacoes distintas nao ocorre", () => {
    const keys = new Set<string>();
    for (let i = 0; i < 500; i++) {
      keys.add(buildDedupeKey({
        sellerIdentifier: `v${i % 25}@x.com`,
        amount: (i % 20) + 1,
        referenceDate: `2026-0${(i % 9) + 1}-15`,
        externalReference: null,
      }));
    }
    expect(keys.size).toBe(500 - (500 - new Set(Array.from({ length: 500 }, (_, i) => `${i % 25}|${(i % 9) + 1}|${(i % 20) + 1}`)).size));
  });
});

const cols = { seller: "email", amount: "valor", date: "data", reference: "ref" } as const;

describe("buildResultRows", () => {
  it("classifica valido, invalido e duplicado no mesmo arquivo", () => {
    const res = buildResultRows(
      [
        { email: "a@x.com", valor: "1.000,00", data: "01/07/2026", ref: "P1" },
        { email: "a@x.com", valor: "1.000,00", data: "01/07/2026", ref: "P1" },
        { email: "", valor: "50", data: "", ref: "" },
        { email: "b@x.com", valor: "xyz", data: "", ref: "" },
        { email: "c@x.com", valor: "0", data: "", ref: "" },
        { email: "d@x.com", valor: "-100", data: "02/07/2026", ref: null },
      ],
      { ...cols },
    );
    expect(res.totalRows).toBe(6);
    expect(res.validRows).toBe(2);
    expect(res.errorRows).toBe(4);
    expect(res.rows[1].errorReason).toMatch(/duplicada/i);
    expect(res.rows[2].errorReason).toMatch(/ausente/i);
    expect(res.rows[3].errorReason).toMatch(/nao reconhecido/i);
    expect(res.rows[4].errorReason).toMatch(/zerado/i);
    expect(res.totalAmount).toBeCloseTo(900, 6);
  });

  it("rejeita valores fora da faixa e identificadores gigantes", () => {
    const res = buildResultRows(
      [
        { email: "a@x.com", valor: "999999999", data: "", ref: "" },
        { email: "x".repeat(300), valor: "10", data: "", ref: "" },
      ],
      { ...cols },
    );
    expect(res.validRows).toBe(0);
    expect(res.rows.every((r) => r.status === "invalid")).toBe(true);
  });

  it("respeita o teto de linhas", () => {
    const records = Array.from({ length: MAX_IMPORT_ROWS + 250 }, (_, i) => ({
      email: `v${i}@x.com`, valor: "10", data: "", ref: "",
    }));
    const res = buildResultRows(records, { ...cols });
    expect(res.totalRows).toBe(MAX_IMPORT_ROWS);
  });

  it("linhas invalidas nunca entram no total", () => {
    for (let i = 0; i < 200; i++) {
      const res = buildResultRows(
        [
          { email: `v${i}@x.com`, valor: `${i + 1}`, data: "", ref: "" },
          { email: "", valor: `${(i + 1) * 1000}`, data: "", ref: "" },
        ],
        { ...cols },
      );
      expect(res.totalAmount).toBeCloseTo(i + 1, 6);
    }
  });

  it("tolera registros com chaves ausentes e colunas nulas", () => {
    expect(() =>
      buildResultRows([{}, { email: null }, { valor: undefined }], { seller: null, amount: null, date: null, reference: null }),
    ).not.toThrow();
  });
});

describe("resolucao de colaborador", () => {
  const directory: DirectoryEntry[] = [
    { id: "u1", email: "ana@x.com", cpf: "123.456.789-00", employee_id: "00123456", display_name: "Ana Souza" },
    { id: "u2", email: "bruno@x.com", cpf: "987.654.321-00", employee_id: "00987654", display_name: "Bruno Lima" },
    { id: "u3", email: "carla@x.com", display_name: "Ana Souza" },
  ];
  const index = buildDirectoryIndex(directory);

  it("resolve por e-mail, cpf e matricula", () => {
    const rows = buildResultRows(
      [
        { email: "ANA@X.COM", valor: "100", data: "", ref: "" },
        { email: "987.654.321-00", valor: "200", data: "", ref: "" },
        { email: "00123456", valor: "300", data: "", ref: "" },
      ],
      { ...cols },
    ).rows;
    const resolved = resolveRows(rows, index);
    expect(resolved.map((r) => r.userId)).toEqual(["u1", "u2", "u1"]);
  });

  it("nome ambiguo nunca credita ninguem", () => {
    const rows = buildResultRows([{ email: "Ana Souza", valor: "100", data: "", ref: "" }], { ...cols }).rows;
    const [row] = resolveRows(rows, index);
    expect(row.userId).toBeNull();
    expect(row.status).toBe("invalid");
    expect(row.errorReason).toMatch(/ambiguo/i);
  });

  it("desconhecido vira linha invalida", () => {
    const rows = buildResultRows([{ email: "zzz@x.com", valor: "100", data: "", ref: "" }], { ...cols }).rows;
    const [row] = resolveRows(rows, index);
    expect(row.status).toBe("invalid");
    expect(row.errorReason).toMatch(/nao encontrado/i);
  });

  it("ignora chaves curtas ou vazias no diretorio", () => {
    const idx = buildDirectoryIndex([{ id: "u9", employee_id: "1", email: "" }]);
    expect(idx.byKey.has("1")).toBe(false);
  });

  it("agrega corretamente por colaborador", () => {
    const rows = buildResultRows(
      [
        { email: "ana@x.com", valor: "100", data: "01/07/2026", ref: "A1" },
        { email: "ana@x.com", valor: "50", data: "02/07/2026", ref: "A2" },
        { email: "bruno@x.com", valor: "70", data: "01/07/2026", ref: "B1" },
        { email: "zzz@x.com", valor: "999", data: "", ref: "Z1" },
      ],
      { ...cols },
    ).rows;
    const summary = summarizeBySeller(resolveRows(rows, index));
    expect(summary).toHaveLength(2);
    expect(summary[0]).toMatchObject({ userId: "u1", rows: 2, amount: 150 });
    expect(summary[1]).toMatchObject({ userId: "u2", rows: 1, amount: 70 });
  });

  it("varredura combinatoria: 300 cenarios preservam invariantes", () => {
    for (let i = 0; i < 300; i++) {
      const identifier = [
        "ana@x.com", "bruno@x.com", "00123456", "Ana Souza", "desconhecido@x.com", "",
      ][i % 6];
      const rows = buildResultRows(
        [{ email: identifier, valor: `${(i % 50) + 1}`, data: "", ref: `R${i}` }],
        { ...cols },
      ).rows;
      const [row] = resolveRows(rows, index);
      if (row.status === "valid") {
        expect(row.userId).toBeTruthy();
        expect(row.amount).toBeGreaterThan(0);
      } else {
        expect(row.userId).toBeNull();
        expect(row.errorReason).toBeTruthy();
      }
    }
  });
});
