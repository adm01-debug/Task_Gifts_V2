/**
 * Motor de ingestao de resultados de campanhas comerciais.
 *
 * Camada pura (sem I/O de rede):
 *  - Normaliza cabecalhos heterogeneos de planilhas (CSV/XLSX) para um schema canonico.
 *  - Converte numeros em formato pt-BR ("1.234,56") e en-US ("1,234.56") sem ambiguidade.
 *  - Converte datas em dd/mm/aaaa, aaaa-mm-dd e serial do Excel.
 *  - Gera uma `dedupe_key` deterministica que impede dupla contabilizacao do mesmo resultado.
 *
 * Toda funcao e defensiva: entrada desconhecida nunca lanca, sempre vira linha invalida
 * com motivo legivel para o operador corrigir a planilha.
 */
import { z } from "zod";

/** Linha canonica extraida do arquivo, antes da resolucao de colaborador. */
export interface ParsedResultRow {
  rowNumber: number;
  sellerIdentifier: string;
  amount: number;
  referenceDate: string | null; // ISO yyyy-mm-dd
  externalReference: string | null;
  dedupeKey: string;
  status: "valid" | "invalid";
  errorReason: string | null;
}

export type DetectedColumns = Record<"seller" | "amount" | "date" | "reference", string | null>;

export interface ParseResult {
  rows: ParsedResultRow[];
  totalRows: number;
  validRows: number;
  errorRows: number;
  totalAmount: number;
  detectedColumns: DetectedColumns;
}

/** Limite defensivo para evitar travar o browser com planilhas absurdas. */
export const MAX_IMPORT_ROWS = 5000;

const HEADER_ALIASES: Record<"seller" | "amount" | "date" | "reference", string[]> = {
  seller: [
    "vendedor", "colaborador", "email", "e-mail", "usuario", "usuário",
    "matricula", "matrícula", "identificador", "seller", "cpf", "login",
  ],
  amount: [
    "valor", "quantidade", "qtd", "amount", "total", "vendas", "resultado", "pontos",
  ],
  date: [
    "data", "data_venda", "data da venda", "date", "competencia", "competência",
  ],
  reference: [
    "referencia", "referência", "pedido", "nota", "nf", "documento", "reference", "id_externo", "id externo",
  ],
};

/** Remove acentos, espacos extras e caixa para comparacao de cabecalhos. */
export function normalizeHeader(raw: unknown): string {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Mapeia os cabecalhos do arquivo para os campos canonicos. */
export function detectColumns(headers: string[]): DetectedColumns {
  const result: DetectedColumns = { seller: null, amount: null, date: null, reference: null };
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  const taken = new Set<string>();

  (Object.keys(HEADER_ALIASES) as Array<keyof typeof HEADER_ALIASES>).forEach((field) => {
    const aliases = HEADER_ALIASES[field].map(normalizeHeader);
    const exact = normalized.find((h) => !taken.has(h.raw) && aliases.includes(h.norm));
    if (exact) {
      result[field] = exact.raw;
      taken.add(exact.raw);
      return;
    }
    const partial = normalized.find((h) => !taken.has(h.raw) && h.norm && aliases.some((a) => h.norm.includes(a)));
    if (partial) {
      result[field] = partial.raw;
      taken.add(partial.raw);
    }
  });

  return result;
}

/**
 * Converte texto numerico em numero, tratando pt-BR e en-US.
 * Retorna `null` quando o valor e indecifravel (jamais lanca).
 */
export function parseAmount(raw: unknown): number | null {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  if (raw == null) return null;

  let s = String(raw).trim();
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }

  s = s.replace(/[R$\s\u00a0]/gi, "").replace(/[^\d.,+-]/g, "");
  if (!s) return null;
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }
  if (!s) return null;

  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    // O separador decimal e o que aparece por ultimo.
    if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    // "1,234" com 3 casas e milhar; "1,23" e decimal.
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (lastDot >= 0) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  }

  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

/** Converte data em ISO (yyyy-mm-dd). Aceita dd/mm/aaaa, ISO e serial do Excel. */
export function parseReferenceDate(raw: unknown): string | null {
  if (raw == null || raw === "") return null;

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    // Serial do Excel (base 1899-12-30). Faixa defensiva.
    if (raw < 1 || raw > 120000) return null;
    const d = new Date(Date.UTC(1899, 11, 30) + Math.round(raw) * 86400000);
    return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  }

  const s = String(raw).trim();
  if (!s) return null;

  const toIso = (year: number, month: number, day: number): string | null => {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) return null;
    return d.toISOString().slice(0, 10);
  };

  const br = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (br) {
    let year = Number(br[3]);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    return toIso(year, Number(br[2]), Number(br[1]));
  }

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  return null;
}

/** Normaliza o identificador do vendedor (e-mail, matricula ou CPF). */
export function normalizeSellerIdentifier(raw: unknown): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (s.includes("@")) return s.toLowerCase();
  if (/^[\d.\-/\s]+$/.test(s)) return s.replace(/\D/g, "");
  return s.toLowerCase();
}

/**
 * Chave deterministica de deduplicacao.
 * Com referencia externa ela e soberana (o mesmo pedido nunca conta duas vezes).
 * Sem referencia, combinamos vendedor + data + valor.
 */
