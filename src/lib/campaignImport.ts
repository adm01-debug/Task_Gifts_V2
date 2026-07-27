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
  /** Classificacao do problema, usada pelo relatorio de reconciliacao. */
  issue?: ReconciliationIssue;
}

/**
 * Natureza do problema de uma linha rejeitada.
 *  - `ambiguous`: o identificador (CPF/e-mail/matricula) casa com mais de um colaborador.
 *  - `not_found`: nenhum colaborador do diretorio corresponde.
 *  - `duplicate`: repeticao da mesma venda dentro do proprio arquivo.
 *  - `invalid_data`: valor/identificador ausente ou fora da faixa (nao reconciliavel).
 */
export type ReconciliationIssue = "ambiguous" | "not_found" | "duplicate" | "invalid_data";

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

    const invalid = (reason: string, issue: ReconciliationIssue = "invalid_data"): ParsedResultRow => ({
      rowNumber,
      sellerIdentifier: sellerIdentifier || String(sellerRaw ?? "").slice(0, 180),
      amount: amount ?? 0,
      referenceDate,
      externalReference,
      dedupeKey: `invalid:${rowNumber}`,
      status: "invalid",
      errorReason: reason,
      issue,
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
      rows.push({
        ...invalid("Duplicada dentro do proprio arquivo", "duplicate"),
        dedupeKey: `dup:${rowNumber}`,
      });
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
/* ------------------------------------------------------------------ */
/* Resolucao de colaborador (camada pura)                              */
/* ------------------------------------------------------------------ */

/** Registro minimo de diretorio usado para casar o identificador da planilha. */
export interface DirectoryEntry {
  id: string;
  email?: string | null;
  personal_email?: string | null;
  cpf?: string | null;
  employee_id?: string | null;
  display_name?: string | null;
}

/**
 * Indice de resolucao. Chaves ambiguas (mesmo valor para dois colaboradores)
 * sao removidas: e preferivel falhar a linha do que creditar a pessoa errada.
 */
export interface DirectoryIndex {
  byKey: Map<string, string>;
  ambiguous: Set<string>;
  /** Para cada chave ambigua, os ids dos colaboradores que a reivindicam. */
  ambiguousOwners: Map<string, string[]>;
}

export function buildDirectoryIndex(entries: DirectoryEntry[]): DirectoryIndex {
  const byKey = new Map<string, string>();
  const ambiguous = new Set<string>();
  const ambiguousOwners = new Map<string, string[]>();

  const claim = (key: string, userId: string) => {
    const owners = ambiguousOwners.get(key) ?? [];
    if (!owners.includes(userId)) owners.push(userId);
    ambiguousOwners.set(key, owners);
  };

  const add = (rawKey: unknown, userId: string) => {
    const key = normalizeSellerIdentifier(rawKey);
    if (!key || key.length < 3) return;
    const existing = byKey.get(key);
    if (existing && existing !== userId) {
      ambiguous.add(key);
      claim(key, existing);
      claim(key, userId);
      byKey.delete(key);
      return;
    }
    if (ambiguous.has(key)) {
      claim(key, userId);
      return;
    }
    byKey.set(key, userId);
  };

  entries.forEach((e) => {
    if (!e?.id) return;
    add(e.email, e.id);
    add(e.personal_email, e.id);
    add(e.cpf, e.id);
    add(e.employee_id, e.id);
    add(e.display_name, e.id);
  });

  return { byKey, ambiguous, ambiguousOwners };
}

export interface ResolvedResultRow extends ParsedResultRow {
  userId: string | null;
}

/**
 * Associa cada linha valida a um colaborador; invalida as nao resolvidas.
 *
 * `overrides` mapeia a chave normalizada do identificador para o id escolhido
 * manualmente pelo operador no relatorio de reconciliacao. A correcao manual e
 * soberana sobre a ambiguidade: se o operador decidiu, respeitamos.
 */
export function resolveRows(
  rows: ParsedResultRow[],
  index: DirectoryIndex,
  overrides?: ReconciliationOverrides,
): ResolvedResultRow[] {
  return rows.map((row) => {
    const reconcilable = row.status === "valid" || row.issue === "ambiguous" || row.issue === "not_found";
    if (!reconcilable) return { ...row, userId: null };
    const key = normalizeSellerIdentifier(row.sellerIdentifier);
    const override = overrides ? normalizeOverrideId(overrides[key]) : null;
    if (override) {
      return { ...row, userId: override, status: "valid", errorReason: null, issue: undefined };
    }
    if (index.ambiguous.has(key)) {
      return {
        ...row,
        userId: null,
        status: "invalid",
        errorReason: "Identificador ambiguo: corresponde a mais de um colaborador",
        issue: "ambiguous",
      };
    }
    const userId = index.byKey.get(key) ?? null;
    if (!userId) {
      return {
        ...row,
        userId: null,
        status: "invalid",
        errorReason: "Colaborador nao encontrado no diretorio",
        issue: "not_found",
      };
    }
    return { ...row, userId, status: "valid", errorReason: null, issue: undefined };
  });
}

/** Resumo agregado por colaborador, usado na pre-visualizacao. */
export function summarizeBySeller(rows: ResolvedResultRow[]): Array<{
  userId: string;
  sellerIdentifier: string;
  rows: number;
  amount: number;
}> {
  const map = new Map<string, { userId: string; sellerIdentifier: string; rows: number; amount: number }>();
  rows.forEach((r) => {
    if (r.status !== "valid" || !r.userId) return;
    const current = map.get(r.userId);
    if (current) {
      current.rows += 1;
      current.amount += r.amount;
    } else {
      map.set(r.userId, { userId: r.userId, sellerIdentifier: r.sellerIdentifier, rows: 1, amount: r.amount });
    }
  });
  return Array.from(map.values()).sort((a, b) => b.amount - a.amount);
}

/* ------------------------------------------------------------------ */
/* Reconciliacao (camada pura)                                         */
/* ------------------------------------------------------------------ */

/** Correcoes manuais: chave normalizada do identificador -> id do colaborador. */
export type ReconciliationOverrides = Record<string, string | null | undefined>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Aceita apenas ids plausiveis: evita gravar lixo vindo da UI. */
export function normalizeOverrideId(value: unknown): string | null {
  const s = String(value ?? "").trim();
  if (!s || !UUID_RE.test(s)) return null;
  return s.toLowerCase();
}

/** Sugestao de colaborador para uma linha nao resolvida. */
export interface DirectoryCandidate {
  id: string;
  label: string;
  /** 0..1 — quanto maior, mais provavel. */
  score: number;
  /** Campo do diretorio que gerou o casamento. */
  matchedOn: string;
}

/** Agrupamento de linhas problematicas por identificador. */
export interface ReconciliationEntry {
  /** Chave normalizada (vazia quando a planilha nao trouxe identificador). */
  key: string;
  displayIdentifier: string;
  issue: ReconciliationIssue;
  reason: string;
  rowNumbers: number[];
  rows: number;
  amount: number;
  candidates: DirectoryCandidate[];
  /** Reconciliavel = da para apontar um colaborador e reprocessar. */
  resolvable: boolean;
}

export interface ReconciliationReport {
  entries: ReconciliationEntry[];
  totalIssueRows: number;
  blockedAmount: number;
  byIssue: Record<ReconciliationIssue, number>;
  /** Identificadores distintos que podem ser corrigidos manualmente. */
  resolvableKeys: number;
}

const ISSUE_LABEL: Record<ReconciliationIssue, string> = {
  ambiguous: "Identificador ambíguo (mais de um colaborador)",
  not_found: "Colaborador não encontrado no diretório",
  duplicate: "Linha duplicada dentro do arquivo",
  invalid_data: "Dado inválido na planilha",
};

function directoryLabel(entry: DirectoryEntry): string {
  return (
    entry.display_name?.trim() ||
    entry.email?.trim() ||
    entry.employee_id?.trim() ||
    entry.id
  );
}

/** Distancia de similaridade barata (Dice sobre bigramas), sempre em 0..1. */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const grams = (s: string) => {
    const out = new Map<string, number>();
    for (let i = 0; i < s.length - 1; i += 1) {
      const g = s.slice(i, i + 2);
      out.set(g, (out.get(g) ?? 0) + 1);
    }
    return out;
  };
  const ga = grams(a);
  const gb = grams(b);
  let hits = 0;
  ga.forEach((count, g) => {
    const other = gb.get(g);
    if (other) hits += Math.min(count, other);
  });
  return (2 * hits) / (a.length - 1 + b.length - 1);
}

/**
 * Sugere colaboradores para um identificador que nao resolveu.
 * Nunca lanca; retorna no maximo `limit` candidatos ordenados por confianca.
 */
export function findDirectoryCandidates(
  rawIdentifier: string,
  directory: DirectoryEntry[],
  limit = 5,
): DirectoryCandidate[] {
  const key = normalizeSellerIdentifier(rawIdentifier);
  if (!key) return [];
  const localPart = key.includes("@") ? key.split("@")[0] : key;

  const scored: DirectoryCandidate[] = [];
  directory.forEach((entry) => {
    if (!entry?.id) return;
    let best = 0;
    let matchedOn = "";
    const fields: Array<[string, unknown]> = [
      ["e-mail", entry.email],
      ["e-mail pessoal", entry.personal_email],
      ["CPF", entry.cpf],
      ["matrícula", entry.employee_id],
      ["nome", entry.display_name],
    ];
    fields.forEach(([label, value]) => {
      const candidateKey = normalizeSellerIdentifier(value);
      if (!candidateKey) return;
      const candidateLocal = candidateKey.includes("@") ? candidateKey.split("@")[0] : candidateKey;
      let score = similarity(key, candidateKey);
      if (candidateLocal && localPart && candidateLocal === localPart) score = Math.max(score, 0.95);
      else if (candidateKey.startsWith(key) || key.startsWith(candidateKey)) score = Math.max(score, 0.8);
      if (score > best) {
        best = score;
        matchedOn = label;
      }
    });
    if (best >= 0.45) {
      scored.push({ id: entry.id, label: directoryLabel(entry), score: best, matchedOn });
    }
  });

  return scored
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, Math.max(0, limit));
}

