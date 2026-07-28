import { describe, expect, it } from "vitest";
import {
  buildBossLeaderboard,
  formatShare,
  rankLabel,
  type LeaderboardInput,
} from "@/lib/bossLeaderboard";

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

function makeEntries(rand: () => number, count: number): LeaderboardInput[] {
  return Array.from({ length: count }, (_, i) => ({
    userId: `u${String(i).padStart(3, "0")}`,
    displayName: i % 7 === 0 ? "" : `Pessoa ${i}`,
    damage: Math.floor(rand() * 500),
    hits: Math.floor(rand() * 20),
  }));
}

describe("buildBossLeaderboard", () => {
  it("ignora entradas sem dano ou sem usuário", () => {
    const result = buildBossLeaderboard([
      { userId: "a", damage: 0 },
      { userId: "", damage: 50 },
      { userId: "b", damage: 10 },
    ]);
    expect(result.rows.map((r) => r.userId)).toEqual(["b"]);
    expect(result.contributors).toBe(1);
  });

  it("consolida linhas duplicadas do mesmo usuário", () => {
    const result = buildBossLeaderboard([
      { userId: "a", damage: 10, hits: 1, displayName: "Ana" },
      { userId: "a", damage: 15, hits: 2 },
    ]);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].damage).toBe(25);
    expect(result.rows[0].hits).toBe(3);
    expect(result.rows[0].displayName).toBe("Ana");
  });

  it("atribui a mesma posição em caso de empate (1,2,2,4)", () => {
    const result = buildBossLeaderboard([
      { userId: "a", damage: 100 },
      { userId: "b", damage: 50 },
      { userId: "c", damage: 50 },
      { userId: "d", damage: 10 },
    ]);
    expect(result.rows.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
    expect(result.rows.map((r) => r.userId)).toEqual(["a", "b", "c", "d"]);
  });

  it("usa o total da batalha e não a soma da página", () => {
    const result = buildBossLeaderboard(
      [{ userId: "a", damage: 100 }],
      { totalDamage: 400 },
    );
    expect(result.rows[0].share).toBeCloseTo(0.25, 6);
  });

  it("nunca deixa o total abaixo da soma das linhas", () => {
    const result = buildBossLeaderboard(
      [{ userId: "a", damage: 100 }, { userId: "b", damage: 100 }],
      { totalDamage: 10 },
    );
    expect(result.totalDamage).toBe(200);
  });

  it("expõe a linha do usuário atual quando ele fica fora do recorte", () => {
    const entries = Array.from({ length: 30 }, (_, i) => ({
      userId: `u${i}`,
      damage: 1000 - i,
    }));
    const result = buildBossLeaderboard(entries, { limit: 5, currentUserId: "u20" });
    expect(result.rows).toHaveLength(5);
    expect(result.currentUserRow?.userId).toBe("u20");
    expect(result.currentUserRow?.rank).toBe(21);
  });

  it("não duplica o usuário atual quando ele já está no recorte", () => {
    const result = buildBossLeaderboard(
      [{ userId: "a", damage: 10 }, { userId: "b", damage: 5 }],
      { currentUserId: "a" },
    );
    expect(result.currentUserRow).toBeNull();
    expect(result.rows[0].isCurrentUser).toBe(true);
  });

  it("projeta prêmios sem estourar o pool", () => {
    const result = buildBossLeaderboard(
      [
        { userId: "a", damage: 60 },
        { userId: "b", damage: 30 },
        { userId: "c", damage: 10 },
      ],
      { rewards: { coinsPool: 1000, xpPool: 500 } },
    );
    const coins = result.rows.reduce((s, r) => s + r.projectedCoins, 0);
    const xp = result.rows.reduce((s, r) => s + r.projectedXp, 0);
    expect(coins).toBe(1000);
    expect(xp).toBe(500);
  });

  it("respeita participação mínima na projeção", () => {
    const result = buildBossLeaderboard(
      [
        { userId: "a", damage: 990 },
        { userId: "b", damage: 10 },
      ],
      { rewards: { coinsPool: 100, xpPool: 100, minShare: 0.05 } },
    );
    const b = result.rows.find((r) => r.userId === "b");
    expect(b?.projectedCoins).toBe(0);
  });

  it("usa nome de fallback para perfis sem display_name", () => {
    const result = buildBossLeaderboard([{ userId: "a", damage: 5, displayName: "   " }]);
    expect(result.rows[0].displayName).toBe("Participante");
  });

  it("mantém invariantes em ~900 cenários aleatórios", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rand = mulberry32(seed);
      for (const count of [1, 12, 80]) {
        const entries = makeEntries(rand, count);
        const limit = 1 + Math.floor(rand() * 25);
        const result = buildBossLeaderboard(entries, {
          limit,
          currentUserId: `u${String(Math.floor(rand() * count)).padStart(3, "0")}`,
          rewards: { coinsPool: 5000, xpPool: 2500, perUserCoinsCap: 1200 },
        });

        expect(result.rows.length).toBeLessThanOrEqual(limit);
        // ordenação monotônica decrescente
        for (let i = 1; i < result.rows.length; i++) {
          expect(result.rows[i - 1].damage).toBeGreaterThanOrEqual(result.rows[i].damage);
          expect(result.rows[i - 1].rank).toBeLessThanOrEqual(result.rows[i].rank);
        }
        // shares válidos
        for (const row of result.rows) {
          expect(row.share).toBeGreaterThanOrEqual(0);
          expect(row.share).toBeLessThanOrEqual(1);
          expect(Number.isInteger(row.projectedCoins)).toBe(true);
        }
        // usuário atual aparece exatamente uma vez (na página ou no destaque)
        const inPage = result.rows.filter((r) => r.isCurrentUser).length;
        expect(inPage + (result.currentUserRow ? 1 : 0)).toBeLessThanOrEqual(1 + inPage);
      }
    }
  });

  it("é determinístico para a mesma entrada", () => {
    const rand = mulberry32(42);
    const entries = makeEntries(rand, 40);
    const a = buildBossLeaderboard(entries, { limit: 10 });
    const b = buildBossLeaderboard([...entries].reverse(), { limit: 10 });
    expect(a.rows.map((r) => `${r.userId}:${r.rank}`)).toEqual(
      b.rows.map((r) => `${r.userId}:${r.rank}`),
    );
  });
});

describe("formatadores", () => {
  it("rankLabel destaca o pódio", () => {
    expect(rankLabel(1)).toBe("🥇");
    expect(rankLabel(2)).toBe("🥈");
    expect(rankLabel(3)).toBe("🥉");
    expect(rankLabel(7)).toBe("7º");
  });

  it("formatShare limita entre 0% e 100%", () => {
    expect(formatShare(-1)).toBe("0%");
    expect(formatShare(2)).toBe("100%");
    expect(formatShare(Number.NaN)).toBe("0%");
    expect(formatShare(0.1234)).toBe("12,3%");
  });
});
