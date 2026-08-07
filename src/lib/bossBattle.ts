/**
 * Motor puro do **Boss Battle Departamental** (Onda 4 — Premium).
 *
 * O chefão tem uma barra de HP coletiva reduzida por entregas reais do time
 * (tarefas concluídas, trilhas, presença). Este módulo concentra TODA a
 * aritmética determinística — dano, clamps, fases e rateio de recompensa —
 * para que o RPC `SECURITY DEFINER` no banco e a UI compartilhem a mesma
 * verdade e para que possamos simular centenas de cenários sem tocar no banco.
 *
 * Invariantes garantidos aqui:
 *  1. Dano nunca é negativo e nunca ultrapassa o HP restante (sem overkill).
 *  2. Cap por usuário limita farm individual (anti-abuso econômico).
 *  3. O rateio distribui EXATAMENTE o pool (maior resto), sem criar moeda.
 *  4. Todas as funções são puras: mesma entrada ⇒ mesma saída.
 */

export type BossDamageSource =
  | "task_score"
  | "trail_completion"
  | "attendance"
  | "quiz"
  | "manual";

export interface BossDamageRules {
  /** Dano base por fonte. Valores <= 0 desativam a fonte. */
  base: Partial<Record<BossDamageSource, number>>;
  /** Multiplicador aplicado sobre o dano base (ex.: combo do usuário). */
  maxMultiplier: number;
  /** Teto de dano acumulado por usuário na batalha (0 = ilimitado). */
  perUserCap: number;
}

export const DEFAULT_DAMAGE_RULES: BossDamageRules = {
  base: { task_score: 10, trail_completion: 25, attendance: 5, quiz: 8, manual: 0 },
  maxMultiplier: 3,
  perUserCap: 0,
};

export interface BossBattleState {
  totalHp: number;
  currentHp: number;
}

export interface DamageRequest {
  source: BossDamageSource;
  /** Multiplicador do combo do jogador (1..maxMultiplier). */
  multiplier?: number;
  /** Dano acumulado do usuário nesta batalha, para aplicar o cap. */
  userDamageSoFar?: number;
  /** Override explícito (usado por `manual`, sempre validado). */
  amount?: number;
}

export interface DamageOutcome {
  /** Dano efetivamente aplicado após clamps. */
  applied: number;
  /** Dano descartado por cap/overkill — útil para telemetria e UX honesta. */
  wasted: number;
  hpAfter: number;
  defeated: boolean;
  reason: "ok" | "no_hp" | "capped" | "zero_damage";
}

const toInt = (n: number): number => (Number.isFinite(n) ? Math.floor(n) : 0);

/** Dano bruto antes de qualquer clamp de estado. */
export function computeRawDamage(rules: BossDamageRules, req: DamageRequest): number {
  const base = req.source === "manual" ? toInt(req.amount ?? 0) : toInt(rules.base[req.source] ?? 0);
  if (base <= 0) return 0;
  const rawMult = Number.isFinite(req.multiplier) ? (req.multiplier as number) : 1;
  const mult = Math.min(Math.max(rawMult, 1), Math.max(rules.maxMultiplier, 1));
  return Math.max(0, Math.floor(base * mult));
}

/**
 * Aplica o dano ao estado da batalha respeitando cap por usuário e HP restante.
 * Espelha exatamente a lógica do RPC `deal_boss_damage`.
 */
export function applyDamage(
  state: BossBattleState,
  rules: BossDamageRules,
  req: DamageRequest,
): DamageOutcome {
  const hp = Math.max(0, toInt(state.currentHp));
  const raw = computeRawDamage(rules, req);

  if (hp <= 0) return { applied: 0, wasted: raw, hpAfter: 0, defeated: true, reason: "no_hp" };
  if (raw <= 0) return { applied: 0, wasted: 0, hpAfter: hp, defeated: false, reason: "zero_damage" };

  let allowed = raw;
  let reason: DamageOutcome["reason"] = "ok";

  if (rules.perUserCap > 0) {
    const remainingForUser = Math.max(0, rules.perUserCap - Math.max(0, toInt(req.userDamageSoFar ?? 0)));
    if (raw > remainingForUser) {
      allowed = remainingForUser;
      reason = "capped";
    }
  }

  const applied = Math.min(allowed, hp);
  if (applied < allowed) reason = reason === "capped" ? "capped" : "ok";

  const hpAfter = hp - applied;
  return {
    applied,
    wasted: raw - applied,
    hpAfter,
    defeated: hpAfter === 0,
    reason: applied === 0 && reason !== "capped" ? "zero_damage" : reason,
  };
}

export type BossPhase = "healthy" | "wounded" | "enraged" | "critical" | "defeated";

