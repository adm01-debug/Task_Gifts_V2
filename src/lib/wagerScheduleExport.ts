/**
 * Exportação CSV da agenda de Perguntas do Dia (round-trip).
 *
 * Premissa central: o arquivo gerado aqui DEVE ser reimportável por
 * `parseWagerImportCsv` sem edição manual. Por isso o cabeçalho é exatamente
 * o do modelo oficial (delimitador `;`), e as colunas de telemetria
 * (apostas, acertos, saldo) vêm depois — o parser ignora colunas extras.
 *
 * Segurança: células que começam com `=`, `+`, `-`, `@`, TAB ou CR são
 * prefixadas com apóstrofo para neutralizar CSV injection no Excel/Sheets.
 * O apóstrofo é removido na reimportação por `sanitizeExportedCell`.
 */

import type { AdminWagerQuestion } from "@/services/wagerAdminService";
import { WAGER_MAX_OPTIONS, optionKeyAt } from "./wagerAuthoring";

const RISKY_PREFIX = /^[=+\-@\t\r]/;
const DELIMITER = ";";

export const WAGER_EXPORT_HEADER = [
  "data",
  ...Array.from({ length: WAGER_MAX_OPTIONS }, (_, i) => `alternativa_${optionKeyAt(i).toLowerCase()}`),
  "correta",
  "dificuldade",
  "multiplicador",
  "teto",
  "explicacao",
  "ativo",
  "apostas",
  "acertos",
  "moedas_apostadas",
  "saldo_moedas",
] as const;

function escapeCell(value: string): string {
  const safe = RISKY_PREFIX.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return escapeCell("");
  if (typeof value === "boolean") return escapeCell(value ? "sim" : "nao");
  if (typeof value === "number") {
    return escapeCell(Number.isFinite(value) ? String(value) : "");
  }
  return escapeCell(String(value));
}

function line(values: readonly unknown[]): string {
  return values.map(cell).join(DELIMITER);
}

const DIFFICULTY_CSV: Record<string, string> = {
  easy: "facil",
  medium: "media",
  hard: "dificil",
};

/** Remove o apóstrofo defensivo aplicado na exportação. */
export function sanitizeExportedCell(value: string): string {
  const raw = String(value ?? "");
  return raw.startsWith("'") && RISKY_PREFIX.test(raw.slice(1)) ? raw.slice(1) : raw;
}

/**
 * Gera o CSV da agenda. A coluna `pergunta` fica logo após `data` para
 * espelhar o modelo de importação.
 */
export function buildWagerScheduleCsv(questions: readonly AdminWagerQuestion[]): string {
  const header = [
    "data",
    "pergunta",
    ...Array.from({ length: WAGER_MAX_OPTIONS }, (_, i) => `alternativa_${optionKeyAt(i).toLowerCase()}`),
    "correta",
    "dificuldade",
    "multiplicador",
    "teto",
    "explicacao",
    "ativo",
    "apostas",
    "acertos",
    "moedas_apostadas",
    "saldo_moedas",
  ];

  const rows = [...(questions ?? [])]
    .filter((q): q is AdminWagerQuestion => !!q)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .map((question) => {
      const options = Array.from(
        { length: WAGER_MAX_OPTIONS },
        (_, i) => question.options[i]?.label ?? "",
      );
      // O gabarito sai como letra posicional para não depender do texto.
      const correctIndex = question.options.findIndex((o) => o.id === question.correctOption);
      return line([
        question.scheduledDate,
        question.question,
        ...options,
        correctIndex >= 0 ? optionKeyAt(correctIndex) : "",
        DIFFICULTY_CSV[question.difficulty] ?? "media",
        question.multiplier,
        question.maxStake,
        question.explanation ?? "",
        question.isActive,
        question.totalEntries,
        question.correctEntries,
        question.totalStaked,
        question.coinsDelta,
      ]);
    });

  return [line(header), ...rows].join("\r\n");
}

/** Nome de arquivo determinístico, útil para versionar a agenda. */
export function wagerScheduleFileName(generatedAt: Date = new Date()): string {
  const iso = Number.isNaN(generatedAt.getTime())
    ? new Date().toISOString()
    : generatedAt.toISOString();
  return `perguntas-do-dia-${iso.slice(0, 10)}.csv`;
}