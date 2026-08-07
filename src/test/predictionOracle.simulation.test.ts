import { describe, expect, it } from "vitest";

import {
  buildOracleRanking,
  DEFAULT_SHRINKAGE_COINS,
  formatOracleScore,
  tierOf,
  type OracleStake,
} from "@/lib/predictionOracle";

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

interface Scenario {
  stakes: OracleStake[];
  users: string[];
}

/**
 * Gera um mundo completo: mercados com opções, probabilidades implícitas
 * coerentes (somando 1) e um vencedor sorteado por essas probabilidades.
 */
function makeScenario(rnd: () => number): Scenario {
  const userCount = 1 + Math.floor(rnd() * 12);
  const users = Array.from({ length: userCount }, (_, i) => `u${i}`);
  const marketCount = 1 + Math.floor(rnd() * 10);
  const stakes: OracleStake[] = [];

  for (let m = 0; m < marketCount; m++) {
    const optionCount = 2 + Math.floor(rnd() * 4);
    const raw = Array.from({ length: optionCount }, () => 0.05 + rnd());
    const sum = raw.reduce((a, b) => a + b, 0);
    const probs = raw.map((v) => v / sum);
    const optionIds = Array.from({ length: optionCount }, (_, i) => `m${m}o${i}`);

    // Vencedor sorteado pela própria distribuição: o mercado é calibrado.
    let roll = rnd();
    let winner = optionIds[optionCount - 1];
    for (let i = 0; i < optionCount; i++) {
      roll -= probs[i];
      if (roll <= 0) {
        winner = optionIds[i];
        break;
      }
    }

    const bettors = 1 + Math.floor(rnd() * userCount);
    for (let b = 0; b < bettors; b++) {
      const userId = users[Math.floor(rnd() * userCount)];
      const choice = Math.floor(rnd() * optionCount);
      const amount = 1 + Math.floor(rnd() * 400);
      const won = optionIds[choice] === winner;
      stakes.push({
        userId,
        marketId: `m${m}`,
        optionId: optionIds[choice],
        amount,
        impliedProbability: probs[choice],
        winningOptionId: winner,
        payout: won ? Math.floor(amount / Math.max(probs[choice], 0.01)) : 0,
      });
    }
  }

  return { stakes, users };
}

