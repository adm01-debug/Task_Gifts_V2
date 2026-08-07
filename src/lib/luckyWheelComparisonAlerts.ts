/**
 * Decisão de alerta a partir da comparação de janelas da Roleta da Sorte.
 *
 * Motor PURO (sem I/O, nunca lança): recebe o `WindowComparison` já calculado
 * por `comparePayoutWindows` e decide quais alertas devem ser abertos —
 * variação estatisticamente significativa de custo, estouro de orçamento por
 * giro e queda relevante de volume. As chaves de deduplicação são estáveis por
 * janela, de modo que reexecuções (cron, refresh da UI) não dupliquem alertas.
 */
import type {
  SignificanceTest,
  WindowComparison,
} from "./luckyWheelPayoutComparison";

export type ComparisonAlertSeverity = "low" | "medium" | "high" | "critical";

export interface ComparisonAlertDecision {
  /** Sempre prefixado com `lucky_wheel_` (aceito pelo CHECK de security_alerts). */
  alertType: string;
  severity: ComparisonAlertSeverity;
  title: string;
  description: string;
  /** Chave estável por janela + tipo. */
  dedupeKey: string;
  metadata: Record<string, number | string | boolean>;
}

export interface ComparisonAlertOptions {
  /**
   * Orçamento máximo de moedas por giro. Quando informado (> 0) e a janela
   * atual o ultrapassa, abrimos alerta independentemente da significância.
   */
  coinsPerSpinBudget?: number;
  /** Efeito mínimo (Cohen's d) para considerar a variação relevante. Padrão: 0,5. */
  minEffectSize?: number;
  /** Piora relativa mínima de custo para alertar. Padrão: 0,15 (15%). */
  minCostIncrease?: number;
  /** Queda relativa de volume que dispara alerta. Padrão: 0,30 (30%). */
  maxVolumeDrop?: number;
}

const DEFAULTS = {
  minEffectSize: 0.5,
  minCostIncrease: 0.15,
  maxVolumeDrop: 0.3,
} as const;

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function positive(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value as number) > 0 ? (value as number) : fallback;
}

function pct(value: number): string {
  return `${(safe(value) * 100).toFixed(1)}%`;
}

function num(value: number): string {
  return safe(value).toFixed(2);
}

function findTest(
  comparison: WindowComparison,
  metric: SignificanceTest["metric"],
): SignificanceTest | undefined {
  return comparison.tests?.find((test) => test?.metric === metric);
}

/** Sufixo determinístico da janela, usado nas chaves de deduplicação. */
export function comparisonWindowKey(comparison: WindowComparison): string {
  const start = comparison.current?.startDate || "sem-inicio";
  const end = comparison.current?.endDate || "sem-fim";
  return `${start}_${end}`;
}

/**
 * Avalia a comparação e devolve os alertas a abrir. Lista vazia = nada a
 * reportar. Ordenada por severidade decrescente.
 */
export function decideComparisonAlerts(
  comparison: WindowComparison,
  options: ComparisonAlertOptions = {},
): ComparisonAlertDecision[] {
  if (!comparison || !comparison.current || !comparison.previous) return [];

  const minEffectSize = positive(options.minEffectSize, DEFAULTS.minEffectSize);
  const minCostIncrease = positive(options.minCostIncrease, DEFAULTS.minCostIncrease);
  const maxVolumeDrop = positive(options.maxVolumeDrop, DEFAULTS.maxVolumeDrop);
  const budget = Number.isFinite(options.coinsPerSpinBudget) && (options.coinsPerSpinBudget as number) > 0
    ? (options.coinsPerSpinBudget as number)
    : 0;

  const key = comparisonWindowKey(comparison);
  const out: ComparisonAlertDecision[] = [];

  const cost = findTest(comparison, "coinsPerSpin");
  const volume = findTest(comparison, "spinsPerDay");

  // 1) Custo por giro subiu de forma estatisticamente significativa e relevante.
  if (cost && cost.verdict === "significant" && cost.delta > 0) {
    const relevant = Math.abs(safe(cost.effectSize)) >= minEffectSize
      && safe(cost.deltaRatio) >= minCostIncrease;
    if (relevant) {
      const severe = safe(cost.deltaRatio) >= minCostIncrease * 3;
      out.push({
        alertType: "lucky_wheel_window_cost_regression",
        severity: severe ? "high" : "medium",
        title: "Roleta: custo por giro subiu de forma significativa",
        description:
          `Custo por giro passou de ${num(cost.previous)} para ${num(cost.current)} moeda(s) ` +
          `(${pct(cost.deltaRatio)}), com p = ${safe(cost.pValue).toExponential(2)} e d = ${num(cost.effectSize)}.`,
        dedupeKey: `lucky_wheel_window_cost_regression:${key}`,
        metadata: {
          window: key,
          current: Number(safe(cost.current).toFixed(4)),
          previous: Number(safe(cost.previous).toFixed(4)),
          delta_ratio: Number(safe(cost.deltaRatio).toFixed(4)),
          p_value: Number(safe(cost.pValue).toFixed(6)),
          effect_size: Number(safe(cost.effectSize).toFixed(4)),
        },
      });
    }
  }

  // 2) Estouro de orçamento por giro na janela atual (independe de significância).
  if (budget > 0) {
    const actual = safe(comparison.current.coinsPerSpin);
    if (actual > budget) {
      const overrun = (actual - budget) / budget;
      out.push({
        alertType: "lucky_wheel_window_budget_overrun",
        severity: overrun > 0.5 ? "critical" : "high",
        title: "Roleta: orçamento de moedas por giro estourado",
        description:
          `A janela atual pagou ${num(actual)} moeda(s) por giro contra o teto de ${num(budget)} ` +
          `(${pct(overrun)} acima).`,
        dedupeKey: `lucky_wheel_window_budget_overrun:${key}`,
        metadata: {
          window: key,
          coins_per_spin: Number(actual.toFixed(4)),
          budget: Number(budget.toFixed(4)),
          overrun: Number(overrun.toFixed(4)),
          spins: Math.max(0, Math.trunc(safe(comparison.current.spins))),
        },
      });
    }
  }

  // 3) Queda relevante de engajamento (giros por dia).
  if (volume && volume.verdict === "significant" && volume.delta < 0) {
    const drop = Math.abs(safe(volume.deltaRatio));
    if (drop >= maxVolumeDrop) {
      out.push({
        alertType: "lucky_wheel_window_volume_drop",
        severity: drop >= maxVolumeDrop * 2 ? "high" : "medium",
        title: "Roleta: queda significativa de participação",
        description:
          `Giros por dia caíram de ${num(volume.previous)} para ${num(volume.current)} (${pct(-drop)}).`,
        dedupeKey: `lucky_wheel_window_volume_drop:${key}`,
        metadata: {
          window: key,
          current: Number(safe(volume.current).toFixed(4)),
          previous: Number(safe(volume.previous).toFixed(4)),
          drop: Number(drop.toFixed(4)),
          p_value: Number(safe(volume.pValue).toFixed(6)),
        },
      });
    }
  }

  const rank: Record<ComparisonAlertSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}