/**
 * Utilitários puros para a comparação de clima interno × benchmark de mercado.
 *
 * O cálculo canônico dos scores acontece no banco (RPC
 * `get_engagement_pillar_benchmark`), mas a leitura executiva (gap, posição
 * competitiva, ordenação e sumário) precisa ser determinística e resistente a
 * dados sujos (nulos, NaN, strings numéricas, referências invertidas).
 * Mantendo a lógica pura conseguimos simulá-la exaustivamente em testes.
 */

import type { ClimatePillar } from "@/services/climateSurveyService";

/** Linha crua devolvida pela RPC de benchmark. */
export interface PillarBenchmarkRow {
  pillar: ClimatePillar | string;
  score: number | null;
  favorability: number | null;
  respondents: number;
  benchmark_average: number | null;
  benchmark_top_quartile: number | null;
  benchmark_top_10: number | null;
  benchmark_sample_size: number | null;
  /** Recorte efetivamente aplicado pelo fallback do banco. */
  benchmark_industry?: string | null;
  benchmark_company_size?: string | null;
}

/** Posição competitiva do recorte frente ao mercado. */
export type BenchmarkPosition =
  | "top_10"
  | "top_quartile"
  | "above_average"
  | "below_average"
  | "unknown";

export interface PillarBenchmarkComparison {
  pillar: string;
  score: number | null;
  favorability: number | null;
  respondents: number;
  average: number | null;
  topQuartile: number | null;
  top10: number | null;
  sampleSize: number;
  /** score − média de mercado, arredondado em 1 casa. `null` sem base. */
  gap: number | null;
  position: BenchmarkPosition;
}

export interface BenchmarkSummary {
  comparable: number;
  aboveMarket: number;
  belowMarket: number;
  topPerformers: number;
  /** Média dos gaps comparáveis, 1 casa. `null` quando não há base. */
  averageGap: number | null;
  strongest: PillarBenchmarkComparison | null;
  weakest: PillarBenchmarkComparison | null;
}

export const BENCHMARK_POSITION_LABEL: Record<BenchmarkPosition, string> = {
  top_10: "Top 10% do mercado",
  top_quartile: "Top 25% do mercado",
  above_average: "Acima da média",
  below_average: "Abaixo da média",
  unknown: "Sem referência",
};

/** Classes de token semântico por posição — nunca cores hard-coded. */
export const BENCHMARK_POSITION_CLASS: Record<BenchmarkPosition, string> = {
  top_10: "bg-success/15 text-success border-success/30",
  top_quartile: "bg-primary/15 text-primary border-primary/30",
  above_average: "bg-muted text-muted-foreground border-border",
  below_average: "bg-destructive/15 text-destructive border-destructive/30",
  unknown: "bg-muted text-muted-foreground border-border",
};

/** Converte qualquer entrada para número finito ou `null`. */
export function safeNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Arredondamento simétrico (half away from zero) — evita viés em gaps negativos. */
function round1(value: number): number {
  const sign = value < 0 ? -1 : 1;
  return (sign * Math.round(Math.abs(value) * 10)) / 10;
}

/** Inteiro não negativo; qualquer lixo vira 0. */
function safeCount(value: unknown): number {
  const n = safeNumber(value);
  if (n === null || n < 0) return 0;
  return Math.floor(n);
}

/**
 * Normaliza os limiares de mercado garantindo monotonicidade
 * (média ≤ top 25% ≤ top 10%), mesmo se a fonte vier invertida.
 */
export function normalizeThresholds(
  average: unknown,
  topQuartile: unknown,
  top10: unknown,
): { average: number | null; topQuartile: number | null; top10: number | null } {
  const avg = safeNumber(average);
  let tq = safeNumber(topQuartile);
  let t10 = safeNumber(top10);

  if (avg !== null && tq !== null && tq < avg) tq = avg;
  if (tq !== null && t10 !== null && t10 < tq) t10 = tq;
  if (tq === null && avg !== null && t10 !== null && t10 < avg) t10 = avg;

  return { average: avg, topQuartile: tq, top10: t10 };
}

