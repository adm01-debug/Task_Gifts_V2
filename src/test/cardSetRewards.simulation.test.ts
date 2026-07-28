import { describe, expect, it } from "vitest";

import {
  COINS_PER_VALUE_POINT,
  SET_MILESTONES,
  XP_PER_VALUE_POINT,
  cardsRequiredFor,
  checkSetClaim,
  setRewardDedupeKey,
  splitByMilestone,
  summarizeSetRewards,
  type SetMilestone,
  type SetRewardClaim,
} from "@/lib/cardSetRewards";
import { CARD_RARITIES, RARITY_VALUE, type CardDefinition, type CardRarity, type OwnedCard } from "@/lib/tradingCards";

/** PRNG determinístico (mulberry32): cenários reproduzíveis em CI. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSet(setCode: string, size: number, next: () => number): CardDefinition[] {
  return Array.from({ length: size }, (_, i) => {
    const rarity = CARD_RARITIES[Math.floor(next() * CARD_RARITIES.length)] as CardRarity;
    return {
      id: `${setCode}-${i}`,
      code: `${setCode}${String(i).padStart(3, "0")}`,
      name: `Carta ${i}`,
      rarity,
      set_code: setCode,
      is_active: true,
    };
  });
}

function ownFirst(pool: readonly CardDefinition[], count: number, qty = 1): OwnedCard[] {
  return pool.slice(0, count).map((c) => ({ card_id: c.id, quantity: qty }));
}

describe("cardSetRewards — divisão por marcos", () => {
  it("a soma dos marcos é exatamente o total, em 1.000 valores", () => {
    for (let total = 0; total < 1000; total++) {
      const split = splitByMilestone(total);
      const sum = SET_MILESTONES.reduce((s, m) => s + split[m], 0);
      expect(sum).toBe(total);
      for (const m of SET_MILESTONES) expect(split[m]).toBeGreaterThanOrEqual(0);
    }
  });

  it("a recompensa é crescente (ou igual) do marco 25 ao 100", () => {
    const next = rng(7);
    for (let i = 0; i < 300; i++) {
      const total = Math.floor(next() * 50_000);
      const split = splitByMilestone(total);
      expect(split[100]).toBeGreaterThanOrEqual(split[75]);
      expect(split[75]).toBeGreaterThanOrEqual(split[50]);
      expect(split[50]).toBeGreaterThanOrEqual(split[25]);
    }
  });

  it("valores inválidos degradam para zero em vez de propagar NaN", () => {
    for (const bad of [NaN, -1, -Infinity, Infinity]) {
      const split = splitByMilestone(bad as number);
      for (const m of SET_MILESTONES) expect(Number.isFinite(split[m])).toBe(true);
    }
  });
});

describe("cardSetRewards — progresso e elegibilidade", () => {
  it("marcos acompanham a posse em todos os tamanhos de coleção (1..40)", () => {
    const next = rng(11);
    for (let size = 1; size <= 40; size++) {
      const pool = buildSet("S1", size, next);
      for (let ownedCount = 0; ownedCount <= size; ownedCount++) {
        const [progress] = summarizeSetRewards(pool, ownFirst(pool, ownedCount));
        expect(progress.totalCards).toBe(size);
        expect(progress.ownedCards).toBe(ownedCount);
        for (const entry of progress.milestones) {
          const expected = ownedCount >= cardsRequiredFor(size, entry.milestone);
          expect(entry.reached).toBe(expected);
        }
        expect(progress.isComplete).toBe(ownedCount === size);
      }
    }
  });

  it("marcos são monotônicos: nunca desatingem ao ganhar cartas", () => {
    const next = rng(23);
    for (let scenario = 0; scenario < 200; scenario++) {
      const size = 4 + Math.floor(next() * 20);
      const pool = buildSet("S1", size, next);
      let previous = SET_MILESTONES.map(() => false);
      for (let ownedCount = 0; ownedCount <= size; ownedCount++) {
        const [progress] = summarizeSetRewards(pool, ownFirst(pool, ownedCount));
        const current = progress.milestones.map((m) => m.reached);
        current.forEach((reached, i) => {
          if (previous[i]) expect(reached).toBe(true);
        });
        previous = current;
      }
    }
  });

  it("duplicatas não contam como progresso de coleção", () => {
    const pool = buildSet("S1", 12, rng(31));
    const single = summarizeSetRewards(pool, ownFirst(pool, 6, 1))[0];
    const hoarder = summarizeSetRewards(pool, ownFirst(pool, 6, 99))[0];
    expect(hoarder.ownedCards).toBe(single.ownedCards);
    expect(hoarder.claimableCoins).toBe(single.claimableCoins);
  });

  it("recompensa total reflete a composição de raridade do conjunto", () => {
    const next = rng(41);
    for (let scenario = 0; scenario < 200; scenario++) {
      const pool = buildSet("S1", 1 + Math.floor(next() * 24), next);
      const value = pool.reduce((s, c) => s + RARITY_VALUE[c.rarity], 0);
      const [progress] = summarizeSetRewards(pool, []);
      expect(progress.setValue).toBe(value);
      expect(progress.totalCoins).toBe(value * COINS_PER_VALUE_POINT);
      expect(progress.totalXp).toBe(value * XP_PER_VALUE_POINT);
      const sumCoins = progress.milestones.reduce((s, m) => s + m.coins, 0);
      const sumXp = progress.milestones.reduce((s, m) => s + m.xp, 0);
      expect(sumCoins).toBe(progress.totalCoins);
      expect(sumXp).toBe(progress.totalXp);
    }
  });

  it("a ordem de chegada das linhas não altera o resultado", () => {
    const next = rng(53);
    for (let scenario = 0; scenario < 150; scenario++) {
      const pool = buildSet("S1", 10 + Math.floor(next() * 10), next);
      const owned = ownFirst(pool, Math.floor(next() * pool.length), 1 + Math.floor(next() * 3));
      const shuffledPool = [...pool].sort(() => next() - 0.5);
      const shuffledOwned = [...owned].sort(() => next() - 0.5);
      expect(summarizeSetRewards(shuffledPool, shuffledOwned)).toEqual(
        summarizeSetRewards(pool, owned),
      );
    }
  });

  it("cartas inativas saem do denominador e do valor", () => {
    const pool = buildSet("S1", 10, rng(61));
    const withInactive = pool.map((c, i) => (i >= 8 ? { ...c, is_active: false } : c));
    const [progress] = summarizeSetRewards(withInactive, []);
    expect(progress.totalCards).toBe(8);
  });

  it("múltiplos conjuntos são isolados e ordenados de forma estável", () => {
    const next = rng(71);
    const poolA = buildSet("S1", 8, next);
    const poolB = buildSet("S2", 6, next);
    const result = summarizeSetRewards([...poolB, ...poolA], ownFirst(poolA, 8));
    expect(result.map((p) => p.setCode)).toEqual(["S1", "S2"]);
    expect(result[0].isComplete).toBe(true);
    expect(result[1].ownedCards).toBe(0);
  });
});

describe("cardSetRewards — resistência a dados corrompidos", () => {
  it("quantidades inválidas e raridades desconhecidas não quebram o cálculo", () => {
    const pool = buildSet("S1", 10, rng(83));
    const corrupted = [
      ...pool,
      { ...pool[0], id: "bad-1", rarity: "mythic" as unknown as CardRarity, code: "X1" },
    ];
    const owned = [
      { card_id: pool[0].id, quantity: NaN },
      { card_id: pool[1].id, quantity: -5 },
      { card_id: pool[2].id, quantity: 2 },
      { card_id: "inexistente", quantity: 10 },
      { card_id: pool[2].id, quantity: 1 },
    ] as OwnedCard[];

    const [progress] = summarizeSetRewards(corrupted, owned);
    expect(progress.totalCards).toBe(10);
    expect(progress.ownedCards).toBe(1);
    expect(Number.isFinite(progress.totalCoins)).toBe(true);
  });

  it("conjunto vazio não gera recompensa nem divisão por zero", () => {
    expect(summarizeSetRewards([], [])).toEqual([]);
    expect(cardsRequiredFor(0, 100)).toBe(0);
  });

  it("resgates desconhecidos são ignorados sem marcar marcos", () => {
    const pool = buildSet("S1", 8, rng(97));
    const claims = [
      { set_code: "S1", milestone: 33 },
      { set_code: "S9", milestone: 100 },
    ] as SetRewardClaim[];
    const [progress] = summarizeSetRewards(pool, ownFirst(pool, 8), claims);
    expect(progress.milestones.every((m) => !m.claimed)).toBe(true);
  });
});

describe("cardSetRewards — veredito de resgate", () => {
  it("resgate é único: o segundo pedido do mesmo marco é recusado", () => {
    const pool = buildSet("S1", 12, rng(103));
    const owned = ownFirst(pool, 12);
    const claims: SetRewardClaim[] = [];
    let credited = 0;

    // Duplo clique + retry: 4 tentativas por marco, apenas 1 deve creditar.
    for (const milestone of SET_MILESTONES) {
      for (let attempt = 0; attempt < 4; attempt++) {
        const progress = summarizeSetRewards(pool, owned, claims);
        const verdict = checkSetClaim(progress, "S1", milestone);
        if (verdict.ok) {
          credited += verdict.coins;
          claims.push({ set_code: "S1", milestone });
        } else {
          expect(verdict.reason).toBe("already_claimed");
          expect(verdict.coins).toBe(0);
        }
      }
    }

    expect(credited).toBe(summarizeSetRewards(pool, owned)[0].totalCoins);
  });

  it("nunca credita além do total do conjunto em 300 trajetórias aleatórias", () => {
    const next = rng(113);
    for (let scenario = 0; scenario < 300; scenario++) {
      const size = 4 + Math.floor(next() * 20);
      const pool = buildSet("S1", size, next);
      const claims: SetRewardClaim[] = [];
      let credited = 0;

      for (let ownedCount = 0; ownedCount <= size; ownedCount++) {
        const owned = ownFirst(pool, ownedCount);
        const progress = summarizeSetRewards(pool, owned, claims);
        for (const milestone of SET_MILESTONES) {
          const verdict = checkSetClaim(progress, "S1", milestone);
          if (verdict.ok) {
            credited += verdict.coins;
            claims.push({ set_code: "S1", milestone });
          }
        }
      }

      const total = summarizeSetRewards(pool, ownFirst(pool, size))[0].totalCoins;
      expect(credited).toBe(total);
      expect(claims).toHaveLength(SET_MILESTONES.length);
    }
  });

  it("marco não atingido é recusado com motivo explícito", () => {
    const pool = buildSet("S1", 10, rng(127));
    const progress = summarizeSetRewards(pool, ownFirst(pool, 2));
    expect(checkSetClaim(progress, "S1", 100).reason).toBe("not_reached");
    expect(checkSetClaim(progress, "S9", 25).reason).toBe("unknown_set");
  });

  it("a chave de idempotência é determinística e discrimina usuário/marco", () => {
    const key = (u: string, m: SetMilestone) => setRewardDedupeKey(u, "S1", m);
    expect(key("u1", 50)).toBe(key("u1", 50));
    expect(key("u1", 50)).not.toBe(key("u2", 50));
    expect(key("u1", 50)).not.toBe(key("u1", 100));
  });
});