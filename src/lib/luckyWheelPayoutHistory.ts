/**
 * Série histórica de payout da Roleta da Sorte.
 *
 * Motor PURO (sem I/O): recebe as linhas de `lucky_wheel_payout_snapshots`
 * geradas pelo cron diário e devolve uma série densa (dias sem snapshot viram
 * lacunas explícitas), com o valor crítico de χ² por dia, o desvio de custo e
 * a tendência linear — tudo pronto para gráfico e para leitura de auditoria.
 *
 * Toda a matemática vive aqui para poder ser simulada em centenas de cenários
 * antes de tocar a UI.
 */
import { chiSquareCritical } from "./luckyWheelPayoutAlerts";

/** Linha crua vinda do banco (tolerante a nulos e tipos textuais do PostgREST). */
export interface PayoutSnapshotRow {
  snapshot_date: string;
  spins?: number | string | null;
  unique_users?: number | string | null;
  coins_paid?: number | string | null;
  xp_paid?: number | string | null;
  projected_coins?: number | string | null;
  projected_xp?: number | string | null;
  chi_square?: number | string | null;
  degrees_of_freedom?: number | string | null;
  duplicate_spins?: number | string | null;
  unconfigured_spins?: number | string | null;
}

export type PayoutTrendStatus = "gap" | "insufficient" | "ok" | "warn" | "critical";

export interface PayoutTrendPoint {
  /** YYYY-MM-DD, sempre presente mesmo em dias sem snapshot. */
  date: string;
  /** `false` quando o dia não possui snapshot (lacuna preenchida). */
  present: boolean;
  spins: number;
  uniqueUsers: number;
  coinsPaid: number;
  xpPaid: number;
  projectedCoins: number;
  projectedXp: number;
  chiSquare: number;
  degreesOfFreedom: number;
  duplicateSpins: number;
  unconfiguredSpins: number;
  /** Limite de atenção de χ² para os graus de liberdade do dia (0 se indefinido). */
  chiWarn: number;
  /** Limite crítico de χ². */
  chiCritical: number;
  /** (pago - projetado) / projetado, em moedas. 0 quando não há projeção. */
  coinsDeviation: number;
  /** Idem para XP. */
  xpDeviation: number;
  status: PayoutTrendStatus;
}

export interface PayoutTrendSummary {
  days: number;
  daysWithData: number;
  gaps: number;
  totalSpins: number;
  totalCoinsPaid: number;
  totalProjectedCoins: number;
  totalXpPaid: number;
  totalProjectedXp: number;
  /** Desvio agregado de moedas no período. */
  coinsDeviation: number;
  xpDeviation: number;
  warnDays: number;
  criticalDays: number;
  /** Custo médio em moedas por giro (0 sem giros). */
  avgCoinsPerSpin: number;
  /** Inclinação da regressão linear do custo diário em moedas (moedas/dia). */
  coinsTrendPerDay: number;
  /** Inclinação da regressão de χ² normalizado (χ²/df) por dia. */
  chiTrendPerDay: number;
  worstDay: PayoutTrendPoint | null;
}

export interface PayoutTrendResult {
  points: PayoutTrendPoint[];
  summary: PayoutTrendSummary;
}

export interface PayoutTrendOptions {
  /** Amostra mínima de giros no dia para julgar a distribuição. Padrão: 50. */
  minSpins?: number;
  /** p-valor de atenção. Padrão: 0,01. */
  warnP?: number;
  /** p-valor crítico. Padrão: 0,0001. */
  criticalP?: number;
  /** Último dia da janela (YYYY-MM-DD). Padrão: maior data presente. */
  endDate?: string;
  /** Tamanho da janela em dias. Padrão: cobre da menor à maior data. */
  days?: number;
}

const DAY_MS = 86_400_000;
const DEFAULTS = { minSpins: 50, warnP: 0.01, criticalP: 0.0001 } as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function num(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function nonNegative(value: unknown): number {
  const n = num(value);
  return n > 0 ? n : 0;
}

/** Aceita apenas datas ISO válidas de calendário (rejeita 2024-02-31). */
export function isValidDay(date: string): boolean {
  if (typeof date !== "string" || !DATE_RE.test(date)) return false;
  const ts = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(ts)) return false;
  return new Date(ts).toISOString().slice(0, 10) === date;
}

