import { describe, expect, it } from "vitest";
import { projectWheel, resolvePrizeIndex, validateWheelConfig, type OddsPrize } from "@/lib/luckyWheelOdds";

/**
 * A Raspadinha usa o mesmo sorteio ponderado da Roleta (soma de pesos + roll no servidor).
 * Estes cenários replicam a grade padrão semeada na migração e validam a consistência
 * do mapeamento roll -> prêmio para TODOS os rolls possíveis, mais 500 grades aleatórias.
 */
const SEED_GRID: OddsPrize[] = [
  { id: "a", label: "Tente novamente", prize_type: "nothing", amount: 0, weight: 3000, rarity: "common", is_active: true },
  { id: "b", label: "10 moedas", prize_type: "coins", amount: 10, weight: 3000, rarity: "common", is_active: true },
  { id: "c", label: "25 moedas", prize_type: "coins", amount: 25, weight: 2000, rarity: "common", is_active: true },
  { id: "d", label: "50 XP", prize_type: "xp", amount: 50, weight: 1200, rarity: "rare", is_active: true },
  { id: "e", label: "100 moedas", prize_type: "coins", amount: 100, weight: 600, rarity: "rare", is_active: true },
  { id: "f", label: "250 XP", prize_type: "xp", amount: 250, weight: 170, rarity: "epic", is_active: true },
  { id: "g", label: "500 moedas", prize_type: "coins", amount: 500, weight: 30, rarity: "legendary", is_active: true },
];

describe("Raspadinha — grade semeada", () => {
  it("soma 100% de probabilidade e não tem prêmio inalcançável", () => {
    const projection = projectWheel(SEED_GRID);
    const total = projection.odds.reduce((acc, o) => acc + o.probability, 0);
    expect(total).toBeCloseTo(1, 10);
    expect(projection.odds.every((o) => o.probability > 0)).toBe(true);
  });

  it("não produz problemas bloqueantes de configuração", () => {
    const issues = validateWheelConfig(SEED_GRID);
    expect(issues.filter((i) => i.level === "error")).toHaveLength(0);
  });

  it("mapeia todos os rolls possíveis para um prêmio válido e contíguo", () => {
    const totalWeight = SEED_GRID.reduce((acc, p) => acc + p.weight, 0);
    let previous = 0;
    for (let roll = 0; roll < totalWeight; roll += 1) {
      const index = resolvePrizeIndex(SEED_GRID, roll);
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(SEED_GRID.length);
      // A faixa de cada prêmio é monotônica: índice nunca retrocede conforme o roll cresce.
      expect(index).toBeGreaterThanOrEqual(previous);
      previous = index;
    }
    expect(previous).toBe(SEED_GRID.length - 1);
  });

  it("mantém o teto de custo esperado por carta abaixo de 45 moedas equivalentes", () => {
    const projection = projectWheel(SEED_GRID);
    expect(projection.expectedCoinsPerSpin + projection.expectedXpPerSpin / 10).toBeLessThan(45);
  });
});

describe("Raspadinha — 500 grades aleatórias hostis", () => {
  it("nunca retorna índice fora do intervalo, mesmo com pesos zerados", () => {
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };

    for (let scenario = 0; scenario < 500; scenario += 1) {
      const size = 1 + Math.floor(rand() * 8);
      const grid: OddsPrize[] = Array.from({ length: size }, (_, i) => ({
        id: `p${i}`,
        label: `Prêmio ${i}`,
        prize_type: i % 3 === 0 ? "nothing" : i % 2 === 0 ? "coins" : "xp",
        amount: Math.floor(rand() * 500),
        weight: rand() < 0.2 ? 0 : Math.floor(rand() * 5000),
        rarity: "common",
        is_active: true,
      }));

      const totalWeight = grid.reduce((acc, p) => acc + p.weight, 0);
      const roll = totalWeight === 0 ? 0 : Math.floor(rand() * totalWeight);
      const index = resolvePrizeIndex(grid, roll);

      if (totalWeight === 0) {
        expect(index).toBe(-1);
        continue;
      }
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(grid.length);
      // Prêmio sorteado nunca pode ter peso zero quando existe peso disponível.
      expect(grid[index].weight).toBeGreaterThan(0);
    }
  });
});
