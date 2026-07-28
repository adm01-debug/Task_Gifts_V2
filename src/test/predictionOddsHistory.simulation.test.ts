import { describe, expect, it } from "vitest";

import {
  buildOddsHistory,
  leaderOf,
  formatMultiplier,
  type OddsOption,
  type OddsStake,
} from "@/lib/predictionOddsHistory";

/** PRNG determinístico — falhas precisam ser reproduzíveis. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const BASE = Date.UTC(2026, 6, 20, 9, 0, 0);

function scenario(rng: () => number) {
  const optionCount = 2 + Math.floor(rng() * 5); // 2..6
  const options: OddsOption[] = Array.from({ length: optionCount }, (_, i) => ({
    id: `opt-${i}`,
    label: `Opção ${i}`,
  }));

  const rakeBps = Math.floor(rng() * 2001); // 0..20%
  const stakeCount = Math.floor(rng() * 200); // inclui 0 (mercado vazio)

  const stakes: OddsStake[] = Array.from({ length: stakeCount }, () => ({
    optionId: options[Math.floor(rng() * options.length)].id,
    amount: 1 + Math.floor(rng() * 500),
    // Janela de até 7 dias, com colisões de timestamp propositais.
    createdAt: new Date(BASE + Math.floor(rng() * 7 * 86_400_000)).toISOString(),
  }));

  return { options, rakeBps, stakes };
}

describe("histórico de cotações — simulação massiva", () => {
  // 500 cenários × até 60 pontos × até 6 opções gera ~10^6 asserções.
  it("preserva conservação do pote, normalização e coerência dos multiplicadores", () => {
    for (let seed = 1; seed <= 500; seed += 1) {
      const rng = mulberry32(seed);
      const { options, rakeBps, stakes } = scenario(rng);
      const history = buildOddsHistory(stakes, options, rakeBps);

      const expectedTotal = stakes.reduce((acc, s) => acc + s.amount, 0);

      if (stakes.length === 0) {
        // H0: mercado sem aportes não inventa série.
        expect(history.points).toHaveLength(0);
        expect(history.leaderId).toBeNull();
        expect(history.finalTotalPool).toBe(0);
        continue;
      }

      // H1: conservação — o último ponto reflete exatamente o ledger.
      expect(history.finalTotalPool).toBe(expectedTotal);
      const lastPoint = history.points[history.points.length - 1];
      expect(lastPoint.totalPool).toBe(expectedTotal);

      // H2: a soma dos potes por opção sempre fecha com o total do ponto.
      for (const point of history.points) {
        const sum = options.reduce((acc, o) => acc + point.pools[o.id], 0);
        expect(sum).toBe(point.totalPool);
      }

      // H3: probabilidades normalizadas e dentro de [0,1].
      for (const point of history.points) {
        const sum = options.reduce((acc, o) => acc + point.probabilities[o.id], 0);
        expect(sum).toBeCloseTo(1, 10);
        for (const o of options) {
          expect(point.probabilities[o.id]).toBeGreaterThanOrEqual(0);
          expect(point.probabilities[o.id]).toBeLessThanOrEqual(1);
        }
      }

      // H4: monotonicidade — pote acumulado nunca decresce, nem no total nem
      // por opção. Uma regressão aqui significaria aporte contado fora de ordem.
      for (let i = 1; i < history.points.length; i += 1) {
        expect(history.points[i].totalPool).toBeGreaterThanOrEqual(
          history.points[i - 1].totalPool,
        );
        for (const o of options) {
          expect(history.points[i].pools[o.id]).toBeGreaterThanOrEqual(
            history.points[i - 1].pools[o.id],
          );
        }
      }

      // H5: multiplicador só existe onde há aporte, e nunca promete mais do
      // que o pote líquido — a invariante econômica que impede a casa quebrar.
      const netFactor = 1 - rakeBps / 10_000;
      for (const point of history.points) {
        for (const o of options) {
          const pool = point.pools[o.id];
          const mult = point.multipliers[o.id];
          if (pool === 0) {
            expect(mult).toBe(0);
            expect(formatMultiplier(mult)).toBe("—");
          } else {
            expect(mult).toBeGreaterThan(0);
            // Pagamento total dessa opção <= pote distribuível.
            expect(pool * mult).toBeLessThanOrEqual(point.totalPool * netFactor + 1e-6);
          }
        }
      }

      // H6: eixo temporal estritamente crescente e limitado pela janela real.
      const first = Math.min(...stakes.map((s) => Date.parse(s.createdAt)));
      const last = Math.max(...stakes.map((s) => Date.parse(s.createdAt)));
      for (let i = 1; i < history.points.length; i += 1) {
        expect(history.points[i].t).toBeGreaterThan(history.points[i - 1].t);
      }
      for (const point of history.points) {
        expect(point.t).toBeGreaterThanOrEqual(first - 1);
        expect(point.t).toBeLessThanOrEqual(last + 1);
      }

      // H7: teto de pontos respeitado (custo previsível de renderização).
      expect(history.points.length).toBeLessThanOrEqual(60);

      // H8: líder coerente com o último ponto.
      expect(history.leaderId).toBe(leaderOf(lastPoint, options));
    }
  }, 30_000);

  it("é determinístico e imune à ordem de chegada das linhas", () => {
    for (let seed = 900; seed < 1000; seed += 1) {
      const rng = mulberry32(seed);
      const { options, rakeBps, stakes } = scenario(rng);
      if (stakes.length === 0) continue;

      const straight = buildOddsHistory(stakes, options, rakeBps);
      const shuffled = buildOddsHistory([...stakes].reverse(), options, rakeBps);

      // O ledger pode chegar em qualquer ordem do banco; o replay ordena.
      expect(shuffled).toEqual(straight);
    }
  });

  it("descarta linhas órfãs sem corromper a série", () => {
    const options: OddsOption[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ];
    const stakes: OddsStake[] = [
      { optionId: "a", amount: 100, createdAt: new Date(BASE).toISOString() },
      // Opção removida do mercado, aporte com valor inválido e data inválida.
      { optionId: "fantasma", amount: 999, createdAt: new Date(BASE + 1000).toISOString() },
      { optionId: "b", amount: 0, createdAt: new Date(BASE + 2000).toISOString() },
      { optionId: "b", amount: 50, createdAt: "data-invalida" },
      { optionId: "b", amount: 300, createdAt: new Date(BASE + 3000).toISOString() },
    ];

    const history = buildOddsHistory(stakes, options, 500);
    expect(history.finalTotalPool).toBe(400);
    expect(history.leaderId).toBe("b");
  });

  it("trata mercado de aporte único e mercado com timestamps idênticos", () => {
    const options: OddsOption[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ];
    const iso = new Date(BASE).toISOString();

    const single = buildOddsHistory([{ optionId: "a", amount: 10, createdAt: iso }], options, 0);
    expect(single.points).toHaveLength(1);
    expect(single.points[0].probabilities.a).toBe(1);
    expect(single.points[0].multipliers.a).toBe(1);
    expect(single.points[0].multipliers.b).toBe(0);

    // Span zero: todos os aportes no mesmo instante colapsam em um ponto.
    const collapsed = buildOddsHistory(
      Array.from({ length: 25 }, () => ({ optionId: "b", amount: 4, createdAt: iso })),
      options,
      1000,
    );
    expect(collapsed.points).toHaveLength(1);
    expect(collapsed.finalTotalPool).toBe(100);
    expect(collapsed.points[0].multipliers.b).toBeCloseTo(0.9, 10);
  });

  it("conta viradas de liderança de forma estável", () => {
    const options: OddsOption[] = [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
    ];
    const at = (min: number) => new Date(BASE + min * 60_000).toISOString();

    const history = buildOddsHistory(
      [
        { optionId: "a", amount: 100, createdAt: at(0) },
        { optionId: "b", amount: 300, createdAt: at(10) },
        { optionId: "a", amount: 500, createdAt: at(20) },
      ],
      options,
      0,
    );

    expect(history.leaderId).toBe("a");
    expect(history.leadChanges).toBe(2);
  });
});