export function buildDedupeKey(input: {
  sellerIdentifier: string;
  amount: number;
  referenceDate: string | null;
  externalReference: string | null;
}): string {
  const seller = normalizeSellerIdentifier(input.sellerIdentifier);
  const ref = (input.externalReference ?? "").trim().toLowerCase();
  if (ref) return `ref:${seller}|${ref}`;
  return `agg:${seller}|${input.referenceDate ?? "sem-data"}|${input.amount.toFixed(2)}`;
}

const rowSchema = z.object({
  sellerIdentifier: z.string().trim().min(1, "Identificador do vendedor vazio").max(180, "Identificador muito longo"),
  amount: z
    .number()
    .refine((n) => Number.isFinite(n), "Valor invalido")
    .refine((n) => n !== 0, "Valor zerado")
    .refine((n) => Math.abs(n) <= 99_999_999, "Valor fora da faixa permitida"),
  referenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  externalReference: z.string().trim().max(180).nullable(),
});

/**
 * Converte registros brutos (array de objetos com chaves = cabecalhos) em linhas canonicas.
 * Deduplica dentro do proprio arquivo, marcando repeticoes como invalidas.
 */
export function buildResultRows(
  records: Array<Record<string, unknown>>,
  columns: DetectedColumns,
): ParseResult {
  const rows: ParsedResultRow[] = [];
  const seen = new Set<string>();
  let totalAmount = 0;

  const limited = records.slice(0, MAX_IMPORT_ROWS);

  limited.forEach((record, index) => {
    const rowNumber = index + 1;
    const sellerRaw = columns.seller ? record[columns.seller] : undefined;
    const amountRaw = columns.amount ? record[columns.amount] : undefined;
    const dateRaw = columns.date ? record[columns.date] : undefined;
    const refRaw = columns.reference ? record[columns.reference] : undefined;

    const sellerIdentifier = normalizeSellerIdentifier(sellerRaw);
    const amount = parseAmount(amountRaw);
    const referenceDate = parseReferenceDate(dateRaw);
    const externalReference =
      refRaw == null || String(refRaw).trim() === "" ? null : String(refRaw).trim().slice(0, 180);

    const invalid = (reason: string): ParsedResultRow => ({
      rowNumber,
      sellerIdentifier: sellerIdentifier || String(sellerRaw ?? "").slice(0, 180),
      amount: amount ?? 0,
      referenceDate,
      externalReference,
      dedupeKey: `invalid:${rowNumber}`,
      status: "invalid",
      errorReason: reason,
    });

    if (!sellerIdentifier) {
      rows.push(invalid("Identificador do vendedor ausente"));
      return;
    }
    if (amount === null) {
      rows.push(invalid("Valor nao reconhecido"));
      return;
    }

    const parsed = rowSchema.safeParse({ sellerIdentifier, amount, referenceDate, externalReference });
    if (!parsed.success) {
      rows.push(invalid(parsed.error.issues[0]?.message ?? "Linha invalida"));
      return;
    }

    const dedupeKey = buildDedupeKey({ sellerIdentifier, amount, referenceDate, externalReference });
    if (seen.has(dedupeKey)) {
      rows.push({ ...invalid("Duplicada dentro do proprio arquivo"), dedupeKey: `dup:${rowNumber}` });
      return;
    }
    seen.add(dedupeKey);

    totalAmount += amount;
    rows.push({
      rowNumber,
      sellerIdentifier,
      amount,
      referenceDate,
      externalReference,
      dedupeKey,
      status: "valid",
      errorReason: null,
    });
  });

  const validRows = rows.filter((r) => r.status === "valid").length;
  return {
    rows,
    totalRows: rows.length,
    validRows,
    errorRows: rows.length - validRows,
    totalAmount,
    detectedColumns: columns,
  };
}

/**
 * Le um arquivo CSV ou XLSX no browser e devolve as linhas canonicas.
 * Bibliotecas pesadas sao carregadas sob demanda para nao inflar o bundle inicial.
 */
export async function parseCampaignResultFile(file: File): Promise<ParseResult> {
  const isExcel = /\.(xlsx|xls)$/i.test(file.name);
  let records: Array<Record<string, unknown>> = [];
  let headers: string[] = [];

  if (isExcel) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("A planilha nao possui abas legiveis.");
    records = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
      defval: null,
      raw: true,
    });
    headers = records.length > 0 ? Object.keys(records[0]) : [];
  } else {
    const Papa = (await import("papaparse")).default;
    const text = await file.text();
    const result = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (h) => h.trim(),
    });
    records = (result.data ?? []).filter((r) => r && typeof r === "object");
    headers = result.meta?.fields ?? (records.length > 0 ? Object.keys(records[0]) : []);
  }

  if (headers.length === 0) throw new Error("Nao foi possivel identificar o cabecalho do arquivo.");

  const columns = detectColumns(headers);
  if (!columns.seller) throw new Error("Coluna de vendedor nao encontrada (ex.: email, matricula, vendedor).");
  if (!columns.amount) throw new Error("Coluna de valor nao encontrada (ex.: valor, quantidade, total).");

  return buildResultRows(records, columns);
}

/** Modelo CSV para download, com os cabecalhos que o parser reconhece. */
export const IMPORT_TEMPLATE_CSV = [
  "email;valor;data;referencia",
  "vendedor@empresa.com;1.250,00;01/07/2026;PED-1001",
  "00123456;980,50;02/07/2026;PED-1002",
].join("\n");