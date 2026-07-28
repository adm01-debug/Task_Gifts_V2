/**
 * Relatório consolidado do Chefão (Hall da Fama + comparativo + metas).
 *
 * Premissas explícitas:
 * - existe UM único conjunto de filtros (departamento, janela em dias, meta) e
 *   todas as seções o respeitam, para que PDF, CSV e tela nunca divirjam;
 * - a janela é aplicada ANTES dos motores, filtrando pela data de conclusão
 *   real da batalha (`toHistoryRow`), e batalhas concluídas sem data confiável
 *   são contabilizadas em `excludedUndated` em vez de silenciosamente sumirem;
 * - o comparativo e as metas continuam usando `compareDepartments` /
 *   `evaluateWinRateGoals` como fonte única da verdade — aqui não há regra
 *   estatística nova, apenas composição;
 * - CSV segue RFC 4180 (tudo entre aspas, aspas internas duplicadas) e bloqueia
 *   CSV injection prefixando `'` em células iniciadas por `= + - @ TAB CR`;
 * - determinístico e livre de I/O (simulável em massa).
 */

import {
  summarizeBossHistory,
  toHistoryRow,
  formatDuration,
  type BossHistoryInput,
  type BossHistorySummary,
} from "./bossHistory";
import {
  buildBossHistoryTrend,
  type BossTrendResult,
} from "./bossHistoryTrend";
import {
  compareDepartments,
  NO_DEPARTMENT,
  type DepartmentComparisonResult,
} from "./bossDepartmentComparison";
import {
  evaluateWinRateGoals,
  type WinRateGoalsResult,
  type GoalStatus,
  type DropSeverity,
} from "./bossWinRateGoals";

const DAY_MS = 86_400_000;

export type DepartmentNames =
  | ReadonlyMap<string, string>
  | Record<string, string>
  | null
  | undefined;

export interface BossReportFilters {
  /** `null`/ausente = todos os departamentos. */
  departmentId?: string | null;
  /** Janela em dias; `0` = todo o histórico. Padrão: 90. */
  days?: number;
  /** Meta de aproveitamento 0..1. Padrão: 0.6. */
  target?: number;
  /** Tolerância (pp) antes de considerar abaixo da meta. Padrão: 5. */
  tolerancePp?: number;
  /** Injetável para testes determinísticos. */
  now?: Date;
}

export interface BossReportMeta {
  departmentId: string | null;
  departmentLabel: string;
  days: number;
  target: number;
  tolerancePp: number;
  from: string | null;
  to: string;
  generatedAt: string;
  /** Batalhas concluídas descartadas por não terem data confiável. */
  excludedUndated: number;
  /** Batalhas concluídas dentro do recorte. */
  consideredBattles: number;
}

export interface BossReport {
  meta: BossReportMeta;
  history: BossHistorySummary;
  trend: BossTrendResult;
  comparison: DepartmentComparisonResult;
  goals: WinRateGoalsResult;
}

export const GOAL_STATUS_LABEL: Record<GoalStatus, string> = {
  no_data: "Sem dados",
  on_track: "Na meta",
  at_risk: "Em risco",
  below_target: "Abaixo da meta",
};

export const SEVERITY_LABEL: Record<DropSeverity, string> = {
  none: "Estável",
  watch: "Atenção",
  warning: "Alerta",
  critical: "Crítico",
};

export function resolveDepartmentName(id: string, names: DepartmentNames): string {
  if (id === NO_DEPARTMENT) return "Sem departamento";
  if (!names) return "Departamento";
  const found =
    names instanceof Map ? names.get(id) : (names as Record<string, string>)[id];
  return found && String(found).trim() ? String(found) : "Departamento";
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/** Percentual 0..1 -> número com 2 casas (ex.: 0.5123 => 51.23). */
export function pct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 10000) / 100;
}

