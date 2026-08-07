/**
 * Motor puro dos **gatilhos automáticos de pacotes de cartas**.
 *
 * Espelha, linha a linha, o comportamento dos gatilhos de banco
 * (`trg_card_pack_task_scores`, `trg_card_pack_trail_enrollments`,
 * `trg_card_pack_attendance_streaks`) para que centenas de cenários possam ser
 * simulados sem tocar no Postgres.
 *
 * Decisões de projeto (o "porquê" antes do "como"):
 *
 * 1. **Só evento real gera pacote.** Um pacote é moeda forte da economia do
 *    álbum; concedê-lo em qualquer `UPDATE` faria com que um simples reprocesso
 *    administrativo inflacionasse o estoque. Por isso cada regra observa a
 *    *transição* (estado anterior → novo), nunca o estado isolado.
 * 2. **Idempotência determinística.** A `dedupe_key` é função pura do
 *    (origem, referência) — o mesmo evento reprocessado mil vezes devolve o
 *    mesmo pacote. Isso é o que torna seguro reexecutar migrações e retries.
 * 3. **Sem retroatividade em quedas.** Uma sequência de presença que cai de 20
 *    para 3 e volta a 20 não paga de novo: o marco já tem chave própria.
 * 4. **Tamanho limitado no motor**, não só no banco: falha de configuração
 *    nunca deve virar pacote gigante.
 */

/** Origens aceitas pela RPC `grant_card_pack` (espelha o CHECK da tabela). */
export type CardPackSource = "task" | "training" | "quest" | "campaign" | "manual" | "streak";

export const CARD_PACK_MIN_SIZE = 1;
export const CARD_PACK_MAX_SIZE = 20;

/** Tamanho do pacote por gatilho automático. */
export const PACK_SIZE_TASK_ON_TIME = 3;
export const PACK_SIZE_TRAIL_COMPLETED = 5;
export const PACK_SIZE_STREAK_MILESTONE = 4;

/** Marcos de sequência de presença que pagam pacote. */
export const STREAK_MILESTONE_STEP = 5;
export const STREAK_MILESTONE_MAX = 100;

export interface CardPackGrant {
  userId: string;
  source: CardPackSource;
  sourceRef: string;
  size: number;
  dedupeKey: string;
}

/** Chave de idempotência — idêntica à construída na RPC. */
export function buildPackDedupeKey(source: CardPackSource, sourceRef: string | null | undefined): string {
  const ref = (sourceRef ?? "").trim();
  return `pack:${source}:${ref === "" ? "none" : ref}`;
}

function clampSize(size: number): number {
  if (!Number.isFinite(size)) return CARD_PACK_MIN_SIZE;
  return Math.max(CARD_PACK_MIN_SIZE, Math.min(Math.trunc(size), CARD_PACK_MAX_SIZE));
}

function grant(userId: string, source: CardPackSource, sourceRef: string, size: number): CardPackGrant | null {
  const id = (userId ?? "").trim();
  const ref = (sourceRef ?? "").trim();
  if (id === "" || ref === "") return null;
  const key = buildPackDedupeKey(source, ref);
  // Espelha o guarda de tamanho da RPC (`length(v_key) > 160`).
  if (key.length > 160) return null;
  return { userId: id, source, sourceRef: ref, size: clampSize(size), dedupeKey: key };
}

/** Estados de `task_scores.status` que representam entrega íntegra. */
export type TaskCompletionStatus = "pending" | "on_time" | "late" | "rejected" | "rework";

export interface TaskScoreRow {
  id: string;
  userId: string;
  status: TaskCompletionStatus;
  isLate?: boolean;
  reworkCount?: number;
}

/**
 * Tarefa entregue no prazo, sem retrabalho e sem atraso registrado.
 * `previous = null` representa um `INSERT` já nascido concluído.
 */
export function evaluateTaskScorePack(
  previous: TaskScoreRow | null,
  next: TaskScoreRow,
): CardPackGrant | null {
  if (next.status !== "on_time") return null;
  if (next.isLate === true) return null;
  if ((next.reworkCount ?? 0) > 0) return null;
  if (previous && previous.status === "on_time") return null;
  return grant(next.userId, "task", next.id, PACK_SIZE_TASK_ON_TIME);
}

export interface TrailEnrollmentRow {
  userId: string;
  trailId: string;
  completedAt: string | null;
}

/** Trilha concluída: transição de `completed_at` nulo para preenchido. */
export function evaluateTrailEnrollmentPack(
  previous: TrailEnrollmentRow | null,
  next: TrailEnrollmentRow,
): CardPackGrant | null {
  if (!next.completedAt) return null;
  if (previous && previous.completedAt) return null;
  return grant(next.userId, "training", next.trailId, PACK_SIZE_TRAIL_COMPLETED);
}

export interface AttendanceStreakRow {
  userId: string;
  currentStreak: number;
}

/** Maior marco (múltiplo de 5) alcançado por uma sequência. */
export function highestStreakMilestone(streak: number): number {
  if (!Number.isFinite(streak) || streak < STREAK_MILESTONE_STEP) return 0;
  const capped = Math.min(Math.trunc(streak), STREAK_MILESTONE_MAX);
  return Math.floor(capped / STREAK_MILESTONE_STEP) * STREAK_MILESTONE_STEP;
}

/**
 * Sequência de presença cruzando um novo marco.
 * Só o **marco recém-alcançado** paga; marcos anteriores já foram pagos no
 * momento em que ocorreram (e a `dedupe_key` protege contra repetição).
 */
export function evaluateAttendanceStreakPack(
  previous: AttendanceStreakRow | null,
  next: AttendanceStreakRow,
): CardPackGrant | null {
  const reached = highestStreakMilestone(next.currentStreak);
  if (reached === 0) return null;
  const before = highestStreakMilestone(previous?.currentStreak ?? 0);
  if (reached <= before) return null;
  return grant(next.userId, "streak", `${next.userId}:${reached}`, PACK_SIZE_STREAK_MILESTONE);
}

/**
 * Aplica uma concessão sobre um "banco" em memória de chaves já usadas.
 * Devolve `replayed: true` quando a chave já existia — exatamente o contrato
 * da RPC `grant_card_pack`.
 */
export function applyGrant(
  existingKeys: Set<string>,
  candidate: CardPackGrant | null,
): { granted: boolean; replayed: boolean } {
  if (!candidate) return { granted: false, replayed: false };
  const scoped = `${candidate.userId}|${candidate.dedupeKey}`;
  if (existingKeys.has(scoped)) return { granted: false, replayed: true };
  existingKeys.add(scoped);
  return { granted: true, replayed: false };
}
