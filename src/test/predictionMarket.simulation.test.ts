import { describe, expect, it } from "vitest";
import {
  applyStake,
  impliedOdds,
  isConserved,
  poolByOption,
  refundAll,
  settleMarket,
  totalPool,
  userOption,
  userTotal,
  type PredictionMarket,
  type PredictionStake,
} from "@/lib/predictionMarket";

/** PRNG determinístico: a simulação precisa ser reproduzível em CI. */
function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

const market: PredictionMarket = {
  status: "open",
  optionIds: ["a", "b", "c"],
  minStake: 10,
  maxStakePerUser: 500,
  rakeBps: 500,
  locksAt: 1_000,
};

describe("predictionMarket — validação de aportes", () => {
  it("rejeita mercado fechado ou já travado", () => {
    expect(applyStake({ ...market, status: "locked" }, [], 999, "u1", "a", 50, 0).reason)
      .toBe("market_closed");
    expect(applyStake(market, [], 999, "u1", "a", 50, 1_000).reason).toBe("market_closed");
  });

  it("rejeita opção inexistente, valor inválido e abaixo do mínimo", () => {
    expect(applyStake(market, [], 999, "u1", "z", 50, 0).reason).toBe("unknown_option");
    expect(applyStake(market, [], 999, "u1", "a", 0, 0).reason).toBe("invalid_amount");
    expect(applyStake(market, [], 999, "u1", "a", 10.5, 0).reason).toBe("invalid_amount");
    expect(applyStake(market, [], 999, "u1", "a", 9, 0).reason).toBe("below_minimum");
  });

  it("impede hedge (apostar em duas opções do mesmo mercado)", () => {
    const stakes: PredictionStake[] = [{ userId: "u1", optionId: "a", amount: 50, createdAt: 0 }];
    expect(applyStake(market, stakes, 999, "u1", "b", 50, 1).reason)
      .toBe("option_switch_forbidden");
    expect(applyStake(market, stakes, 999, "u1", "a", 50, 1).accepted).toBe(true);
  });

  it("respeita o teto por usuário e o saldo disponível", () => {
    const stakes: PredictionStake[] = [{ userId: "u1", optionId: "a", amount: 480, createdAt: 0 }];
    expect(applyStake(market, stakes, 999, "u1", "a", 30, 1).reason).toBe("over_user_cap");
    expect(applyStake(market, stakes, 999, "u1", "a", 20, 1).accepted).toBe(true);
    expect(applyStake(market, [], 5, "u2", "a", 50, 1).reason).toBe("insufficient_coins");
  });

  it("debita exatamente o aporte do saldo", () => {
    const out = applyStake(market, [], 300, "u1", "a", 120, 1);
    expect(out.newBalance).toBe(180);
    expect(out.stake?.amount).toBe(120);
  });

  it("teto zero significa sem limite", () => {
    const open = { ...market, maxStakePerUser: 0 };
    const stakes: PredictionStake[] = [{ userId: "u1", optionId: "a", amount: 9_000, createdAt: 0 }];
    expect(applyStake(open, stakes, 10_000, "u1", "a", 1_000, 1).accepted).toBe(true);
  });
});

describe("predictionMarket — agregações e cotações", () => {
  const stakes: PredictionStake[] = [
    { userId: "u1", optionId: "a", amount: 100, createdAt: 0 },
    { userId: "u2", optionId: "a", amount: 100, createdAt: 1 },
    { userId: "u3", optionId: "b", amount: 200, createdAt: 2 },
  ];

  it("soma pools por opção incluindo opções vazias", () => {
    expect(poolByOption(market, stakes)).toEqual({ a: 200, b: 200, c: 0 });
    expect(totalPool(stakes)).toBe(400);
    expect(userTotal(stakes, "u1")).toBe(100);
    expect(userOption(stakes, "u3")).toBe("b");
  });

  it("cotação reflete o rake e zera para opção sem aportes", () => {
    // total 400, rake 5% = 20, distribuível 380, lado a = 200 -> 1.9x
    expect(impliedOdds(market, stakes, "a")).toBeCloseTo(1.9, 6);
    expect(impliedOdds(market, stakes, "c")).toBe(0);
  });
});