/** Monta o relatório consolidado com filtros compartilhados por todas as seções. */
export function buildBossReport(
  battles: readonly BossHistoryInput[],
  filters: BossReportFilters = {},
  names?: DepartmentNames,
): BossReport {
  const departmentId = filters.departmentId ?? null;
  const days = Math.max(0, Math.trunc(filters.days ?? 90) || 0);
  const target = clamp01(Number(filters.target ?? 0.6));
  const tolerancePp = Math.max(0, Number(filters.tolerancePp ?? 5) || 0);
  const now = filters.now && Number.isFinite(filters.now.getTime())
    ? filters.now
    : new Date();
  const toMs = now.getTime();
  const fromMs = days > 0 ? toMs - days * DAY_MS : null;

  let excludedUndated = 0;
  const scoped: BossHistoryInput[] = [];
  for (const battle of battles ?? []) {
    if (departmentId && battle.department_id !== departmentId) continue;
    const row = toHistoryRow(battle);
    if (!row) continue; // rascunho/em andamento não entra no relatório
    const concludedMs = row.concludedAt ? Date.parse(row.concludedAt) : NaN;
    if (!Number.isFinite(concludedMs)) {
      excludedUndated += 1;
      if (fromMs === null) scoped.push(battle);
      continue;
    }
    if (fromMs !== null && (concludedMs < fromMs || concludedMs > toMs)) continue;
    scoped.push(battle);
  }

  const history = summarizeBossHistory(scoped, { departmentId: null, limit: 0 });
  const trend = buildBossHistoryTrend(scoped, { months: days > 0 ? 0 : 12 });
  const comparison = compareDepartments(scoped, {
    from: fromMs === null ? null : new Date(fromMs).toISOString(),
    to: new Date(toMs).toISOString(),
  });
  // Metas precisam da janela anterior: usam a base completa (já filtrada por
  // departamento) para não perder o bloco de comparação histórica.
  const goalsBase = departmentId
    ? (battles ?? []).filter((b) => b.department_id === departmentId)
    : (battles ?? []);
  const goals = evaluateWinRateGoals(goalsBase, {
    target,
    days: days > 0 ? days : 3650,
    tolerancePp,
    now,
  });

  return {
    meta: {
      departmentId,
      departmentLabel: departmentId
        ? resolveDepartmentName(departmentId, names)
        : "Toda a empresa",
      days,
      target,
      tolerancePp,
      from: fromMs === null ? null : new Date(fromMs).toISOString(),
      to: new Date(toMs).toISOString(),
      generatedAt: new Date(toMs).toISOString(),
      excludedUndated,
      consideredBattles: history.concluded,
    },
    history,
    trend,
    comparison,
    goals,
  };
}

/* -------------------------------------------------------------------------- */
/* CSV                                                                         */
/* -------------------------------------------------------------------------- */

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

function line(values: readonly unknown[]): string {
  return values.map(cell).join(",");
}

export const BOSS_REPORT_SECTIONS = [
  "PARAMETROS",
  "RESUMO",
  "TENDENCIA_MENSAL",
  "COMPARATIVO_DEPARTAMENTOS",
  "METAS_WIN_RATE",
  "BATALHAS",
] as const;

