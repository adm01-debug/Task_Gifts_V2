/**
 * Motor puro do Torneio Mata-Mata (single elimination).
 *
 * IMPORTANTE: a fonte de verdade das partidas e do crédito de recompensas é o
 * banco (RPCs SECURITY DEFINER). Este módulo é um espelho determinístico usado
 * para (a) montar/renderizar o chaveamento na UI e (b) permitir simulação
 * exaustiva de cenários em teste. Nada aqui gera moedas ou XP.
 */

export interface BracketSeed {
  /** Id do participante (profile_id ou team_id). */
  id: string;
  label: string;
  /** Pontuação usada para semear (maior = melhor seed). */
  score: number;
}

export interface BracketMatch {
  round: number;
  /** Posição da partida dentro da rodada (0-based). */
  slot: number;
  home_seed: number | null;
  away_seed: number | null;
  /** Partida com apenas um lado: avanço automático (bye). */
  bye: boolean;
}

export interface BracketPlan {
  size: number;
  rounds: number;
  byes: number;
  /** Ordem de seeds na primeira rodada (seed 1..size, 0 = vaga vazia/bye). */
  firstRoundOrder: number[];
  matches: BracketMatch[];
}

export const MIN_BRACKET_PARTICIPANTS = 2;
export const MAX_BRACKET_PARTICIPANTS = 256;

/** Menor potência de 2 >= n (mínimo 2). */
export function bracketSize(participants: number): number {
  if (participants < MIN_BRACKET_PARTICIPANTS) return 0;
  let size = 2;
  while (size < participants) size *= 2;
  return size;
}

export function bracketRounds(size: number): number {
  if (size < 2) return 0;
  return Math.round(Math.log2(size));
}

/**
 * Ordem canônica de seeds (padrão tênis/NBA) para um bracket de tamanho `size`.
 * Garante que seed 1 e seed 2 só possam se encontrar na final.
 */
export function seedOrder(size: number): number[] {
  if (size < 2) return [];
  let order = [1, 2];
  while (order.length < size) {
    const next = order.length * 2;
    const mirrored: number[] = [];
    for (const seed of order) {
      mirrored.push(seed, next + 1 - seed);
    }
    order = mirrored;
  }
  return order;
}

/**
 * Ordena seeds de forma determinística: score desc, depois label, depois id.
 * Empates nunca dependem da ordem de chegada do array.
 */
export function rankSeeds(seeds: BracketSeed[]): BracketSeed[] {
  return [...seeds].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.label !== b.label) return a.label.localeCompare(b.label, "pt-BR");
    return a.id.localeCompare(b.id);
  });
}

/**
 * Monta o plano completo do chaveamento. Participantes faltantes viram byes,
 * sempre atribuídos aos melhores seeds (comportamento esportivo padrão).
 */
export function buildBracket(participants: number): BracketPlan {
  const size = bracketSize(participants);
  if (size === 0) {
    return { size: 0, rounds: 0, byes: 0, firstRoundOrder: [], matches: [] };
  }
  const clamped = Math.min(participants, MAX_BRACKET_PARTICIPANTS);
  const order = seedOrder(size).map((seed) => (seed <= clamped ? seed : 0));
  const rounds = bracketRounds(size);
  const matches: BracketMatch[] = [];

  for (let slot = 0; slot < size / 2; slot++) {
    const home = order[slot * 2];
    const away = order[slot * 2 + 1];
    matches.push({
      round: 1,
      slot,
      home_seed: home === 0 ? null : home,
      away_seed: away === 0 ? null : away,
      bye: home === 0 || away === 0,
    });
  }

  for (let round = 2; round <= rounds; round++) {
    const count = size / 2 ** round;
    for (let slot = 0; slot < count; slot++) {
      matches.push({ round, slot, home_seed: null, away_seed: null, bye: false });
    }
  }

  return {
    size,
    rounds,
    byes: size - clamped,
    firstRoundOrder: order,
    matches,
  };
}

/** Índice da partida da rodada seguinte que recebe o vencedor. */
export function nextSlot(slot: number): number {
  return Math.floor(slot / 2);
}

/** Lado ("home" | "away") que o vencedor ocupa na próxima rodada. */
export function nextSide(slot: number): "home" | "away" {
  return slot % 2 === 0 ? "home" : "away";
}

export interface MatchResultInput {
  round: number;
  slot: number;
  home_seed: number | null;
  away_seed: number | null;
  home_score: number;
  away_score: number;
}

/**
 * Resolve o vencedor de uma partida.
 * Regras: bye avança sozinho; maior score vence; empate é resolvido pelo
 * melhor seed (número menor) — nunca retorna resultado indefinido.
 */
export function resolveWinner(match: MatchResultInput): number | null {
  const { home_seed, away_seed, home_score, away_score } = match;
  if (home_seed === null && away_seed === null) return null;
  if (home_seed === null) return away_seed;
  if (away_seed === null) return home_seed;
  if (home_score > away_score) return home_seed;
  if (away_score > home_score) return away_seed;
  return Math.min(home_seed, away_seed);
}

export interface TournamentRewardRules {
  coinsPerWin: number;
  xpPerWin: number;
  coinsChampion: number;
  xpChampion: number;
  coinsRunnerUp: number;
  xpRunnerUp: number;
}

export interface TournamentAward {
  coins: number;
  xp: number;
}

/**
 * Recompensa determinística de um participante.
 * `wins` conta apenas vitórias efetivas (byes não pagam), evitando inflação
 * econômica em torneios com muitas vagas vazias.
 */
export function awardFor(
  wins: number,
  placement: "champion" | "runner_up" | "eliminated",
  rules: TournamentRewardRules,
): TournamentAward {
  const safeWins = Math.max(0, Math.floor(wins));
  let coins = safeWins * Math.max(0, rules.coinsPerWin);
  let xp = safeWins * Math.max(0, rules.xpPerWin);
  if (placement === "champion") {
    coins += Math.max(0, rules.coinsChampion);
    xp += Math.max(0, rules.xpChampion);
  } else if (placement === "runner_up") {
    coins += Math.max(0, rules.coinsRunnerUp);
    xp += Math.max(0, rules.xpRunnerUp);
  }
  return { coins, xp };
}

/** Progresso do torneio em % (partidas decididas / total de partidas). */
export function tournamentProgress(decided: number, total: number): number {
  if (total <= 0) return 0;
  const pct = (Math.min(decided, total) / total) * 100;
  return Math.round(pct);
}

export function roundLabel(round: number, rounds: number): string {
  const remaining = rounds - round;
  if (remaining === 0) return "Final";
  if (remaining === 1) return "Semifinal";
  if (remaining === 2) return "Quartas de final";
  if (remaining === 3) return "Oitavas de final";
  return `Rodada ${round}`;
}