function shiftDay(date: string, delta: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + delta * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

function deviation(actual: number, projected: number): number {
  if (projected <= 0) return 0;
  return (actual - projected) / projected;
}

/** Regressão linear simples: devolve a inclinação por passo de índice. */
function slope(values: Array<{ x: number; y: number }>): number {
  if (values.length < 2) return 0;
  const n = values.length;
  const meanX = values.reduce((acc, v) => acc + v.x, 0) / n;
  const meanY = values.reduce((acc, v) => acc + v.y, 0) / n;
  let cov = 0;
  let varX = 0;
  for (const v of values) {
    cov += (v.x - meanX) * (v.y - meanY);
    varX += (v.x - meanX) ** 2;
  }
  if (varX <= 0) return 0;
  const s = cov / varX;
  return Number.isFinite(s) ? s : 0;
}

function emptyPoint(date: string): PayoutTrendPoint {
  return {
    date,
    present: false,
    spins: 0,
    uniqueUsers: 0,
    coinsPaid: 0,
    xpPaid: 0,
    projectedCoins: 0,
    projectedXp: 0,
    chiSquare: 0,
    degreesOfFreedom: 0,
    duplicateSpins: 0,
    unconfiguredSpins: 0,
    chiWarn: 0,
    chiCritical: 0,
    coinsDeviation: 0,
    xpDeviation: 0,
    status: "gap",
  };
}

/**
 * Consolida linhas duplicadas do mesmo dia somando volumes e mantendo o pior
 * χ² observado — reexecuções do cron nunca inflam a série.
 */
function foldRows(rows: PayoutSnapshotRow[]): Map<string, PayoutTrendPoint> {
  const byDay = new Map<string, PayoutTrendPoint>();
  for (const row of rows) {
    const date = typeof row?.snapshot_date === "string" ? row.snapshot_date.slice(0, 10) : "";
    if (!isValidDay(date)) continue;

    const current = byDay.get(date) ?? { ...emptyPoint(date), present: true };
    const chi = nonNegative(row.chi_square);
    const df = Math.max(0, Math.floor(nonNegative(row.degrees_of_freedom)));

    byDay.set(date, {
      ...current,
      present: true,
      spins: current.spins + nonNegative(row.spins),
      uniqueUsers: Math.max(current.uniqueUsers, nonNegative(row.unique_users)),
      coinsPaid: current.coinsPaid + nonNegative(row.coins_paid),
      xpPaid: current.xpPaid + nonNegative(row.xp_paid),
      projectedCoins: current.projectedCoins + nonNegative(row.projected_coins),
      projectedXp: current.projectedXp + nonNegative(row.projected_xp),
      chiSquare: Math.max(current.chiSquare, chi),
      degreesOfFreedom: Math.max(current.degreesOfFreedom, df),
      duplicateSpins: current.duplicateSpins + nonNegative(row.duplicate_spins),
      unconfiguredSpins: current.unconfiguredSpins + nonNegative(row.unconfigured_spins),
    });
  }
  return byDay;
}

/**
 * Constrói a série densa e o resumo do período.
 *
 * Invariantes garantidas (cobertas por simulação):
 * - `points` sempre em ordem cronológica crescente, sem datas repetidas;
 * - dias sem snapshot aparecem com `present: false` e `status: "gap"`;
 * - nenhum campo numérico é `NaN`/`Infinity`, mesmo com entrada hostil;
 * - os totais do resumo somam exatamente os pontos presentes.
 */
export function buildPayoutTrend(
  rows: PayoutSnapshotRow[],
  options: PayoutTrendOptions = {},
): PayoutTrendResult {
  const minSpins = Math.max(0, Math.floor(options.minSpins ?? DEFAULTS.minSpins));
  const warnP = options.warnP ?? DEFAULTS.warnP;
  const criticalP = options.criticalP ?? DEFAULTS.criticalP;

  const byDay = foldRows(Array.isArray(rows) ? rows : []);
  const known = [...byDay.keys()].sort();

  const end = isValidDay(options.endDate ?? "")
    ? (options.endDate as string)
    : known[known.length - 1];

  if (!end) {
    return {
      points: [],
      summary: {
        days: 0, daysWithData: 0, gaps: 0, totalSpins: 0, totalCoinsPaid: 0,
        totalProjectedCoins: 0, totalXpPaid: 0, totalProjectedXp: 0,
        coinsDeviation: 0, xpDeviation: 0, warnDays: 0, criticalDays: 0,
        avgCoinsPerSpin: 0, coinsTrendPerDay: 0, chiTrendPerDay: 0, worstDay: null,
      },
    };
  }

  const requested = options.days && Number.isFinite(options.days)
    ? Math.min(365, Math.max(1, Math.floor(options.days)))
    : null;
  const span = requested ?? Math.min(365, Math.max(1, daysBetween(known[0], end) + 1));
  const start = shiftDay(end, -(span - 1));

  const points: PayoutTrendPoint[] = [];
  for (let i = 0; i < span; i += 1) {
    const date = shiftDay(start, i);
    const found = byDay.get(date);
    if (!found) {
      points.push(emptyPoint(date));
      continue;
    }

    const df = found.degreesOfFreedom;
    const chiWarn = df >= 1 ? chiSquareCritical(df, warnP) : 0;
    const chiCritical = df >= 1 ? chiSquareCritical(df, criticalP) : 0;

    let status: PayoutTrendStatus = "ok";
    if (found.spins < minSpins || df < 1) {
      status = "insufficient";
    } else if (chiCritical > 0 && found.chiSquare > chiCritical) {
      status = "critical";
    } else if (chiWarn > 0 && found.chiSquare > chiWarn) {
      status = "warn";
    }

    points.push({
      ...found,
      chiWarn,
      chiCritical,
      coinsDeviation: deviation(found.coinsPaid, found.projectedCoins),
      xpDeviation: deviation(found.xpPaid, found.projectedXp),
      status,
    });
  }

  const present = points.filter((p) => p.present);
  const totalSpins = present.reduce((acc, p) => acc + p.spins, 0);
  const totalCoinsPaid = present.reduce((acc, p) => acc + p.coinsPaid, 0);
  const totalProjectedCoins = present.reduce((acc, p) => acc + p.projectedCoins, 0);
  const totalXpPaid = present.reduce((acc, p) => acc + p.xpPaid, 0);
  const totalProjectedXp = present.reduce((acc, p) => acc + p.projectedXp, 0);

  const worstDay = present.reduce<PayoutTrendPoint | null>((worst, p) => {
    if (p.status !== "warn" && p.status !== "critical") return worst;
    if (!worst) return p;
    const ratio = (x: PayoutTrendPoint) => (x.chiCritical > 0 ? x.chiSquare / x.chiCritical : 0);
    return ratio(p) > ratio(worst) ? p : worst;
  }, null);

  return {
    points,
    summary: {
      days: points.length,
      daysWithData: present.length,
      gaps: points.length - present.length,
      totalSpins,
      totalCoinsPaid,
      totalProjectedCoins,
      totalXpPaid,
      totalProjectedXp,
      coinsDeviation: deviation(totalCoinsPaid, totalProjectedCoins),
      xpDeviation: deviation(totalXpPaid, totalProjectedXp),
      warnDays: present.filter((p) => p.status === "warn").length,
      criticalDays: present.filter((p) => p.status === "critical").length,
      avgCoinsPerSpin: totalSpins > 0 ? totalCoinsPaid / totalSpins : 0,
      coinsTrendPerDay: slope(present.map((p, i) => ({ x: i, y: p.coinsPaid }))),
      chiTrendPerDay: slope(
        present
          .filter((p) => p.degreesOfFreedom >= 1)
          .map((p, i) => ({ x: i, y: p.chiSquare / p.degreesOfFreedom })),
      ),
      worstDay,
    },
  };
}

/* ------------------------------------------------------------------ *
 * Exportação CSV auditável da série histórica
 * ------------------------------------------------------------------ */

const CSV_INJECTION_RE = /^[=+\-@\t\r]/;

/** Neutraliza fórmulas (CSV injection) e normaliza quebras de linha. */
function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).replace(/\r\n|\r|\n/g, " ").trim();
  return CSV_INJECTION_RE.test(raw) ? `'${raw}` : raw;
}

