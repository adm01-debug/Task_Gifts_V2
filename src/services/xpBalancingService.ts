import { logger } from "./loggingService";

/**
 * XP Balancing Service — Item #10 do backlog.
 *
 * Módulo puro que analisa a distribuição de XP da base de usuários
 * e recomenda ajustes de economia para o admin (multiplicadores de
 * quests, penalidades, rewards da loja). Determinístico e testável.
 *
 * Baseia-se em métricas clássicas de game economy:
 *  - Gini coefficient para desigualdade (top-heavy → precisa nivelar).
 *  - Median vs. Mean para skew.
 *  - Progressão média por nível (grind pressure).
 */

export interface XpDistributionSample {
  userId: string;
  xp: number;
  level: number;
  daysActive: number;
}

export type EconomyHealth = "healthy" | "inflated" | "stagnant" | "unbalanced";

export interface XpBalancingRecommendation {
  health: EconomyHealth;
  gini: number; // 0 igualdade perfeita, 1 desigualdade máxima
  medianXp: number;
  meanXp: number;
  xpPerActiveDay: number;
  questMultiplierSuggestion: number; // multiplicador recomendado (0.5..2.0)
  penaltyMultiplierSuggestion: number; // multiplicador para penalidades
  shopPriceAdjustment: number; // ajuste percentual sugerido para preços da loja
  rationale: string[];
}

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export function computeGini(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].filter(v => v >= 0).sort((a, b) => a - b);
  const n = sorted.length;
  if (n === 0) return 0;
  const sum = sorted.reduce((a, b) => a + b, 0);
  if (sum === 0) return 0;
  let cum = 0;
  for (let i = 0; i < n; i++) {
    cum += (i + 1) * sorted[i];
  }
  return clamp((2 * cum) / (n * sum) - (n + 1) / n, 0, 1);
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function classifyHealth(gini: number, xpPerDay: number): EconomyHealth {
  if (gini > 0.65) return "unbalanced"; // top players dominando
  if (xpPerDay > 400) return "inflated"; // XP fácil demais
  if (xpPerDay < 30) return "stagnant"; // grind excessivo
  return "healthy";
}

export function recommendBalancing(
  samples: XpDistributionSample[],
): XpBalancingRecommendation {
  try {
    if (samples.length === 0) {
      return {
        health: "stagnant",
        gini: 0,
        medianXp: 0,
        meanXp: 0,
        xpPerActiveDay: 0,
        questMultiplierSuggestion: 1.0,
        penaltyMultiplierSuggestion: 1.0,
        shopPriceAdjustment: 0,
        rationale: ["Sem amostras suficientes para análise."],
      };
    }

    const xps = samples.map(s => Math.max(0, s.xp));
    const gini = computeGini(xps);
    const medianXp = median(xps);
    const meanXp = mean(xps);

    const totalDays = samples.reduce((acc, s) => acc + Math.max(1, s.daysActive), 0);
    const xpPerActiveDay = totalDays > 0 ? xps.reduce((a, b) => a + b, 0) / totalDays : 0;

    const health = classifyHealth(gini, xpPerActiveDay);

    const rationale: string[] = [];
    let quest = 1.0;
    let penalty = 1.0;
    let shop = 0;

    switch (health) {
      case "inflated":
        quest = 0.75;
        penalty = 1.25;
        shop = 20; // encarecer loja
        rationale.push("Ganho médio de XP/dia está alto — reduzir recompensas de quests em 25%.");
        rationale.push("Aumentar penalidades em 25% para reforçar disciplina.");
        rationale.push("Aumentar preços da loja em 20% para absorver excedente de moedas.");
        break;
      case "stagnant":
        quest = 1.25;
        penalty = 0.9;
        shop = -15;
        rationale.push("Ganho médio muito baixo — aumentar recompensas em 25%.");
        rationale.push("Reduzir preços da loja em 15% para incentivar consumo.");
        break;
      case "unbalanced":
        quest = 1.1;
        penalty = 1.0;
        shop = 10;
        rationale.push(`Coeficiente de Gini alto (${gini.toFixed(2)}) — top players dominam.`);
        rationale.push("Adicionar bônus catch-up para jogadores abaixo da mediana.");
        break;
      case "healthy":
      default:
        rationale.push("Economia saudável — manter parâmetros atuais.");
        break;
    }

    if (meanXp > medianXp * 3 && health !== "unbalanced") {
      rationale.push("Distribuição enviesada para topo — considerar diminishing returns em ganhos altos.");
    }

    return {
      health,
      gini: Number(gini.toFixed(3)),
      medianXp: Math.round(medianXp),
      meanXp: Math.round(meanXp),
      xpPerActiveDay: Math.round(xpPerActiveDay),
      questMultiplierSuggestion: quest,
      penaltyMultiplierSuggestion: penalty,
      shopPriceAdjustment: shop,
      rationale,
    };
  } catch (err) {
    logger.apiError("recommendBalancing", err, "xpBalancingService");
    return {
      health: "stagnant",
      gini: 0,
      medianXp: 0,
      meanXp: 0,
      xpPerActiveDay: 0,
      questMultiplierSuggestion: 1.0,
      penaltyMultiplierSuggestion: 1.0,
      shopPriceAdjustment: 0,
      rationale: ["Falha ao processar amostras de XP."],
    };
  }
}

export const xpBalancingService = {
  recommendBalancing,
  computeGini,
  median,
  mean,
};