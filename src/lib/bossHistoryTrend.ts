/**
 * Tendência mensal do Hall da Fama do Chefão.
 *
 * Premissas explícitas:
 * - só entram batalhas CONCLUÍDAS (reaproveita `toHistoryRow` como fonte da verdade);
 * - o bucket é o mês do ENCERRAMENTO (`settled_at || defeated_at || ends_at`);
 *   batalhas sem data de encerramento são contabilizadas em `undated` e nunca
 *   distorcem a série temporal;
 * - a série é densa: meses sem batalha entre o primeiro e o último aparecem
 *   zerados, para o gráfico não "encurtar" períodos de inatividade;
 * - o delta compara o último mês com o anterior em pontos percentuais;
 * - determinístico e livre de I/O (simulável em massa).
 */

import { toHistoryRow, type BossHistoryInput } from "./bossHistory";

export interface BossTrendPoint {
  /** `YYYY-MM` (UTC). */
  month: string;
  label: string;
  battles: number;
  victories: number;
  defeats: number;
  /** 0..1 — 0 quando o mês não teve batalhas. */
  winRate: number;
  hpDestroyed: number;
  coinsAwarded: number;
  xpAwarded: number;
}

export interface BossTrendResult {
  points: BossTrendPoint[];
  /** Batalhas concluídas sem data de encerramento confiável. */
  undated: number;
  /** Diferença em pontos percentuais entre o último mês e o anterior. */
  winRateDeltaPp: number | null;
  bestMonth: BossTrendPoint | null;
}

const MONTHS = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

function monthKey(iso: string): string | null {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function label(key: string): string {
  const [y, m] = key.split("-");
  const idx = Number(m) - 1;
  return `${MONTHS[idx] ?? "?"}/${y.slice(2)}`;
}

function empty(month: string): BossTrendPoint {
  return {
    month,
    label: label(month),
    battles: 0,
    victories: 0,
    defeats: 0,
    winRate: 0,
    hpDestroyed: 0,
    coinsAwarded: 0,
    xpAwarded: 0,
  };
}

/** Avança um mês em cima da chave `YYYY-MM` sem depender de timezone local. */
function nextMonth(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return m >= 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}

export interface BossTrendOptions {
  departmentId?: string | null;
  /** Mantém apenas os N meses mais recentes (0 = todos). Padrão: 12. */
  months?: number;
}

export function buildBossHistoryTrend(
  battles: readonly BossHistoryInput[],
  options: BossTrendOptions = {},
): BossTrendResult {
  const maxMonths = Math.max(0, Math.trunc(options.months ?? 12));
  const buckets = new Map<string, BossTrendPoint>();
  let undated = 0;

  for (const battle of battles ?? []) {
    if (options.departmentId && battle.department_id !== options.departmentId) continue;
    const row = toHistoryRow(battle);
    if (!row) continue;
    const key = row.concludedAt ? monthKey(row.concludedAt) : null;
    if (!key) {
      undated += 1;
      continue;
    }
    const point = buckets.get(key) ?? empty(key);
    point.battles += 1;
    if (row.victory) point.victories += 1;
    else point.defeats += 1;
    point.hpDestroyed += row.hpDestroyed;
    if (row.settled) {
      point.coinsAwarded += row.coinsPool;
      point.xpAwarded += row.xpPool;
    }
    buckets.set(key, point);
  }

  const keys = [...buckets.keys()].sort();
  const dense: BossTrendPoint[] = [];
  if (keys.length > 0) {
    let cursor = keys[0];
    const last = keys[keys.length - 1];
    // Guarda contra loops infinitos em dados corrompidos.
    for (let guard = 0; guard < 600; guard++) {
      dense.push(buckets.get(cursor) ?? empty(cursor));
      if (cursor === last) break;
      cursor = nextMonth(cursor);
    }
  }

  for (const point of dense) {
    point.winRate = point.battles > 0 ? point.victories / point.battles : 0;
  }

  const points = maxMonths > 0 ? dense.slice(-maxMonths) : dense;

  let winRateDeltaPp: number | null = null;
  if (points.length >= 2) {
    const current = points[points.length - 1];
    const previous = points[points.length - 2];
    if (current.battles > 0 && previous.battles > 0) {
      winRateDeltaPp = Math.round((current.winRate - previous.winRate) * 1000) / 10;
    }
  }

  let bestMonth: BossTrendPoint | null = null;
  for (const point of points) {
    if (point.battles === 0) continue;
    if (
      !bestMonth ||
      point.victories > bestMonth.victories ||
      (point.victories === bestMonth.victories && point.hpDestroyed > bestMonth.hpDestroyed)
    ) {
      bestMonth = point;
    }
  }

  return { points, undated, winRateDeltaPp, bestMonth };
}
