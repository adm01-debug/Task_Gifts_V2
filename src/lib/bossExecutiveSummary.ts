/**
 * Motor puro do **Painel Executivo do Chefão** (visão de chefia).
 *
 * Objetivo: entregar, em um único cálculo determinístico, o resumo que a
 * liderança precisa para decidir em menos de 30 segundos — tendência do
 * período, alertas acionáveis e situação das metas por departamento.
 *
 * Premissas explícitas (o "porquê" antes do "como"):
 *
 * 1. **Fonte única da verdade.** Reaproveita `evaluateWinRateGoals` (que por
 *    sua vez reaproveita `compareDepartments` e `toHistoryRow`). O painel
 *    jamais recalcula taxas por conta própria: se o comparativo e a meta
 *    concordam, o executivo concorda também.
 * 2. **Janela contígua.** Período atual `[now - days, now]`, período anterior
 *    `[now - 2*days, now - days)`. Sem sobreposição, sem dupla contagem.
 * 3. **Ausência de dado não é regressão.** Departamentos sem batalhas na
 *    janela ficam em `no_data` e não entram na contagem de alertas.
 * 4. **Alertas escalonados e limitados.** Só quedas `warning`/`critical` e
 *    departamentos `below_target` viram alerta; a lista é ordenada por
 *    gravidade e truncada para não virar ruído no painel.
 * 5. **Pendências operacionais são alerta.** Vitórias não apuradas
 *    (`awaitingSettlement`) representam recompensa prometida e não paga —
 *    risco reputacional direto, logo aparecem no topo.
 * 6. **Zero I/O.** Tudo é função pura, simulável em massa nos testes.
 */

import { summarizeBossHistory, type BossHistoryInput } from "./bossHistory";
import { NO_DEPARTMENT } from "./bossDepartmentComparison";
import {
  evaluateWinRateGoals,
  type DropSeverity,
  type GoalStatus,
  type WinRateGoalRow,
  type WinRateGoalsOptions,
} from "./bossWinRateGoals";

/** Gravidade normalizada exibida no painel. */
export type ExecutiveAlertLevel = "critical" | "warning" | "info";

export type ExecutiveAlertKind =
  | "win_rate_drop"
  | "below_target"
  | "awaiting_settlement"
  | "no_activity";

export interface BossExecutiveAlert {
  /** Estável e único — serve como `key` de lista e chave de deduplicação. */
  id: string;
  kind: ExecutiveAlertKind;
  level: ExecutiveAlertLevel;
  /** `null` quando o alerta é global (não atrelado a um departamento). */
  departmentId: string | null;
  title: string;
  detail: string;
}

export interface BossExecutiveDepartmentRow {
  departmentId: string;
  battles: number;
  /** 0..100, arredondado, para exibição direta. */
  winRatePct: number;
  targetPct: number;
  deltaPp: number | null;
  status: GoalStatus;
  severity: DropSeverity;
  gapToTargetPp: number;
}

export interface BossExecutiveSummary {
  /** Janela avaliada (ISO). */
  window: { from: string; to: string; days: number };
  /** Batalhas concluídas na janela atual. */
  battles: number;
  /** Batalhas concluídas na janela anterior (base de comparação). */
  previousBattles: number;
  /** 0..100 — aproveitamento agregado da janela atual. */
  winRatePct: number;
  /** Diferença em p.p. contra a janela anterior; `null` sem base. */
  winRateDeltaPp: number | null;
  /** Batalhas em andamento no momento (independem da janela). */
  activeBattles: number;
  /** Vitórias concluídas ainda sem apuração de recompensa. */
  awaitingSettlement: number;
  departmentsTracked: number;
  departmentsOnTrack: number;
  departmentsBelowTarget: number;
  departmentsDropping: number;
  /** Melhor e pior departamento da janela (mínimo de batalhas respeitado). */
  topDepartment: BossExecutiveDepartmentRow | null;
  bottomDepartment: BossExecutiveDepartmentRow | null;
  /** Ordenado por gravidade; já truncado por `maxAlerts`. */
  alerts: BossExecutiveAlert[];
  /** Linhas por departamento, ordenadas por gravidade (mesma ordem da meta). */
  rows: BossExecutiveDepartmentRow[];
}

export interface BossExecutiveOptions extends WinRateGoalsOptions {
  /** Máximo de alertas retornados. Padrão 6. */
  maxAlerts?: number;
}

const DAY_MS = 86_400_000;

function pct(value: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(Math.min(1, Math.max(0, n)) * 100);
}

function toRow(row: WinRateGoalRow): BossExecutiveDepartmentRow {
  return {
    departmentId: row.departmentId,
    battles: row.battles,
    winRatePct: pct(row.winRate),
    targetPct: pct(row.target),
    deltaPp: row.deltaPp,
    status: row.status,
    severity: row.severity,
    gapToTargetPp: row.gapToTargetPp,
  };
}

function inWindow(iso: string | null, fromMs: number, toMs: number): boolean {
  if (!iso) return false;
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return false;
  return ms >= fromMs && ms <= toMs;
}