/** Posição competitiva a partir do score e dos limiares já normalizados. */
export function benchmarkPosition(
  score: number | null,
  thresholds: { average: number | null; topQuartile: number | null; top10: number | null },
): BenchmarkPosition {
  if (score === null || thresholds.average === null) return "unknown";
  if (thresholds.top10 !== null && score >= thresholds.top10) return "top_10";
  if (thresholds.topQuartile !== null && score >= thresholds.topQuartile) return "top_quartile";
  if (score >= thresholds.average) return "above_average";
  return "below_average";
}

/** Converte uma linha crua em comparação pronta para a UI. */
export function toComparison(row: PillarBenchmarkRow): PillarBenchmarkComparison {
  const score = safeNumber(row?.score);
  const thresholds = normalizeThresholds(
    row?.benchmark_average,
    row?.benchmark_top_quartile,
    row?.benchmark_top_10,
  );
  const gap =
    score !== null && thresholds.average !== null ? round1(score - thresholds.average) : null;

  return {
    pillar: String(row?.pillar ?? ""),
    score,
    favorability: safeNumber(row?.favorability),
    respondents: safeCount(row?.respondents),
    average: thresholds.average,
    topQuartile: thresholds.topQuartile,
    top10: thresholds.top10,
    sampleSize: safeCount(row?.benchmark_sample_size),
    gap,
    position: benchmarkPosition(score, thresholds),
  };
}

/**
 * Ordena por gap crescente (pior primeiro) — pilares sem referência vão para o
 * fim. Empates resolvidos pelo nome do pilar para garantir determinismo.
 */
export function buildBenchmarkComparisons(
  rows: PillarBenchmarkRow[] | null | undefined,
): PillarBenchmarkComparison[] {
  const list = (Array.isArray(rows) ? rows : []).map(toComparison);
  return list.sort((a, b) => {
    if (a.gap === null && b.gap === null) return a.pillar.localeCompare(b.pillar);
    if (a.gap === null) return 1;
    if (b.gap === null) return -1;
    if (a.gap !== b.gap) return a.gap - b.gap;
    return a.pillar.localeCompare(b.pillar);
  });
}

/** Sumário executivo do recorte comparado ao mercado. */
export function summarizeBenchmark(
  comparisons: PillarBenchmarkComparison[] | null | undefined,
): BenchmarkSummary {
  const list = (Array.isArray(comparisons) ? comparisons : []).filter((c) => c.gap !== null);

  if (list.length === 0) {
    return {
      comparable: 0,
      aboveMarket: 0,
      belowMarket: 0,
      topPerformers: 0,
      averageGap: null,
      strongest: null,
      weakest: null,
    };
  }

  const aboveMarket = list.filter((c) => (c.gap as number) >= 0).length;
  const topPerformers = list.filter(
    (c) => c.position === "top_10" || c.position === "top_quartile",
  ).length;
  const total = list.reduce((sum, c) => sum + (c.gap as number), 0);

  const sorted = [...list].sort((a, b) => {
    const diff = (a.gap as number) - (b.gap as number);
    return diff !== 0 ? diff : a.pillar.localeCompare(b.pillar);
  });

  return {
    comparable: list.length,
    aboveMarket,
    belowMarket: list.length - aboveMarket,
    topPerformers,
    averageGap: round1(total / list.length),
    strongest: sorted[sorted.length - 1] ?? null,
    weakest: sorted[0] ?? null,
  };
}

