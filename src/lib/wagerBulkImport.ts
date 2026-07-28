/**
 * Importação em lote (CSV) das Perguntas do Dia com aposta.
 *
 * Motor puro: faz o parse RFC 4180 (com detecção de delimitador `,` `;` ou TAB),
 * normaliza cada linha para `WagerQuestionDraft` e reaproveita EXATAMENTE as
 * mesmas regras de `validateWagerDraft`. Nada é enviado ao banco antes do
 * usuário revisar o relatório de pré-voo.
 */

import {
  clampMaxStake,
  clampMultiplier,
  comparisonKey,
  isValidISODate,
  normalizeText,
  optionKeyAt,
  validateWagerDraft,
  type WagerQuestionDraft,
} from "./wagerAuthoring";
import { sanitizeExportedCell } from "./wagerScheduleExport";

export const WAGER_IMPORT_MAX_ROWS = 200;

export interface WagerImportRow {
  /** Linha do arquivo (1 = cabeçalho), útil para o usuário localizar o erro. */
  line: number;
  draft: WagerQuestionDraft;
  errors: string[];
  /** Já existe pergunta agendada para a mesma data no banco. */
  conflict: boolean;
}

export interface WagerImportReport {
  rows: WagerImportRow[];
  valid: WagerImportRow[];
  invalid: WagerImportRow[];
  /** Erros estruturais (arquivo vazio, cabeçalho ausente, limite excedido). */
  fatal: string[];
  delimiter: string;
}

const HEADER_ALIASES: Record<string, string> = {
  data: "date",
  date: "date",
  scheduled_date: "date",
  pergunta: "question",
  question: "question",
  enunciado: "question",
  correta: "correct",
  gabarito: "correct",
  correct: "correct",
  dificuldade: "difficulty",
  difficulty: "difficulty",
  multiplicador: "multiplier",
  multiplier: "multiplier",
  teto: "max_stake",
  aposta_maxima: "max_stake",
  max_stake: "max_stake",
  explicacao: "explanation",
  explanation: "explanation",
  ativo: "active",
  active: "active",
};

const DIFFICULTY_ALIASES: Record<string, "easy" | "medium" | "hard"> = {
  facil: "easy",
  easy: "easy",
  media: "medium",
  medio: "medium",
  medium: "medium",
  dificil: "hard",
  hard: "hard",
};

/** Cabeçalho de referência oferecido como modelo para download. */
export const WAGER_IMPORT_TEMPLATE = [
  "data;pergunta;alternativa_a;alternativa_b;alternativa_c;alternativa_d;correta;dificuldade;multiplicador;teto;explicacao;ativo",
  "2026-08-01;Qual prazo padrão de resposta ao cliente?;2 horas;4 horas;8 horas;24 horas;A;media;2;100;SLA institucional é de 2 horas.;sim",
].join("\n");

function detectDelimiter(headerLine: string): string {
  const candidates = [";", ",", "\t"];
  let best = ";";
  let bestCount = -1;
  for (const candidate of candidates) {
    const count = splitLine(headerLine, candidate).length;
    if (count > bestCount) {
      bestCount = count;
      best = candidate;
    }
  }
  return best;
}

/** Split RFC 4180 de UMA linha lógica (aspas duplas escapadas com ""). */
function splitLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
      continue;
    }
    if (char === delimiter) {
      out.push(field);
      field = "";
      continue;
    }
    field += char;
  }
  out.push(field);
  return out;
}

/**
 * Quebra o arquivo em linhas lógicas respeitando quebras dentro de aspas.
 * Suporta CRLF, LF e BOM.
 */
export function splitCsvLines(content: string): string[] {
  const text = String(content ?? "").replace(/^\uFEFF/, "");
  const lines: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      quoted = !quoted;
      current += char;
      continue;
    }
    if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      lines.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  lines.push(current);
  return lines;
}

