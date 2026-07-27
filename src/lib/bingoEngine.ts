/**
 * Motor puro do Bingo de Missões.
 *
 * IMPORTANTE: a fonte de verdade da marcação e do crédito é a RPC
 * `sync_bingo_card` (SECURITY DEFINER). Este módulo é um espelho
 * determinístico usado para (a) renderizar linhas destacadas na UI e
 * (b) permitir simulação exaustiva de cenários em teste. Nada aqui
 * gera moedas ou XP.
 */

export const BINGO_SIZE = 5;
export const BINGO_CELLS = BINGO_SIZE * BINGO_SIZE;
export const BINGO_FREE_POSITION = 12;
export const BINGO_TOTAL_LINES = 12; // 5 linhas + 5 colunas + 2 diagonais

export interface BingoCell {
  position: number;
  task_id: string | null;
  label: string;
  metric_key: string;
  target: number;
  free: boolean;
}

export interface BingoRewardRules {
  coinsPerLine: number;
  xpPerLine: number;
  coinsFullHouse: number;
  xpFullHouse: number;
}

export interface BingoAward {
  coins: number;
  xp: number;
  newLines: number;
  fullHouse: boolean;
}

/** Índices (0..24) de cada uma das 12 linhas possíveis. */
export function bingoLineIndexes(): number[][] {
  const lines: number[][] = [];
  for (let i = 0; i < BINGO_SIZE; i++) {
    lines.push(Array.from({ length: BINGO_SIZE }, (_, j) => i * BINGO_SIZE + j));
  }
  for (let j = 0; j < BINGO_SIZE; j++) {
    lines.push(Array.from({ length: BINGO_SIZE }, (_, i) => i * BINGO_SIZE + j));
  }
  lines.push(Array.from({ length: BINGO_SIZE }, (_, i) => i * BINGO_SIZE + i));
  lines.push(Array.from({ length: BINGO_SIZE }, (_, i) => i * BINGO_SIZE + (BINGO_SIZE - 1 - i)));
  return lines;
}

const LINE_INDEXES = bingoLineIndexes();

function normalizeMarks(marked: readonly boolean[]): boolean[] {
  const out = new Array<boolean>(BINGO_CELLS).fill(false);
  for (let i = 0; i < BINGO_CELLS; i++) out[i] = marked[i] === true;
  return out;
}

/** Quantidade de linhas completas. */
export function countCompletedLines(marked: readonly boolean[]): number {
  const m = normalizeMarks(marked);
  return LINE_INDEXES.reduce((acc, line) => (line.every((idx) => m[idx]) ? acc + 1 : acc), 0);
}

/** Posições que pertencem a alguma linha completa (para destaque visual). */
export function completedLinePositions(marked: readonly boolean[]): Set<number> {
  const m = normalizeMarks(marked);
  const positions = new Set<number>();
  for (const line of LINE_INDEXES) {
    if (line.every((idx) => m[idx])) line.forEach((idx) => positions.add(idx));
  }
  return positions;
}

/** Cartela cheia = 25 casas marcadas. */
export function isFullHouse(marked: readonly boolean[]): boolean {
  return normalizeMarks(marked).every(Boolean);
}

function safeInt(value: number, max = 1_000_000): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(max, Math.max(0, Math.floor(value)));
}

/**
 * Espelha `sync_bingo_card`: credita apenas as linhas novas
 * (nunca regride) e a cartela cheia uma única vez.
 */
export function calculateBingoAward(params: {
  marked: readonly boolean[];
  linesAlreadyAwarded: number;
  fullHouseAlreadyAwarded: boolean;
  rules: BingoRewardRules;
}): BingoAward {
  const lines = countCompletedLines(params.marked);
  const already = safeInt(params.linesAlreadyAwarded, BINGO_TOTAL_LINES);
  const newLines = Math.max(0, lines - already);
  const full = isFullHouse(params.marked);
  const grantsFull = full && !params.fullHouseAlreadyAwarded;

  return {
    newLines,
    fullHouse: full,
    coins: newLines * safeInt(params.rules.coinsPerLine) + (grantsFull ? safeInt(params.rules.coinsFullHouse) : 0),
    xp: newLines * safeInt(params.rules.xpPerLine) + (grantsFull ? safeInt(params.rules.xpFullHouse) : 0),
  };
}

/** Uma casa está conquistada quando o valor observado atinge a meta. */
export function isCellAchieved(cell: Pick<BingoCell, "free" | "target">, observedValue: number): boolean {
  if (cell.free) return true;
  return safeInt(observedValue) >= Math.max(1, safeInt(cell.target));
}

/** Progresso da cartela em % inteiro. */
export function bingoProgressPercent(marked: readonly boolean[]): number {
  const done = normalizeMarks(marked).filter(Boolean).length;
  return Math.round((done / BINGO_CELLS) * 100);
}
