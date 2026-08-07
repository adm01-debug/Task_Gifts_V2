/**
 * Motor determinístico de risco para governança de resgates.
 *
 * Este módulo é PURO (sem I/O) de propósito: a mesma lógica é espelhada na
 * Edge Function `reward-approval-review`, o que permite simular centenas de
 * cenários em teste sem depender do banco nem da IA.
 *
 * A IA nunca decide sozinha: ela apenas ajusta a pontuação heurística dentro
 * de uma faixa limitada e escreve o parecer textual. A decisão final continua
 * sendo humana e registrada na trilha auditável.
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface PurchaseRiskSignals {
  /** Moedas debitadas no resgate. */
  totalCoins: number;
  /** Quantidade de itens no mesmo pedido. */
  quantity: number;
  /** Saldo de moedas do colaborador ANTES do débito. */
  balanceBefore: number;
  /** Moedas legitimamente ganhas nos últimos 30 dias. */
  coinsEarnedLast30Days: number;
  /** Idade da conta em dias. */
  accountAgeDays: number;
  /** Resgates criados nos últimos 7 dias (incluindo o atual). */
  purchasesLast7Days: number;
  /** Resgates cancelados/rejeitados nos últimos 90 dias. */
  cancelledLast90Days: number;
  /** Raridade da recompensa. */
  rarity: "common" | "rare" | "epic" | "legendary";
  /** Estoque restante (null = ilimitado). */
  stockRemaining: number | null;
  /** Resgates da MESMA recompensa nos últimos 7 dias (incluindo o atual). */
  sameRewardLast7Days: number;
}

export interface RiskFactor {
  code: string;
  label: string;
  /** Pontos somados (positivo = mais risco, negativo = mitigador). */
  points: number;
  detail: string;
}

export interface PurchaseRiskAssessment {
  score: number;
  level: RiskLevel;
  requiresDualApproval: boolean;
  factors: RiskFactor[];
}

const MAX_SCORE = 100;
const MIN_SCORE = 0;

/** Limiar a partir do qual o pedido exige dois aprovadores distintos. */
export const DUAL_APPROVAL_THRESHOLD = 70;

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return MIN_SCORE;
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, Math.round(value)));
}

export function riskLevelFromScore(score: number): RiskLevel {
  const s = clampScore(score);
  if (s >= 80) return "critical";
  if (s >= 55) return "high";
  if (s >= 30) return "medium";
  return "low";
}

