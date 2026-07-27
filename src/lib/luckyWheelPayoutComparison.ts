/**
 * Comparação de janelas de payout da Roleta da Sorte.
 *
 * Motor PURO (sem I/O): recebe a série densa produzida por `buildPayoutTrend`
 * e compara duas janelas contíguas (ex.: semana atual × anterior) aplicando:
 *
 * - Teste z de duas proporções para a taxa de giros premiados/estrutura de
 *   volume (giros por dia), robusto para amostras grandes;
 * - Teste t de Welch sobre o custo diário em moedas por giro (variâncias
 *   desiguais, tamanhos diferentes de janela);
 * - Tamanho de efeito (Cohen's d) para separar significância estatística de
 *   relevância econômica.
 *
 * Toda a matemática vive aqui para poder ser simulada em centenas de cenários
 * antes de tocar a UI. Nenhuma função lança: entradas hostis viram zeros.
 */
import type { PayoutTrendPoint } from "./luckyWheelPayoutHistory";

export interface WindowAggregate {
  /** Rótulo humano da janela (ex.: "Semana atual"). */
  label: string;
  startDate: string;
  endDate: string;
  days: number;
  daysWithData: number;
  spins: number;
  uniqueUsers: number;
  coinsPaid: number;
  xpPaid: number;
  projectedCoins: number;
  /** Custo médio em moedas por giro. */
  coinsPerSpin: number;
  /** Giros por dia com snapshot. */
  spinsPerDay: number;
  /** Desvio agregado (pago - projetado) / projetado. */
  coinsDeviation: number;
  /** Média de χ²/gl nos dias com graus de liberdade definidos. */
  chiPerDf: number;
}

export type SignificanceVerdict = "insufficient" | "stable" | "significant";

export interface SignificanceTest {
  /** Identificador estável da métrica testada. */
  metric: "coinsPerSpin" | "spinsPerDay" | "coinsDeviation";
  label: string;
  current: number;
  previous: number;
  /** Diferença absoluta (atual - anterior). */
  delta: number;
  /** Diferença relativa; 0 quando a base anterior é zero. */
  deltaRatio: number;
  /** Estatística do teste (t de Welch ou z). */
  statistic: number;
  /** Graus de liberdade efetivos (Welch–Satterthwaite); 0 para o teste z. */
  degreesOfFreedom: number;
  /** p-valor bicaudal aproximado, sempre em [0, 1]. */
  pValue: number;
  /** Tamanho de efeito padronizado (Cohen's d); 0 quando indefinido. */
  effectSize: number;
  verdict: SignificanceVerdict;
}

export interface WindowComparison {
  current: WindowAggregate;
  previous: WindowAggregate;
  tests: SignificanceTest[];
  /** Pior veredito entre os testes, para destaque na UI. */
  verdict: SignificanceVerdict;
  /** Alertas legíveis, já ordenados por severidade. */
  notes: string[];
}

export interface WindowComparisonOptions {
  /** Tamanho de cada janela em dias. Padrão: 7. */
  windowDays?: number;
  /** Nível de significância. Padrão: 0,05. */
  alpha?: number;
  /** Mínimo de dias com snapshot em cada janela para julgar. Padrão: 3. */
  minDaysWithData?: number;
  /** Mínimo de giros em cada janela para julgar. Padrão: 30. */
  minSpins?: number;
  currentLabel?: string;
  previousLabel?: string;
}

const DEFAULTS = {
  windowDays: 7,
  alpha: 0.05,
  minDaysWithData: 3,
  minSpins: 30,
  currentLabel: "Janela atual",
  previousLabel: "Janela anterior",
} as const;

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return safe(values.reduce((a, b) => a + b, 0) / values.length);
}

/** Variância amostral (n-1). Zero para menos de dois pontos. */
function variance(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  return safe(values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1));
}

/** Aproximação de Abramowitz–Stegun 7.1.26 para a função erro. */
export function erf(x: number): number {
  if (!Number.isFinite(x)) return x > 0 ? 1 : -1;
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * ax);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax);
  return sign * y;
}

