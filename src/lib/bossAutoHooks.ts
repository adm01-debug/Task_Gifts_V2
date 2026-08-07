/**
 * Motor puro dos **gatilhos automáticos do Chefão Departamental**.
 *
 * Espelha, linha a linha, os gatilhos de banco (`trg_boss_damage_task_scores`,
 * `trg_boss_damage_trail_enrollments`, `trg_boss_damage_attendance_streaks`)
 * para que centenas de cenários possam ser simulados sem tocar no Postgres.
 *
 * Decisões de projeto (o "porquê" antes do "como"):
 *
 * 1. **Só transição real causa dano.** Um `UPDATE` administrativo em uma
 *    tarefa já concluída não pode bater no chefão de novo — por isso cada
 *    regra observa a transição (estado anterior → novo), nunca o estado
 *    isolado.
 * 2. **Idempotência determinística.** A `dedupe_key` é função pura do
 *    (origem, referência). O mesmo evento reprocessado mil vezes gera a mesma
 *    chave e a RPC devolve `duplicate: true` sem alterar HP.
 * 3. **Seleção de batalha explícita e determinística.** Entre várias batalhas
 *    ativas, a do departamento do usuário vence a global; empates são
 *    resolvidos pelo término mais próximo e depois pelo id (ordem estável),
 *    garantindo que banco e cliente escolham o mesmo alvo.
 * 4. **Multiplicador sempre clampado** no motor, não só no banco: uma
 *    configuração inválida de combo nunca deve virar dano gigante.
 */

import type { BossDamageSource } from "./bossBattle";

export interface BossBattleTarget {
  id: string;
  /** `null` = batalha global (vale para todos os departamentos). */
  departmentId: string | null;
  status: string;
  startsAt: string;
  endsAt: string;
  currentHp: number;
}

export interface BossDamageEvent {
  battleId: string;
  userId: string;
  source: BossDamageSource;
  sourceId: string | null;
  multiplier: number;
  dedupeKey: string;
}

/** Chave de idempotência — idêntica à construída pelos gatilhos SQL. */
export function buildBossDedupeKey(source: BossDamageSource, sourceRef: string | null | undefined): string {
  const ref = (sourceRef ?? "").trim();
  return `boss:${source}:${ref === "" ? "none" : ref}`;
}

export const BOSS_DEDUPE_KEY_MAX = 200;

const parseTime = (value: string): number => {
  const t = Date.parse(value);
  return Number.isNaN(t) ? Number.NaN : t;
};

/** Batalha elegível: em execução, dentro da janela e com HP restante. */
export function isBattleEligible(battle: BossBattleTarget, at: Date): boolean {
  if (battle.status !== "running") return false;
  if (!Number.isFinite(battle.currentHp) || battle.currentHp <= 0) return false;
  const starts = parseTime(battle.startsAt);
  const ends = parseTime(battle.endsAt);
  if (Number.isNaN(starts) || Number.isNaN(ends)) return false;
  const now = at.getTime();
  return now >= starts && now <= ends;
}

/**
 * Escolhe a batalha alvo para um usuário: departamento específico primeiro,
 * depois global; desempate por término mais próximo e id crescente.
 */
