/**
 * Utilitários puros para a série histórica de eNPS / LNPS.
 *
 * O cálculo canônico acontece no banco (RPC `get_engagement_nps_history`),
 * mas a UI precisa de derivações determinísticas e resistentes a dados sujos
 * (nulos, NaN, períodos fora de ordem, totais inconsistentes). Manter essa
 * lógica pura permite simulá-la exaustivamente em testes.
 */

export type NpsMetricKey = "eNPS" | "LNPS";

export interface NpsHistoryPoint {
  metric: string;
  period_start: string;
  score: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  respondents: number;
}

export interface NpsSeriesPoint {
  periodStart: string;
  label: string;
  score: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  respondents: number;
}

export interface NpsSeries {
  metric: string;
  points: NpsSeriesPoint[];
  latest: number | null;
  previous: number | null;
  delta: number | null;
  trend: NpsTrend;
  best: number | null;
  worst: number | null;
}

export type NpsTrend = "up" | "down" | "flat" | "unknown";
export type NpsZone = "critical" | "attention" | "good" | "excellent" | "unknown";

const SAFE_INT = (value: unknown): number => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
};

/** Score NPS a partir das contagens; `null` quando não há base. */
export function computeNpsScore(
  promoters: unknown,
  passives: unknown,
  detractors: unknown,
): number | null {
  const p = SAFE_INT(promoters);
  const n = SAFE_INT(passives);
  const d = SAFE_INT(detractors);
  const total = p + n + d;
  if (total === 0) return null;
  const raw = (100 * (p - d)) / total;
  return Math.max(-100, Math.min(100, Math.round(raw)));
}

/** Zona de leitura do NPS conforme benchmark de mercado. */
export function npsZone(score: number | null | undefined): NpsZone {
  if (score === null || score === undefined || !Number.isFinite(score)) return "unknown";
  if (score < 0) return "critical";
  if (score < 30) return "attention";
  if (score < 70) return "good";
  return "excellent";
}

export const NPS_ZONE_LABEL: Record<NpsZone, string> = {
  critical: "Zona crítica",
  attention: "Zona de aperfeiçoamento",
  good: "Zona de qualidade",
  excellent: "Zona de excelência",
  unknown: "Sem dados suficientes",
};

/** Tendência entre dois pontos, com faixa morta de 1 ponto para evitar ruído. */
export function npsTrend(latest: number | null, previous: number | null): NpsTrend {
  if (latest === null || previous === null) return "unknown";
  if (!Number.isFinite(latest) || !Number.isFinite(previous)) return "unknown";
  const delta = latest - previous;
  if (Math.abs(delta) < 1) return "flat";
  return delta > 0 ? "up" : "down";
}

/** Rótulo curto do período (ex.: "jul/26"), tolerante a datas inválidas. */
export function formatPeriodLabel(periodStart: string, bucket: "month" | "week" = "month"): string {
  const date = new Date(`${periodStart}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return periodStart ?? "—";
  if (bucket === "week") {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  })
    .format(date)
    .replace(".", "");
}

/**
 * Agrupa os pontos crus por métrica, ordena cronologicamente e deriva
 * indicadores de tendência. Linhas inválidas são descartadas em silêncio.
 */
export function buildNpsSeries(
  rows: readonly NpsHistoryPoint[] | null | undefined,
  bucket: "month" | "week" = "month",
): NpsSeries[] {
  const grouped = new Map<string, NpsSeriesPoint[]>();

  for (const row of rows ?? []) {
    if (!row || typeof row.metric !== "string" || !row.metric.trim()) continue;
    if (typeof row.period_start !== "string" || !row.period_start.trim()) continue;

    const promoters = SAFE_INT(row.promoters);
    const passives = SAFE_INT(row.passives);
    const detractors = SAFE_INT(row.detractors);
    const score =
      typeof row.score === "number" && Number.isFinite(row.score)
        ? Math.max(-100, Math.min(100, Math.round(row.score)))
        : computeNpsScore(promoters, passives, detractors);

    const list = grouped.get(row.metric) ?? [];
    list.push({
      periodStart: row.period_start,
      label: formatPeriodLabel(row.period_start, bucket),
      score,
      promoters,
      passives,
      detractors,
      respondents: SAFE_INT(row.respondents),
    });
    grouped.set(row.metric, list);
  }

  return [...grouped.entries()]
    .map(([metric, points]) => {
      const sorted = [...points].sort((a, b) => a.periodStart.localeCompare(b.periodStart));
      const scored = sorted.map((p) => p.score).filter((s): s is number => s !== null);
      const latest = scored.length ? scored[scored.length - 1] : null;
      const previous = scored.length > 1 ? scored[scored.length - 2] : null;
      return {
        metric,
        points: sorted,
        latest,
        previous,
        delta: latest !== null && previous !== null ? latest - previous : null,
        trend: npsTrend(latest, previous),
        best: scored.length ? Math.max(...scored) : null,
        worst: scored.length ? Math.min(...scored) : null,
      } satisfies NpsSeries;
    })
    .sort((a, b) => a.metric.localeCompare(b.metric));
}
