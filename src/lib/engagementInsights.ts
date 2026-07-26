/**
 * Motor puro de insights automáticos do diagnóstico de clima.
 *
 * Consolida sinais heterogêneos (pilares, fatores, benchmark de mercado, eNPS/LNPS
 * e participação) numa lista priorizada e determinística de recomendações.
 * Toda a lógica é pura para permitir simulação exaustiva: os dados de origem já
 * passam pelas guardas de anonimato do banco, mas podem chegar sujos
 * (nulos, NaN, strings numéricas, contagens negativas) e o motor precisa
 * degradar com segurança em vez de emitir recomendação inválida.
 */

import { safeNumber } from "@/lib/climateBenchmark";
import type { PillarBenchmarkComparison } from "@/lib/climateBenchmark";

/** Respondentes mínimos para que um recorte gere recomendação. */
export const INSIGHT_MIN_RESPONDENTS = 5;

/** Amostra mínima da base de mercado para confiar num gap de benchmark. */
export const INSIGHT_MIN_BENCHMARK_SAMPLE = 30;

export type InsightSeverity = "critical" | "high" | "medium" | "info" | "positive";

export type InsightKind =
  | "pillar_critical"
  | "factor_weak"
  | "market_gap"
  | "nps_decline"
  | "low_participation"
  | "strength";

export interface EngagementInsight {
  /** Identificador estável — permite dedupe e chave de lista sem índice. */
  id: string;
  kind: InsightKind;
  severity: InsightSeverity;
  title: string;
  description: string;
  /** Ação recomendada, em linguagem de gestor. */
  recommendation: string;
  /** 0–100. Maior = mais urgente. Determina a ordenação. */
  priority: number;
  /** Chave do fator quando o insight permite gerar plano 5W2H direto. */
  factorKey?: string;
  pillar?: string;
}

export interface InsightPillarInput {
  pillar: string;
  score: number | null;
  favorability?: number | null;
  respondents: number;
}

export interface InsightFactorInput {
  factor_key: string;
  factor_name: string;
  pillar: string;
  score: number | null;
  respondents: number;
}

export interface InsightNpsInput {
  metric: string;
  score: number | null;
  respondents: number;
  /** Score do período anterior, quando houver série histórica. */
  previousScore?: number | null;
}

export interface InsightOverviewInput {
  participation_rate: number | null;
  respondents: number;
  eligible_users: number;
}

export interface InsightEngineInput {
  overview?: InsightOverviewInput | null;
  pillars?: InsightPillarInput[] | null;
  factors?: InsightFactorInput[] | null;
  benchmark?: PillarBenchmarkComparison[] | null;
  nps?: InsightNpsInput[] | null;
}

export const SEVERITY_LABEL: Record<InsightSeverity, string> = {
  critical: "Crítico",
  high: "Alta prioridade",
  medium: "Atenção",
  info: "Informativo",
  positive: "Ponto forte",
};

/** Classes de token semântico — nunca cores hard-coded. */
export const SEVERITY_CLASS: Record<InsightSeverity, string> = {
  critical: "bg-destructive/15 text-destructive border-destructive/30",
  high: "bg-warning/15 text-warning border-warning/30",
  medium: "bg-primary/15 text-primary border-primary/30",
  info: "bg-muted text-muted-foreground border-border",
  positive: "bg-success/15 text-success border-success/30",
};

const SEVERITY_RANK: Record<InsightSeverity, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  info: 3,
  positive: 4,
};

/** Respondentes válidos: inteiro finito >= 0. */
function respondentCount(value: unknown): number {
  const n = safeNumber(value);
  if (n === null || n < 0) return 0;
  return Math.floor(n);
}

/** Score válido de clima (escala 0–10). Fora da faixa é considerado inválido. */
function climateScore(value: unknown): number | null {
  const n = safeNumber(value);
  if (n === null || n < 0 || n > 10) return null;
  return n;
}

/** Score válido de NPS (escala −100 a 100). */
function npsScore(value: unknown): number | null {
  const n = safeNumber(value);
  if (n === null || n < -100 || n > 100) return null;
  return n;
}

