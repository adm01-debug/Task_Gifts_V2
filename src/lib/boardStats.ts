/**
 * Camada pura de análise da Trilha Tabuleiro.
 *
 * Responsabilidades:
 *  - Classificar a dificuldade de cada desafio a partir da taxa de acerto real.
 *  - Sinalizar desafios que precisam de recalibração (muito fáceis, muito
 *    difíceis, com amostra insuficiente ou com jogadores travados).
 *  - Derivar medalhas e destaques do ranking sem depender de nenhuma UI.
 *
 * Todos os cálculos são defensivos: valores nulos, negativos, NaN ou Infinity
 * vindos do banco (ou de um payload adulterado) nunca podem quebrar a tela nem
 * produzir percentuais fora de 0..100.
 */

export interface BoardChallengeStatRow {
  challenge_id: string;
  question: string;
  tile_position: number;
  attempts: number;
  correct_attempts: number;
  accuracy: number;
  distinct_players: number;
  blocked_players: number;
}

export type ChallengeDifficulty = "sem-dados" | "muito-facil" | "equilibrado" | "dificil" | "critico";

export type ChallengeFlag =
  | "amostra-insuficiente"
  | "revisar-enunciado"
  | "recompensa-baixa-demais"
  | "jogadores-travados";

export interface AnalyzedChallenge extends BoardChallengeStatRow {
  /** Taxa de acerto saneada, sempre entre 0 e 100. */
  accuracyPct: number;
  difficulty: ChallengeDifficulty;
  flags: ChallengeFlag[];
}

export interface BoardChallengeReport {
  items: AnalyzedChallenge[];
  totalAttempts: number;
  totalCorrect: number;
  /** Acerto global ponderado por tentativas (0..100). */
  overallAccuracy: number;
  blockedPlayers: number;
  needsAttention: AnalyzedChallenge[];
}

/** Abaixo desta amostra qualquer conclusão estatística é ruído. */
export const MIN_SAMPLE_FOR_CALIBRATION = 5;

function toInt(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.trunc(parsed));
}

function toPct(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(100, Math.max(0, Math.round(parsed * 10) / 10));
}

export function classifyDifficulty(attempts: number, accuracyPct: number): ChallengeDifficulty {
  if (attempts <= 0) return "sem-dados";
  if (accuracyPct >= 90) return "muito-facil";
  if (accuracyPct >= 60) return "equilibrado";
  if (accuracyPct >= 30) return "dificil";
  return "critico";
}

export function analyzeChallenge(row: BoardChallengeStatRow): AnalyzedChallenge {
  const attempts = toInt(row?.attempts);
  // O gabarito nunca pode render mais acertos do que tentativas.
  const correct = Math.min(toInt(row?.correct_attempts), attempts);
  const blocked = toInt(row?.blocked_players);
  const players = toInt(row?.distinct_players);

  // Recalcula a acurácia localmente: é a fonte da verdade mesmo se o campo
  // `accuracy` vier inconsistente de uma versão antiga da RPC.
  const accuracyPct = attempts === 0 ? 0 : toPct((correct / attempts) * 100);
  const difficulty = classifyDifficulty(attempts, accuracyPct);

  const flags: ChallengeFlag[] = [];
  if (attempts > 0 && attempts < MIN_SAMPLE_FOR_CALIBRATION) flags.push("amostra-insuficiente");
  if (attempts >= MIN_SAMPLE_FOR_CALIBRATION && difficulty === "critico") flags.push("revisar-enunciado");
  if (attempts >= MIN_SAMPLE_FOR_CALIBRATION && difficulty === "muito-facil") {
    flags.push("recompensa-baixa-demais");
  }
  if (blocked > 0) flags.push("jogadores-travados");

  return {
    ...row,
    challenge_id: String(row?.challenge_id ?? ""),
    question: row?.question || "Pergunta removida",
    tile_position: toInt(row?.tile_position),
    attempts,
    correct_attempts: correct,
    distinct_players: players,
    blocked_players: blocked,
    accuracy: accuracyPct,
    accuracyPct,
    difficulty,
    flags,
  };
}

export function buildChallengeReport(rows: BoardChallengeStatRow[] | null | undefined): BoardChallengeReport {
  const items = (rows || []).map(analyzeChallenge);
  const totalAttempts = items.reduce((acc, i) => acc + i.attempts, 0);
  const totalCorrect = items.reduce((acc, i) => acc + i.correct_attempts, 0);

  return {
    items,
    totalAttempts,
    totalCorrect,
    overallAccuracy: totalAttempts === 0 ? 0 : toPct((totalCorrect / totalAttempts) * 100),
    blockedPlayers: items.reduce((acc, i) => acc + i.blocked_players, 0),
    needsAttention: items
      .filter((i) => i.flags.some((f) => f === "revisar-enunciado" || f === "jogadores-travados"))
      // Mais travados primeiro; empate resolve pela menor acurácia.
      .sort((a, b) => b.blocked_players - a.blocked_players || a.accuracyPct - b.accuracyPct),
  };
}

export interface BoardLeaderboardRow {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  board_position: number;
  coins: number;
  xp: number;
  moves_count: number;
  finished_at: string | null;
}

export type BoardMedal = "ouro" | "prata" | "bronze" | null;

export function medalForRank(rank: unknown): BoardMedal {
  const parsed = typeof rank === "number" ? rank : Number(rank);
  if (!Number.isFinite(parsed)) return null;
  const value = Math.trunc(parsed);
  if (value === 1) return "ouro";
  if (value === 2) return "prata";
  if (value === 3) return "bronze";
  return null;
}

/** Progresso do jogador em % sobre o total de casas (nunca divide por zero). */
export function trailProgressPct(position: unknown, totalTiles: unknown): number {
  const pos = toInt(position);
  const total = toInt(totalTiles);
  if (total <= 1) return pos > 0 ? 100 : 0;
  return Math.min(100, Math.round((pos / (total - 1)) * 100));
}