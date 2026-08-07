import { logger } from "./loggingService";

/**
 * Predictive Feedback Service — Item #4 do backlog.
 *
 * Módulo puro (sem I/O) que consome métricas já disponíveis do usuário
 * (streak, XP recente, pontualidade, dias inativo) e projeta um sinal
 * de engajamento futuro com sugestões acionáveis.
 *
 * Determinístico e testável em isolamento — ideal para uso em widgets
 * do dashboard, no AI Coach e em alertas de gestor.
 */

export interface EngagementSignals {
  streak: number;
  daysInactive: number;
  recentXpGain: number;
  punctualityRate: number; // 0..1
  questsCompleted7d: number;
}

export type EngagementTrend = "rising" | "stable" | "declining" | "critical";

export interface PredictiveFeedback {
  score: number; // 0..100
  trend: EngagementTrend;
  headline: string;
  suggestions: string[];
  confidence: number; // 0..1
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

const WEIGHTS = {
  streak: 0.25,
  inactivity: 0.30,
  xp: 0.20,
  punctuality: 0.15,
  quests: 0.10,
} as const;

function normalizeSignals(s: EngagementSignals) {
  return {
    streak: clamp(s.streak / 14, 0, 1),
    inactivity: clamp(1 - s.daysInactive / 7, 0, 1),
    xp: clamp(s.recentXpGain / 500, 0, 1),
    punctuality: clamp(s.punctualityRate, 0, 1),
    quests: clamp(s.questsCompleted7d / 10, 0, 1),
  };
}

export function computeEngagementScore(s: EngagementSignals): number {
  const n = normalizeSignals(s);
  const raw =
    n.streak * WEIGHTS.streak +
    n.inactivity * WEIGHTS.inactivity +
    n.xp * WEIGHTS.xp +
    n.punctuality * WEIGHTS.punctuality +
    n.quests * WEIGHTS.quests;
  return Math.round(raw * 100);
}

export function classifyTrend(score: number, daysInactive: number): EngagementTrend {
  if (daysInactive >= 7 || score < 25) return "critical";
  if (score < 45) return "declining";
  if (score < 70) return "stable";
  return "rising";
}

function buildSuggestions(s: EngagementSignals, trend: EngagementTrend): string[] {
  const out: string[] = [];
  if (s.daysInactive >= 3) out.push("Faça o check-in de hoje para reativar seu streak.");
  if (s.punctualityRate < 0.7) out.push("Melhore sua pontualidade — impacta direto no ranking.");
  if (s.questsCompleted7d < 3) out.push("Complete ao menos 3 quests esta semana para ganhar bônus.");
  if (s.recentXpGain < 100) out.push("Explore trilhas curtas de aprendizagem para XP rápido.");
  if (trend === "rising" && out.length === 0) out.push("Excelente ritmo — mantenha para subir de liga!");
  return out.slice(0, 3);
}

function buildHeadline(trend: EngagementTrend): string {
  switch (trend) {
    case "critical": return "Engajamento crítico — ação imediata recomendada.";
    case "declining": return "Engajamento em queda — pequenas ações revertem a tendência.";
    case "stable": return "Engajamento estável — há espaço para acelerar.";
    case "rising": return "Engajamento em alta — continue nesse ritmo.";
  }
}

function computeConfidence(s: EngagementSignals): number {
  // Confiança cresce com o volume de sinal disponível.
  const evidence =
    (s.streak > 0 ? 1 : 0) +
    (s.questsCompleted7d > 0 ? 1 : 0) +
    (s.recentXpGain > 0 ? 1 : 0) +
    (s.punctualityRate > 0 ? 1 : 0);
  return clamp(0.4 + evidence * 0.15, 0.4, 1);
}

export function predictEngagement(signals: EngagementSignals): PredictiveFeedback {
  try {
    const score = computeEngagementScore(signals);
    const trend = classifyTrend(score, signals.daysInactive);
    return {
      score,
      trend,
      headline: buildHeadline(trend),
      suggestions: buildSuggestions(signals, trend),
      confidence: computeConfidence(signals),
    };
  } catch (err) {
    logger.apiError("predictEngagement", err, "predictiveFeedbackService");
    return {
      score: 0,
      trend: "critical",
      headline: "Não foi possível calcular o feedback preditivo.",
      suggestions: [],
      confidence: 0,
    };
  }
}

export const predictiveFeedbackService = {
  predictEngagement,
  computeEngagementScore,
  classifyTrend,
};