function cell(value: unknown): string {
  const s = sanitizeCell(value);
  return /[",;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvLine(cells: readonly unknown[]): string {
  return cells.map(cell).join(",");
}

function fixed(value: number, decimals = 2): string {
  return Number.isFinite(value) ? value.toFixed(decimals) : "0";
}

const STATUS_PT: Record<PayoutTrendStatus, string> = {
  gap: "Sem snapshot",
  insufficient: "Amostra insuficiente",
  ok: "Normal",
  warn: "Atenção",
  critical: "Crítico",
};

export interface PayoutTrendCsvMeta {
  periodLabel?: string;
  generatedAt?: string;
}

/**
 * Gera o CSV auditável da série histórica (cabeçalho de contexto + resumo +
 * série densa dia a dia, incluindo lacunas). Função pura para permitir
 * simulação massiva.
 */
export function buildPayoutTrendCsv(result: PayoutTrendResult, meta: PayoutTrendCsvMeta = {}): string {
  const lines: string[] = [];
  const { summary, points } = result;

  lines.push(csvLine(["Série histórica de payout — Roleta da Sorte"]));
  lines.push(csvLine(["Período", meta.periodLabel ?? "não informado"]));
  lines.push(csvLine(["Gerado em", meta.generatedAt ?? new Date().toISOString()]));
  lines.push("");

  lines.push(csvLine(["Indicador", "Valor"]));
  lines.push(csvLine(["Dias na janela", summary.days]));
  lines.push(csvLine(["Dias com snapshot", summary.daysWithData]));
  lines.push(csvLine(["Lacunas", summary.gaps]));
  lines.push(csvLine(["Giros", summary.totalSpins]));
  lines.push(csvLine(["Moedas pagas", summary.totalCoinsPaid]));
  lines.push(csvLine(["Moedas projetadas", fixed(summary.totalProjectedCoins)]));
  lines.push(csvLine(["Desvio de moedas", fixed(summary.coinsDeviation, 4)]));
  lines.push(csvLine(["XP pago", summary.totalXpPaid]));
  lines.push(csvLine(["XP projetado", fixed(summary.totalProjectedXp)]));
  lines.push(csvLine(["Desvio de XP", fixed(summary.xpDeviation, 4)]));
  lines.push(csvLine(["Dias em atenção", summary.warnDays]));
  lines.push(csvLine(["Dias críticos", summary.criticalDays]));
  lines.push(csvLine(["Moedas por giro", fixed(summary.avgCoinsPerSpin, 4)]));
  lines.push(csvLine(["Tendência de custo (moedas/dia)", fixed(summary.coinsTrendPerDay, 4)]));
  lines.push(csvLine(["Tendência de χ²/gl por dia", fixed(summary.chiTrendPerDay, 4)]));
  lines.push(csvLine(["Pior dia", summary.worstDay ? summary.worstDay.date : "n/d"]));
  lines.push("");

  lines.push(
    csvLine([
      "Dia",
      "Snapshot",
      "Situação",
      "Giros",
      "Participantes",
      "Moedas pagas",
      "Moedas projetadas",
      "Desvio moedas",
      "XP pago",
      "XP projetado",
      "Desvio XP",
      "Qui-quadrado",
      "Graus de liberdade",
      "Limite atenção",
      "Limite crítico",
      "χ²/limite crítico",
      "Giros duplicados",
      "Giros fora da calibração",
    ]),
  );
  for (const p of points) {
    lines.push(
      csvLine([
        p.date,
        p.present ? "sim" : "não",
        STATUS_PT[p.status] ?? p.status,
        p.spins,
        p.uniqueUsers,
        p.coinsPaid,
        fixed(p.projectedCoins),
        fixed(p.coinsDeviation, 4),
        p.xpPaid,
        fixed(p.projectedXp),
        fixed(p.xpDeviation, 4),
        fixed(p.chiSquare, 4),
        p.degreesOfFreedom,
        fixed(p.chiWarn, 4),
        fixed(p.chiCritical, 4),
        p.chiCritical > 0 ? fixed(p.chiSquare / p.chiCritical, 4) : "",
        p.duplicateSpins,
        p.unconfiguredSpins,
      ]),
    );
  }

  return lines.join("\n");
}