/** Prioridade sempre inteira e dentro de 0–100. */
function clampPriority(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function round1(value: number): number {
  // Arredondamento simétrico: evita viés em valores negativos.
  return Math.sign(value) * Math.round(Math.abs(value) * 10) / 10;
}

function severityForScore(score: number): InsightSeverity {
  if (score < 4) return "critical";
  if (score < 6) return "high";
  return "medium";
}

function pillarInsights(pillars: InsightPillarInput[]): EngagementInsight[] {
  const out: EngagementInsight[] = [];
  for (const row of pillars) {
    const pillar = typeof row?.pillar === "string" ? row.pillar.trim() : "";
    if (!pillar) continue;
    const respondents = respondentCount(row?.respondents);
    if (respondents < INSIGHT_MIN_RESPONDENTS) continue;
    const score = climateScore(row?.score);
    if (score === null) continue;

    if (score < 6) {
      out.push({
        id: `pillar_critical:${pillar}`,
        kind: "pillar_critical",
        severity: severityForScore(score),
        pillar,
        title: `Pilar "${pillar}" abaixo do aceitável`,
        description: `Score ${round1(score).toFixed(1)}/10 com ${respondents} respondentes no recorte.`,
        recommendation:
          "Priorize um plano de ação 5W2H para este pilar e valide as causas com escuta qualificada antes do próximo ciclo.",
        priority: clampPriority(100 - score * 8),
      });
    } else if (score >= 8.5) {
      out.push({
        id: `strength:${pillar}`,
        kind: "strength",
        severity: "positive",
        pillar,
        title: `Pilar "${pillar}" é um ponto forte`,
        description: `Score ${round1(score).toFixed(1)}/10 com ${respondents} respondentes.`,
        recommendation:
          "Documente as práticas deste pilar e replique-as nas áreas com menor pontuação.",
        priority: clampPriority(score * 2),
      });
    }
  }
  return out;
}

function factorInsights(factors: InsightFactorInput[]): EngagementInsight[] {
  const out: EngagementInsight[] = [];
  for (const row of factors) {
    const key = typeof row?.factor_key === "string" ? row.factor_key.trim() : "";
    if (!key) continue;
    const respondents = respondentCount(row?.respondents);
    if (respondents < INSIGHT_MIN_RESPONDENTS) continue;
    const score = climateScore(row?.score);
    if (score === null || score >= 6) continue;

    const name = typeof row?.factor_name === "string" && row.factor_name.trim()
      ? row.factor_name.trim()
      : key;

    out.push({
      id: `factor_weak:${key}`,
      kind: "factor_weak",
      severity: severityForScore(score),
      factorKey: key,
      pillar: typeof row?.pillar === "string" ? row.pillar : undefined,
      title: `Fator "${name}" requer intervenção`,
      description: `Score ${round1(score).toFixed(1)}/10 com ${respondents} respondentes.`,
      recommendation:
        "Gere o plano de ação sugerido para o fator e defina responsável e prazo ainda neste ciclo.",
      priority: clampPriority(96 - score * 8),
    });
  }
  return out;
}

function benchmarkInsights(rows: PillarBenchmarkComparison[]): EngagementInsight[] {
  const out: EngagementInsight[] = [];
  for (const row of rows) {
    const pillar = typeof row?.pillar === "string" ? row.pillar.trim() : "";
    if (!pillar) continue;
    const sample = respondentCount(row?.sampleSize);
    if (sample < INSIGHT_MIN_BENCHMARK_SAMPLE) continue;
    const gap = safeNumber(row?.gap);
    if (gap === null || gap >= -0.5) continue;

    const magnitude = Math.abs(gap);
    out.push({
      id: `market_gap:${pillar}`,
      kind: "market_gap",
      severity: magnitude >= 1.5 ? "high" : "medium",
      pillar,
      title: `"${pillar}" está atrás do mercado`,
      description: `Gap de ${round1(gap).toFixed(1)} ponto(s) frente à média de mercado (base de ${sample} empresas).`,
      recommendation:
        "Compare práticas com o recorte de mercado equivalente e trate este pilar como meta do próximo trimestre.",
      priority: clampPriority(55 + magnitude * 15),
    });
  }
  return out;
}

function npsInsights(rows: InsightNpsInput[]): EngagementInsight[] {
  const out: EngagementInsight[] = [];
  for (const row of rows) {
    const metric = typeof row?.metric === "string" ? row.metric.trim() : "";
    if (!metric) continue;
    const respondents = respondentCount(row?.respondents);
    if (respondents < INSIGHT_MIN_RESPONDENTS) continue;
    const current = npsScore(row?.score);
    if (current === null) continue;
    const previous = npsScore(row?.previousScore);
    const delta = previous === null ? null : current - previous;

    const isNegative = current < 0;
    const isFalling = delta !== null && delta <= -10;
    if (!isNegative && !isFalling) continue;

    out.push({
      id: `nps_decline:${metric}`,
      kind: "nps_decline",
      severity: isNegative ? "critical" : "high",
      title: isNegative ? `${metric} negativo` : `${metric} em queda`,
      description:
        delta === null
          ? `${metric} atual de ${round1(current).toFixed(0)} com ${respondents} respondentes.`
          : `${metric} passou de ${round1(previous as number).toFixed(0)} para ${round1(current).toFixed(0)} (${round1(delta).toFixed(0)} pontos).`,
      recommendation:
        "Abra escuta com detratores e conecte a queda aos pilares críticos antes de comunicar novas iniciativas.",
      priority: clampPriority(isNegative ? 88 + Math.abs(current) / 10 : 70 + Math.abs(delta ?? 0) / 4),
    });
  }
  return out;
}

function participationInsight(overview: InsightOverviewInput): EngagementInsight | null {
  const eligible = respondentCount(overview?.eligible_users);
  const respondents = respondentCount(overview?.respondents);
  if (eligible <= 0) return null;

  const declared = safeNumber(overview?.participation_rate);
  const computed = (respondents / eligible) * 100;
  // A taxa declarada pelo banco tem precedência, mas fora de 0–100 é descartada.
  const rate = declared !== null && declared >= 0 && declared <= 100 ? declared : computed;
  if (!Number.isFinite(rate) || rate >= 60) return null;

  return {
    id: "low_participation",
    kind: "low_participation",
    severity: rate < 30 ? "critical" : "high",
    title: "Participação abaixo do recomendado",
    description: `${round1(rate).toFixed(0)}% de participação (${respondents} de ${eligible} elegíveis).`,
    recommendation:
      "Reforce a comunicação de anonimato e acione lideranças diretas — abaixo de 60% os resultados perdem representatividade.",
    priority: clampPriority(95 - rate),
  };
}

/**
 * Constrói a lista priorizada de insights.
 * Ordenação estável: severidade → prioridade desc → id asc.
 */
export function buildEngagementInsights(input: InsightEngineInput): EngagementInsight[] {
  const collected: EngagementInsight[] = [
    ...pillarInsights(Array.isArray(input?.pillars) ? input.pillars : []),
    ...factorInsights(Array.isArray(input?.factors) ? input.factors : []),
    ...benchmarkInsights(Array.isArray(input?.benchmark) ? input.benchmark : []),
    ...npsInsights(Array.isArray(input?.nps) ? input.nps : []),
  ];

  const participation = input?.overview ? participationInsight(input.overview) : null;
  if (participation) collected.push(participation);

  // Dedupe defensivo: entradas duplicadas na origem não podem duplicar recomendação.
  const byId = new Map<string, EngagementInsight>();
  for (const insight of collected) {
    const existing = byId.get(insight.id);
    if (!existing || insight.priority > existing.priority) byId.set(insight.id, insight);
  }

  return Array.from(byId.values()).sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.id.localeCompare(b.id);
  });
}

export interface InsightSummary {
  total: number;
  critical: number;
  actionable: number;
  strengths: number;
  topPriority: EngagementInsight | null;
}

export function summarizeInsights(insights: EngagementInsight[]): InsightSummary {
  const list = Array.isArray(insights) ? insights : [];
  const critical = list.filter((i) => i.severity === "critical").length;
  const strengths = list.filter((i) => i.severity === "positive").length;
  return {
    total: list.length,
    critical,
    actionable: list.filter((i) => i.severity !== "positive" && i.severity !== "info").length,
    strengths,
    topPriority: list.find((i) => i.severity !== "positive") ?? null,
  };
}