/**
 * Constroi o relatorio de reconciliacao: agrupa as linhas rejeitadas por
 * identificador, classifica o motivo e sugere colaboradores para correcao.
 */
export function buildReconciliationReport(
  rows: ResolvedResultRow[],
  directory: DirectoryEntry[],
  index?: DirectoryIndex,
): ReconciliationReport {
  const idx = index ?? buildDirectoryIndex(directory);
  const byId = new Map(directory.filter((d) => d?.id).map((d) => [d.id, d] as const));
  const grouped = new Map<string, ReconciliationEntry>();
  const byIssue: Record<ReconciliationIssue, number> = {
    ambiguous: 0,
    not_found: 0,
    duplicate: 0,
    invalid_data: 0,
  };
  let blockedAmount = 0;
  let totalIssueRows = 0;

  rows.forEach((row) => {
    if (row.status === "valid") return;
    const issue: ReconciliationIssue = row.issue ?? "invalid_data";
    const key = normalizeSellerIdentifier(row.sellerIdentifier);
    const groupKey = `${issue}|${key || `linha-${row.rowNumber}`}`;
    byIssue[issue] += 1;
    totalIssueRows += 1;
    blockedAmount += Number.isFinite(row.amount) ? row.amount : 0;

    const existing = grouped.get(groupKey);
    if (existing) {
      existing.rowNumbers.push(row.rowNumber);
      existing.rows += 1;
      existing.amount += Number.isFinite(row.amount) ? row.amount : 0;
      return;
    }

    const resolvable = issue === "ambiguous" || issue === "not_found";
    const candidates = !resolvable
      ? []
      : issue === "ambiguous"
        ? (idx.ambiguousOwners.get(key) ?? [])
            .map((id) => {
              const entry = byId.get(id);
              return entry
                ? { id, label: directoryLabel(entry), score: 1, matchedOn: "conflito direto" }
                : null;
            })
            .filter((c): c is DirectoryCandidate => c !== null)
        : findDirectoryCandidates(row.sellerIdentifier, directory);

    grouped.set(groupKey, {
      key,
      displayIdentifier: row.sellerIdentifier || "(sem identificador)",
      issue,
      reason: row.errorReason ?? ISSUE_LABEL[issue],
      rowNumbers: [row.rowNumber],
      rows: 1,
      amount: Number.isFinite(row.amount) ? row.amount : 0,
      candidates,
      resolvable: resolvable && key.length > 0,
    });
  });

  const entries = Array.from(grouped.values()).sort(
    (a, b) => Number(b.resolvable) - Number(a.resolvable) || b.amount - a.amount,
  );

  return {
    entries,
    totalIssueRows,
    blockedAmount,
    byIssue,
    resolvableKeys: entries.filter((e) => e.resolvable).length,
  };
}

/** Rotulo legivel de um tipo de problema. */
export function reconciliationIssueLabel(issue: ReconciliationIssue): string {
  return ISSUE_LABEL[issue];
}

/**
 * Reprocessa as linhas aplicando as correcoes manuais.
 * Linhas duplicadas ou com dado invalido permanecem rejeitadas — corrigir isso
 * exige alterar a planilha, nao apenas apontar o colaborador certo.
 */
export function reprocessWithOverrides(
  rows: ResolvedResultRow[] | ParsedResultRow[],
  index: DirectoryIndex,
  overrides: ReconciliationOverrides,
): ResolvedResultRow[] {
  const sanitized: ReconciliationOverrides = {};
  Object.entries(overrides ?? {}).forEach(([key, value]) => {
    const id = normalizeOverrideId(value);
    const normalizedKey = normalizeSellerIdentifier(key);
    if (id && normalizedKey) sanitized[normalizedKey] = id;
  });
  return resolveRows(rows as ParsedResultRow[], index, sanitized);
}