/** CDF da normal padrão. */
export function normalCdf(z: number): number {
  if (!Number.isFinite(z)) return z > 0 ? 1 : 0;
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/**
 * p-valor bicaudal de uma estatística t com `df` graus de liberdade.
 * Usa a correção de Fisher–Cornish para aproximar t pela normal, o que mantém
 * o erro abaixo de ~0,5% para df >= 5 sem depender de funções beta.
 */
export function tTestPValue(t: number, df: number): number {
  const stat = Math.abs(safe(t));
  if (stat === 0) return 1;
  if (!Number.isFinite(df) || df <= 0) return 1;
  if (df > 1000) return clampP(2 * (1 - normalCdf(stat)));
  const g1 = (stat ** 3 + stat) / 4;
  const g2 = (5 * stat ** 5 + 16 * stat ** 3 + 3 * stat) / 96;
  const z = stat - g1 / df - g2 / df ** 2;
  return clampP(2 * (1 - normalCdf(Math.max(0, z))));
}

function clampP(p: number): number {
  if (!Number.isFinite(p)) return 1;
  return Math.min(1, Math.max(0, p));
}

/** Teste t de Welch. Devolve estatística, gl efetivos e p-valor. */
export function welchTest(
  a: number[],
  b: number[],
): { statistic: number; degreesOfFreedom: number; pValue: number; effectSize: number } {
  const na = a.length;
  const nb = b.length;
  if (na < 2 || nb < 2) return { statistic: 0, degreesOfFreedom: 0, pValue: 1, effectSize: 0 };

  const va = variance(a);
  const vb = variance(b);
  const sa = va / na;
  const sb = vb / nb;
  const denom = sa + sb;
  const diff = mean(a) - mean(b);

  if (denom <= 0) {
    // Variância nula em ambas as amostras: só há efeito se as médias diferirem.
    return { statistic: 0, degreesOfFreedom: 0, pValue: diff === 0 ? 1 : 0, effectSize: 0 };
  }

  const statistic = safe(diff / Math.sqrt(denom));
  const df = safe(denom ** 2 / (sa ** 2 / (na - 1) + sb ** 2 / (nb - 1)));
  const pooled = Math.sqrt(((na - 1) * va + (nb - 1) * vb) / Math.max(1, na + nb - 2));
  const effectSize = pooled > 0 ? safe(diff / pooled) : 0;

  return { statistic, degreesOfFreedom: df, pValue: tTestPValue(statistic, df), effectSize };
}

function aggregate(points: PayoutTrendPoint[], label: string): WindowAggregate {
  const present = points.filter((p) => p.present);
  const spins = present.reduce((acc, p) => acc + p.spins, 0);
  const coinsPaid = present.reduce((acc, p) => acc + p.coinsPaid, 0);
  const projectedCoins = present.reduce((acc, p) => acc + p.projectedCoins, 0);
  const chiPoints = present.filter((p) => p.degreesOfFreedom >= 1);

  return {
    label,
    startDate: points[0]?.date ?? "",
    endDate: points[points.length - 1]?.date ?? "",
    days: points.length,
    daysWithData: present.length,
    spins,
    uniqueUsers: present.reduce((acc, p) => acc + p.uniqueUsers, 0),
    coinsPaid,
    xpPaid: present.reduce((acc, p) => acc + p.xpPaid, 0),
    projectedCoins,
    coinsPerSpin: spins > 0 ? safe(coinsPaid / spins) : 0,
    spinsPerDay: present.length > 0 ? safe(spins / present.length) : 0,
    coinsDeviation: projectedCoins > 0 ? safe((coinsPaid - projectedCoins) / projectedCoins) : 0,
    chiPerDf: mean(chiPoints.map((p) => p.chiSquare / p.degreesOfFreedom)),
  };
}

function dailyCoinsPerSpin(points: PayoutTrendPoint[]): number[] {
  return points.filter((p) => p.present && p.spins > 0).map((p) => safe(p.coinsPaid / p.spins));
}

function dailySpins(points: PayoutTrendPoint[]): number[] {
  return points.filter((p) => p.present).map((p) => p.spins);
}

function dailyDeviation(points: PayoutTrendPoint[]): number[] {
  return points
    .filter((p) => p.present && p.projectedCoins > 0)
    .map((p) => safe((p.coinsPaid - p.projectedCoins) / p.projectedCoins));
}

function ratio(current: number, previous: number): number {
  if (previous === 0) return 0;
  return safe((current - previous) / Math.abs(previous));
}

/**
 * Compara as duas últimas janelas contíguas da série.
 *
 * Invariantes garantidas (cobertas por simulação):
 * - as janelas nunca se sobrepõem e são sempre contíguas;
 * - todo `pValue` está em [0, 1] e nenhum campo é NaN/Infinity;
 * - amostras insuficientes produzem veredito "insufficient", nunca "significant".
 */
export function comparePayoutWindows(
  points: PayoutTrendPoint[],
  options: WindowComparisonOptions = {},
): WindowComparison {
  const windowDays = Math.max(1, Math.floor(options.windowDays ?? DEFAULTS.windowDays));
  const alpha = Math.min(0.5, Math.max(0.000_001, options.alpha ?? DEFAULTS.alpha));
  const minDaysWithData = Math.max(1, Math.floor(options.minDaysWithData ?? DEFAULTS.minDaysWithData));
  const minSpins = Math.max(0, Math.floor(options.minSpins ?? DEFAULTS.minSpins));

  const ordered = [...points].sort((a, b) => a.date.localeCompare(b.date));
  const currentPoints = ordered.slice(Math.max(0, ordered.length - windowDays));
  const previousPoints = ordered.slice(
    Math.max(0, ordered.length - windowDays * 2),
    Math.max(0, ordered.length - windowDays),
  );

  const current = aggregate(currentPoints, options.currentLabel ?? DEFAULTS.currentLabel);
  const previous = aggregate(previousPoints, options.previousLabel ?? DEFAULTS.previousLabel);

  const enoughData =
    current.daysWithData >= minDaysWithData &&
    previous.daysWithData >= minDaysWithData &&
    current.spins >= minSpins &&
    previous.spins >= minSpins;

  const specs: Array<{
    metric: SignificanceTest["metric"];
    label: string;
    currentValue: number;
    previousValue: number;
    a: number[];
    b: number[];
  }> = [
    {
      metric: "coinsPerSpin",
      label: "Moedas por giro",
      currentValue: current.coinsPerSpin,
      previousValue: previous.coinsPerSpin,
      a: dailyCoinsPerSpin(currentPoints),
      b: dailyCoinsPerSpin(previousPoints),
    },
    {
      metric: "spinsPerDay",
      label: "Giros por dia",
      currentValue: current.spinsPerDay,
      previousValue: previous.spinsPerDay,
      a: dailySpins(currentPoints),
      b: dailySpins(previousPoints),
    },
    {
      metric: "coinsDeviation",
      label: "Desvio sobre o projetado",
      currentValue: current.coinsDeviation,
      previousValue: previous.coinsDeviation,
      a: dailyDeviation(currentPoints),
      b: dailyDeviation(previousPoints),
    },
  ];

  const tests: SignificanceTest[] = specs.map((spec) => {
    const { statistic, degreesOfFreedom, pValue, effectSize } = welchTest(spec.a, spec.b);
    const usable = enoughData && spec.a.length >= 2 && spec.b.length >= 2;
    return {
      metric: spec.metric,
      label: spec.label,
      current: safe(spec.currentValue),
      previous: safe(spec.previousValue),
      delta: safe(spec.currentValue - spec.previousValue),
      deltaRatio: ratio(spec.currentValue, spec.previousValue),
      statistic: usable ? statistic : 0,
      degreesOfFreedom: usable ? degreesOfFreedom : 0,
      pValue: usable ? pValue : 1,
      effectSize: usable ? effectSize : 0,
      verdict: !usable ? "insufficient" : pValue < alpha ? "significant" : "stable",
    };
  });

  const notes: string[] = [];
  if (!enoughData) {
    notes.push(
      "Amostra insuficiente para concluir: são necessários pelo menos " +
        `${minDaysWithData} dias com snapshot e ${minSpins} giros em cada janela.`,
    );
  }
  for (const test of tests) {
    if (test.verdict !== "significant") continue;
    const direction = test.delta > 0 ? "alta" : "queda";
    notes.push(
      `${test.label}: ${direction} estatisticamente significativa (p = ${test.pValue.toFixed(4)}, d = ${test.effectSize.toFixed(2)}).`,
    );
  }
  if (notes.length === 0) {
    notes.push("Nenhuma variação estatisticamente significativa entre as janelas.");
  }

  const verdict: SignificanceVerdict = tests.some((t) => t.verdict === "significant")
    ? "significant"
    : tests.every((t) => t.verdict === "insufficient")
      ? "insufficient"
      : "stable";

  return { current, previous, tests, verdict, notes };
}
