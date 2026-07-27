/**
 * Decisão de alerta estatístico da Roleta da Sorte.
 *
 * Motor PURO: não toca no banco, não dispara nada. Ele apenas decide, a partir
 * de um `PayoutReport` já reconciliado, se o desvio observado justifica abrir
 * um registro em `security_alerts`. A mesma regra é reimplementada na função
 * SQL agendada (`raise_lucky_wheel_payout_alerts`) — este módulo é a
 * especificação executável e testável dessa regra.
 */
import type { PayoutReport } from "./luckyWheelPayout";

export type PayoutAlertSeverity = "low" | "medium" | "high" | "critical";

export interface PayoutAlertDecision {
  /** Sempre prefixado com `lucky_wheel_` (aceito pelo CHECK de security_alerts). */
  alertType: string;
  severity: PayoutAlertSeverity;
  title: string;
  description: string;
  /** Chave estável por dia+tipo: impede duplicar o alerta em reexecuções do cron. */
  dedupeKey: string;
  metadata: Record<string, number | string | boolean>;
}

export interface PayoutAlertOptions {
  /** Data de referência (YYYY-MM-DD) usada na chave de deduplicação. */
  date: string;
  /** Amostra mínima de giros para julgar a distribuição. Padrão: 50. */
  minSpins?: number;
  /** Nível de atenção (p-valor). Padrão: 0,01. */
  warnP?: number;
  /** Nível crítico (p-valor). Padrão: 0,0001. */
  criticalP?: number;
  /** Desvio relativo de custo tolerado antes de alertar. Padrão: 0,25. */
  costTolerance?: number;
}

const DEFAULTS = {
  minSpins: 50,
  warnP: 0.01,
  criticalP: 0.0001,
  costTolerance: 0.25,
} as const;

/** Quantil normal padrão (Acklam, erro < 1,15e-9) — usado por Wilson–Hilferty. */
function normalQuantile(p: number): number {
  if (!Number.isFinite(p) || p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p > 1 - pLow) return -normalQuantile(1 - p);
  const q = p - 0.5;
  const r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}

/**
 * Valor crítico da qui-quadrado na cauda superior via aproximação de
 * Wilson–Hilferty. Precisão suficiente (erro < 1%) para df >= 1 nos níveis
 * usados aqui, e sem dependência externa — a mesma fórmula roda no SQL.
 */
export function chiSquareCritical(df: number, p: number): number {
  if (!Number.isFinite(df) || df < 1) return Infinity;
  if (!Number.isFinite(p) || p <= 0 || p >= 1) return Infinity;
  const z = normalQuantile(1 - p);
  const t = 2 / (9 * df);
  const base = 1 - t + z * Math.sqrt(t);
  return df * Math.max(base, 0) ** 3;
}

/** Graus de liberdade: setores com expectativa utilizável, menos um. */
export function payoutDegreesOfFreedom(report: PayoutReport): number {
  const usable = report.prizes.filter((p) => p.expectedCount > 0).length;
  return Math.max(usable - 1, 0);
}

function pct(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Avalia o relatório e devolve os alertas que devem ser abertos. Lista vazia
 * significa "nada a reportar" — o cron não escreve nada nesse caso.
 */
export function decidePayoutAlerts(
  report: PayoutReport,
  options: PayoutAlertOptions,
): PayoutAlertDecision[] {
  const minSpins = options.minSpins ?? DEFAULTS.minSpins;
  const warnP = options.warnP ?? DEFAULTS.warnP;
  const criticalP = options.criticalP ?? DEFAULTS.criticalP;
  const costTolerance = options.costTolerance ?? DEFAULTS.costTolerance;
  const date = options.date || "sem-data";
  const out: PayoutAlertDecision[] = [];

  const spins = Number.isFinite(report.totals.spins) ? report.totals.spins : 0;
  const df = payoutDegreesOfFreedom(report);
  const chi = Number.isFinite(report.chiSquare) ? report.chiSquare : 0;

  // 1) Distribuição fora do peso configurado.
  if (spins >= minSpins && df >= 1) {
    const warnLimit = chiSquareCritical(df, warnP);
    const criticalLimit = chiSquareCritical(df, criticalP);
    if (chi > warnLimit) {
      const isCritical = chi > criticalLimit;
      out.push({
        alertType: "lucky_wheel_chi_square",
        severity: isCritical ? "critical" : "high",
        title: isCritical
          ? "Roleta: distribuição de prêmios severamente fora da calibração"
          : "Roleta: distribuição de prêmios fora do esperado",
        description:
          `χ² = ${chi.toFixed(2)} com ${df} grau(s) de liberdade em ${spins} giro(s), ` +
          `acima do limite de ${(isCritical ? criticalLimit : warnLimit).toFixed(2)}. ` +
          "Verifique os pesos vigentes e a trilha de calibração.",
        dedupeKey: `lucky_wheel_chi_square:${date}`,
        metadata: {
          date,
          chi_square: Number(chi.toFixed(4)),
          degrees_of_freedom: df,
          warn_limit: Number(warnLimit.toFixed(4)),
          critical_limit: Number(criticalLimit.toFixed(4)),
          spins,
        },
      });
    }
  }

  // 2) Custo realizado divergindo da projeção.
  if (report.projectedCoins > 0 && spins >= minSpins) {
    const deviation = Math.abs(report.coinsDelta) / report.projectedCoins;
    if (deviation > costTolerance) {
      out.push({
        alertType: "lucky_wheel_cost_deviation",
        severity: deviation > costTolerance * 2 ? "high" : "medium",
        title: "Roleta: custo em moedas divergente da projeção",
        description:
          `Pagou ${report.totals.coinsPaid} moeda(s) contra ${Math.round(report.projectedCoins)} projetada(s) ` +
          `(desvio de ${pct(deviation)}).`,
        dedupeKey: `lucky_wheel_cost_deviation:${date}`,
        metadata: {
          date,
          coins_paid: report.totals.coinsPaid,
          projected_coins: Number(report.projectedCoins.toFixed(2)),
          deviation: Number(deviation.toFixed(4)),
          spins,
        },
      });
    }
  }

  // 3) Integridade: giro duplicado viola o índice único de um giro por dia.
  if (report.duplicateSpins > 0) {
    out.push({
      alertType: "lucky_wheel_duplicate_spins",
      severity: "critical",
      title: "Roleta: giros duplicados detectados",
      description:
        `${report.duplicateSpins} giro(s) além do limite de um por usuário por dia. ` +
        "Investigue a integridade do índice único e a RPC de sorteio.",
      dedupeKey: `lucky_wheel_duplicate_spins:${date}`,
      metadata: { date, duplicate_spins: report.duplicateSpins, spins },
    });
  }

  // 4) Prêmios pagos que não existem mais na calibração.
  if (report.unconfiguredSpins > 0) {
    out.push({
      alertType: "lucky_wheel_unconfigured_prizes",
      severity: "medium",
      title: "Roleta: prêmios pagos fora da calibração vigente",
      description:
        `${report.unconfiguredSpins} giro(s) referenciam prêmios ausentes da configuração atual.`,
      dedupeKey: `lucky_wheel_unconfigured_prizes:${date}`,
      metadata: { date, unconfigured_spins: report.unconfiguredSpins, spins },
    });
  }

  return out;
}