function headerKey(raw: string): string {
  return comparisonKey(raw).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function parseBool(value: string, fallback = true): boolean {
  const key = comparisonKey(value);
  if (!key) return fallback;
  if (["sim", "s", "true", "1", "ativo", "yes", "y"].includes(key)) return true;
  if (["nao", "n", "false", "0", "inativo", "no"].includes(key)) return false;
  return fallback;
}

function parseNumber(value: string): number {
  // Aceita "2,5" (pt-BR) e "2.5".
  const cleaned = normalizeText(value).replace(/\s/g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : Number.NaN;
}

function normalizeDate(value: string): string {
  const raw = normalizeText(value);
  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  return raw.slice(0, 10);
}

/**
 * Converte o conteúdo CSV em um relatório de pré-voo.
 *
 * @param existingDates datas já agendadas no banco (marca conflito, não bloqueia).
 */
export function parseWagerImportCsv(
  content: string,
  existingDates: string[] = [],
): WagerImportReport {
  const fatal: string[] = [];
  const rawLines = splitCsvLines(content).filter((line, index) => index === 0 || line.trim() !== "");

  if (rawLines.length === 0 || rawLines[0].trim() === "") {
    return { rows: [], valid: [], invalid: [], fatal: ["Arquivo vazio."], delimiter: ";" };
  }

  const delimiter = detectDelimiter(rawLines[0]);
  const header = splitLine(rawLines[0], delimiter).map(headerKey);

  const indexOf = (key: string) => header.findIndex((h) => HEADER_ALIASES[h] === key);
  const dateIdx = indexOf("date");
  const questionIdx = indexOf("question");
  const correctIdx = indexOf("correct");
  const optionIdxs = header
    .map((h, i) => ({ h, i }))
    .filter(({ h }) => /^(alternativa|opcao|option)_?[a-f]$/.test(h))
    .sort((a, b) => a.h.localeCompare(b.h))
    .map(({ i }) => i);

  if (dateIdx < 0) fatal.push("Coluna obrigatória ausente: data.");
  if (questionIdx < 0) fatal.push("Coluna obrigatória ausente: pergunta.");
  if (correctIdx < 0) fatal.push("Coluna obrigatória ausente: correta.");
  if (optionIdxs.length < 2) fatal.push("Informe ao menos as colunas alternativa_a e alternativa_b.");
  if (fatal.length > 0) return { rows: [], valid: [], invalid: [], fatal, delimiter };

  const bodyLines = rawLines.slice(1);
  if (bodyLines.length === 0) {
    return { rows: [], valid: [], invalid: [], fatal: ["Nenhuma pergunta encontrada."], delimiter };
  }
  if (bodyLines.length > WAGER_IMPORT_MAX_ROWS) {
    fatal.push(`Limite de ${WAGER_IMPORT_MAX_ROWS} perguntas por importação excedido.`);
    return { rows: [], valid: [], invalid: [], fatal, delimiter };
  }

  const difficultyIdx = indexOf("difficulty");
  const multiplierIdx = indexOf("multiplier");
  const stakeIdx = indexOf("max_stake");
  const explanationIdx = indexOf("explanation");
  const activeIdx = indexOf("active");

  const existing = new Set(existingDates.map((d) => String(d ?? "").slice(0, 10)));
  const seenDates = new Map<string, number>();
  const rows: WagerImportRow[] = [];

  bodyLines.forEach((line, index) => {
    const cells = splitLine(line, delimiter);
    // `sanitizeExportedCell` desfaz o apóstrofo anti-CSV-injection do export.
    const at = (i: number) => (i >= 0 ? normalizeText(sanitizeExportedCell(cells[i] ?? "")) : "");
    const errors: string[] = [];

    const scheduledDate = normalizeDate(at(dateIdx));
    const options = optionIdxs
      .map((i) => normalizeText(sanitizeExportedCell(cells[i] ?? "")))
      .filter((label) => label.length > 0)
      .map((label, i) => ({ id: optionKeyAt(i), label }));

    // O gabarito pode vir como letra (A) ou como o texto da alternativa.
    const rawCorrect = at(correctIdx);
    const correctKey = comparisonKey(rawCorrect);
    const byLetter = options.find((o) => comparisonKey(o.id) === correctKey);
    const byLabel = options.find((o) => comparisonKey(o.label) === correctKey);
    const correctOption = byLetter?.id ?? byLabel?.id ?? "";
    if (rawCorrect && !correctOption) {
      errors.push(`Gabarito "${rawCorrect}" não corresponde a nenhuma alternativa.`);
    }

    const rawMultiplier = multiplierIdx >= 0 ? parseNumber(at(multiplierIdx)) : 2;
    const rawStake = stakeIdx >= 0 ? parseNumber(at(stakeIdx)) : 100;
    if (multiplierIdx >= 0 && at(multiplierIdx) && Number.isNaN(rawMultiplier)) {
      errors.push("Multiplicador não numérico.");
    }
    if (stakeIdx >= 0 && at(stakeIdx) && Number.isNaN(rawStake)) {
      errors.push("Teto de aposta não numérico.");
    }

    const difficulty =
      DIFFICULTY_ALIASES[comparisonKey(at(difficultyIdx))] ?? "medium";

    const draft: WagerQuestionDraft = {
      id: null,
      question: at(questionIdx),
      options,
      correctOption,
      explanation: at(explanationIdx) || null,
      difficulty,
      multiplier: clampMultiplier(Number.isNaN(rawMultiplier) ? 2 : rawMultiplier),
      maxStake: clampMaxStake(Number.isNaN(rawStake) ? 100 : rawStake),
      scheduledDate,
      isActive: activeIdx >= 0 ? parseBool(at(activeIdx)) : true,
    };

    const validation = validateWagerDraft(draft);
    validation.issues.forEach((issue) => errors.push(issue.message));

    // Duplicidade DENTRO do próprio arquivo é erro: o banco só aceita 1/dia.
    if (isValidISODate(scheduledDate)) {
      const firstLine = seenDates.get(scheduledDate);
      if (firstLine) {
        errors.push(`Data repetida no arquivo (linha ${firstLine}).`);
      } else {
        seenDates.set(scheduledDate, index + 2);
      }
    }

    rows.push({
      line: index + 2,
      draft,
      errors: Array.from(new Set(errors)),
      conflict: isValidISODate(scheduledDate) && existing.has(scheduledDate),
    });
  });

  return {
    rows,
    valid: rows.filter((r) => r.errors.length === 0),
    invalid: rows.filter((r) => r.errors.length > 0),
    fatal,
    delimiter,
  };
}