import { describe, expect, it } from "vitest";
import {
  BOARD_MAX_MOVES_PER_DAY,
  createStarterTiles,
  draftsToTiles,
  simulateBoardEconomics,
  validateTrailDraft,
  type TileDraft,
  type TrailDraft,
} from "@/lib/boardTrailAuthoring";

const baseTrail: TrailDraft = {
  title: "Trilha de Onboarding",
  description: "Primeiros 30 dias",
  departmentId: null,
  status: "draft",
  maxMovesPerDay: 3,
};

function errorMessages(trail: TrailDraft, tiles: TileDraft[]): string[] {
  return validateTrailDraft(trail, tiles).errors.map((issue) => issue.message);
}

describe("validateTrailDraft", () => {
  it("aceita o tabuleiro inicial sugerido", () => {
    const result = validateTrailDraft(baseTrail, createStarterTiles());
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reindexa posições e descarta buracos informados pelo autor", () => {
    const tiles = createStarterTiles().map((tile, index) => ({ ...tile, position: index * 7 }));
    const result = validateTrailDraft(baseTrail, tiles);
    expect(result.valid).toBe(true);
    expect(result.normalizedTiles.map((t) => t.position)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("exige título", () => {
    expect(errorMessages({ ...baseTrail, title: "   " }, createStarterTiles())).toContain(
      "Informe um título para a trilha.",
    );
  });

  it("rejeita jogadas por dia fora da faixa", () => {
    for (const value of [0, -3, BOARD_MAX_MOVES_PER_DAY + 1, 999]) {
      const errors = errorMessages({ ...baseTrail, maxMovesPerDay: value }, createStarterTiles());
      expect(errors.some((m) => m.includes("jogadas por dia"))).toBe(true);
    }
  });

  it("rejeita tabuleiro curto demais", () => {
    const tiles = createStarterTiles().slice(0, 3);
    expect(errorMessages(baseTrail, tiles).some((m) => m.includes("pelo menos"))).toBe(true);
  });

  it("exige exatamente uma Partida na primeira casa", () => {
    const tiles = createStarterTiles();
    tiles[2] = { ...tiles[2], type: "start" };
    expect(
      errorMessages(baseTrail, tiles).some((m) => m.includes("uma casa de Partida")),
    ).toBe(true);

    const noStart = createStarterTiles();
    noStart[0] = { ...noStart[0], type: "neutral" };
    expect(
      errorMessages(baseTrail, noStart).some((m) => m.includes("uma casa de Partida")),
    ).toBe(true);
  });

  it("exige a Chegada na última casa", () => {
    const tiles = createStarterTiles();
    tiles.push({
      position: 6,
      type: "neutral",
      label: "Depois do fim",
      coins: null,
      xp: null,
      moveBy: null,
      challengeId: null,
    });
    expect(errorMessages(baseTrail, tiles).some((m) => m.includes("última"))).toBe(true);
  });

  it("bloqueia casa de Desafio sem desafio vinculado", () => {
    const tiles = createStarterTiles();
    tiles[2] = { ...tiles[2], type: "challenge" };
    expect(
      errorMessages(baseTrail, tiles).some((m) => m.includes("desafio vinculado")),
    ).toBe(true);
  });

  it("impede que um atalho pule uma casa de Desafio", () => {
    const tiles = createStarterTiles();
    tiles[2] = { ...tiles[2], type: "challenge", challengeId: "quiz-1" };
    tiles[1] = { ...tiles[1], moveBy: 1 };
    expect(errorMessages(baseTrail, tiles).some((m) => m.includes("burlaria"))).toBe(true);
  });

  it("impede deslocamento para fora do tabuleiro", () => {
    const tiles = createStarterTiles();
    tiles[1] = { ...tiles[1], moveBy: 20 };
    expect(errorMessages(baseTrail, tiles).some((m) => m.includes("fora do tabuleiro"))).toBe(true);

    const back = createStarterTiles();
    back[1] = { ...back[1], moveBy: -5 };
    expect(errorMessages(baseTrail, back).some((m) => m.includes("fora do tabuleiro"))).toBe(true);
  });

  it("não permite deslocamento em Partida/Chegada", () => {
    const tiles = createStarterTiles();
    tiles[0] = { ...tiles[0], moveBy: 2 };
    expect(errorMessages(baseTrail, tiles).some((m) => m.includes("não podem deslocar"))).toBe(true);
  });

  it("limita moedas e XP aos tetos do motor", () => {
    const tiles = createStarterTiles();
    tiles[1] = { ...tiles[1], coins: 99999, xp: 99999 };
    const result = validateTrailDraft(baseTrail, tiles);
    expect(result.normalizedTiles[1].coins).toBe(500);
    expect(result.normalizedTiles[1].xp).toBe(800);
  });

  it("normaliza valores não positivos para nulo", () => {
    const tiles = createStarterTiles();
    tiles[1] = { ...tiles[1], coins: 0, xp: -50 };
    const result = validateTrailDraft(baseTrail, tiles);
    expect(result.normalizedTiles[1].coins).toBeNull();
    expect(result.normalizedTiles[1].xp).toBeNull();
  });

  it("avisa sobre valores ignorados em casas neutras", () => {
    const tiles = createStarterTiles();
    tiles[2] = { ...tiles[2], coins: 50 };
    const result = validateTrailDraft(baseTrail, tiles);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.message.includes("ignorados"))).toBe(true);
  });

  it("nunca lança para entradas degeneradas", () => {
    const degenerate: TileDraft[] = [
      { position: NaN, type: "start", label: "", coins: NaN, xp: null, moveBy: NaN, challengeId: "" },
    ];
    expect(() => validateTrailDraft({ ...baseTrail, title: "" }, degenerate)).not.toThrow();
    expect(() => validateTrailDraft(baseTrail, [])).not.toThrow();
  });
});

describe("simulateBoardEconomics", () => {
  it("estima o custo médio de uma trilha válida", () => {
    const economics = simulateBoardEconomics(draftsToTiles(createStarterTiles()), 300);
    expect(economics.runs).toBe(300);
    expect(economics.completedRuns).toBe(300);
    expect(economics.avgCoins).toBeGreaterThan(0);
    expect(economics.avgMoves).toBeGreaterThan(0);
    expect(economics.maxCoins).toBeGreaterThanOrEqual(economics.avgCoins);
  });

  it("é determinística entre execuções", () => {
    const tiles = draftsToTiles(createStarterTiles());
    expect(simulateBoardEconomics(tiles, 120)).toEqual(simulateBoardEconomics(tiles, 120));
  });

  it("termina mesmo em tabuleiro sem chegada alcançável", () => {
    const tiles = draftsToTiles(
      createStarterTiles().map((tile) =>
        tile.type === "finish" ? { ...tile, type: "neutral" as const } : tile,
      ),
    );
    const economics = simulateBoardEconomics(tiles, 20, 50);
    expect(economics.completedRuns).toBe(0);
    expect(economics.avgMoves).toBeLessThanOrEqual(50);
  });

  it("mantém moedas não negativas mesmo com penalidades severas", () => {
    const tiles = draftsToTiles(
      createStarterTiles().map((tile) =>
        tile.type === "penalty" ? { ...tile, coins: 500, xp: 800 } : tile,
      ),
    );
    const economics = simulateBoardEconomics(tiles, 250);
    expect(economics.avgCoins).toBeGreaterThanOrEqual(0);
    expect(economics.avgXp).toBeGreaterThanOrEqual(0);
  });
});