/**
 * Motor puro de odds da Roleta da Sorte.
 *
 * Espelha a lógica de sorteio da RPC `spin_lucky_wheel` (`SECURITY DEFINER`),
 * permitindo:
 *  - simular centenas de cenários em teste sem tocar no banco;
 *  - projetar o custo econômico antes de o admin salvar novos pesos.
 *
 * IMPORTANTE: este módulo NUNCA decide prêmio em produção — o sorteio real
 * acontece exclusivamente no servidor. Aqui é apenas projeção/validação.
 */

export type OddsPrizeType = "coins" | "xp" | "achievement" | "nothing";

export interface OddsPrize {
  id: string;
  label: string;
  prize_type: OddsPrizeType;
  amount: number;
  weight: number;
  rarity: string;
  is_active: boolean;
  achievement_id?: string | null;
}

export interface PrizeOdds {
  id: string;
  label: string;
  prize_type: OddsPrizeType;
  amount: number;
  weight: number;
  /** Probabilidade em 0..1. */
  probability: number;
  /** 1 em N giros (Infinity quando a probabilidade é zero). */
  oneIn: number;
  rangeStart: number;
  rangeEnd: number;
}

export interface WheelProjection {
  activeCount: number;
  totalWeight: number;
  odds: PrizeOdds[];
  expectedCoinsPerSpin: number;
  expectedXpPerSpin: number;
  emptyProbability: number;
}

export type WheelIssueLevel = "error" | "warning";

export interface WheelIssue {
  level: WheelIssueLevel;
  code: string;
  message: string;
  prizeId?: string;
}

const EPSILON = 1e-9;

function activePrizes(prizes: readonly OddsPrize[]): OddsPrize[] {
  // A RPC ordena por `created_at, id`; o array recebido já chega nessa ordem
  // do service, então preservamos a ordem de entrada para casar os setores.
  return prizes.filter((p) => p.is_active);
}

/**
 * Réplica do laço da RPC:
 *   v_acc := v_acc + weight; EXIT WHEN v_roll < v_acc
 * com `v_roll = floor(random() * total_weight)` em [0, total-1].
 * Retorna -1 quando não há prêmio sorteável.
 */
export function resolvePrizeIndex(prizes: readonly OddsPrize[], roll: number): number {
  const active = activePrizes(prizes);
  if (active.length === 0) return -1;

  const total = active.reduce((sum, p) => sum + Math.max(0, p.weight), 0);
  if (total <= 0) return -1;

  // Rolls fora da faixa (defensivo) são normalizados para dentro dela.
  const normalized = Number.isFinite(roll)
    ? Math.min(Math.max(Math.floor(roll), 0), total - 1)
    : 0;

  let acc = 0;
  for (let i = 0; i < active.length; i += 1) {
    acc += Math.max(0, active[i].weight);
    if (normalized < acc) return i;
  }
  // Espelha o PL/pgSQL: sem EXIT, sobra o último prêmio do laço.
  return active.length - 1;
}

export function projectWheel(prizes: readonly OddsPrize[]): WheelProjection {
  const active = activePrizes(prizes);
  const totalWeight = active.reduce((sum, p) => sum + Math.max(0, p.weight), 0);

  let cursor = 0;
  const odds: PrizeOdds[] = active.map((prize) => {
    const weight = Math.max(0, prize.weight);
    const probability = totalWeight > 0 ? weight / totalWeight : 0;
    const entry: PrizeOdds = {
      id: prize.id,
      label: prize.label,
      prize_type: prize.prize_type,
      amount: prize.amount,
      weight,
      probability,
      oneIn: probability > EPSILON ? 1 / probability : Number.POSITIVE_INFINITY,
      rangeStart: cursor,
      rangeEnd: cursor + weight - 1,
    };
    cursor += weight;
    return entry;
  });

  const expectedCoinsPerSpin = odds
    .filter((o) => o.prize_type === "coins")
    .reduce((sum, o) => sum + o.probability * Math.max(0, o.amount), 0);
  const expectedXpPerSpin = odds
    .filter((o) => o.prize_type === "xp")
    .reduce((sum, o) => sum + o.probability * Math.max(0, o.amount), 0);
  const emptyProbability = odds
    .filter((o) => o.prize_type === "nothing" || o.amount <= 0)
    .reduce((sum, o) => sum + o.probability, 0);

  return {
    activeCount: active.length,
    totalWeight,
    odds,
    expectedCoinsPerSpin,
    expectedXpPerSpin,
    emptyProbability: Math.min(1, emptyProbability),
  };
}

export interface WheelBudgetInput {
  activeUsers: number;
  /** Fração de usuários que efetivamente giram por dia (0..1). */
  participationRate: number;
  days: number;
}

export interface WheelBudget {
  spins: number;
  coins: number;
  xp: number;
}

export function projectBudget(projection: WheelProjection, input: WheelBudgetInput): WheelBudget {
  const users = Math.max(0, Math.floor(input.activeUsers));
  const rate = Math.min(1, Math.max(0, input.participationRate));
  const days = Math.max(0, Math.floor(input.days));
  const spins = Math.round(users * rate * days);
  return {
    spins,
    coins: Math.round(spins * projection.expectedCoinsPerSpin),
    xp: Math.round(spins * projection.expectedXpPerSpin),
  };
}

