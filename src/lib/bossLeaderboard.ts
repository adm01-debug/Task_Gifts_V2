/**
 * Motor puro do ranking de contribuintes do Chefão.
 *
 * Regras de negócio:
 * - ordenação determinística (dano desc, depois userId asc), igual à do banco;
 * - empates recebem a MESMA posição (rank competitivo: 1, 2, 2, 4);
 * - o percentual usa o dano total da batalha, nunca a soma da página,
 *   evitando que um top-10 parcial "feche" em 100%;
 * - a projeção de prêmio reaproveita `distributeRewards`, respeitando
 *   participação mínima e teto por pessoa exatamente como a apuração real.
 */
import { distributeRewards, type RewardOptions } from "./bossBattle";

export interface LeaderboardInput {
  userId: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  damage: number;
  hits?: number;
}

export interface LeaderboardRow {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  damage: number;
  hits: number;
  /** 0..1 sobre o dano total da batalha. */
  share: number;
  isCurrentUser: boolean;
  /** Projeção de moedas/XP caso a batalha fosse apurada agora. */
  projectedCoins: number;
  projectedXp: number;
}

export interface BuildLeaderboardOptions {
  /** Dano total da batalha (pode ser maior que a soma das linhas recebidas). */
  totalDamage?: number;
  currentUserId?: string | null;
  /** Quantidade de linhas exibidas (padrão 10). */
  limit?: number;
  rewards?: RewardOptions;
}

export interface LeaderboardResult {
  rows: LeaderboardRow[];
  /** Linha do usuário atual quando ele ficou fora do recorte exibido. */
  currentUserRow: LeaderboardRow | null;
  totalDamage: number;
  contributors: number;
}

function toInt(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function fallbackName(name: string | null | undefined): string {
  const trimmed = (name ?? "").trim();
  return trimmed.length > 0 ? trimmed : "Participante";
}

export function buildBossLeaderboard(
  entries: readonly LeaderboardInput[],
  options: BuildLeaderboardOptions = {},
): LeaderboardResult {
  const limit = Math.min(Math.max(toInt(options.limit ?? 10) || 10, 1), 100);
  const currentUserId = options.currentUserId ?? null;

  // Deduplica por usuário (defesa contra respostas repetidas do banco).
  const merged = new Map<string, { userId: string; displayName?: string | null; avatarUrl?: string | null; damage: number; hits: number }>();
  for (const entry of entries) {
    const userId = String(entry?.userId ?? "").trim();
    if (!userId) continue;
    const damage = Math.max(0, toInt(entry.damage));
    if (damage <= 0) continue;
    const existing = merged.get(userId);
    if (existing) {
      existing.damage += damage;
      existing.hits += Math.max(0, toInt(entry.hits));
      existing.displayName = existing.displayName ?? entry.displayName;
      existing.avatarUrl = existing.avatarUrl ?? entry.avatarUrl;
    } else {
      merged.set(userId, {
        userId,
        displayName: entry.displayName ?? null,
        avatarUrl: entry.avatarUrl ?? null,
        damage,
        hits: Math.max(0, toInt(entry.hits)),
      });
    }
  }

  const ordered = [...merged.values()].sort(
    (a, b) => b.damage - a.damage || (a.userId < b.userId ? -1 : a.userId > b.userId ? 1 : 0),
  );

  const sumRows = ordered.reduce((sum, row) => sum + row.damage, 0);
  const totalDamage = Math.max(Math.max(0, toInt(options.totalDamage ?? 0)), sumRows);

  const projection = new Map<string, { coins: number; xp: number }>();
  if (options.rewards) {
    for (const share of distributeRewards(
      ordered.map((row) => ({ userId: row.userId, damage: row.damage })),
      options.rewards,
    )) {
      projection.set(share.userId, { coins: share.coins, xp: share.xp });
    }
  }

  let lastDamage: number | null = null;
  let lastRank = 0;
  const ranked: LeaderboardRow[] = ordered.map((row, index) => {
    const rank = lastDamage === row.damage ? lastRank : index + 1;
    lastDamage = row.damage;
    lastRank = rank;
    const reward = projection.get(row.userId);
    return {
      rank,
      userId: row.userId,
      displayName: fallbackName(row.displayName),
      avatarUrl: row.avatarUrl ?? null,
      damage: row.damage,
      hits: row.hits,
      share: totalDamage > 0 ? row.damage / totalDamage : 0,
      isCurrentUser: !!currentUserId && row.userId === currentUserId,
      projectedCoins: reward?.coins ?? 0,
      projectedXp: reward?.xp ?? 0,
    };
  });

  const rows = ranked.slice(0, limit);
  const currentUserRow =
    currentUserId && !rows.some((row) => row.isCurrentUser)
      ? (ranked.find((row) => row.isCurrentUser) ?? null)
      : null;

  return { rows, currentUserRow, totalDamage, contributors: ranked.length };
}

/** Rótulo curto de posição, com medalha para o pódio. */
export function rankLabel(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `${rank}º`;
}

/** Percentual formatado em pt-BR (ex.: "12,4%"). */
export function formatShare(share: number): string {
  const safe = Number.isFinite(share) ? Math.min(Math.max(share, 0), 1) : 0;
  return `${(safe * 100).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}
