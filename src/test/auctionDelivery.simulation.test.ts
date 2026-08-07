import { describe, expect, it } from "vitest";

import { resolveAuctionDelivery, type DeliveryInput } from "@/lib/auctionAdmin";

/** PRNG determinístico — a simulação precisa ser reprodutível no CI. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

describe("resolveAuctionDelivery — casos determinísticos", () => {
  it("não entrega nada quando ninguém deu lance", () => {
    const out = resolveAuctionDelivery({
      rewardId: "r1",
      stock: 5,
      winnerId: null,
      escrowCoins: 0,
    });
    expect(out.kind).toBe("no_winner");
    expect(out.stockAfter).toBe(5);
  });

  it("leilão simbólico não mexe em estoque", () => {
    const out = resolveAuctionDelivery({
      rewardId: null,
      stock: 3,
      winnerId: "u1",
      escrowCoins: 120,
    });
    expect(out.kind).toBe("symbolic");
    expect(out.refundedCoins).toBe(0);
    expect(out.stockAfter).toBe(3);
  });

  it("estoque ilimitado sempre reserva", () => {
    const out = resolveAuctionDelivery({
      rewardId: "r1",
      stock: null,
      winnerId: "u1",
      escrowCoins: 90,
    });
    expect(out.kind).toBe("reserved");
    expect(out.stockAfter).toBeNull();
  });

  it("estoque finito decrementa exatamente uma unidade", () => {
    const out = resolveAuctionDelivery({
      rewardId: "r1",
      stock: 1,
      winnerId: "u1",
      escrowCoins: 300,
    });
    expect(out.kind).toBe("reserved");
    expect(out.stockAfter).toBe(0);
  });

  it("estoque zerado estorna a caução integral do vencedor", () => {
    const out = resolveAuctionDelivery({
      rewardId: "r1",
      stock: 0,
      winnerId: "u1",
      escrowCoins: 450,
    });
    expect(out.kind).toBe("refunded_no_stock");
    expect(out.refundedCoins).toBe(450);
    expect(out.stockAfter).toBe(0);
  });

  it("nunca devolve estorno negativo", () => {
    const out = resolveAuctionDelivery({
      rewardId: "r1",
      stock: 0,
      winnerId: "u1",
      escrowCoins: -10,
    });
    expect(out.refundedCoins).toBe(0);
  });
});

describe("resolveAuctionDelivery — 600 cenários aleatórios", () => {
  it("preserva as invariantes econômicas e de estoque", () => {
    const random = makeRandom(20260728);

    for (let i = 0; i < 600; i += 1) {
      const hasReward = random() > 0.25;
      const unlimited = hasReward && random() > 0.7;
      const stock = hasReward ? (unlimited ? null : Math.floor(random() * 4)) : Math.floor(random() * 4);
      const hasWinner = random() > 0.2;
      const escrow = Math.floor(random() * 1_000);

      const input: DeliveryInput = {
        rewardId: hasReward ? `reward-${i % 7}` : null,
        stock,
        winnerId: hasWinner ? `user-${i % 11}` : null,
        escrowCoins: escrow,
      };

      const out = resolveAuctionDelivery(input);

      // 1. Estorno nunca excede a caução retida.
      expect(out.refundedCoins).toBeLessThanOrEqual(Math.max(0, escrow));
      expect(out.refundedCoins).toBeGreaterThanOrEqual(0);

      // 2. Estoque nunca fica negativo nem aumenta.
      if (typeof out.stockAfter === "number" && typeof stock === "number") {
        expect(out.stockAfter).toBeGreaterThanOrEqual(0);
        expect(out.stockAfter).toBeLessThanOrEqual(stock);
      }

      // 3. Só há consumo de estoque quando de fato houve reserva.
      if (typeof stock === "number" && typeof out.stockAfter === "number") {
        const consumed = stock - out.stockAfter;
        expect(consumed).toBe(out.kind === "reserved" ? 1 : 0);
      }

      // 4. Sem vencedor nunca há entrega nem estorno de vencedor.
      if (!hasWinner) {
        expect(out.kind).toBe("no_winner");
        expect(out.refundedCoins).toBe(0);
      }

      // 5. Vencedor com item vinculado sem estoque é sempre estornado.
      if (hasWinner && hasReward && stock === 0) {
        expect(out.kind).toBe("refunded_no_stock");
        expect(out.refundedCoins).toBe(escrow);
      }
    }
  });
});