describe("predictionMarket — apuração", () => {
  it("reembolsa integralmente quando anulado ou sem vencedores", () => {
    const stakes: PredictionStake[] = [
      { userId: "u1", optionId: "a", amount: 100, createdAt: 0 },
      { userId: "u2", optionId: "b", amount: 50, createdAt: 1 },
    ];
    for (const result of [refundAll(stakes), settleMarket(market, stakes, null), settleMarket(market, stakes, "c")]) {
      expect(result.refunded).toBe(true);
      expect(result.rake).toBe(0);
      expect(isConserved(result)).toBe(true);
      expect(result.payouts.find((p) => p.userId === "u1")?.amount).toBe(100);
      expect(result.payouts.find((p) => p.userId === "u2")?.amount).toBe(50);
    }
  });

  it("não cobra rake quando todo o pool está do lado vencedor", () => {
    const stakes: PredictionStake[] = [
      { userId: "u1", optionId: "a", amount: 100, createdAt: 0 },
      { userId: "u2", optionId: "a", amount: 40, createdAt: 1 },
    ];
    const result = settleMarket(market, stakes, "a");
    expect(result.rake).toBe(0);
    expect(result.refunded).toBe(true);
    expect(result.payouts.every((p) => p.profit === 0)).toBe(true);
  });

  it("distribui proporcionalmente descontando o rake", () => {
    const stakes: PredictionStake[] = [
      { userId: "u1", optionId: "a", amount: 100, createdAt: 0 },
      { userId: "u2", optionId: "a", amount: 100, createdAt: 1 },
      { userId: "u3", optionId: "b", amount: 200, createdAt: 2 },
    ];
    const result = settleMarket(market, stakes, "a");
    expect(result.total).toBe(400);
    expect(result.rake).toBe(20);
    expect(result.payouts.find((p) => p.userId === "u1")?.amount).toBe(190);
    expect(result.payouts.find((p) => p.userId === "u2")?.amount).toBe(190);
    expect(result.payouts.find((p) => p.userId === "u3")?.amount).toBe(0);
    expect(result.payouts.find((p) => p.userId === "u3")?.profit).toBe(-200);
    expect(isConserved(result)).toBe(true);
  });

  it("entrega o resto da divisão inteira sem criar nem perder moedas", () => {
    const noRake = { ...market, rakeBps: 0 };
    const stakes: PredictionStake[] = [
      { userId: "u1", optionId: "a", amount: 33, createdAt: 0 },
      { userId: "u2", optionId: "a", amount: 33, createdAt: 1 },
      { userId: "u3", optionId: "a", amount: 34, createdAt: 2 },
      { userId: "u4", optionId: "b", amount: 101, createdAt: 3 },
    ];
    const result = settleMarket(noRake, stakes, "a");
    expect(isConserved(result)).toBe(true);
    expect(result.payouts.reduce((acc, p) => acc + p.amount, 0)).toBe(201);
  });

  it("mercado vazio apura sem efeitos", () => {
    const result = settleMarket(market, [], "a");
    expect(result.payouts).toEqual([]);
    expect(result.total).toBe(0);
    expect(isConserved(result)).toBe(true);
  });
});

describe("predictionMarket — simulação massiva (600 cenários)", () => {
  it("mantém conservação, saldos não-negativos e ausência de hedge", () => {
    let scenarios = 0;

    for (let seed = 1; seed <= 600; seed += 1) {
      const rnd = makeRandom(seed);
      const optionCount = 2 + Math.floor(rnd() * 3);
      const optionIds = Array.from({ length: optionCount }, (_, i) => `opt${i}`);
      const cfg: PredictionMarket = {
        status: "open",
        optionIds,
        minStake: 1 + Math.floor(rnd() * 20),
        maxStakePerUser: rnd() < 0.3 ? 0 : 100 + Math.floor(rnd() * 900),
        rakeBps: Math.floor(rnd() * 2_001),
        locksAt: 10_000,
      };

      const userCount = 1 + Math.floor(rnd() * 25);
      const balances = new Map<string, number>();
      const initial = new Map<string, number>();
      for (let u = 0; u < userCount; u += 1) {
        const id = `u${u}`;
        const coins = Math.floor(rnd() * 2_000);
        balances.set(id, coins);
        initial.set(id, coins);
      }

      const stakes: PredictionStake[] = [];
      const attempts = 5 + Math.floor(rnd() * 60);
      for (let t = 0; t < attempts; t += 1) {
        const userId = `u${Math.floor(rnd() * userCount)}`;
        const optionId = optionIds[Math.floor(rnd() * optionIds.length)];
        const amount = Math.floor(rnd() * 400) - 5; // inclui valores inválidos
        const out = applyStake(
          cfg,
          stakes,
          balances.get(userId) as number,
          userId,
          optionId,
          amount,
          t,
        );
        if (out.accepted && out.stake) {
          balances.set(userId, out.newBalance);
          stakes.push(out.stake);
        } else {
          // Rejeição jamais pode alterar o saldo.
          expect(out.newBalance).toBe(balances.get(userId));
        }
      }

      // I2/anti-hedge: nenhum saldo negativo e um usuário nunca em duas opções.
      for (const [, coins] of balances) expect(coins).toBeGreaterThanOrEqual(0);
      const chosen = new Map<string, string>();
      for (const s of stakes) {
        const prev = chosen.get(s.userId);
        if (prev) expect(prev).toBe(s.optionId);
        chosen.set(s.userId, s.optionId);
        if (cfg.maxStakePerUser > 0) {
          expect(userTotal(stakes, s.userId)).toBeLessThanOrEqual(cfg.maxStakePerUser);
        }
      }

      const winner = rnd() < 0.15 ? null : optionIds[Math.floor(rnd() * optionIds.length)];
      const result = settleMarket(cfg, stakes, winner);

      // I1: conservação absoluta.
      expect(isConserved(result)).toBe(true);
      expect(result.total).toBe(totalPool(stakes));

      // I2: nenhum payout negativo.
      for (const p of result.payouts) expect(p.amount).toBeGreaterThanOrEqual(0);

      // Nenhuma moeda criada no ciclo completo (aporte -> apuração).
      let finalSum = 0;
      for (const [id, coins] of balances) {
        const payout = result.payouts.find((p) => p.userId === id)?.amount ?? 0;
        finalSum += coins + payout;
      }
      const initialSum = [...initial.values()].reduce((a, b) => a + b, 0);
      expect(finalSum + result.rake).toBe(initialSum);

      // I4: reembolso devolve exatamente o aporte.
      if (result.refunded) {
        for (const p of result.payouts) {
          expect(p.amount).toBe(userTotal(stakes, p.userId));
          expect(p.profit).toBe(0);
        }
      }

      // I3: sem rake, vencedor nunca recebe menos que o aporte.
      if (!result.refunded && cfg.rakeBps === 0) {
        for (const p of result.payouts) {
          if (p.amount > 0) expect(p.amount).toBeGreaterThanOrEqual(userTotal(stakes, p.userId));
        }
      }

      scenarios += 1;
    }

    expect(scenarios).toBe(600);
  });
});
