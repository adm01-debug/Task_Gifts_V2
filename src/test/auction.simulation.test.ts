import { describe, expect, it } from "vitest";
import {
  applyBid,
  cancelRefunds,
  escrowDelta,
  minNextBid,
  settle,
  type EngineAuction,
  type EngineBid,
} from "@/lib/auctionEngine";

/** PRNG determinístico: a simulação precisa ser reproduzível em CI. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

const auction: EngineAuction = { startingBid: 50, minIncrement: 10 };

describe("auctionEngine — regras de lance", () => {
  it("exige o lance inicial no primeiro lance", () => {
    expect(minNextBid(auction)).toBe(50);
    expect(applyBid(auction, 1000, 49, 0, "u1").reason).toBe("below_minimum");
    expect(applyBid(auction, 1000, 50, 0, "u1").accepted).toBe(true);
  });

  it("exige incremento mínimo ao aumentar o próprio lance", () => {
    const first = applyBid(auction, 1000, 60, 0, "u1").bid as EngineBid;
    expect(minNextBid(auction, first)).toBe(70);
    expect(applyBid(auction, 940, 65, 1, "u1", first).reason).toBe("below_minimum");
    expect(applyBid(auction, 940, 70, 1, "u1", first).accepted).toBe(true);
  });

  it("retém apenas a diferença ao aumentar (caução incremental)", () => {
    const first = applyBid(auction, 1000, 100, 0, "u1").bid as EngineBid;
    expect(first.escrow).toBe(100);
    expect(escrowDelta(150, first)).toBe(50);
    const second = applyBid(auction, 900, 150, 1, "u1", first);
    expect(second.newBalance).toBe(850);
    expect(second.bid?.escrow).toBe(150);
  });

  it("rejeita valores não inteiros ou não positivos", () => {
    for (const bad of [0, -1, -999, 12.5, Number.NaN]) {
      expect(applyBid(auction, 1000, bad, 0, "u1").reason).toBe("invalid_amount");
    }
  });

  it("nunca deixa o saldo ficar negativo", () => {
    const outcome = applyBid(auction, 40, 50, 0, "u1");
    expect(outcome.accepted).toBe(false);
    expect(outcome.newBalance).toBe(40);
  });
});

describe("auctionEngine — apuração", () => {
  it("maior lance vence e empate vai para o primeiro no tempo", () => {
    const bids: EngineBid[] = [
      { userId: "a", amount: 100, escrow: 100, createdAt: 5, status: "active" },
      { userId: "b", amount: 100, escrow: 100, createdAt: 2, status: "active" },
      { userId: "c", amount: 90, escrow: 90, createdAt: 1, status: "active" },
    ];
    const result = settle(bids);
    expect(result.winner?.userId).toBe("b");
    expect(result.refunds.map((r) => r.userId).sort()).toEqual(["a", "c"]);
  });

  it("leilão sem lances encerra sem vencedor e sem estorno", () => {
    expect(settle([])).toEqual({ refunds: [] });
  });

  it("cancelamento devolve 100% da caução ativa", () => {
    const bids: EngineBid[] = [
      { userId: "a", amount: 100, escrow: 100, createdAt: 1, status: "active" },
      { userId: "b", amount: 80, escrow: 0, createdAt: 2, status: "refunded" },
    ];
    expect(cancelRefunds(bids)).toEqual([{ userId: "a", coins: 100 }]);
  });
});

describe("auctionEngine — 600 cenários aleatórios de conservação de moedas", () => {
  it("nunca cria nem destrói moedas além do valor pago pelo vencedor", () => {
    const random = makeRandom(20260728);

    for (let scenario = 0; scenario < 600; scenario += 1) {
      const config: EngineAuction = {
        startingBid: 1 + Math.floor(random() * 200),
        minIncrement: 1 + Math.floor(random() * 50),
      };
      const userCount = 1 + Math.floor(random() * 8);
      const balances = new Map<string, number>();
      const initial = new Map<string, number>();
      const bids = new Map<string, EngineBid>();

      for (let u = 0; u < userCount; u += 1) {
        const id = `u${u}`;
        const coins = Math.floor(random() * 2000);
        balances.set(id, coins);
        initial.set(id, coins);
      }

      const rounds = 1 + Math.floor(random() * 12);
      for (let round = 0; round < rounds; round += 1) {
        const id = `u${Math.floor(random() * userCount)}`;
        const current = bids.get(id);
        const amount = Math.floor(random() * 1200) - 50;
        const outcome = applyBid(
          config,
          balances.get(id) as number,
          amount,
          round,
          id,
          current,
        );

        // Saldo jamais negativo e só muda quando o lance é aceito.
        expect(outcome.newBalance).toBeGreaterThanOrEqual(0);
        if (!outcome.accepted) {
          expect(outcome.newBalance).toBe(balances.get(id));
          continue;
        }
        balances.set(id, outcome.newBalance);
        bids.set(id, outcome.bid as EngineBid);
      }

      const escrowTotal = [...bids.values()].reduce((sum, bid) => sum + bid.escrow, 0);
      const liquid = [...balances.values()].reduce((sum, coins) => sum + coins, 0);
      const initialTotal = [...initial.values()].reduce((sum, coins) => sum + coins, 0);

      // Invariante 1: saldo + caução == saldo inicial (nada some antes da apuração).
      expect(liquid + escrowTotal).toBe(initialTotal);

      const result = settle([...bids.values()]);
      for (const refund of result.refunds) {
        balances.set(refund.userId, (balances.get(refund.userId) as number) + refund.coins);
      }

      const afterSettle = [...balances.values()].reduce((sum, coins) => sum + coins, 0);
      const paid = result.winner?.escrow ?? 0;

      // Invariante 2: o único débito líquido do sistema é o lance do vencedor.
      expect(afterSettle).toBe(initialTotal - paid);

      // Invariante 3: o vencedor tem o maior lance registrado.
      if (result.winner) {
        const max = Math.max(...[...bids.values()].map((bid) => bid.amount));
        expect(result.winner.amount).toBe(max);
      }
    }
  });
});
