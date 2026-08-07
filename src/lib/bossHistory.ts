/**
 * Motor puro da retrospectiva (Hall da Fama) do Chefão.
 *
 * Premissas explícitas:
 * - só entram no cálculo batalhas CONCLUÍDAS (`defeated`, `settled`, `expired`);
 *   rascunhos e batalhas em andamento nunca contaminam taxas históricas;
 * - vitória = chefão derrubado (`defeated` ou `settled`); derrota = `expired`;
 * - `hpDestroyedPct` é limitado a 0..1 mesmo se o banco tiver HP corrente
 *   inconsistente (defensivo contra dados legados);
 * - tempo de abate usa `defeated_at - starts_at`; valores negativos ou sem
 *   data são descartados em vez de gerar médias absurdas;
 * - a sequência de vitórias é calculada na ordem cronológica de encerramento.
 *
 * Todas as funções são determinísticas e livres de I/O para permitir
 * simulação massiva em testes.
 */

export type BossHistoryStatus = "draft" | "running" | "defeated" | "expired" | "settled";

export interface BossHistoryInput {
  id: string;
  title?: string | null;
  status: BossHistoryStatus;
  total_hp: number;
  current_hp: number;
  starts_at?: string | null;
  ends_at?: string | null;
  defeated_at?: string | null;
  settled_at?: string | null;
  coins_pool?: number;
  xp_pool?: number;
  department_id?: string | null;
}

export interface BossHistoryRow {
  id: string;
  title: string;
  status: Extract<BossHistoryStatus, "defeated" | "expired" | "settled">;
  victory: boolean;
  /** 0..1 */
  hpDestroyedPct: number;
  hpDestroyed: number;
  totalHp: number;
  /** Milissegundos entre o início e o abate; `null` quando não houve abate. */
  killDurationMs: number | null;
  coinsPool: number;
  xpPool: number;
  /** Recompensa só é considerada paga depois da apuração. */
  settled: boolean;
  concludedAt: string | null;
}

export interface BossHistorySummary {
  concluded: number;
  victories: number;
  defeats: number;
  /** Vitórias ainda não apuradas (pendência operacional acionável). */
  awaitingSettlement: number;
  /** 0..1 — 0 quando não há histórico. */
  winRate: number;
  /** Média de HP destruído (0..1) considerando todas as concluídas. */
  avgHpDestroyedPct: number;
  totalHpDestroyed: number;
  fastestKillMs: number | null;
  avgKillMs: number | null;
  coinsAwarded: number;
  xpAwarded: number;
  longestVictoryStreak: number;
  currentVictoryStreak: number;
  rows: BossHistoryRow[];
}

const CONCLUDED: ReadonlySet<string> = new Set(["defeated", "expired", "settled"]);

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

/** Data usada para ordenar cronologicamente o encerramento da batalha. */
function concludedAt(battle: BossHistoryInput): string | null {
  return battle.settled_at || battle.defeated_at || battle.ends_at || null;
}

export function toHistoryRow(battle: BossHistoryInput): BossHistoryRow | null {
  if (!CONCLUDED.has(battle.status)) return null;
  const totalHp = Math.max(0, Math.trunc(num(battle.total_hp)));
  const currentHp = Math.max(0, Math.trunc(num(battle.current_hp)));
  const destroyed = Math.max(0, Math.min(totalHp, totalHp - currentHp));
  const victory = battle.status !== "expired";
  const start = timestamp(battle.starts_at);
  const kill = timestamp(battle.defeated_at);
  const duration = start !== null && kill !== null && kill >= start ? kill - start : null;

  return {
    id: battle.id,
    title: (battle.title ?? "").trim() || "Chefão sem título",
    status: battle.status as BossHistoryRow["status"],
    victory,
    hpDestroyed: destroyed,
    totalHp,
    hpDestroyedPct: totalHp > 0 ? clamp01(destroyed / totalHp) : victory ? 1 : 0,
    killDurationMs: victory ? duration : null,
    coinsPool: Math.max(0, Math.trunc(num(battle.coins_pool))),
    xpPool: Math.max(0, Math.trunc(num(battle.xp_pool))),
    settled: battle.status === "settled",
    concludedAt: concludedAt(battle),
  };
}