function safeNumber(value: number | null | undefined, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/**
 * Normaliza sinais possivelmente sujos (nulos, negativos, NaN) antes do cálculo.
 * Defensivo por design: dados vindos do banco podem ter buracos históricos.
 */
export function normalizeSignals(raw: Partial<PurchaseRiskSignals>): PurchaseRiskSignals {
  const rarity = raw.rarity ?? "common";
  return {
    totalCoins: Math.max(0, safeNumber(raw.totalCoins)),
    quantity: Math.max(1, Math.floor(safeNumber(raw.quantity, 1)) || 1),
    balanceBefore: Math.max(0, safeNumber(raw.balanceBefore)),
    coinsEarnedLast30Days: Math.max(0, safeNumber(raw.coinsEarnedLast30Days)),
    accountAgeDays: Math.max(0, safeNumber(raw.accountAgeDays)),
    purchasesLast7Days: Math.max(0, Math.floor(safeNumber(raw.purchasesLast7Days))),
    cancelledLast90Days: Math.max(0, Math.floor(safeNumber(raw.cancelledLast90Days))),
    rarity: (["common", "rare", "epic", "legendary"] as const).includes(rarity) ? rarity : "common",
    stockRemaining:
      raw.stockRemaining === null || raw.stockRemaining === undefined
        ? null
        : Math.max(0, Math.floor(safeNumber(raw.stockRemaining))),
    sameRewardLast7Days: Math.max(0, Math.floor(safeNumber(raw.sameRewardLast7Days))),
  };
}

/**
 * Calcula a pontuação heurística de risco (0-100) e os fatores que a compõem.
 */
export function assessPurchaseRisk(raw: Partial<PurchaseRiskSignals>): PurchaseRiskAssessment {
  const s = normalizeSignals(raw);
  const factors: RiskFactor[] = [];

  // 1. Valor absoluto do resgate.
  if (s.totalCoins >= 5000) {
    factors.push({
      code: "high_value",
      label: "Resgate de valor muito alto",
      points: 25,
      detail: `${s.totalCoins} moedas em um único pedido.`,
    });
  } else if (s.totalCoins >= 2000) {
    factors.push({
      code: "elevated_value",
      label: "Resgate de valor elevado",
      points: 14,
      detail: `${s.totalCoins} moedas em um único pedido.`,
    });
  } else if (s.totalCoins >= 800) {
    factors.push({
      code: "moderate_value",
      label: "Resgate de valor moderado",
      points: 6,
      detail: `${s.totalCoins} moedas em um único pedido.`,
    });
  }

  // 2. Saldo incompatível com o histórico de ganhos (possível crédito indevido).
  if (s.balanceBefore > 0 && s.coinsEarnedLast30Days === 0 && s.totalCoins >= 500) {
    factors.push({
      code: "no_recent_earnings",
      label: "Sem ganhos recentes registrados",
      points: 20,
      detail: "Saldo utilizado não tem contrapartida de ganhos nos últimos 30 dias.",
    });
  } else if (s.coinsEarnedLast30Days > 0 && s.totalCoins > s.coinsEarnedLast30Days * 3) {
    factors.push({
      code: "earnings_mismatch",
      label: "Resgate desproporcional aos ganhos",
      points: 12,
      detail: `Resgate de ${s.totalCoins} contra ${s.coinsEarnedLast30Days} moedas ganhas em 30 dias.`,
    });
  }

  // 3. Conta recém-criada.
  if (s.accountAgeDays < 7) {
    factors.push({
      code: "new_account",
      label: "Conta muito recente",
      points: 18,
      detail: `Conta criada há ${s.accountAgeDays} dia(s).`,
    });
  } else if (s.accountAgeDays < 30) {
    factors.push({
      code: "young_account",
      label: "Conta recente",
      points: 8,
      detail: `Conta criada há ${s.accountAgeDays} dia(s).`,
    });
  }

  // 4. Rajada de resgates.
  if (s.purchasesLast7Days >= 8) {
    factors.push({
      code: "burst_activity",
      label: "Rajada de resgates",
      points: 20,
      detail: `${s.purchasesLast7Days} resgates nos últimos 7 dias.`,
    });
  } else if (s.purchasesLast7Days >= 4) {
    factors.push({
      code: "frequent_activity",
      label: "Frequência acima do normal",
      points: 9,
      detail: `${s.purchasesLast7Days} resgates nos últimos 7 dias.`,
    });
  }

  // 5. Repetição do mesmo item (acumulação/revenda).
  if (s.sameRewardLast7Days >= 3) {
    factors.push({
      code: "same_reward_repeat",
      label: "Repetição do mesmo item",
      points: 12,
      detail: `${s.sameRewardLast7Days} resgates da mesma recompensa em 7 dias.`,
    });
  }

  // 6. Quantidade elevada no mesmo pedido.
  if (s.quantity >= 5) {
    factors.push({
      code: "bulk_quantity",
      label: "Quantidade elevada",
      points: 10,
      detail: `${s.quantity} unidades no mesmo pedido.`,
    });
  }

  // 7. Histórico de cancelamentos.
  if (s.cancelledLast90Days >= 3) {
    factors.push({
      code: "cancellation_history",
      label: "Histórico de cancelamentos",
      points: 10,
      detail: `${s.cancelledLast90Days} cancelamentos em 90 dias.`,
    });
  }

  // 8. Escassez do item (impacto sobre outros colaboradores).
  if (s.stockRemaining !== null && s.stockRemaining <= 2) {
    factors.push({
      code: "scarce_stock",
      label: "Item escasso",
      points: 7,
      detail: `Apenas ${s.stockRemaining} unidade(s) restante(s) após o pedido.`,
    });
  }

  // 9. Raridade da recompensa.
  const rarityPoints: Record<PurchaseRiskSignals["rarity"], number> = {
    common: 0,
    rare: 3,
    epic: 7,
    legendary: 12,
  };
  if (rarityPoints[s.rarity] > 0) {
    factors.push({
      code: `rarity_${s.rarity}`,
      label: "Recompensa de alta raridade",
      points: rarityPoints[s.rarity],
      detail: `Raridade: ${s.rarity}.`,
    });
  }

  // 10. Mitigador: colaborador antigo e consistente.
  if (s.accountAgeDays >= 180 && s.cancelledLast90Days === 0 && s.coinsEarnedLast30Days >= s.totalCoins) {
    factors.push({
      code: "trusted_profile",
      label: "Perfil consistente",
      points: -15,
      detail: "Conta madura, sem cancelamentos e com ganhos que cobrem o resgate.",
    });
  }

  const score = clampScore(factors.reduce((acc, f) => acc + f.points, 0));
  const level = riskLevelFromScore(score);

  return {
    score,
    level,
    requiresDualApproval: score >= DUAL_APPROVAL_THRESHOLD,
    factors,
  };
}

/**
 * Aplica o ajuste da IA sobre a heurística, com teto rígido de ±15 pontos.
 * Garante que uma resposta alucinada do modelo nunca zere nem estoure o risco.
 */
export function applyAiAdjustment(
  base: PurchaseRiskAssessment,
  aiDelta: number | null | undefined,
  aiSummary?: string | null
): PurchaseRiskAssessment & { aiSummary: string | null } {
  const delta = Math.max(-15, Math.min(15, safeNumber(aiDelta)));
  const score = clampScore(base.score + delta);
  const factors = delta === 0
    ? base.factors
    : [
        ...base.factors,
        {
          code: "ai_adjustment",
          label: "Ajuste da análise por IA",
          points: delta,
          detail: aiSummary?.slice(0, 240) || "Ajuste contextual do parecer automatizado.",
        },
      ];

  return {
    score,
    level: riskLevelFromScore(score),
    requiresDualApproval: score >= DUAL_APPROVAL_THRESHOLD,
    factors,
    aiSummary: aiSummary?.trim() ? aiSummary.trim() : null,
  };
}

export const RISK_LEVEL_CONFIG: Record<
  RiskLevel,
  { label: string; badgeClass: string; textClass: string }
> = {
  low: { label: "Baixo", badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", textClass: "text-emerald-600" },
  medium: { label: "Médio", badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30", textClass: "text-amber-600" },
  high: { label: "Alto", badgeClass: "bg-orange-500/15 text-orange-600 border-orange-500/30", textClass: "text-orange-600" },
  critical: { label: "Crítico", badgeClass: "bg-destructive/15 text-destructive border-destructive/30", textClass: "text-destructive" },
};
