/**
 * Motor puro da "Guerra de Departamentos".
 *
 * IMPORTANTE: a fonte de verdade das contribuicoes e do credito de moedas/XP e
 * o banco (RPCs SECURITY DEFINER com advisory lock e idempotencia). Este modulo
 * e um espelho deterministico usado para (a) renderizar o placar na UI e
 * (b) permitir simulacao exaustiva de cenarios em teste. Nada aqui credita
 * economia real.
 *
 * Problema central: departamentos tem tamanhos muito diferentes (2 vs 140
 * pessoas). Somar pontos brutos entrega a vitoria sempre ao maior time e mata o
 * engajamento dos pequenos. Usamos normalizacao por capita com expoente de
 * justica (alpha) configuravel:
 *
 *   score = raw / max(1, headcount) ^ alpha
 *
 *   alpha = 0   -> soma bruta (favorece departamentos grandes)
 *   alpha = 1   -> media por pessoa (favorece departamentos pequenos)
 *   alpha = 0.5 -> equilibrio (padrao recomendado)
 */

export interface WarMetricWeight {
  metric_key: string;
  weight: number;
}

export interface WarContributionInput {
  department_id: string;
  user_id: string;
  metric_key: string;
  amount: number;
}

export interface WarDepartmentInput {
  department_id: string;
  name: string;
  /** Quantidade de colaboradores elegiveis no departamento. */
  headcount: number;
}

export interface WarScoringConfig {
  /** Expoente de justica entre 0 e 1. */
  fairness_alpha: number;
  /** Pesos por metrica. Metricas ausentes sao ignoradas (peso 0). */
  weights: WarMetricWeight[];
  /** Teto de pontos brutos que um unico usuario pode somar (0 = sem teto). */
  per_user_cap: number;
  /** Bonus multiplicativo maximo por taxa de participacao (0 = desligado). */
  participation_bonus: number;
}

export interface WarStanding {
  department_id: string;
  name: string;
  headcount: number;
  /** Soma ponderada apos aplicar teto por usuario. */
  raw_score: number;
  /** Pontos descartados pelo teto por usuario (transparencia/auditoria). */
  capped_out: number;
  /** Colaboradores distintos que contribuiram. */
  contributors: number;
  /** contributors / headcount, entre 0 e 1. */
  participation_rate: number;
  /** Score final normalizado (com bonus de participacao). */
  score: number;
  position: number;
}

export interface WarRewardConfig {
  /** Moedas totais disponiveis para a guerra inteira. */
  coins_pool: number;
  /** XP total disponivel para a guerra inteira. */
  xp_pool: number;
  /**
   * Fracao do pool por colocacao (indice 0 = 1o lugar). A soma nao precisa ser
   * 1: valores sao normalizados sobre as colocacoes efetivamente premiadas.
   */
  placement_shares: number[];
  /** Teto de moedas por colaborador (0 = sem teto). */
  per_member_coins_cap: number;
}

export interface WarReward {
  department_id: string;
  position: number;
  coins_total: number;
  xp_total: number;
  coins_per_member: number;
  xp_per_member: number;
  /** Sobras nao distribuidas por arredondamento/teto (voltam ao caixa). */
  coins_returned: number;
  xp_returned: number;
}

export const DEFAULT_WAR_SCORING: WarScoringConfig = {
  fairness_alpha: 0.5,
  weights: [],
  per_user_cap: 0,
  participation_bonus: 0.2,
};

export const DEFAULT_WAR_REWARDS: WarRewardConfig = {
  coins_pool: 0,
  xp_pool: 0,
  placement_shares: [0.5, 0.3, 0.2],
  per_member_coins_cap: 0,
};

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/** Sanitiza a configuracao vinda do banco/UI para valores sempre utilizaveis. */
export function normalizeScoringConfig(
  config: Partial<WarScoringConfig> | null | undefined,
): WarScoringConfig {
  const source = config ?? {};
  const weights = Array.isArray(source.weights) ? source.weights : [];
  return {
    fairness_alpha: clamp(
      Number(source.fairness_alpha ?? DEFAULT_WAR_SCORING.fairness_alpha),
      0,
      1,
    ),
    weights: weights
      .filter((w): w is WarMetricWeight => !!w && typeof w.metric_key === "string")
      .map((w) => ({
        metric_key: w.metric_key,
        weight: Number.isFinite(Number(w.weight)) ? Number(w.weight) : 0,
      })),
    per_user_cap: Math.max(0, Math.floor(Number(source.per_user_cap ?? 0) || 0)),
    participation_bonus: clamp(
      Number(source.participation_bonus ?? DEFAULT_WAR_SCORING.participation_bonus),
      0,
      1,
    ),
  };
}

function weightFor(config: WarScoringConfig, metricKey: string): number {
  // Sem pesos configurados toda metrica vale 1 (modo "contagem simples").
  if (config.weights.length === 0) return 1;
  const found = config.weights.find((w) => w.metric_key === metricKey);
  return found ? found.weight : 0;
}

/** Arredonda para 4 casas para evitar ruido de ponto flutuante em empates. */
function round4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}

/**
 * Calcula o placar completo da guerra.
 * Deterministico: mesma entrada => mesma saida (inclusive desempates).
 */