export interface WheelValidationOptions {
  /** Teto de moedas esperadas por giro antes de alertar inflação. */
  maxExpectedCoinsPerSpin?: number;
  /** Número máximo de setores legíveis na roleta. */
  maxSectors?: number;
}

/**
 * Valida a configuração antes de persistir. Erros bloqueiam o salvamento;
 * avisos são liberados, mas exibidos ao gestor.
 */
export function validateWheelConfig(
  prizes: readonly OddsPrize[],
  options: WheelValidationOptions = {},
): WheelIssue[] {
  const maxExpectedCoins = options.maxExpectedCoinsPerSpin ?? 60;
  const maxSectors = options.maxSectors ?? 12;
  const issues: WheelIssue[] = [];
  const active = activePrizes(prizes);

  if (active.length === 0) {
    issues.push({
      level: "error",
      code: "no_active_prizes",
      message: "Nenhum prêmio ativo: a roleta ficaria inoperante para todos os usuários.",
    });
    return issues;
  }

  if (active.length < 3) {
    issues.push({
      level: "warning",
      code: "too_few_sectors",
      message: "Menos de 3 setores ativos reduzem drasticamente a sensação de recompensa variável.",
    });
  }

  if (active.length > maxSectors) {
    issues.push({
      level: "warning",
      code: "too_many_sectors",
      message: `${active.length} setores ativos: acima de ${maxSectors} os rótulos ficam ilegíveis no mobile.`,
    });
  }

  const seen = new Map<string, number>();
  for (const prize of active) {
    const key = prize.label.trim().toLocaleLowerCase();
    seen.set(key, (seen.get(key) ?? 0) + 1);

    if (!prize.label.trim()) {
      issues.push({
        level: "error",
        code: "empty_label",
        message: "Existe um prêmio ativo sem rótulo.",
        prizeId: prize.id,
      });
    }
    if (!Number.isInteger(prize.weight) || prize.weight <= 0) {
      issues.push({
        level: "error",
        code: "invalid_weight",
        message: `"${prize.label}": o peso precisa ser um inteiro maior que zero.`,
        prizeId: prize.id,
      });
    }
    if (!Number.isInteger(prize.amount) || prize.amount < 0) {
      issues.push({
        level: "error",
        code: "invalid_amount",
        message: `"${prize.label}": o valor precisa ser um inteiro maior ou igual a zero.`,
        prizeId: prize.id,
      });
    }
    if ((prize.prize_type === "coins" || prize.prize_type === "xp") && prize.amount <= 0) {
      issues.push({
        level: "warning",
        code: "zero_reward",
        message: `"${prize.label}" premia zero: use o tipo "Nada" para setores vazios.`,
        prizeId: prize.id,
      });
    }
    if (prize.prize_type === "achievement" && !prize.achievement_id) {
      issues.push({
        level: "error",
        code: "achievement_missing",
        message: `"${prize.label}" é do tipo conquista mas não aponta para nenhuma conquista.`,
        prizeId: prize.id,
      });
    }
  }

  for (const [label, count] of seen) {
    if (count > 1) {
      issues.push({
        level: "warning",
        code: "duplicate_label",
        message: `O rótulo "${label}" aparece ${count} vezes: o usuário não distingue os setores.`,
      });
    }
  }

  const projection = projectWheel(active);

  if (projection.emptyProbability >= 1 - EPSILON) {
    issues.push({
      level: "error",
      code: "all_empty",
      message: "Todos os setores ativos são sem recompensa: a roleta perde o efeito em DAU.",
    });
  } else if (projection.emptyProbability > 0.6) {
    issues.push({
      level: "warning",
      code: "high_empty_rate",
      message: `${Math.round(projection.emptyProbability * 100)}% dos giros não premiam nada — frustração acima do saudável.`,
    });
  } else if (projection.emptyProbability < EPSILON) {
    issues.push({
      level: "warning",
      code: "no_empty_sector",
      message: "Sem nenhum setor vazio a recompensa deixa de ser variável e o engajamento cai com o tempo.",
    });
  }

  if (projection.expectedCoinsPerSpin > maxExpectedCoins) {
    issues.push({
      level: "warning",
      code: "economy_inflation",
      message: `Média de ${projection.expectedCoinsPerSpin.toFixed(1)} moedas por giro (teto sugerido: ${maxExpectedCoins}). Risco de inflação na loja.`,
    });
  }

  const legendaryIds = new Set(active.filter((p) => p.rarity === "legendary").map((p) => p.id));
  const legendaryProbability = projection.odds
    .filter((o) => legendaryIds.has(o.id))
    .reduce((sum, o) => sum + o.probability, 0);
  if (legendaryIds.size > 0 && legendaryProbability > 0.05) {
    issues.push({
      level: "warning",
      code: "legendary_too_common",
      message: `Prêmios lendários saem em ${(legendaryProbability * 100).toFixed(1)}% dos giros: acima de 5% deixam de ser lendários.`,
    });
  }

  return issues;
}

export function hasBlockingIssues(issues: readonly WheelIssue[]): boolean {
  return issues.some((issue) => issue.level === "error");
}
