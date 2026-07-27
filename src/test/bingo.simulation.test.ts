import { describe, expect, it } from "vitest";
import {
  BINGO_CELLS,
  BINGO_FREE_POSITION,
  BINGO_TOTAL_LINES,
  bingoLineIndexes,
  bingoProgressPercent,
  calculateBingoAward,
  completedLinePositions,
  countCompletedLines,
  isCellAchieved,
  isFullHouse,
} from "@/lib/bingoEngine";

const RULES = { coinsPerLine: 30, xpPerLine: 40, coinsFullHouse: 200, xpFullHouse: 300 };

function empty(): boolean[] {
  return new Array<boolean>(BINGO_CELLS).fill(false);
}

/** PRNG determinístico para simulações reprodutíveis. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("Bingo — geometria da cartela", () => {
  it("possui exatamente 12 linhas de 5 casas, sem índices fora do intervalo", () => {
    const lines = bingoLineIndexes();
    expect(lines).toHaveLength(BINGO_TOTAL_LINES);
    for (const line of lines) {
      expect(line).toHaveLength(5);
      expect(new Set(line).size).toBe(5);
      for (const idx of line) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(BINGO_CELLS);
      }
    }
  });

  it("cada casa participa de pelo menos duas linhas (linha + coluna)", () => {
    const counts = new Array<number>(BINGO_CELLS).fill(0);
    bingoLineIndexes().forEach((line) => line.forEach((idx) => (counts[idx] += 1)));
    counts.forEach((c) => expect(c).toBeGreaterThanOrEqual(2));
    // O centro livre participa de linha, coluna e as duas diagonais.
    expect(counts[BINGO_FREE_POSITION]).toBe(4);
  });
});

describe("Bingo — detecção de linhas (cenários exaustivos por linha)", () => {
  it("marcar exatamente uma linha completa detecta ao menos 1 linha", () => {
    for (const line of bingoLineIndexes()) {
      const marks = empty();
      line.forEach((idx) => (marks[idx] = true));
      expect(countCompletedLines(marks)).toBeGreaterThanOrEqual(1);
      expect(completedLinePositions(marks).size).toBeGreaterThanOrEqual(5);
      expect(isFullHouse(marks)).toBe(false);
    }
  });

  it("cartela vazia não gera linha nem prêmio", () => {
    const marks = empty();
    expect(countCompletedLines(marks)).toBe(0);
    expect(bingoProgressPercent(marks)).toBe(0);
    const award = calculateBingoAward({ marked: marks, linesAlreadyAwarded: 0, fullHouseAlreadyAwarded: false, rules: RULES });
    expect(award).toMatchObject({ coins: 0, xp: 0, newLines: 0, fullHouse: false });
  });

  it("cartela cheia gera as 12 linhas e o prêmio máximo uma única vez", () => {
    const marks = new Array<boolean>(BINGO_CELLS).fill(true);
    expect(countCompletedLines(marks)).toBe(BINGO_TOTAL_LINES);
    expect(isFullHouse(marks)).toBe(true);
    expect(bingoProgressPercent(marks)).toBe(100);

    const first = calculateBingoAward({ marked: marks, linesAlreadyAwarded: 0, fullHouseAlreadyAwarded: false, rules: RULES });
    expect(first.coins).toBe(12 * 30 + 200);
    expect(first.xp).toBe(12 * 40 + 300);

    const replay = calculateBingoAward({ marked: marks, linesAlreadyAwarded: 12, fullHouseAlreadyAwarded: true, rules: RULES });
    expect(replay).toMatchObject({ coins: 0, xp: 0, newLines: 0 });
  });
});

describe("Bingo — 2.000 cenários aleatórios de marcação", () => {
  it("nunca credita duas vezes a mesma linha nem regride o total pago", () => {
    for (let seed = 1; seed <= 2000; seed++) {
      const rand = mulberry32(seed);
      const marks = empty();
      let linesAwarded = 0;
      let fullAwarded = false;
      let totalCoins = 0;
      let totalXp = 0;

      // Marcações incrementais: o estado só cresce, como no servidor.
      for (let step = 0; step < 30; step++) {
        const pos = Math.floor(rand() * BINGO_CELLS);
        marks[pos] = true;

        const award = calculateBingoAward({
          marked: marks,
          linesAlreadyAwarded: linesAwarded,
          fullHouseAlreadyAwarded: fullAwarded,
          rules: RULES,
        });

        expect(award.coins).toBeGreaterThanOrEqual(0);
        expect(award.xp).toBeGreaterThanOrEqual(0);

        totalCoins += award.coins;
        totalXp += award.xp;
        linesAwarded = Math.max(linesAwarded, countCompletedLines(marks));
        fullAwarded = fullAwarded || award.fullHouse;

        // Sincronizações repetidas sem novas marcações são no-op (idempotência).
        const idempotent = calculateBingoAward({
          marked: marks,
          linesAlreadyAwarded: linesAwarded,
          fullHouseAlreadyAwarded: fullAwarded,
          rules: RULES,
        });
        expect(idempotent.coins).toBe(0);
        expect(idempotent.xp).toBe(0);
      }

      // Teto econômico rígido por cartela.
      expect(totalCoins).toBeLessThanOrEqual(BINGO_TOTAL_LINES * RULES.coinsPerLine + RULES.coinsFullHouse);
      expect(totalXp).toBeLessThanOrEqual(BINGO_TOTAL_LINES * RULES.xpPerLine + RULES.xpFullHouse);
    }
  });
});

describe("Bingo — entradas hostis e metas", () => {
  it("ignora valores inválidos em regras e contadores", () => {
    const marks = new Array<boolean>(BINGO_CELLS).fill(true);
    const award = calculateBingoAward({
      marked: marks,
      linesAlreadyAwarded: Number.NaN,
      fullHouseAlreadyAwarded: false,
      rules: { coinsPerLine: Number.POSITIVE_INFINITY, xpPerLine: -50, coinsFullHouse: Number.NaN, xpFullHouse: 300 },
    });
    expect(Number.isFinite(award.coins)).toBe(true);
    expect(award.xp).toBe(300);
  });

  it("casa livre sempre conquistada; metas exigem valor mínimo", () => {
    expect(isCellAchieved({ free: true, target: 0 }, 0)).toBe(true);
    expect(isCellAchieved({ free: false, target: 5 }, 4)).toBe(false);
    expect(isCellAchieved({ free: false, target: 5 }, 5)).toBe(true);
    expect(isCellAchieved({ free: false, target: 0 }, 0)).toBe(false);
    expect(isCellAchieved({ free: false, target: Number.NaN }, 1)).toBe(true);
    expect(isCellAchieved({ free: false, target: 3 }, Number.NaN)).toBe(false);
  });

  it("arrays curtos ou com lixo não quebram a contagem", () => {
    expect(countCompletedLines([] as boolean[])).toBe(0);
    expect(countCompletedLines([true, true, true, true, true])).toBe(1);
    expect(isFullHouse([true])).toBe(false);
  });
});