export function computeWarStandings(
  departments: WarDepartmentInput[],
  contributions: WarContributionInput[],
  rawConfig?: Partial<WarScoringConfig> | null,
): WarStanding[] {
  const config = normalizeScoringConfig(rawConfig);
  const known = new Map<string, WarDepartmentInput>();
  for (const dept of departments) {
    if (!dept || typeof dept.department_id !== "string") continue;
    known.set(dept.department_id, {
      department_id: dept.department_id,
      name: dept.name ?? "",
      headcount: Math.max(0, Math.floor(Number(dept.headcount) || 0)),
    });
  }

  // Agrega por departamento -> usuario, para aplicar o teto por colaborador.
  const perUser = new Map<string, Map<string, number>>();
  for (const item of contributions) {
    if (!item || !known.has(item.department_id)) continue;
    const amount = Number(item.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const points = amount * weightFor(config, item.metric_key);
    if (!Number.isFinite(points) || points <= 0) continue;
    let bucket = perUser.get(item.department_id);
    if (!bucket) {
      bucket = new Map<string, number>();
      perUser.set(item.department_id, bucket);
    }
    bucket.set(item.user_id, (bucket.get(item.user_id) ?? 0) + points);
  }

  const standings: WarStanding[] = [];
  for (const dept of known.values()) {
    const bucket = perUser.get(dept.department_id);
    let raw = 0;
    let cappedOut = 0;
    let contributors = 0;
    if (bucket) {
      for (const total of bucket.values()) {
        if (total <= 0) continue;
        contributors += 1;
        if (config.per_user_cap > 0 && total > config.per_user_cap) {
          raw += config.per_user_cap;
          cappedOut += total - config.per_user_cap;
        } else {
          raw += total;
        }
      }
    }

    const headcount = Math.max(1, dept.headcount);
    const participation = dept.headcount > 0 ? clamp(contributors / dept.headcount, 0, 1) : 0;
    const divisor = Math.pow(headcount, config.fairness_alpha);
    const base = divisor > 0 ? raw / divisor : raw;
    const score = base * (1 + config.participation_bonus * participation);

    standings.push({
      department_id: dept.department_id,
      name: dept.name,
      headcount: dept.headcount,
      raw_score: round4(raw),
      capped_out: round4(cappedOut),
      contributors,
      participation_rate: round4(participation),
      score: round4(score),
      position: 0,
    });
  }

  standings.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.participation_rate !== a.participation_rate) {
      return b.participation_rate - a.participation_rate;
    }
    if (b.raw_score !== a.raw_score) return b.raw_score - a.raw_score;
    if (b.contributors !== a.contributors) return b.contributors - a.contributors;
    const byName = a.name.localeCompare(b.name, "pt-BR");
    if (byName !== 0) return byName;
    return a.department_id.localeCompare(b.department_id);
  });

  let position = 0;
  let lastScore: number | null = null;
  standings.forEach((standing, index) => {
    // Empate real (mesmo score) compartilha a colocacao.
    if (lastScore === null || standing.score !== lastScore) {
      position = index + 1;
      lastScore = standing.score;
    }
    standing.position = position;
  });

  return standings;
}

/**
 * Distribui o pool de recompensas por colocacao.
 * Garantias: nunca excede o pool, nunca gera valor negativo, sempre inteiro.
 */
export function distributeWarRewards(
  standings: WarStanding[],
  rawConfig?: Partial<WarRewardConfig> | null,
): WarReward[] {
  const shares =
    Array.isArray(rawConfig?.placement_shares) && rawConfig.placement_shares.length > 0
      ? rawConfig.placement_shares.map((s) => Math.max(0, Number(s) || 0))
      : DEFAULT_WAR_REWARDS.placement_shares;
  const config: WarRewardConfig = {
    coins_pool: Math.max(0, Math.floor(Number(rawConfig?.coins_pool ?? 0) || 0)),
    xp_pool: Math.max(0, Math.floor(Number(rawConfig?.xp_pool ?? 0) || 0)),
    placement_shares: shares,
    per_member_coins_cap: Math.max(
      0,
      Math.floor(Number(rawConfig?.per_member_coins_cap ?? 0) || 0),
    ),
  };

  const awarded = standings.slice(0, config.placement_shares.length);
  const shareSum = awarded.reduce(
    (acc, _standing, index) => acc + (config.placement_shares[index] ?? 0),
    0,
  );

  return awarded.map((standing, index) => {
    const fraction = shareSum > 0 ? (config.placement_shares[index] ?? 0) / shareSum : 0;
    const coinsBudget = Math.floor(config.coins_pool * fraction);
    const xpBudget = Math.floor(config.xp_pool * fraction);
    const members = Math.max(1, standing.headcount);

    let coinsPerMember = Math.floor(coinsBudget / members);
    if (config.per_member_coins_cap > 0) {
      coinsPerMember = Math.min(coinsPerMember, config.per_member_coins_cap);
    }
    const xpPerMember = Math.floor(xpBudget / members);

    const coinsPaid = coinsPerMember * members;
    const xpPaid = xpPerMember * members;

    return {
      department_id: standing.department_id,
      position: standing.position,
      coins_total: coinsPaid,
      xp_total: xpPaid,
      coins_per_member: coinsPerMember,
      xp_per_member: xpPerMember,
      coins_returned: coinsBudget - coinsPaid,
      xp_returned: xpBudget - xpPaid,
    };
  });
}

/** Progresso temporal da guerra (0..1) para barras de UI. */
export function warProgress(startsAt: string, endsAt: string, now = new Date()): number {
  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return clamp((now.getTime() - start) / (end - start), 0, 1);
}