/** Rótulo curto do gap, sempre com sinal explícito. */
export function formatGap(gap: number | null): string {
  if (gap === null) return "—";
  const value = round1(gap);
  if (value === 0) return "0,0";
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1).replace(".", ",")}`;
}

/* ------------------------------------------------------------------ *
 * Segmentação de benchmark (setor × porte)                            *
 * ------------------------------------------------------------------ */

export const BENCHMARK_INDUSTRIES = [
  { value: "geral", label: "Todos os setores" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "industria", label: "Indústria" },
  { value: "comercio", label: "Comércio / Varejo" },
  { value: "servicos", label: "Serviços" },
  { value: "saude", label: "Saúde" },
  { value: "educacao", label: "Educação" },
  { value: "financeiro", label: "Financeiro" },
] as const;

export const BENCHMARK_COMPANY_SIZES = [
  { value: "all", label: "Todos os portes" },
  { value: "small", label: "Pequena (até 99)" },
  { value: "medium", label: "Média (100–499)" },
  { value: "large", label: "Grande (500–1999)" },
  { value: "enterprise", label: "Corporação (2000+)" },
] as const;

export type BenchmarkIndustry = (typeof BENCHMARK_INDUSTRIES)[number]["value"];
export type BenchmarkCompanySize = (typeof BENCHMARK_COMPANY_SIZES)[number]["value"];

export const DEFAULT_BENCHMARK_INDUSTRY: BenchmarkIndustry = "geral";
export const DEFAULT_BENCHMARK_COMPANY_SIZE: BenchmarkCompanySize = "all";

const INDUSTRY_VALUES = new Set<string>(BENCHMARK_INDUSTRIES.map((i) => i.value));
const SIZE_VALUES = new Set<string>(BENCHMARK_COMPANY_SIZES.map((s) => s.value));

/** Sanitiza entrada de setor — valores desconhecidos caem no recorte geral. */
export function normalizeIndustry(value: unknown): BenchmarkIndustry {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (INDUSTRY_VALUES.has(key) ? key : DEFAULT_BENCHMARK_INDUSTRY) as BenchmarkIndustry;
}

/** Sanitiza entrada de porte — valores desconhecidos caem em "todos os portes". */
export function normalizeCompanySize(value: unknown): BenchmarkCompanySize {
  const key = typeof value === "string" ? value.trim().toLowerCase() : "";
  return (SIZE_VALUES.has(key) ? key : DEFAULT_BENCHMARK_COMPANY_SIZE) as BenchmarkCompanySize;
}

export function industryLabel(value: unknown): string {
  const key = normalizeIndustry(value);
  return BENCHMARK_INDUSTRIES.find((i) => i.value === key)?.label ?? key;
}

export function companySizeLabel(value: unknown): string {
  const key = normalizeCompanySize(value);
  return BENCHMARK_COMPANY_SIZES.find((s) => s.value === key)?.label ?? key;
}

/**
 * Cadeia de fallback aplicada no banco, replicada aqui para exibição e testes:
 * exato → setor/todos os portes → geral/porte → geral/todos.
 */
export function benchmarkFallbackChain(
  industry: unknown,
  companySize: unknown,
): Array<{ industry: BenchmarkIndustry; companySize: BenchmarkCompanySize }> {
  const ind = normalizeIndustry(industry);
  const size = normalizeCompanySize(companySize);
  const chain: Array<{ industry: BenchmarkIndustry; companySize: BenchmarkCompanySize }> = [
    { industry: ind, companySize: size },
    { industry: ind, companySize: DEFAULT_BENCHMARK_COMPANY_SIZE },
    { industry: DEFAULT_BENCHMARK_INDUSTRY, companySize: size },
    { industry: DEFAULT_BENCHMARK_INDUSTRY, companySize: DEFAULT_BENCHMARK_COMPANY_SIZE },
  ];
  const seen = new Set<string>();
  return chain.filter((c) => {
    const k = `${c.industry}|${c.companySize}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Descreve o recorte realmente aplicado nas linhas retornadas, sinalizando
 * quando o banco precisou recorrer a um recorte mais amplo que o solicitado.
 */
export function describeAppliedSegment(
  rows: PillarBenchmarkRow[] | null | undefined,
  requestedIndustry: unknown,
  requestedSize: unknown,
): { label: string; isFallback: boolean } {
  const reqInd = normalizeIndustry(requestedIndustry);
  const reqSize = normalizeCompanySize(requestedSize);
  const applied = (Array.isArray(rows) ? rows : []).find(
    (r) => r?.benchmark_industry || r?.benchmark_company_size,
  );
  const ind = normalizeIndustry(applied?.benchmark_industry ?? reqInd);
  const size = normalizeCompanySize(applied?.benchmark_company_size ?? reqSize);
  return {
    label: `${industryLabel(ind)} · ${companySizeLabel(size)}`,
    isFallback: ind !== reqInd || size !== reqSize,
  };
}
