/**
 * Comparativo entre departamentos no mesmo período (Chefão).
 *
 * Premissas explícitas:
 * - só entram batalhas CONCLUÍDAS (`toHistoryRow` é a fonte da verdade);
 * - a janela é aplicada sobre a data de ENCERRAMENTO; batalhas sem data
 *   confiável ficam de fora do comparativo (contabilizadas em `excludedUndated`)
 *   porque não é possível afirmar que pertencem à janela;
 * - batalhas sem `department_id` são agrupadas em um bucket explícito
 *   ("sem departamento") em vez de sumirem silenciosamente;
 * - o score de ranking prioriza taxa de vitória e usa HP destruído como
 *   desempate, evitando que um departamento com 1 batalha vencida supere
 *   outro com 20 vitórias apenas por 100% de aproveitamento: aplica-se
 *   suavização bayesiana (média ponderada com a média global);
 * - determinístico e livre de I/O.
 */

import { toHistoryRow, type BossHistoryInput } from "./bossHistory";

export const NO_DEPARTMENT = "__none__";

export interface DepartmentComparisonRow {
  departmentId: string;
  battles: number;
  victories: number;
  defeats: number;
  /** 0..1 bruto. */
  winRate: number;
  /** 0..1 suavizado (prior = média global, peso = `priorWeight`). */
  adjustedWinRate: number;
  hpDestroyed: number;
  coinsAwarded: number;
  xpAwarded: number;
  avgKillMs: number | null;
  rank: number;
}

export interface DepartmentComparisonResult {
  rows: DepartmentComparisonRow[];
  totalBattles: number;
  globalWinRate: number;
  excludedUndated: number;
  from: string | null;
  to: string | null;
}

export interface ComparisonOptions {
  /** ISO inclusive. */
  from?: string | null;
  /** ISO inclusive. */
  to?: string | null;
  /** Peso do prior bayesiano (batalhas virtuais). Padrão: 3. */
  priorWeight?: number;
  /** Ignora departamentos com menos batalhas que isto. Padrão: 1. */
  minBattles?: number;
}

function ts(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function compareDepartments(
  battles: readonly BossHistoryInput[],
  options: ComparisonOptions = {},
): DepartmentComparisonResult {
  const priorWeight = Math.max(0, Number(options.priorWeight ?? 3) || 0);
  const minBattles = Math.max(1, Math.trunc(options.minBattles ?? 1));
  const fromMs = ts(options.from);
  const toMs = ts(options.to);
  // Janela invertida é normalizada em vez de retornar vazio silenciosamente.
  const lower = fromMs !== null && toMs !== null ? Math.min(fromMs, toMs) : fromMs;
  const upper = fromMs !== null && toMs !== null ? Math.max(fromMs, toMs) : toMs;

  interface Acc {
    battles: number;
    victories: number;
    hpDestroyed: number;
    coins: number;
    xp: number;
    killSum: number;
    killCount: number;
  }
  const acc = new Map<string, Acc>();
  let excludedUndated = 0;
  let totalBattles = 0;
  let totalVictories = 0;

  for (const battle of battles ?? []) {
    const row = toHistoryRow(battle);
    if (!row) continue;
    const when = ts(row.concludedAt);
    if (when === null) {
      excludedUndated += 1;
      continue;
    }
    if (lower !== null && when < lower) continue;
    if (upper !== null && when > upper) continue;

    const key = battle.department_id || NO_DEPARTMENT;
    const entry = acc.get(key) ?? {
      battles: 0, victories: 0, hpDestroyed: 0, coins: 0, xp: 0, killSum: 0, killCount: 0,
    };
    entry.battles += 1;
    if (row.victory) entry.victories += 1;
    entry.hpDestroyed += row.hpDestroyed;
    if (row.settled) {
      entry.coins += row.coinsPool;
      entry.xp += row.xpPool;
    }
    if (row.killDurationMs !== null) {
      entry.killSum += row.killDurationMs;
      entry.killCount += 1;
    }
    acc.set(key, entry);
    totalBattles += 1;
    if (row.victory) totalVictories += 1;
  }

  const globalWinRate = totalBattles > 0 ? totalVictories / totalBattles : 0;

  const rows: DepartmentComparisonRow[] = [];
  for (const [departmentId, entry] of acc) {
    if (entry.battles < minBattles) continue;
    const winRate = entry.victories / entry.battles;
    const adjustedWinRate =
      (entry.victories + globalWinRate * priorWeight) / (entry.battles + priorWeight);
    rows.push({
      departmentId,
      battles: entry.battles,
      victories: entry.victories,
      defeats: entry.battles - entry.victories,
      winRate,
      adjustedWinRate,
      hpDestroyed: entry.hpDestroyed,
      coinsAwarded: entry.coins,
      xpAwarded: entry.xp,
      avgKillMs: entry.killCount > 0 ? Math.round(entry.killSum / entry.killCount) : null,
      rank: 0,
    });
  }

  rows.sort((a, b) => {
    if (b.adjustedWinRate !== a.adjustedWinRate) return b.adjustedWinRate - a.adjustedWinRate;
    if (b.hpDestroyed !== a.hpDestroyed) return b.hpDestroyed - a.hpDestroyed;
    if (b.battles !== a.battles) return b.battles - a.battles;
    return a.departmentId < b.departmentId ? -1 : a.departmentId > b.departmentId ? 1 : 0;
  });

  // Dense ranking: empates (mesmo score ajustado) compartilham a posição.
  let rank = 0;
  let previous: number | null = null;
  rows.forEach((row) => {
    if (previous === null || row.adjustedWinRate !== previous) {
      rank += 1;
      previous = row.adjustedWinRate;
    }
    row.rank = rank;
  });

  return {
    rows,
    totalBattles,
    globalWinRate,
    excludedUndated,
    from: lower !== null ? new Date(lower).toISOString() : null,
    to: upper !== null ? new Date(upper).toISOString() : null,
  };
}

/** Janela relativa em dias, fechada em `now` (útil para presets da UI). */
export function lastDaysWindow(days: number, now: Date = new Date()): { from: string; to: string } {
  const safeDays = Math.max(1, Math.trunc(days) || 1);
  const to = now.getTime();
  return {
    from: new Date(to - safeDays * 86_400_000).toISOString(),
    to: new Date(to).toISOString(),
  };
}
