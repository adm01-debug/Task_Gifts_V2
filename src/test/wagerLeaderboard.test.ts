import { describe, expect, it } from "vitest";
import {
  formatNet,
  parseWagerLeaderboard,
  summarizeLeaderboard,
  windowLabel,
} from "@/lib/wagerLeaderboard";

const base = {
  user_id: "11111111-1111-1111-1111-111111111111",
  display_name: "Ana",
  avatar_url: null,
  entries: 10,
  correct_count: 7,
  accuracy: 70,
  staked_coins: 500,
  net_coins: 320,
  xp_awarded: 140,
  current_streak: 3,
  best_streak: 5,
  last_played: "2026-07-28",
  rank: 1,
};

describe("parseWagerLeaderboard", () => {
  it("retorna vazio para payloads inválidos", () => {
    expect(parseWagerLeaderboard(null)).toEqual([]);
    expect(parseWagerLeaderboard({})).toEqual([]);
    expect(parseWagerLeaderboard("erro")).toEqual([]);
  });

  it("descarta linhas sem identificador", () => {
    expect(parseWagerLeaderboard([{ ...base, user_id: null }])).toHaveLength(0);
  });

  it("mapeia uma linha completa", () => {
    const [row] = parseWagerLeaderboard([base]);
    expect(row.displayName).toBe("Ana");
    expect(row.accuracy).toBe(70);
    expect(row.currentStreak).toBe(3);
  });

  it("usa fallback de nome quando vazio", () => {
    const [row] = parseWagerLeaderboard([{ ...base, display_name: "   " }]);
    expect(row.displayName).toBe("Jogador");
  });

  it("limita acertos ao total de apostas", () => {
    const [row] = parseWagerLeaderboard([{ ...base, entries: 4, correct_count: 9 }]);
    expect(row.correctCount).toBe(4);
  });

  it("limita a sequência atual à melhor sequência", () => {
    const [row] = parseWagerLeaderboard([{ ...base, current_streak: 99 }]);
    expect(row.currentStreak).toBe(5);
  });

  it("mantém precisão de acurácia em uma casa decimal", () => {
    const [row] = parseWagerLeaderboard([{ ...base, accuracy: 66.666 }]);
    expect(row.accuracy).toBe(66.7);
  });

  it("calcula acurácia quando o banco não envia o campo", () => {
    const [row] = parseWagerLeaderboard([
      { ...base, accuracy: undefined, entries: 4, correct_count: 1 },
    ]);
    expect(row.accuracy).toBe(25);
  });

  it("trata numéricos vindos como string", () => {
    const [row] = parseWagerLeaderboard([{ ...base, net_coins: "-120", entries: "10" }]);
    expect(row.netCoins).toBe(-120);
    expect(row.entries).toBe(10);
  });

  it("reordena por saldo líquido e renumera o rank", () => {
    const rows = parseWagerLeaderboard([
      { ...base, user_id: "a", net_coins: 10, rank: 1 },
      { ...base, user_id: "b", net_coins: 90, rank: 2 },
    ]);
    expect(rows.map((r) => r.userId)).toEqual(["b", "a"]);
    expect(rows.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("desempata por acertos e depois por acurácia", () => {
    const rows = parseWagerLeaderboard([
      { ...base, user_id: "a", net_coins: 50, correct_count: 5, entries: 10, accuracy: 50 },
      { ...base, user_id: "b", net_coins: 50, correct_count: 5, entries: 6, accuracy: 83.3 },
    ]);
    expect(rows[0].userId).toBe("b");
  });

  it("nunca produz valores negativos em campos absolutos", () => {
    const [row] = parseWagerLeaderboard([
      { ...base, staked_coins: -5, xp_awarded: -9, entries: -3 },
    ]);
    expect(row.stakedCoins).toBe(0);
    expect(row.xpAwarded).toBe(0);
    expect(row.entries).toBe(0);
  });

  it("aceita saldo líquido negativo (apostador no prejuízo)", () => {
    const [row] = parseWagerLeaderboard([{ ...base, net_coins: -450 }]);
    expect(row.netCoins).toBe(-450);
  });
});

describe("summarizeLeaderboard", () => {
  it("resume um ranking vazio sem divisão por zero", () => {
    expect(summarizeLeaderboard([])).toEqual({
      players: 0,
      entries: 0,
      accuracy: 0,
      topStreak: 0,
    });
  });

  it("agrega participantes, apostas e maior sequência", () => {
    const rows = parseWagerLeaderboard([
      { ...base, user_id: "a", entries: 10, correct_count: 5, best_streak: 3 },
      { ...base, user_id: "b", entries: 10, correct_count: 8, best_streak: 6 },
    ]);
    const summary = summarizeLeaderboard(rows);
    expect(summary.players).toBe(2);
    expect(summary.entries).toBe(20);
    expect(summary.accuracy).toBe(65);
    expect(summary.topStreak).toBe(6);
  });
});

describe("formatadores", () => {
  it("prefixa ganhos com sinal positivo", () => {
    expect(formatNet(120)).toBe("+120");
    expect(formatNet(0)).toBe("0");
    expect(formatNet(-30)).toBe("-30");
  });

  it("rotula os períodos disponíveis", () => {
    expect(windowLabel(7)).toBe("7 dias");
    expect(windowLabel(30)).toBe("30 dias");
    expect(windowLabel(90)).toBe("90 dias");
  });
});