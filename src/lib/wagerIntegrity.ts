/**
 * Motor de integridade e detecção de anomalias da Pergunta do Dia (Wager).
 *
 * Por que existe: a mecânica de aposta movimenta moedas reais da economia
 * interna. Sem vigilância estatística, conluio (respostas vazadas), contas
 * duplicadas ou erros de gabarito passam despercebidos e drenam o orçamento.
 *
 * Premissas explícitas:
 * - O cálculo é 100% determinístico e puro (mesma entrada => mesma saída).
 * - Amostras pequenas NÃO geram acusação: abaixo de `minEntries` o jogador é
 *   apenas observado, nunca sinalizado por acurácia.
 * - O motor sinaliza SUSPEITA, jamais culpa. A decisão é humana.
 */

import type { WagerLeaderboardRow } from "./wagerLeaderboard";

export type WagerAnomalySeverity = "critical" | "warning" | "info";

export type WagerAnomalyCode =
  | "accuracy_outlier"
  | "perfect_streak"
  | "net_drain"
  | "volume_spike"
  | "stale_activity";

export interface WagerAnomaly {
  code: WagerAnomalyCode;
  severity: WagerAnomalySeverity;
  userId: string;
  displayName: string;
  title: string;
  detail: string;
  /** Métrica numérica que originou o alerta (z-score, moedas, etc.). */
  metric: number;
}

export interface WagerIntegrityOptions {
  /** Mínimo de apostas para avaliar acurácia estatisticamente. */
  minEntries?: number;
  /** Acurácia esperada por acaso (%), padrão 50% para pergunta binária. */
  baselineAccuracy?: number;
  /** Z-score a partir do qual a acurácia vira alerta crítico. */
  criticalZ?: number;
  /** Z-score a partir do qual a acurácia vira alerta de atenção. */
  warningZ?: number;
  /** Saldo líquido (moedas) a partir do qual o ganho vira alerta. */
  netDrainThreshold?: number;
  /** Dias sem jogar para marcar inatividade de um top player. */
  staleDays?: number;
  /** Data de referência (injetável para testes determinísticos). */
  now?: Date;
}

export interface WagerIntegrityReport {
  anomalies: WagerAnomaly[];
  /** Total de jogadores avaliados com amostra suficiente. */
  evaluated: number;
  /** Jogadores ignorados por amostra insuficiente. */
  skipped: number;
  /** Moedas líquidas distribuídas (positivo = casa pagando). */
  netDistributed: number;
  /** 0 a 100 — quanto maior, mais saudável o jogo. */
  healthScore: number;
}

const DEFAULTS: Required<Omit<WagerIntegrityOptions, "now">> = {
  minEntries: 8,
  baselineAccuracy: 50,
  criticalZ: 3,
  warningZ: 2,
  netDrainThreshold: 1500,
  staleDays: 14,
};

const SEVERITY_WEIGHT: Record<WagerAnomalySeverity, number> = {
  critical: 18,
  warning: 7,
  info: 2,
};

const SEVERITY_ORDER: Record<WagerAnomalySeverity, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Z-score da acurácia observada contra uma binomial de referência.
 * Fórmula: z = (p̂ - p0) / sqrt(p0 * (1 - p0) / n)
 */
export function accuracyZScore(
  correctCount: number,
  entries: number,
  baselineAccuracy: number,
): number {
  if (!Number.isFinite(entries) || entries <= 0) return 0;
  const p0 = clampPercent(baselineAccuracy) / 100;
  // Baselines degeneradas (0% ou 100%) não têm variância — evita divisão por zero.
  if (p0 <= 0 || p0 >= 1) return 0;
  const safeCorrect = Number.isFinite(correctCount) ? correctCount : 0;
  const observed = Math.min(entries, Math.max(0, safeCorrect)) / entries;
  const standardError = Math.sqrt((p0 * (1 - p0)) / entries);
  if (standardError === 0) return 0;
  return round((observed - p0) / standardError, 2);
}

function daysBetween(from: Date, iso: string | null): number | null {
  if (!iso) return null;
  const time = new Date(iso).getTime();
  if (!Number.isFinite(time)) return null;
  const diff = from.getTime() - time;
  if (diff < 0) return 0;
  return Math.floor(diff / 86_400_000);
}

/** Ordena por severidade e, dentro dela, pela métrica mais extrema. */
export function sortAnomalies(list: readonly WagerAnomaly[]): WagerAnomaly[] {
  return [...list].sort((a, b) => {
    if (SEVERITY_ORDER[a.severity] !== SEVERITY_ORDER[b.severity]) {
      return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    }
    if (b.metric !== a.metric) return b.metric - a.metric;
    return a.displayName.localeCompare(b.displayName, "pt-BR");
  });
}

/**
 * Varre o ranking do período e devolve o relatório de integridade.
 * Nenhuma exceção é lançada: entradas inválidas são simplesmente ignoradas.
 */
