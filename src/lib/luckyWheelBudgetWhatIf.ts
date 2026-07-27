/**
 * Simulação "E se?" do teto de moedas por giro da Roleta da Sorte.
 *
 * Motor PURO (sem I/O, nunca lança): reaproveita `decideComparisonAlerts` para
 * responder "quantos alertas dispariam se o teto fosse X?" e qual é o teto
 * mínimo que mantém a janela atual silenciosa (break-even).
 */
import {
  decideComparisonAlerts,
  type ComparisonAlertDecision,
  type ComparisonAlertOptions,
} from "./luckyWheelComparisonAlerts";
import type { WindowComparison } from "./luckyWheelPayoutComparison";
import {
  MAX_COINS_PER_SPIN_BUDGET,
  MIN_COINS_PER_SPIN_BUDGET,
  parseBudget,
} from "./luckyWheelBudget";

export interface WhatIfScenario {
  /** Teto avaliado (normalizado). */
  budget: number;
  /** Total de alertas que dispariam com esse teto. */
  alertCount: number;
  /** Apenas o alerta de estouro de teto dispararia? */
  overrun: boolean;
  /** Alertas completos, para exibição/tooltip. */
  alerts: ComparisonAlertDecision[];
}

export interface WhatIfReport {
  /** Custo por giro observado na janela atual (0 quando indisponível). */
  currentCoinsPerSpin: number;
  /** Alertas independentes do teto (custo/volume) — o piso irredutível. */
  baselineAlertCount: number;
  /**
   * Menor teto (arredondado para cima em 0,01) que NÃO dispara estouro.
   * `null` quando não há dado de custo na janela atual.
   */
  breakEvenBudget: number | null;
  scenarios: WhatIfScenario[];
}

