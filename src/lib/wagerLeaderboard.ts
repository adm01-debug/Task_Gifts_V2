/**
 * Motor de saneamento e formatação do ranking de apostadores (Pergunta do Dia).
 * O cálculo pesado (agregações e sequências) roda no banco; aqui garantimos
 * apenas que o payload chegue tipado, íntegro e sem valores impossíveis.
 */

export type WagerLeaderboardWindow = 7 | 30 | 90;

export interface WagerLeaderboardRow {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  entries: number;
  correctCount: number;
  accuracy: number;
  stakedCoins: number;
  netCoins: number;
  xpAwarded: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayed: string | null;
  rank: number;
}

function toInt(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Converte as linhas cruas da RPC em um ranking seguro para renderizar. */
export function parseWagerLeaderboard(payload: unknown): WagerLeaderboardRow[] {
  if (!Array.isArray(payload)) return [];

  const rows: WagerLeaderboardRow[] = [];

  for (const raw of payload) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const userId = typeof item.user_id === "string" ? item.user_id : "";
    if (!userId) continue;

    const entries = Math.max(0, toInt(item.entries));
    // Acertos nunca podem superar o total de apostas do período.
    const correctCount = Math.min(entries, Math.max(0, toInt(item.correct_count)));
    const accuracyRaw = toNumber(item.accuracy, entries > 0 ? (correctCount / entries) * 100 : 0);
    const bestStreak = Math.min(entries, Math.max(0, toInt(item.best_streak)));

    rows.push({
      userId,
      displayName:
        typeof item.display_name === "string" && item.display_name.trim().length > 0
          ? item.display_name.trim()
          : "Jogador",
      avatarUrl: typeof item.avatar_url === "string" && item.avatar_url ? item.avatar_url : null,
      entries,
      correctCount,
      accuracy: Math.min(100, Math.max(0, Math.round(accuracyRaw * 10) / 10)),
      stakedCoins: Math.max(0, toInt(item.staked_coins)),
      netCoins: toInt(item.net_coins),
      xpAwarded: Math.max(0, toInt(item.xp_awarded)),
      // A sequência atual nunca ultrapassa a melhor sequência do período.
      currentStreak: Math.min(bestStreak, Math.max(0, toInt(item.current_streak))),
      bestStreak,
      lastPlayed: typeof item.last_played === "string" ? item.last_played : null,
      rank: Math.max(1, toInt(item.rank, rows.length + 1)),
    });
  }

  // Reordena e renumera para blindar contra qualquer inconsistência de rank.
  return rows
    .sort((a, b) =>
      b.netCoins !== a.netCoins
        ? b.netCoins - a.netCoins
        : b.correctCount !== a.correctCount
          ? b.correctCount - a.correctCount
          : b.accuracy !== a.accuracy
            ? b.accuracy - a.accuracy
            : b.entries - a.entries,
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

/** Rótulo curto do período consultado. */
export function windowLabel(days: WagerLeaderboardWindow): string {
  if (days === 7) return "7 dias";
  if (days === 30) return "30 dias";
  return "90 dias";
}

/** Formata o saldo líquido com sinal explícito. */
export function formatNet(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

/** Resumo agregado do período, usado no cabeçalho do ranking. */
export function summarizeLeaderboard(rows: WagerLeaderboardRow[]): {
  players: number;
  entries: number;
  accuracy: number;
  topStreak: number;
} {
  const entries = rows.reduce((acc, row) => acc + row.entries, 0);
  const correct = rows.reduce((acc, row) => acc + row.correctCount, 0);
  return {
    players: rows.length,
    entries,
    accuracy: entries > 0 ? Math.round((correct / entries) * 1000) / 10 : 0,
    topStreak: rows.reduce((acc, row) => Math.max(acc, row.bestStreak), 0),
  };
}