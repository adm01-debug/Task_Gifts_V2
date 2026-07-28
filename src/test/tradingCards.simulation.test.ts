import { describe, expect, it } from "vitest";

import {
  CARD_RARITIES,
  RARITY_VALUE,
  TRADE_VALUE_RATIO,
  checkTrade,
  drawPack,
  drawablePool,
  rarityOdds,
  summarizeCollection,
  type CardDefinition,
  type CardRarity,
  type OwnedCard,
} from "@/lib/tradingCards";

/** PRNG determinístico — falhas precisam ser reproduzíveis pela seed. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makePool(rnd: () => number): CardDefinition[] {
  const size = 4 + Math.floor(rnd() * 40);
  return Array.from({ length: size }, (_, i) => {
    const rarity = CARD_RARITIES[Math.floor(rnd() * CARD_RARITIES.length)] as CardRarity;
    return {
      id: `c${i}`,
      code: `CARD-${String(i).padStart(3, "0")}`,
      name: `Carta ${i}`,
      rarity,
      set_code: "S1",
      is_active: rnd() > 0.1,
    };
  });
}

function makeOwned(pool: CardDefinition[], rnd: () => number): OwnedCard[] {
  return pool
    .filter(() => rnd() > 0.5)
    .map((c) => ({ card_id: c.id, quantity: 1 + Math.floor(rnd() * 4) }));
}

describe("Álbum de Cartas — simulação massiva", () => {
  it("preserva invariantes de sorteio, garantia e contabilidade em 800 cenários", () => {
    for (let seed = 1; seed <= 800; seed++) {
      const rnd = mulberry32(seed);
      const pool = makePool(rnd);
      const owned = makeOwned(pool, rnd);
      const size = Math.floor(rnd() * 8);
      const result = drawPack(pool, owned, mulberry32(seed * 7919), size);
      const drawable = drawablePool(pool);
      const drawableIds = new Set(drawable.map((c) => c.id));

      // Tamanho respeitado e nunca negativo.
      expect(result.cards.length).toBe(drawable.length === 0 ? 0 : size);
      // Nunca sorteia carta inativa ou inexistente.
      for (const card of result.cards) {
        expect(drawableIds.has(card.card_id)).toBe(true);
      }
      // Contabilidade fechada: novas + duplicatas === total.
      expect(result.newCount + result.duplicateCount).toBe(result.cards.length);
      expect(result.newCount).toBeGreaterThanOrEqual(0);

      // Garantia rare+ sempre honrada quando o pool permite.
      const hasPremium = drawable.some((c) => c.rarity !== "common");
      if (result.cards.length > 0 && hasPremium) {
        expect(result.cards.some((c) => c.rarity !== "common")).toBe(true);
      }

      // Uma carta já possuída jamais é marcada como inédita.
      const ownedIds = new Set(owned.filter((o) => o.quantity > 0).map((o) => o.card_id));
      for (const card of result.cards) {
        if (ownedIds.has(card.card_id)) expect(card.isNew).toBe(false);
      }
      // Dentro do pacote, cada carta só pode ser "nova" uma vez.
      const newIds = result.cards.filter((c) => c.isNew).map((c) => c.card_id);
      expect(new Set(newIds).size).toBe(newIds.length);
    }
  });

  it("é determinístico e indiferente à ordem de chegada do pool", () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rnd = mulberry32(seed);
      const pool = makePool(rnd);
      const owned = makeOwned(pool, rnd);
      const shuffled = [...pool].sort(() => (mulberry32(seed + 1)() > 0.5 ? 1 : -1));

      const a = drawPack(pool, owned, mulberry32(seed), 5);
      const b = drawPack(shuffled, [...owned].reverse(), mulberry32(seed), 5);
      expect(b.cards.map((c) => c.card_id)).toEqual(a.cards.map((c) => c.card_id));
    }
  });

  it("resiste a pool corrompido sem lançar exceção", () => {
    const corrupted = [
      { id: "x", code: "X", name: "X", rarity: "mythic" as CardRarity, set_code: "S", is_active: true },
      { id: "y", code: "Y", name: "Y", rarity: "common", set_code: "S", is_active: false },
    ] satisfies CardDefinition[];
    const owned = [
      { card_id: "x", quantity: Number.NaN },
      { card_id: "y", quantity: -3 },
    ];
    expect(() => drawPack(corrupted, owned, () => Number.NaN, 5)).not.toThrow();
    expect(drawPack(corrupted, owned, () => 0.5, 5).cards).toEqual([]);
    const summary = summarizeCollection(corrupted, owned);
    expect(summary.totalCards).toBe(0);
    expect(summary.completionPct).toBe(0);
  });

  it("mantém a soma das odds por raridade em 1 quando há pool sorteável", () => {
    for (let seed = 1; seed <= 300; seed++) {
      const pool = makePool(mulberry32(seed));
      const odds = rarityOdds(pool);
      const total = CARD_RARITIES.reduce((sum, r) => sum + odds[r], 0);
      if (drawablePool(pool).length === 0) {
        expect(total).toBe(0);
      } else {
        expect(total).toBeCloseTo(1, 10);
      }
    }
  });

  it("nunca reporta progresso acima de 100% nem duplicata negativa", () => {
    for (let seed = 1; seed <= 400; seed++) {
      const rnd = mulberry32(seed);
      const pool = makePool(rnd);
      const owned = makeOwned(pool, rnd);
      const s = summarizeCollection(pool, owned);
      expect(s.ownedCards).toBeLessThanOrEqual(s.totalCards);
      expect(s.completionPct).toBeGreaterThanOrEqual(0);
      expect(s.completionPct).toBeLessThanOrEqual(100);
      expect(s.duplicates).toBeGreaterThanOrEqual(0);
      // Toda carta trocável é de fato uma duplicata possuída.
      for (const id of s.tradableCardIds) {
        const qty = owned.filter((o) => o.card_id === id).reduce((a, o) => a + o.quantity, 0);
        expect(qty).toBeGreaterThanOrEqual(2);
      }
      const rarityTotal = CARD_RARITIES.reduce((sum, r) => sum + s.byRarity[r].total, 0);
      expect(rarityTotal).toBe(s.totalCards);
    }
  });
});

describe("Trocas — antifraude", () => {
  const card = (id: string, rarity: CardRarity): CardDefinition => ({
    id,
    code: id.toUpperCase(),
    name: id,
    rarity,
    set_code: "S1",
    is_active: true,
  });

  it("bloqueia troca de carta única (esvaziamento de coleção)", () => {
    const check = checkTrade({
      proposerId: "a",
      responderId: "b",
      offeredCard: card("c1", "rare"),
      requestedCard: card("c2", "rare"),
      proposerOwned: [{ card_id: "c1", quantity: 1 }],
      responderOwned: [{ card_id: "c2", quantity: 2 }],
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toBe("offer_not_duplicate");
  });

  it("bloqueia lavagem de lendária por comum", () => {
    const check = checkTrade({
      proposerId: "a",
      responderId: "b",
      offeredCard: card("c1", "common"),
      requestedCard: card("c2", "legendary"),
      proposerOwned: [{ card_id: "c1", quantity: 9 }],
      responderOwned: [{ card_id: "c2", quantity: 2 }],
    });
    expect(check.ok).toBe(false);
    expect(check.reason).toBe("unfair");
  });

  it("bloqueia autotroca e carta idêntica", () => {
    expect(
      checkTrade({
        proposerId: "a",
        responderId: "a",
        offeredCard: card("c1", "rare"),
        requestedCard: card("c2", "rare"),
        proposerOwned: [{ card_id: "c1", quantity: 5 }],
        responderOwned: [{ card_id: "c2", quantity: 5 }],
      }).reason,
    ).toBe("same_user");
    expect(
      checkTrade({
        proposerId: "a",
        responderId: "b",
        offeredCard: card("c1", "rare"),
        requestedCard: card("c1", "rare"),
        proposerOwned: [{ card_id: "c1", quantity: 5 }],
        responderOwned: [{ card_id: "c1", quantity: 5 }],
      }).reason,
    ).toBe("same_card");
  });

  it("é simétrico: inverter as pontas nunca muda o veredito de equilíbrio", () => {
    for (let seed = 1; seed <= 400; seed++) {
      const rnd = mulberry32(seed);
      const ra = CARD_RARITIES[Math.floor(rnd() * 4)] as CardRarity;
      const rb = CARD_RARITIES[Math.floor(rnd() * 4)] as CardRarity;
      const base = {
        offeredCard: card("c1", ra),
        requestedCard: card("c2", rb),
        proposerOwned: [{ card_id: "c1", quantity: 3 }],
        responderOwned: [{ card_id: "c2", quantity: 3 }],
      };
      const direct = checkTrade({ proposerId: "a", responderId: "b", ...base });
      const inverse = checkTrade({
        proposerId: "b",
        responderId: "a",
        offeredCard: base.requestedCard,
        requestedCard: base.offeredCard,
        proposerOwned: base.responderOwned,
        responderOwned: base.proposerOwned,
      });
      expect(inverse.ok).toBe(direct.ok);

      const hi = Math.max(RARITY_VALUE[ra], RARITY_VALUE[rb]);
      const lo = Math.min(RARITY_VALUE[ra], RARITY_VALUE[rb]);
      expect(direct.ok).toBe(hi <= lo * TRADE_VALUE_RATIO);
    }
  });
});