export function analyzeWagerIntegrity(
  rows: readonly WagerLeaderboardRow[],
  options: WagerIntegrityOptions = {},
): WagerIntegrityReport {
  const config = { ...DEFAULTS, ...options };
  const now =
    options.now instanceof Date && Number.isFinite(options.now.getTime())
      ? options.now
      : new Date();
  const minEntries = Math.max(1, Math.trunc(config.minEntries));
  const anomalies: WagerAnomaly[] = [];

  let evaluated = 0;
  let skipped = 0;
  let netDistributed = 0;

  const safeRows = Array.isArray(rows) ? rows.filter((row) => row && row.userId) : [];

  // Mediana de volume: base robusta para detectar farm de apostas.
  const volumes = safeRows
    .map((row) => Math.max(0, Math.trunc(row.entries) || 0))
    .sort((a, b) => a - b);
  const medianVolume = volumes.length
    ? volumes.length % 2 === 1
      ? volumes[(volumes.length - 1) / 2]
      : (volumes[volumes.length / 2 - 1] + volumes[volumes.length / 2]) / 2
    : 0;

  for (const row of safeRows) {
    const entries = Math.max(0, Math.trunc(row.entries) || 0);
    const correct = Math.min(entries, Math.max(0, Math.trunc(row.correctCount) || 0));
    const netCoins = Number.isFinite(row.netCoins) ? Math.trunc(row.netCoins) : 0;
    netDistributed += netCoins;
    const name = row.displayName || "Jogador";

    if (entries < minEntries) {
      skipped += 1;
    } else {
      evaluated += 1;
      const z = accuracyZScore(correct, entries, config.baselineAccuracy);
      if (z >= config.criticalZ) {
        anomalies.push({
          code: "accuracy_outlier",
          severity: "critical",
          userId: row.userId,
          displayName: name,
          title: "Acurácia estatisticamente improvável",
          detail: `${correct}/${entries} acertos (z=${z.toFixed(2)}) muito acima do acaso — verificar vazamento de gabarito.`,
          metric: z,
        });
      } else if (z >= config.warningZ) {
        anomalies.push({
          code: "accuracy_outlier",
          severity: "warning",
          userId: row.userId,
          displayName: name,
          title: "Acurácia acima do esperado",
          detail: `${correct}/${entries} acertos (z=${z.toFixed(2)}). Pode ser desempenho legítimo, mas merece acompanhamento.`,
          metric: z,
        });
      }

      // Sequência perfeita longa: sinal clássico de resposta antecipada.
      const bestStreak = Math.max(0, Math.trunc(row.bestStreak) || 0);
      if (bestStreak >= minEntries && bestStreak === entries && correct === entries) {
        anomalies.push({
          code: "perfect_streak",
          severity: "critical",
          userId: row.userId,
          displayName: name,
          title: "Sequência perfeita no período",
          detail: `Acertou todas as ${entries} apostas do período sem nenhum erro.`,
          metric: entries,
        });
      }

      if (medianVolume > 0 && entries >= medianVolume * 3) {
        anomalies.push({
          code: "volume_spike",
          severity: "info",
          userId: row.userId,
          displayName: name,
          title: "Volume muito acima da mediana",
          detail: `${entries} apostas contra mediana de ${medianVolume} do período.`,
          metric: entries,
        });
      }
    }

    if (netCoins >= config.netDrainThreshold) {
      anomalies.push({
        code: "net_drain",
        severity: "warning",
        userId: row.userId,
        displayName: name,
        title: "Ganho líquido elevado",
        detail: `+${netCoins.toLocaleString("pt-BR")} moedas no período — impacto direto no orçamento.`,
        metric: netCoins,
      });
    }

    const idleDays = daysBetween(now, row.lastPlayed);
    const rank = Math.max(1, Math.trunc(row.rank) || 1);
    if (idleDays !== null && idleDays >= config.staleDays && rank <= 5) {
      anomalies.push({
        code: "stale_activity",
        severity: "info",
        userId: row.userId,
        displayName: name,
        title: "Top player inativo",
        detail: `Sem apostar há ${idleDays} dias, mas ainda no top ${rank}.`,
        metric: idleDays,
      });
    }
  }

  const penalty = anomalies.reduce((acc, item) => acc + SEVERITY_WEIGHT[item.severity], 0);
  const healthScore = Math.max(0, Math.min(100, 100 - penalty));

  return {
    anomalies: sortAnomalies(anomalies),
    evaluated,
    skipped,
    netDistributed,
    healthScore,
  };
}

/** Rótulo curto em pt-BR para a severidade. */
export function severityLabel(severity: WagerAnomalySeverity): string {
  if (severity === "critical") return "Crítico";
  if (severity === "warning") return "Atenção";
  return "Informativo";
}

/** Resumo textual do estado do jogo, usado no cabeçalho do painel. */
export function integritySummary(report: WagerIntegrityReport): string {
  const critical = report.anomalies.filter((a) => a.severity === "critical").length;
  const warning = report.anomalies.filter((a) => a.severity === "warning").length;
  if (critical === 0 && warning === 0) {
    return report.evaluated === 0
      ? "Sem amostra suficiente para avaliar o período."
      : "Nenhuma anomalia relevante detectada no período.";
  }
  const parts: string[] = [];
  if (critical > 0) parts.push(`${critical} crítico${critical > 1 ? "s" : ""}`);
  if (warning > 0) parts.push(`${warning} de atenção`);
  return `${parts.join(" e ")} — revisar antes do próximo ciclo.`;
}