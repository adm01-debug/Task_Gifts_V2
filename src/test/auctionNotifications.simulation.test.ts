import { describe, it, expect } from "vitest";
import {
  resolveAuctionDelivery,
  resolveAuctionNotifications,
  type AuctionNotifyParticipant,
} from "@/lib/auctionAdmin";

/** PRNG determinístico para reprodutibilidade das simulações. */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

describe("notificações de apuração de leilão", () => {
  it("não notifica ninguém quando não há lances", () => {
    const delivery = resolveAuctionDelivery({
      rewardId: "r1",
      stock: 5,
      winnerId: null,
      escrowCoins: 0,
    });
    expect(resolveAuctionNotifications({ delivery, winner: null, losers: [] })).toEqual([]);
  });

  it("avisa o vencedor de item esgotado em vez de vitória", () => {
    const delivery = resolveAuctionDelivery({
      rewardId: "r1",
      stock: 0,
      winnerId: "u1",
      escrowCoins: 120,
    });
    const notes = resolveAuctionNotifications({
      delivery,
      winner: { userId: "u1", escrowCoins: 120, wantsInApp: true },
      losers: [],
    });
    expect(notes).toEqual([{ userId: "u1", outcome: "stock_unavailable", refundedCoins: 120 }]);
  });

  it("respeita a preferência desligada sem suprimir o estorno", () => {
    const delivery = resolveAuctionDelivery({
      rewardId: null,
      stock: null,
      winnerId: "u1",
      escrowCoins: 50,
    });
    const notes = resolveAuctionNotifications({
      delivery,
      winner: { userId: "u1", escrowCoins: 50, wantsInApp: false },
      losers: [{ userId: "u2", escrowCoins: 10, wantsInApp: false }],
    });
    expect(notes).toEqual([]);
    expect(delivery.kind).toBe("symbolic");
  });

  it("mantém invariantes em 600 cenários aleatórios", () => {
    const rng = makeRng(20260728);

    for (let i = 0; i < 600; i++) {
      const hasWinner = rng() > 0.15;
      const rewardId = rng() > 0.3 ? "reward" : null;
      const stock = rng() > 0.25 ? Math.floor(rng() * 4) : null;
      const winnerEscrow = Math.floor(rng() * 500);
      const loserCount = Math.floor(rng() * 8);

      const losers: AuctionNotifyParticipant[] = Array.from({ length: loserCount }, (_, k) => ({
        userId: `loser-${k}`,
        escrowCoins: Math.floor(rng() * 300),
        wantsInApp: rng() > 0.4,
      }));

      const winner: AuctionNotifyParticipant | null = hasWinner
        ? { userId: "winner", escrowCoins: winnerEscrow, wantsInApp: rng() > 0.4 }
        : null;

      const delivery = resolveAuctionDelivery({
        rewardId,
        stock,
        winnerId: winner?.userId ?? null,
        escrowCoins: winnerEscrow,
      });

      const notes = resolveAuctionNotifications({ delivery, winner, losers });

      // 1. Nunca mais de uma notificação por usuário.
      const ids = notes.map((n) => n.userId);
      expect(new Set(ids).size).toBe(ids.length);

      // 2. Nenhum usuário com preferência desligada é notificado.
      const optedOut = new Set(
        [...losers, ...(winner ? [winner] : [])].filter((p) => !p.wantsInApp).map((p) => p.userId),
      );
      expect(notes.some((n) => optedOut.has(n.userId))).toBe(false);

      // 3. Todo perdedor com preferência ligada recebe aviso de estorno.
      const expectedLosers = losers.filter((l) => l.wantsInApp).length;
      expect(notes.filter((n) => n.outcome === "refunded").length).toBe(expectedLosers);

      // 4. Coerência com o resultado de entrega.
      const winnerNote = notes.find((n) => n.userId === "winner");
      if (!winner || !winner.wantsInApp || delivery.kind === "no_winner") {
        expect(winnerNote).toBeUndefined();
      } else if (delivery.kind === "refunded_no_stock") {
        expect(winnerNote?.outcome).toBe("stock_unavailable");
        expect(winnerNote?.refundedCoins).toBe(delivery.refundedCoins);
      } else {
        expect(winnerNote?.outcome).toBe("won");
        expect(winnerNote?.refundedCoins).toBe(0);
      }

      // 5. Nenhum valor de estorno negativo é anunciado.
      expect(notes.every((n) => n.refundedCoins >= 0)).toBe(true);
    }
  });
});