export function selectTargetBattle(
  battles: readonly BossBattleTarget[],
  departmentId: string | null,
  at: Date,
): BossBattleTarget | null {
  const eligible = battles.filter(
    (b) => isBattleEligible(b, at) && (b.departmentId === null || b.departmentId === departmentId),
  );
  if (eligible.length === 0) return null;
  const ranked = [...eligible].sort((a, b) => {
    const aScoped = a.departmentId !== null ? 0 : 1;
    const bScoped = b.departmentId !== null ? 0 : 1;
    if (aScoped !== bScoped) return aScoped - bScoped;
    const diff = parseTime(a.endsAt) - parseTime(b.endsAt);
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  return ranked[0];
}

function buildEvent(
  battle: BossBattleTarget | null,
  userId: string,
  source: BossDamageSource,
  sourceRef: string,
  multiplier: number,
  maxMultiplier: number,
): BossDamageEvent | null {
  if (!battle) return null;
  const id = (userId ?? "").trim();
  const ref = (sourceRef ?? "").trim();
  if (id === "" || ref === "") return null;
  const key = buildBossDedupeKey(source, ref);
  if (key.length > BOSS_DEDUPE_KEY_MAX) return null;
  const rawMult = Number.isFinite(multiplier) ? multiplier : 1;
  const mult = Math.min(Math.max(rawMult, 1), Math.max(maxMultiplier, 1));
  return { battleId: battle.id, userId: id, source, sourceId: ref, multiplier: mult, dedupeKey: key };
}

export interface BossHookContext {
  battles: readonly BossBattleTarget[];
  departmentId: string | null;
  at: Date;
  /** Combo atual do jogador (1..maxMultiplier). */
  multiplier?: number;
  maxMultiplier?: number;
}

export type TaskCompletionStatus = "pending" | "on_time" | "late" | "rejected" | "rework";

export interface TaskScoreRow {
  id: string;
  userId: string;
  status: TaskCompletionStatus;
  isLate?: boolean;
  reworkCount?: number;
}

/** Tarefa entregue no prazo e sem retrabalho causa dano uma única vez. */
export function evaluateTaskScoreDamage(
  previous: TaskScoreRow | null,
  next: TaskScoreRow,
  ctx: BossHookContext,
): BossDamageEvent | null {
  if (next.status !== "on_time") return null;
  if (next.isLate === true) return null;
  if ((next.reworkCount ?? 0) > 0) return null;
  if (previous && previous.status === "on_time") return null;
  return buildEvent(
    selectTargetBattle(ctx.battles, ctx.departmentId, ctx.at),
    next.userId,
    "task_score",
    next.id,
    ctx.multiplier ?? 1,
    ctx.maxMultiplier ?? 3,
  );
}

export interface TrailEnrollmentRow {
  userId: string;
  trailId: string;
  completedAt: string | null;
}

/** Trilha concluída: transição de `completed_at` nulo para preenchido. */
export function evaluateTrailDamage(
  previous: TrailEnrollmentRow | null,
  next: TrailEnrollmentRow,
  ctx: BossHookContext,
): BossDamageEvent | null {
  if (!next.completedAt) return null;
  if (previous && previous.completedAt) return null;
  return buildEvent(
    selectTargetBattle(ctx.battles, ctx.departmentId, ctx.at),
    next.userId,
    "trail_completion",
    `${next.userId}:${next.trailId}`,
    ctx.multiplier ?? 1,
    ctx.maxMultiplier ?? 3,
  );
}

export interface AttendanceStreakRow {
  userId: string;
  currentStreak: number;
  lastPunctualDate: string | null;
}

/**
 * Presença pontual: paga uma vez por **dia**, não por linha atualizada.
 * A chave usa a data para que reprocessos no mesmo dia sejam idempotentes e
 * uma sequência que sobe amanhã volte a causar dano.
 */
export function evaluateAttendanceDamage(
  previous: AttendanceStreakRow | null,
  next: AttendanceStreakRow,
  ctx: BossHookContext,
): BossDamageEvent | null {
  const day = (next.lastPunctualDate ?? "").trim();
  if (day === "") return null;
  if (!Number.isFinite(next.currentStreak) || next.currentStreak <= 0) return null;
  if (previous && previous.lastPunctualDate === day) return null;
  return buildEvent(
    selectTargetBattle(ctx.battles, ctx.departmentId, ctx.at),
    next.userId,
    "attendance",
    `${next.userId}:${day}`,
    ctx.multiplier ?? 1,
    ctx.maxMultiplier ?? 3,
  );
}

/**
 * Aplica um evento sobre um "banco" em memória de chaves já usadas.
 * Devolve `duplicate: true` quando a chave já existia — exatamente o contrato
 * da RPC `deal_boss_damage`.
 */
export function applyBossEvent(
  existingKeys: Set<string>,
  event: BossDamageEvent | null,
): { dispatched: boolean; duplicate: boolean } {
  if (!event) return { dispatched: false, duplicate: false };
  const scoped = `${event.battleId}|${event.dedupeKey}`;
  if (existingKeys.has(scoped)) return { dispatched: false, duplicate: true };
  existingKeys.add(scoped);
  return { dispatched: true, duplicate: false };
}