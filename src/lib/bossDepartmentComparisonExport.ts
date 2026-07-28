/**
 * Exportação auditável do comparativo entre departamentos (Chefão).
 *
 * Premissas explícitas:
 * - reaproveita `compareDepartments` como fonte única da verdade, garantindo
 *   que o CSV reflita exatamente o que a UI mostra (mesma janela, mesmo
 *   ranking, mesma suavização bayesiana);
 * - RFC 4180: todas as células vão entre aspas, com aspas internas duplicadas;
 * - proteção contra CSV injection: células iniciadas por `=`, `+`, `-`, `@`,
 *   TAB ou CR recebem apóstrofo antes;
 * - números usam ponto decimal e percentuais são arredondados em 2 casas;
 * - determinístico e livre de I/O.
 */

import {
  compareDepartments,
  NO_DEPARTMENT,
  type ComparisonOptions,
} from "./bossDepartmentComparison";
import type { BossHistoryInput } from "./bossHistory";

export const BOSS_COMPARISON_CSV_HEADERS = [
  "rank",
  "departamento_id",
  "departamento",
  "batalhas",
  "vitorias",
  "derrotas",
  "taxa_vitoria_pct",
  "taxa_ajustada_pct",
  "hp_destruido",
  "moedas",
  "xp",
  "abate_medio_min",
] as const;

const RISKY_PREFIX = /^[=+\-@\t\r]/;

function escapeCell(value: string): string {
  const safe = RISKY_PREFIX.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return escapeCell("");
  if (typeof value === "number") {
    return escapeCell(Number.isFinite(value) ? String(value) : "");
  }
  return escapeCell(String(value));
}

function pct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10000) / 100;
}

export interface BossComparisonCsvOptions extends ComparisonOptions {
  /** Mapa id -> nome para rótulos legíveis. Ausências caem em "Departamento". */
  departmentNames?: ReadonlyMap<string, string> | Record<string, string> | null;
}

function resolveName(
  id: string,
  names: BossComparisonCsvOptions["departmentNames"],
): string {
  if (id === NO_DEPARTMENT) return "Sem departamento";
  if (!names) return "Departamento";
  const found =
    names instanceof Map ? names.get(id) : (names as Record<string, string>)[id];
  return found && String(found).trim() ? String(found) : "Departamento";
}

/** Gera o CSV (com BOM) do comparativo entre departamentos. */
export function buildBossComparisonCsv(
  battles: readonly BossHistoryInput[],
  options: BossComparisonCsvOptions = {},
): string {
  const { departmentNames, ...comparison } = options;
  const result = compareDepartments(battles, comparison);

  const lines: string[] = [BOSS_COMPARISON_CSV_HEADERS.map(escapeCell).join(",")];

  for (const row of result.rows) {
    lines.push(
      [
        cell(row.rank),
        cell(row.departmentId),
        cell(resolveName(row.departmentId, departmentNames)),
        cell(row.battles),
        cell(row.victories),
        cell(row.defeats),
        cell(pct(row.winRate)),
        cell(pct(row.adjustedWinRate)),
        cell(row.hpDestroyed),
        cell(row.coinsAwarded),
        cell(row.xpAwarded),
        cell(row.avgKillMs === null ? "" : Math.round(row.avgKillMs / 60000)),
      ].join(","),
    );
  }

  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Nome de arquivo estável e seguro para o sistema de arquivos. */
export function bossComparisonFileName(
  windowLabel?: string | null,
  now: Date = new Date(),
): string {
  const stamp = Number.isFinite(now.getTime()) ? now.toISOString().slice(0, 10) : "sem-data";
  const slug = (windowLabel ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `chefao-comparativo-${slug || "geral"}-${stamp}.csv`;
}