/** Fase visual do chefão a partir do HP percentual (usada só para UI/áudio). */
export function bossPhase(state: BossBattleState): BossPhase {
  const total = Math.max(1, toInt(state.totalHp));
  const hp = Math.min(Math.max(0, toInt(state.currentHp)), total);
  const pct = hp / total;
  if (hp === 0) return "defeated";
  if (pct > 0.66) return "healthy";
  if (pct > 0.33) return "wounded";
  if (pct > 0.1) return "enraged";
  return "critical";
}

export interface ContributorDamage {
  userId: string;
  damage: number;
}

export interface RewardShare {
  userId: string;
  damage: number;
  share: number;
  coins: number;
  xp: number;
}

export interface RewardOptions {
  coinsPool: number;
  xpPool: number;
  /** Participação mínima (0..1) para ser elegível. 0 = todos que causaram dano. */
  minShare?: number;
  /** Teto de moedas por participante (0 = ilimitado). Sobra é redistribuída. */
  perUserCoinsCap?: number;
}

/**
 * Rateio proporcional ao dano com **maior resto**: a soma dos valores
 * distribuídos é sempre igual ao pool (nunca cria nem destrói moeda),
 * e o desempate é determinístico (maior dano, depois userId) para que
 * banco e cliente cheguem ao mesmo resultado.
 */
export function distributeRewards(
  contributors: readonly ContributorDamage[],
  options: RewardOptions,
): RewardShare[] {
  const coinsPool = Math.max(0, toInt(options.coinsPool));
  const xpPool = Math.max(0, toInt(options.xpPool));
  const minShare = Math.min(Math.max(options.minShare ?? 0, 0), 1);

  const valid = contributors
    .map((c) => ({ userId: c.userId, damage: Math.max(0, toInt(c.damage)) }))
    .filter((c) => c.damage > 0);
  const totalDamage = valid.reduce((s, c) => s + c.damage, 0);
  if (totalDamage === 0) return [];

  const eligible = valid.filter((c) => c.damage / totalDamage >= minShare);
  const eligibleTotal = eligible.reduce((s, c) => s + c.damage, 0);
  if (eligibleTotal === 0) return [];

  const ordered = [...eligible].sort(
    (a, b) => b.damage - a.damage || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
  );

  const allocate = (pool: number, cap: number): Map<string, number> => {
    const result = new Map<string, number>();
    if (pool === 0) {
      ordered.forEach((c) => result.set(c.userId, 0));
      return result;
    }
    // Maior resto sobre o dano.
    const exact = ordered.map((c) => ({ userId: c.userId, value: (pool * c.damage) / eligibleTotal }));
    let distributed = 0;
    exact.forEach((e) => {
      const floorValue = Math.floor(e.value);
      result.set(e.userId, floorValue);
      distributed += floorValue;
    });
    const remainders = exact
      .map((e) => ({ userId: e.userId, rest: e.value - Math.floor(e.value) }))
      .sort((a, b) => b.rest - a.rest || (a.userId < b.userId ? -1 : 1));
    let leftover = pool - distributed;
    for (const r of remainders) {
      if (leftover <= 0) break;
      result.set(r.userId, (result.get(r.userId) ?? 0) + 1);
      leftover -= 1;
    }
    if (cap > 0) {
      // Aplica o teto e redistribui o excedente entre quem ainda cabe,
      // em rodadas determinísticas (ordem por dano desc, userId asc).
      let surplus = 0;
      ordered.forEach((c) => {
        const v = result.get(c.userId) ?? 0;
        if (v > cap) {
          surplus += v - cap;
          result.set(c.userId, cap);
        }
      });
      while (surplus > 0) {
        const room = ordered.filter((c) => (result.get(c.userId) ?? 0) < cap);
        if (room.length === 0) break;
        let moved = 0;
        for (const c of room) {
          if (surplus <= 0) break;
          result.set(c.userId, (result.get(c.userId) ?? 0) + 1);
          surplus -= 1;
          moved += 1;
        }
        if (moved === 0) break;
      }
    }
    return result;
  };

  const coins = allocate(coinsPool, Math.max(0, toInt(options.perUserCoinsCap ?? 0)));
  const xp = allocate(xpPool, 0);

  return ordered.map((c) => ({
    userId: c.userId,
    damage: c.damage,
    share: c.damage / eligibleTotal,
    coins: coins.get(c.userId) ?? 0,
    xp: xp.get(c.userId) ?? 0,
  }));
}

/** Percentual de HP restante (0..100), arredondado para exibição. */
export function hpPercent(state: BossBattleState): number {
  const total = Math.max(1, toInt(state.totalHp));
  const hp = Math.min(Math.max(0, toInt(state.currentHp)), total);
  return Math.round((hp / total) * 100);
}