function shuffle<T>(items: T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

describe("ranking Oráculo — simulação massiva", () => {
  it(
    "preserva invariantes de pontuação, ordenação e elegibilidade",
    () => {
      for (let seed = 1; seed <= 600; seed++) {
        const rnd = mulberry32(seed);
        const { stakes } = makeScenario(rnd);
        const minMarkets = 1 + Math.floor(rnd() * 4);
        const ranking = buildOracleRanking(stakes, { minMarkets });

        const seen = new Set<string>();
        for (let i = 0; i < ranking.length; i++) {
          const entry = ranking[i];

          // Unicidade: um usuário jamais aparece duas vezes.
          expect(seen.has(entry.userId)).toBe(false);
          seen.add(entry.userId);

          // Posições contíguas começando em 1.
          expect(entry.rank).toBe(i + 1);

          // Elegibilidade respeitada.
          expect(entry.markets).toBeGreaterThanOrEqual(minMarkets);

          // A pontuação é estritamente limitada — nunca explode.
          expect(entry.score).toBeGreaterThan(-1);
          expect(entry.score).toBeLessThan(1);
          expect(Number.isFinite(entry.score)).toBe(true);

          // Brier vive em [0,1] por construção.
          expect(entry.brier).toBeGreaterThanOrEqual(0);
          expect(entry.brier).toBeLessThanOrEqual(1);

          // Coerência de contagens e economia.
          expect(entry.hits).toBeLessThanOrEqual(entry.stakes);
          expect(entry.hitRate).toBeGreaterThanOrEqual(0);
          expect(entry.hitRate).toBeLessThanOrEqual(1);
          expect(entry.totalStaked).toBeGreaterThan(0);
          expect(entry.netCoins).toBe(entry.totalPayout - entry.totalStaked);
          expect(entry.markets).toBeLessThanOrEqual(entry.stakes);

          // A faixa é sempre derivada da pontuação, sem estado paralelo.
          expect(entry.tier).toBe(tierOf(entry.score));

          // Ordenação monotônica não crescente.
          if (i > 0) expect(ranking[i - 1].score).toBeGreaterThanOrEqual(entry.score);
        }
      }
    },
    30_000,
  );

  it("é indiferente à ordem de chegada dos aportes", () => {
    for (let seed = 700; seed <= 900; seed++) {
      const rnd = mulberry32(seed);
      const { stakes } = makeScenario(rnd);
      const base = buildOracleRanking(stakes, { minMarkets: 1 });
      const shuffled = buildOracleRanking(shuffle(stakes, mulberry32(seed + 5000)), {
        minMarkets: 1,
      });
      expect(shuffled).toEqual(base);
    }
  });

  it("não recompensa quem apenas copia o consenso", () => {
    // Estratégia "sempre no favorito quase certo": acerta 95% das vezes.
    const conformist: OracleStake[] = [];
    for (let m = 0; m < 40; m++) {
      const won = m % 20 !== 0; // 95% de acerto
      conformist.push({
        userId: "conformista",
        marketId: `m${m}`,
        optionId: "fav",
        amount: 300,
        impliedProbability: 0.95,
        winningOptionId: won ? "fav" : "outro",
        payout: won ? 315 : 0,
      });
    }

    // Estratégia informada: acerta 40% em opções cotadas a 20%.
    const informed: OracleStake[] = [];
    for (let m = 0; m < 40; m++) {
      const won = m % 5 < 2; // 40% de acerto
      informed.push({
        userId: "informado",
        marketId: `m${m}`,
        optionId: "azarao",
        amount: 300,
        impliedProbability: 0.2,
        winningOptionId: won ? "azarao" : "outro",
        payout: won ? 1500 : 0,
      });
    }

    const ranking = buildOracleRanking([...conformist, ...informed]);
    const conformista = ranking.find((e) => e.userId === "conformista")!;
    const informado = ranking.find((e) => e.userId === "informado")!;

    // A taxa de acerto bruta favorece massivamente o conformista...
    expect(conformista.hitRate).toBeGreaterThan(informado.hitRate);
    // ...mas o ranking, corretamente, favorece quem trouxe informação nova.
    expect(informado.rank).toBeLessThan(conformista.rank);
    expect(informado.score).toBeGreaterThan(conformista.score);
    expect(informado.tier).toBe("oracle");
  });

  it("encolhe a pontuação de quem tem pouco volume", () => {
    const build = (amount: number, markets: number) =>
      Array.from({ length: markets }, (_, m) => ({
        userId: "u",
        marketId: `m${m}`,
        optionId: "a",
        amount,
        impliedProbability: 0.25,
        winningOptionId: "a",
        payout: amount * 4,
      }));

    const small = buildOracleRanking(build(10, 3))[0];
    const large = buildOracleRanking(build(5000, 3))[0];

    // Mesmo edge por moeda (0,75), mas confiança estatística muito diferente.
    expect(small.edge).toBeCloseTo(large.edge, 10);
    expect(large.score).toBeGreaterThan(small.score);
    // Um acerto pequeno nunca chega perto do edge bruto.
    expect(small.score).toBeLessThan(small.edge / 2);
  });

  it("descarta lixo do ledger sem quebrar", () => {
    const dirty: OracleStake[] = [
      { userId: "", marketId: "m1", optionId: "a", amount: 100, impliedProbability: 0.5, winningOptionId: "a", payout: 0 },
      { userId: "u", marketId: "", optionId: "a", amount: 100, impliedProbability: 0.5, winningOptionId: "a", payout: 0 },
      { userId: "u", marketId: "m1", optionId: "a", amount: 0, impliedProbability: 0.5, winningOptionId: "a", payout: 0 },
      { userId: "u", marketId: "m2", optionId: "a", amount: -50, impliedProbability: 0.5, winningOptionId: "a", payout: 0 },
      { userId: "u", marketId: "m3", optionId: "a", amount: Number.NaN, impliedProbability: 0.5, winningOptionId: "a", payout: 0 },
      // Probabilidades fora do domínio precisam ser saneadas, não propagadas.
      { userId: "u", marketId: "m4", optionId: "a", amount: 100, impliedProbability: 5, winningOptionId: "a", payout: 100 },
      { userId: "u", marketId: "m5", optionId: "a", amount: 100, impliedProbability: -3, winningOptionId: "b", payout: 0 },
      { userId: "u", marketId: "m6", optionId: "a", amount: 100, impliedProbability: Number.NaN, winningOptionId: "a", payout: 100 },
      { userId: "u", marketId: "m7", optionId: "a", amount: 100, impliedProbability: 0.5, winningOptionId: "a", payout: Number.NaN },
    ];

    const ranking = buildOracleRanking(dirty, { minMarkets: 1 });
    expect(ranking).toHaveLength(1);
    const entry = ranking[0];
    expect(entry.userId).toBe("u");
    expect(entry.stakes).toBe(4);
    expect(Number.isFinite(entry.score)).toBe(true);
    expect(Number.isFinite(entry.netCoins)).toBe(true);
    expect(entry.brier).toBeGreaterThanOrEqual(0);
  });

  it("mantém o prior de encolhimento e a formatação estáveis", () => {
    expect(DEFAULT_SHRINKAGE_COINS).toBeGreaterThan(0);
    expect(formatOracleScore(0.1234)).toBe("+123");
    expect(formatOracleScore(-0.02)).toBe("-20");
    expect(formatOracleScore(0)).toBe("+0");
    expect(buildOracleRanking([])).toEqual([]);
  });
});