export interface SummarizeOptions {
  /** Limita as linhas retornadas (mais recentes primeiro). Padrão: 10. */
  limit?: number;
  departmentId?: string | null;
}

export function summarizeBossHistory(
  battles: readonly BossHistoryInput[],
  options: SummarizeOptions = {},
): BossHistorySummary {
  const limit = Math.max(0, Math.trunc(options.limit ?? 10));
  const filtered = (battles ?? []).filter((b) =>
    options.departmentId ? b.department_id === options.departmentId : true,
  );

  const rows: BossHistoryRow[] = [];
  for (const battle of filtered) {
    const row = toHistoryRow(battle);
    if (row) rows.push(row);
  }

  // Ordem cronológica crescente (empates resolvidos pelo id) para as sequências.
  const chronological = [...rows].sort((a, b) => {
    const ta = timestamp(a.concludedAt) ?? 0;
    const tb = timestamp(b.concludedAt) ?? 0;
    if (ta !== tb) return ta - tb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  let victories = 0;
  let defeats = 0;
  let awaitingSettlement = 0;
  let totalHpDestroyed = 0;
  let pctSum = 0;
  let coinsAwarded = 0;
  let xpAwarded = 0;
  let fastestKillMs: number | null = null;
  let killSum = 0;
  let killCount = 0;
  let streak = 0;
  let longestVictoryStreak = 0;

  for (const row of chronological) {
    if (row.victory) {
      victories += 1;
      streak += 1;
      if (streak > longestVictoryStreak) longestVictoryStreak = streak;
      if (!row.settled) awaitingSettlement += 1;
    } else {
      defeats += 1;
      streak = 0;
    }
    totalHpDestroyed += row.hpDestroyed;
    pctSum += row.hpDestroyedPct;
    if (row.settled) {
      coinsAwarded += row.coinsPool;
      xpAwarded += row.xpPool;
    }
    if (row.killDurationMs !== null) {
      killSum += row.killDurationMs;
      killCount += 1;
      if (fastestKillMs === null || row.killDurationMs < fastestKillMs) {
        fastestKillMs = row.killDurationMs;
      }
    }
  }

  const concluded = chronological.length;
  const recent = [...chronological].reverse();

  return {
    concluded,
    victories,
    defeats,
    awaitingSettlement,
    winRate: concluded > 0 ? victories / concluded : 0,
    avgHpDestroyedPct: concluded > 0 ? pctSum / concluded : 0,
    totalHpDestroyed,
    fastestKillMs,
    avgKillMs: killCount > 0 ? Math.round(killSum / killCount) : null,
    coinsAwarded,
    xpAwarded,
    longestVictoryStreak,
    currentVictoryStreak: streak,
    rows: limit > 0 ? recent.slice(0, limit) : recent,
  };
}

/** Formata uma duração em ms como "2d 4h", "3h 20min" ou "12min". */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms < 0) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const restMin = minutes % 60;
  if (hours < 24) return restMin > 0 ? `${hours}h ${restMin}min` : `${hours}h`;
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days}d ${restHours}h` : `${days}d`;
}

export interface HistoryDepartmentOption {
  id: string;
  concluded: number;
}

/**
 * Departamentos que realmente possuem batalhas CONCLUÍDAS, com a contagem.
 * Evita oferecer filtros que resultariam em uma lista vazia.
 * Ordenação: mais batalhas primeiro, depois id (determinístico).
 */
export function listHistoryDepartments(
  battles: readonly BossHistoryInput[],
): HistoryDepartmentOption[] {
  const counts = new Map<string, number>();
  for (const battle of battles ?? []) {
    if (!CONCLUDED.has(battle.status)) continue;
    const id = battle.department_id;
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, concluded]) => ({ id, concluded }))
    .sort((a, b) => (b.concluded - a.concluded) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}