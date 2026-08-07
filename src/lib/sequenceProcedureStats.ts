/**
 * Motor puro de leitura das estatísticas por procedimento (SOPs).
 *
 * A RPC `get_sequence_procedure_stats` devolve JSON dinâmico; aqui ele é
 * saneado (nunca confiamos em números vindos do transporte) e transformado
 * em insights determinísticos que a UI apenas renderiza.
 */

export interface SequenceStatsSummary {
  attempts: number;
  players: number;
  perfectAttempts: number;
  avgAccuracy: number;
  avgDurationMs: number;
  bestDurationMs: number;
  coinsAwarded: number;
  xpAwarded: number;
  perfectRate: number;
}

export interface SequenceStatsLeader {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  attempts: number;
  perfectAttempts: number;
  bestAccuracy: number;
  bestDurationMs: number;
  coinsAwarded: number;
}

export interface SequenceStepStat {
  stepId: string;
  label: string;
  position: number;
  evaluated: number;
  correct: number;
  /** Percentual de acerto na posição (0 quando ainda não há amostra). */
  accuracy: number;
  /** Sem amostra suficiente para conclusões. */
  noSample: boolean;
}

export interface SequenceDailyPoint {
  day: string;
  attempts: number;
  perfectAttempts: number;
}

export interface SequenceRecentAttempt {
  id: string;
  displayName: string;
  stepsTotal: number;
  correctPositions: number;
  isPerfect: boolean;
  durationMs: number;
  coinsAwarded: number;
  xpAwarded: number;
  createdAt: string;
}

export interface SequenceProcedureStats {
  summary: SequenceStatsSummary;
  leaderboard: SequenceStatsLeader[];
  steps: SequenceStepStat[];
  daily: SequenceDailyPoint[];
  recent: SequenceRecentAttempt[];
}

type Json = Record<string, unknown>;

function asRecord(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Json) : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/** Converte para inteiro não negativo — protege contra NaN/Infinity/negativos. */
export function toCount(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

/** Converte para percentual 0–100 com uma casa decimal. */
export function toPercent(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(Math.min(100, n) * 10) / 10;
}

function toText(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

export function parseSequenceProcedureStats(payload: unknown): SequenceProcedureStats {
  const root = asRecord(payload);
  const rawSummary = asRecord(root.summary);

  const attempts = toCount(rawSummary.attempts);
  const perfectAttempts = Math.min(attempts, toCount(rawSummary.perfect_attempts));

  const summary: SequenceStatsSummary = {
    attempts,
    players: toCount(rawSummary.players),
    perfectAttempts,
    avgAccuracy: toPercent(rawSummary.avg_accuracy),
    avgDurationMs: toCount(rawSummary.avg_duration_ms),
    bestDurationMs: toCount(rawSummary.best_duration_ms),
    coinsAwarded: toCount(rawSummary.coins_awarded),
    xpAwarded: toCount(rawSummary.xp_awarded),
    perfectRate: attempts === 0 ? 0 : Math.round((perfectAttempts / attempts) * 1000) / 10,
  };

  const leaderboard = asArray(root.leaderboard)
    .map((entry) => {
      const row = asRecord(entry);
      return {
        userId: toText(row.user_id, ""),
        displayName: toText(row.display_name, "Participante"),
        avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : null,
        attempts: toCount(row.attempts),
        perfectAttempts: toCount(row.perfect_attempts),
        bestAccuracy: toPercent(row.best_accuracy),
        bestDurationMs: toCount(row.best_duration_ms),
        coinsAwarded: toCount(row.coins_awarded),
      } satisfies SequenceStatsLeader;
    })
    .filter((row) => row.userId.length > 0);

  const steps = asArray(root.steps)
    .map((entry) => {
      const row = asRecord(entry);
      const evaluated = toCount(row.evaluated);
      const correct = Math.min(evaluated, toCount(row.correct));
      return {
        stepId: toText(row.step_id, ""),
        label: toText(row.label, "Etapa"),
        position: toCount(row.position),
        evaluated,
        correct,
        accuracy: evaluated === 0 ? 0 : Math.round((correct / evaluated) * 1000) / 10,
        noSample: evaluated === 0,
      } satisfies SequenceStepStat;
    })
    .filter((row) => row.stepId.length > 0)
    .sort((a, b) => a.position - b.position);

  const daily = asArray(root.daily)
    .map((entry) => {
      const row = asRecord(entry);
      return {
        day: toText(row.day, ""),
        attempts: toCount(row.attempts),
        perfectAttempts: toCount(row.perfect_attempts),
      } satisfies SequenceDailyPoint;
    })
    .filter((row) => row.day.length > 0)
    .sort((a, b) => a.day.localeCompare(b.day));

  const recent = asArray(root.recent)
    .map((entry) => {
      const row = asRecord(entry);
      return {
        id: toText(row.id, ""),
        displayName: toText(row.display_name, "Participante"),
        stepsTotal: toCount(row.steps_total),
        correctPositions: toCount(row.correct_positions),
        isPerfect: row.is_perfect === true,
        durationMs: toCount(row.duration_ms),
        coinsAwarded: toCount(row.coins_awarded),
        xpAwarded: toCount(row.xp_awarded),
        createdAt: toText(row.created_at, ""),
      } satisfies SequenceRecentAttempt;
    })
    .filter((row) => row.id.length > 0);

  return { summary, leaderboard, steps, daily, recent };
}

/**
 * Etapas com maior confusão: menor acerto primeiro, ignorando as que ainda
 * não têm amostra (nenhuma tentativa avaliou aquela posição).
 */
export function weakestSteps(steps: SequenceStepStat[], limit = 3): SequenceStepStat[] {
  return steps
    .filter((step) => !step.noSample && step.accuracy < 100)
    .sort((a, b) => a.accuracy - b.accuracy || a.position - b.position)
    .slice(0, Math.max(0, limit));
}

/** Formata milissegundos em `m:ss` (ou `0:00` quando não há amostra). */
export function formatDuration(ms: number): string {
  const safe = toCount(ms);
  const totalSeconds = Math.round(safe / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
