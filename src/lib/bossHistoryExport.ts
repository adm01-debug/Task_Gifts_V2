/**
 * Exportação auditável do Hall da Fama do Chefão.
 *
 * Premissas explícitas:
 * - a exportação reflete EXATAMENTE as batalhas concluídas do escopo pedido
 *   (nunca rascunhos/andamento), reaproveitando o motor `summarizeBossHistory`
 *   como fonte única da verdade;
 * - todos os campos são escapados no padrão RFC 4180 (aspas duplicadas) para
 *   suportar títulos com vírgula, aspas ou quebra de linha;
 * - protege contra CSV injection (fórmulas): células iniciadas por
 *   `=`, `+`, `-` ou `@` recebem um apóstrofo antes;
 * - números usam ponto decimal para não quebrar em planilhas internacionais;
 * - a função é determinística e livre de I/O (testável em massa).
 */

import { summarizeBossHistory, type BossHistoryInput } from "./bossHistory";

export const BOSS_HISTORY_CSV_HEADERS = [
  "id",
  "titulo",
  "status",
  "resultado",
  "hp_total",
  "hp_destruido",
  "hp_destruido_pct",
  "duracao_abate_min",
  "moedas",
  "xp",
  "apurado",
  "concluido_em",
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
  if (typeof value === "boolean") return escapeCell(value ? "sim" : "nao");
  return escapeCell(String(value));
}

export interface BossHistoryCsvOptions {
  departmentId?: string | null;
  /** 0 = todas as linhas (padrão da exportação, diferente do card). */
  limit?: number;
}

/** Gera o conteúdo CSV (com BOM) do histórico concluído. */
export function buildBossHistoryCsv(
  battles: readonly BossHistoryInput[],
  options: BossHistoryCsvOptions = {},
): string {
  const summary = summarizeBossHistory(battles, {
    departmentId: options.departmentId ?? null,
    limit: options.limit ?? 0,
  });

  const lines: string[] = [BOSS_HISTORY_CSV_HEADERS.map(escapeCell).join(",")];

  for (const row of summary.rows) {
    lines.push(
      [
        cell(row.id),
        cell(row.title),
        cell(row.status),
        cell(row.victory ? "vitoria" : "derrota"),
        cell(row.totalHp),
        cell(row.hpDestroyed),
        cell(Math.round(row.hpDestroyedPct * 10000) / 100),
        cell(row.killDurationMs === null ? "" : Math.round(row.killDurationMs / 60000)),
        cell(row.coinsPool),
        cell(row.xpPool),
        cell(row.settled),
        cell(row.concludedAt ?? ""),
      ].join(","),
    );
  }

  // BOM garante acentuação correta no Excel pt-BR.
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Nome de arquivo estável e seguro para o sistema de arquivos. */
export function bossHistoryFileName(scopeLabel?: string | null, now: Date = new Date()): string {
  const stamp = Number.isFinite(now.getTime())
    ? now.toISOString().slice(0, 10)
    : "sem-data";
  const slug = (scopeLabel ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `chefao-historico-${slug || "geral"}-${stamp}.csv`;
}