const LEVEL_ORDER: Record<ExecutiveAlertLevel, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

/**
 * Consolida tendências, alertas e metas do período em um único objeto.
 *
 * @param battles Batalhas cruas vindas do banco (qualquer status).
 * @param options Janela, meta e overrides por departamento.
 */
export function buildBossExecutiveSummary(
  battles: readonly BossHistoryInput[],
  options: BossExecutiveOptions = {},
): BossExecutiveSummary {
  const days = Math.max(1, Math.trunc(Number(options.days ?? 90)) || 1);
  const maxAlerts = Math.max(1, Math.trunc(Number(options.maxAlerts ?? 6)) || 6);
  const nowMs = options.now?.getTime();
  const to = Number.isFinite(nowMs) ? (nowMs as number) : Date.now();
  const from = to - days * DAY_MS;
  const previousFrom = to - 2 * days * DAY_MS;

  const goals = evaluateWinRateGoals(battles, { ...options, days });
  const rows = goals.rows.map(toRow);

  // O agregado global é recalculado a partir das MESMAS batalhas concluídas na
  // janela, garantindo coerência com o Hall da Fama.
  const list = Array.isArray(battles) ? battles : [];
  const concludedIn = (fromMs: number, toMs: number) =>
    list.filter((battle) =>
      inWindow(
        battle?.settled_at ?? battle?.defeated_at ?? battle?.ends_at ?? null,
        fromMs,
        toMs,
      ),
    );

  const currentSummary = summarizeBossHistory(concludedIn(from, to));
  const previousSummary = summarizeBossHistory(concludedIn(previousFrom, from - 1));

  const winRatePct = pct(currentSummary.winRate);
  const winRateDeltaPp =
    previousSummary.concluded === 0
      ? null
      : Math.round((currentSummary.winRate - previousSummary.winRate) * 1000) / 10;

  const activeBattles = list.filter((battle) => battle?.status === "running").length;

  // ----- Alertas ---------------------------------------------------------
  const alerts: BossExecutiveAlert[] = [];

  if (currentSummary.awaitingSettlement > 0) {
    alerts.push({
      id: "awaiting_settlement",
      kind: "awaiting_settlement",
      level: "critical",
      departmentId: null,
      title: `${currentSummary.awaitingSettlement} vitória(s) sem apuração`,
      detail:
        "Recompensas prometidas ainda não foram creditadas. Apure para manter a confiança do time.",
    });
  }

  if (currentSummary.concluded === 0) {
    alerts.push({
      id: "no_activity",
      kind: "no_activity",
      level: activeBattles > 0 ? "info" : "warning",
      departmentId: null,
      title: "Nenhuma batalha concluída no período",
      detail:
        activeBattles > 0
          ? `Há ${activeBattles} batalha(s) em andamento — o resultado ainda não entrou nas métricas.`
          : "Sem atividade na janela selecionada. Considere abrir um novo desafio departamental.",
    });
  }

  for (const row of goals.rows) {
    if (row.severity === "critical" || row.severity === "warning") {
      alerts.push({
        id: `drop:${row.departmentId}`,
        kind: "win_rate_drop",
        level: row.severity === "critical" ? "critical" : "warning",
        departmentId: row.departmentId === NO_DEPARTMENT ? null : row.departmentId,
        title:
          row.severity === "critical"
            ? "Queda crítica de aproveitamento"
            : "Queda relevante de aproveitamento",
        detail: `${row.deltaPp} p.p. contra o período anterior (${pct(row.winRate)}% agora, ${row.battles} batalha(s)).`,
      });
      continue;
    }
    if (row.status === "below_target") {
      alerts.push({
        id: `below:${row.departmentId}`,
        kind: "below_target",
        level: "warning",
        departmentId: row.departmentId === NO_DEPARTMENT ? null : row.departmentId,
        title: "Abaixo da meta",
        detail: `Faltam ${row.gapToTargetPp} p.p. para a meta de ${pct(row.target)}%.`,
      });
    }
  }

  alerts.sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  // ----- Destaques -------------------------------------------------------
  const ranked = goals.rows.filter((row) => row.status !== "no_data");
  const byRate = [...ranked].sort(
    (a, b) => b.adjustedWinRate - a.adjustedWinRate || b.battles - a.battles,
  );

  return {
    window: { from: new Date(from).toISOString(), to: new Date(to).toISOString(), days },
    battles: currentSummary.concluded,
    previousBattles: previousSummary.concluded,
    winRatePct,
    winRateDeltaPp,
    activeBattles,
    awaitingSettlement: currentSummary.awaitingSettlement,
    departmentsTracked: rows.length,
    departmentsOnTrack: goals.rows.filter((row) => row.status === "on_track").length,
    departmentsBelowTarget: goals.belowTarget,
    departmentsDropping: goals.dropping,
    topDepartment: byRate.length > 0 ? toRow(byRate[0]) : null,
    bottomDepartment: byRate.length > 1 ? toRow(byRate[byRate.length - 1]) : null,
    alerts: alerts.slice(0, maxAlerts),
    rows,
  };
}