/** CSV multi-seção (com BOM) do relatório consolidado. */
export function buildBossReportCsv(report: BossReport, names?: DepartmentNames): string {
  const { meta } = report;
  const out: string[] = [];

  out.push(line(["secao", "PARAMETROS"]));
  out.push(line(["campo", "valor"]));
  out.push(line(["departamento", meta.departmentLabel]));
  out.push(line(["janela_dias", meta.days === 0 ? "todo o historico" : meta.days]));
  out.push(line(["periodo_de", meta.from ?? "inicio"]));
  out.push(line(["periodo_ate", meta.to]));
  out.push(line(["meta_win_rate_pct", pct(meta.target)]));
  out.push(line(["tolerancia_pp", meta.tolerancePp]));
  out.push(line(["batalhas_consideradas", meta.consideredBattles]));
  out.push(line(["batalhas_sem_data", meta.excludedUndated]));
  out.push(line(["gerado_em", meta.generatedAt]));
  out.push("");

  const h = report.history;
  out.push(line(["secao", "RESUMO"]));
  out.push(line(["metrica", "valor"]));
  out.push(line(["batalhas_concluidas", h.concluded]));
  out.push(line(["vitorias", h.victories]));
  out.push(line(["derrotas", h.defeats]));
  out.push(line(["aguardando_apuracao", h.awaitingSettlement]));
  out.push(line(["taxa_vitoria_pct", pct(h.winRate)]));
  out.push(line(["hp_destruido_medio_pct", pct(h.avgHpDestroyedPct)]));
  out.push(line(["hp_destruido_total", h.totalHpDestroyed]));
  out.push(line(["abate_mais_rapido", formatDuration(h.fastestKillMs)]));
  out.push(line(["abate_medio", formatDuration(h.avgKillMs)]));
  out.push(line(["moedas_pagas", h.coinsAwarded]));
  out.push(line(["xp_pago", h.xpAwarded]));
  out.push(line(["maior_sequencia_vitorias", h.longestVictoryStreak]));
  out.push(line(["sequencia_atual", h.currentVictoryStreak]));
  out.push("");

  out.push(line(["secao", "TENDENCIA_MENSAL"]));
  out.push(line(["mes", "batalhas", "vitorias", "derrotas", "taxa_vitoria_pct", "hp_destruido", "moedas", "xp"]));
  for (const point of report.trend.points) {
    out.push(line([
      point.month, point.battles, point.victories, point.defeats,
      pct(point.winRate), point.hpDestroyed, point.coinsAwarded, point.xpAwarded,
    ]));
  }
  out.push("");

  out.push(line(["secao", "COMPARATIVO_DEPARTAMENTOS"]));
  out.push(line([
    "rank", "departamento_id", "departamento", "batalhas", "vitorias", "derrotas",
    "taxa_vitoria_pct", "taxa_ajustada_pct", "hp_destruido", "moedas", "xp", "abate_medio_min",
  ]));
  for (const row of report.comparison.rows) {
    out.push(line([
      row.rank, row.departmentId, resolveDepartmentName(row.departmentId, names),
      row.battles, row.victories, row.defeats,
      pct(row.winRate), pct(row.adjustedWinRate),
      row.hpDestroyed, row.coinsAwarded, row.xpAwarded,
      row.avgKillMs === null ? "" : Math.round(row.avgKillMs / 60000),
    ]));
  }
  out.push("");

  out.push(line(["secao", "METAS_WIN_RATE"]));
  out.push(line([
    "departamento_id", "departamento", "batalhas", "taxa_vitoria_pct", "taxa_ajustada_pct",
    "taxa_anterior_pct", "batalhas_anterior", "delta_pp", "gap_meta_pp", "status", "severidade",
  ]));
  for (const row of report.goals.rows) {
    out.push(line([
      row.departmentId, resolveDepartmentName(row.departmentId, names),
      row.battles, pct(row.winRate), pct(row.adjustedWinRate),
      row.previousAdjustedWinRate === null ? "" : pct(row.previousAdjustedWinRate),
      row.previousBattles,
      row.deltaPp === null ? "" : row.deltaPp,
      row.gapToTargetPp,
      GOAL_STATUS_LABEL[row.status],
      SEVERITY_LABEL[row.severity],
    ]));
  }
  out.push("");

  out.push(line(["secao", "BATALHAS"]));
  out.push(line([
    "id", "titulo", "status", "resultado", "hp_total", "hp_destruido",
    "hp_destruido_pct", "duracao_abate_min", "moedas", "xp", "apurado", "concluido_em",
  ]));
  for (const row of report.history.rows) {
    out.push(line([
      row.id, row.title, row.status, row.victory ? "vitoria" : "derrota",
      row.totalHp, row.hpDestroyed, pct(row.hpDestroyedPct),
      row.killDurationMs === null ? "" : Math.round(row.killDurationMs / 60000),
      row.coinsPool, row.xpPool, row.settled, row.concludedAt ?? "",
    ]));
  }

  return `\uFEFF${out.join("\r\n")}\r\n`;
}

/** Nome de arquivo estável e saneado (sem path traversal). */
export function bossReportFileName(
  meta: Pick<BossReportMeta, "departmentLabel" | "days">,
  ext: "csv" | "pdf",
  now: Date = new Date(),
): string {
  const stamp = Number.isFinite(now.getTime())
    ? now.toISOString().slice(0, 10)
    : "sem-data";
  const slug = (meta.departmentLabel ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const window = meta.days > 0 ? `${meta.days}d` : "total";
  return `chefao-relatorio-${slug || "geral"}-${window}-${stamp}.${ext}`;
}