/**
 * Metas de aproveitamento (win rate) por departamento, com detecção de queda.
 *
 * Premissas explícitas:
 * - reaproveita `compareDepartments` como fonte única da verdade, garantindo
 *   que meta e comparativo enxerguem exatamente as mesmas batalhas;
 * - a janela atual é `[now - days, now]` e a anterior é o bloco imediatamente
 *   contíguo `[now - 2*days, now - days]`, sem sobreposição;
 * - departamentos sem batalhas na janela atual não geram alerta de queda
 *   (ausência de dado não é regressão); ficam marcados como `no_data`;
 * - comparações usam a taxa BRUTA para a meta (contrato objetivo com o RH) e a
 *   taxa AJUSTADA para o delta, evitando alarme por amostra minúscula;
 * - severidade é escalonada e determinística; nenhuma função faz I/O.
 */

import {
  compareDepartments,
  type DepartmentComparisonRow,
} from "./bossDepartmentComparison";
import type { BossHistoryInput } from "./bossHistory";

export type GoalStatus = "no_data" | "on_track" | "at_risk" | "below_target";
export type DropSeverity = "none" | "watch" | "warning" | "critical";

export interface WinRateGoalRow {
  departmentId: string;
  battles: number;
  /** 0..1 bruto na janela atual. */
  winRate: number;
  /** 0..1 suavizado na janela atual. */
  adjustedWinRate: number;
  /** 0..1 suavizado na janela anterior; `null` quando não houve base. */
  previousAdjustedWinRate: number | null;
  previousBattles: number;
  /** Diferença em pontos percentuais (atual - anterior); `null` sem base. */
  deltaPp: number | null;
  status: GoalStatus;
  severity: DropSeverity;
  /** Quantos pontos percentuais faltam para a meta (0 quando atingida). */
  gapToTargetPp: number;
  /** Meta efetivamente aplicada a este departamento (0..1). */
  target: number;
  /** Tolerância (pp) efetivamente aplicada a este departamento. */
  tolerancePp: number;
  /** `true` quando existe meta específica persistida para o departamento. */
  hasOverride: boolean;
}

export interface WinRateGoalsResult {
  rows: WinRateGoalRow[];
  target: number;
  /** Departamentos abaixo da meta na janela atual. */
  belowTarget: number;
  /** Departamentos com queda relevante (>= watch). */
  dropping: number;
  currentWindow: { from: string; to: string };
  previousWindow: { from: string; to: string };
}

export interface WinRateGoalsOptions {
  /** Meta 0..1. Padrão 0.6. */
  target?: number;
  /** Tamanho da janela em dias. Padrão 90. */
  days?: number;
  /** Tolerância (pp) antes de considerar "abaixo da meta". Padrão 5. */
  tolerancePp?: number;
  /** Peso do prior bayesiano repassado ao comparativo. Padrão 3. */
  priorWeight?: number;
  /** Mínimo de batalhas na janela atual para avaliar. Padrão 1. */
  minBattles?: number;
  /**
   * Metas específicas por departamento (persistidas no banco). Sobrescrevem
   * `target`/`tolerancePp` apenas para os departamentos informados.
   */
  overrides?: Readonly<Record<string, { target?: number; tolerancePp?: number }>>;
  now?: Date;
}

const DAY_MS = 86_400_000;

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function pp(value: number): number {
  return Math.round(value * 10000) / 100;
}

function severityFor(deltaPp: number | null): DropSeverity {
  if (deltaPp === null) return "none";
  if (deltaPp <= -20) return "critical";
  if (deltaPp <= -10) return "warning";
  if (deltaPp <= -5) return "watch";
  return "none";
}

export function evaluateWinRateGoals(
  battles: readonly BossHistoryInput[],
  options: WinRateGoalsOptions = {},
): WinRateGoalsResult {
  const target = clamp01(Number(options.target ?? 0.6));
  const days = Math.max(1, Math.trunc(options.days ?? 90) || 1);
  const tolerancePp = Math.max(0, Number(options.tolerancePp ?? 5) || 0);
  const priorWeight = Math.max(0, Number(options.priorWeight ?? 3) || 0);
  const minBattles = Math.max(1, Math.trunc(options.minBattles ?? 1));
  const overrides = options.overrides ?? {};
  const nowMs = options.now?.getTime();
  const to = Number.isFinite(nowMs) ? (nowMs as number) : Date.now();
  const midpoint = to - days * DAY_MS;
  const start = to - 2 * days * DAY_MS;

  const currentWindow = {
    from: new Date(midpoint).toISOString(),
    to: new Date(to).toISOString(),
  };
  // 1 ms de folga evita que a mesma batalha caia nas duas janelas.
  const previousWindow = {
    from: new Date(start).toISOString(),
    to: new Date(midpoint - 1).toISOString(),
  };

  const current = compareDepartments(battles, {
    ...currentWindow,
    priorWeight,
    minBattles,
  });
  const previous = compareDepartments(battles, {
    ...previousWindow,
    priorWeight,
    minBattles: 1,
  });

  const prevById = new Map<string, DepartmentComparisonRow>();
  for (const row of previous.rows) prevById.set(row.departmentId, row);

  const rows: WinRateGoalRow[] = current.rows.map((row) => {
    const prev = prevById.get(row.departmentId) ?? null;
    const deltaPp =
      prev === null ? null : pp(row.adjustedWinRate - prev.adjustedWinRate);
    const override = Object.prototype.hasOwnProperty.call(overrides, row.departmentId)
      ? overrides[row.departmentId]
      : undefined;
    const hasOverride =
      override !== undefined &&
      (Number.isFinite(Number(override.target)) ||
        Number.isFinite(Number(override.tolerancePp)));
    const rowTarget = Number.isFinite(Number(override?.target))
      ? clamp01(Number(override?.target))
      : target;
    const rowTolerance = Number.isFinite(Number(override?.tolerancePp))
      ? Math.max(0, Number(override?.tolerancePp))
      : tolerancePp;
    const gap = rowTarget - row.winRate;
    const gapToTargetPp = gap > 0 ? pp(gap) : 0;
    const status: GoalStatus =
      row.battles < minBattles
        ? "no_data"
        : gapToTargetPp === 0
          ? "on_track"
          : gapToTargetPp <= rowTolerance
            ? "at_risk"
            : "below_target";
    return {
      departmentId: row.departmentId,
      battles: row.battles,
      winRate: row.winRate,
      adjustedWinRate: row.adjustedWinRate,
      previousAdjustedWinRate: prev ? prev.adjustedWinRate : null,
      previousBattles: prev ? prev.battles : 0,
      deltaPp,
      status,
      severity: severityFor(deltaPp),
      gapToTargetPp,
      target: rowTarget,
      tolerancePp: rowTolerance,
      hasOverride,
    };
  });

  const order: Record<DropSeverity, number> = {
    critical: 0, warning: 1, watch: 2, none: 3,
  };
  rows.sort((a, b) => {
    if (order[a.severity] !== order[b.severity]) {
      return order[a.severity] - order[b.severity];
    }
    if (a.gapToTargetPp !== b.gapToTargetPp) return b.gapToTargetPp - a.gapToTargetPp;
    return a.departmentId < b.departmentId ? -1 : a.departmentId > b.departmentId ? 1 : 0;
  });

  return {
    rows,
    target,
    belowTarget: rows.filter((r) => r.status === "below_target").length,
    dropping: rows.filter((r) => r.severity !== "none").length,
    currentWindow,
    previousWindow,
  };
}