function safe(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clampBudget(value: number): number {
  return Math.min(
    MAX_COINS_PER_SPIN_BUDGET,
    Math.max(MIN_COINS_PER_SPIN_BUDGET, Math.round(value * 100) / 100),
  );
}

/** Normaliza e deduplica a lista de tetos candidatos, em ordem crescente. */
export function normalizeCandidates(raw: readonly unknown[]): number[] {
  const set = new Set<number>();
  for (const item of raw || []) {
    const parsed = parseBudget(item);
    if (parsed !== null) set.add(parsed);
  }
  return [...set].sort((a, b) => a - b);
}

/**
 * Roda a simulação. Entradas hostis (comparação nula, candidatos inválidos)
 * devolvem um relatório vazio e coerente — nunca lança.
 */
export function simulateBudgetScenarios(
  comparison: WindowComparison | null | undefined,
  candidates: readonly unknown[],
  options: Omit<ComparisonAlertOptions, "coinsPerSpinBudget"> = {},
): WhatIfReport {
  const empty: WhatIfReport = {
    currentCoinsPerSpin: 0,
    baselineAlertCount: 0,
    breakEvenBudget: null,
    scenarios: [],
  };
  if (!comparison || !comparison.current || !comparison.previous) return empty;

  const currentCoinsPerSpin = Math.max(0, safe(comparison.current.coinsPerSpin));
  // Teto ausente (0) => decideComparisonAlerts ignora a regra de estouro.
  const baseline = decideComparisonAlerts(comparison, { ...options, coinsPerSpinBudget: 0 });

  const scenarios = normalizeCandidates(candidates).map<WhatIfScenario>((budget) => {
    const alerts = decideComparisonAlerts(comparison, { ...options, coinsPerSpinBudget: budget });
    return {
      budget,
      alertCount: alerts.length,
      overrun: alerts.some((a) => a.alertType === "lucky_wheel_window_budget_overrun"),
      alerts,
    };
  });

  const breakEvenBudget = currentCoinsPerSpin > 0
    ? clampBudget(Math.ceil(currentCoinsPerSpin * 100) / 100)
    : null;

  return {
    currentCoinsPerSpin,
    baselineAlertCount: baseline.length,
    breakEvenBudget,
    scenarios,
  };
}

/** Grade padrão de candidatos ao redor do teto vigente (−50% … +100%). */
export function defaultCandidates(currentBudget: unknown): number[] {
  const base = parseBudget(currentBudget) ?? 30;
  return normalizeCandidates([
    base * 0.5,
    base * 0.75,
    base,
    base * 1.25,
    base * 1.5,
    base * 2,
  ]);
}

/* ------------------------- persistência auditável -------------------------- */

/**
 * Assinatura estável do cenário simulado: mesma janela + mesmo teto + mesma
 * grade de candidatos ⇒ mesma chave, garantindo idempotência do registro
 * histórico (upsert por `signature`) mesmo com múltiplos cliques do admin.
 */
export function buildWhatIfSignature(
  comparison: WindowComparison | null | undefined,
  activeBudget: unknown,
  report: WhatIfReport,
): string {
  const cur = comparison?.current;
  const prev = comparison?.previous;
  const budget = parseBudget(activeBudget) ?? 0;
  const grid = report.scenarios.map((s) => s.budget.toFixed(2)).join("|");
  return [
    cur?.startDate ?? "-",
    cur?.endDate ?? "-",
    prev?.startDate ?? "-",
    prev?.endDate ?? "-",
    budget.toFixed(2),
    grid,
  ].join("::");
}

export interface WhatIfSnapshotRow {
  id: string;
  current_window_start: string;
  current_window_end: string;
  previous_window_start: string;
  previous_window_end: string;
  active_budget: number;
  current_coins_per_spin: number;
  baseline_alert_count: number;
  break_even_budget: number | null;
  scenarios: unknown;
  created_at: string;
}

/**
 * Persiste (ou reatualiza) o cenário simulado para auditoria histórica.
 * Retorna `false` — sem lançar — quando não há janela válida para registrar.
 */
export async function persistWhatIfSnapshot(
  comparison: WindowComparison | null | undefined,
  activeBudget: unknown,
  report: WhatIfReport,
): Promise<boolean> {
  const cur = comparison?.current;
  const prev = comparison?.previous;
  if (!cur?.startDate || !cur?.endDate || !prev?.startDate || !prev?.endDate) return false;
  if (report.scenarios.length === 0) return false;

  const { supabase } = await import("@/integrations/supabase/client");
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth?.user?.id;
  if (!userId) throw new Error("Sessão expirada — faça login novamente.");

  const { error } = await supabase
    .from("lucky_wheel_whatif_snapshots")
    .upsert(
      {
        current_window_start: cur.startDate,
        current_window_end: cur.endDate,
        previous_window_start: prev.startDate,
        previous_window_end: prev.endDate,
        active_budget: parseBudget(activeBudget) ?? 0,
        current_coins_per_spin: report.currentCoinsPerSpin,
        baseline_alert_count: report.baselineAlertCount,
        break_even_budget: report.breakEvenBudget,
        scenarios: report.scenarios.map((s) => ({
          budget: s.budget,
          alertCount: s.alertCount,
          overrun: s.overrun,
          alertTypes: s.alerts.map((a) => a.alertType),
        })),
        signature: buildWhatIfSignature(comparison, activeBudget, report),
        created_by: userId,
      },
      { onConflict: "signature" },
    );
  if (error) throw error;
  return true;
}

/** Últimas simulações registradas (auditoria histórica), mais recentes primeiro. */
export async function fetchWhatIfSnapshots(limit = 10): Promise<WhatIfSnapshotRow[]> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("lucky_wheel_whatif_snapshots")
    .select(
      "id, current_window_start, current_window_end, previous_window_start, previous_window_end, active_budget, current_coins_per_spin, baseline_alert_count, break_even_budget, scenarios, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(Math.min(50, Math.max(1, limit)));
  if (error) throw error;
  return (data ?? []) as WhatIfSnapshotRow[];
}
