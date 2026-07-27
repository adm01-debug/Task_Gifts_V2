import { describe, expect, it } from "vitest";
import {
  awardFor,
  bracketRounds,
  bracketSize,
  buildBracket,
  nextSide,
  nextSlot,
  rankSeeds,
  resolveWinner,
  roundLabel,
  seedOrder,
  tournamentProgress,
  type MatchResultInput,
} from "@/lib/tournamentBracket";

/** PRNG determinístico (mulberry32) para simulações reprodutíveis. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RULES = {
  coinsPerWin: 10,
  xpPerWin: 25,
  coinsChampion: 100,
  xpChampion: 250,
  coinsRunnerUp: 40,
  xpRunnerUp: 100,
};

/** Roda um torneio inteiro e devolve campeão, vice e vitórias efetivas. */
function playTournament(participants: number, random: () => number) {
  const plan = buildBracket(participants);
  const wins = new Map<number, number>();
  let current = plan.matches.filter((m) => m.round === 1).map((m) => ({ ...m }));
  let champion: number | null = null;
  let runnerUp: number | null = null;
  let decided = 0;

  for (let round = 1; round <= plan.rounds; round++) {
    const winners = new Map<number, number>(); // slot da próxima rodada -> seed
    const nextHome = new Map<number, number>();
    const nextAway = new Map<number, number>();

    for (const match of current) {
      const input: MatchResultInput = {
        round,
        slot: match.slot,
        home_seed: match.home_seed,
        away_seed: match.away_seed,
        home_score: Math.floor(random() * 5),
        away_score: Math.floor(random() * 5),
      };
      const winner = resolveWinner(input);
      expect(winner === null || winner > 0).toBe(true);
      if (winner === null) continue;
      decided++;
      const contested = match.home_seed !== null && match.away_seed !== null;
      if (contested) wins.set(winner, (wins.get(winner) ?? 0) + 1);
      if (round === plan.rounds) {
        champion = winner;
        runnerUp =
          match.home_seed === winner ? match.away_seed : match.home_seed;
      } else {
        const target = nextSlot(match.slot);
        if (nextSide(match.slot) === "home") nextHome.set(target, winner);
        else nextAway.set(target, winner);
        winners.set(target, winner);
      }
    }

    if (round === plan.rounds) break;
    current = plan.matches
      .filter((m) => m.round === round + 1)
      .map((m) => ({
        ...m,
        home_seed: nextHome.get(m.slot) ?? null,
        away_seed: nextAway.get(m.slot) ?? null,
        bye: (nextHome.get(m.slot) ?? null) === null || (nextAway.get(m.slot) ?? null) === null,
      }));
    expect(winners.size).toBeGreaterThan(0);
  }

  return { plan, champion, runnerUp, wins, decided };
}

describe("tournamentBracket — tamanho e rodadas", () => {
  it("rejeita torneios com menos de 2 participantes", () => {
    for (const n of [-5, 0, 1]) {
      expect(bracketSize(n)).toBe(0);
      expect(buildBracket(n).matches).toHaveLength(0);
    }
  });

  it("sempre gera potência de 2 >= participantes (2..256)", () => {
    for (let n = 2; n <= 256; n++) {
      const size = bracketSize(n);
      expect(size).toBeGreaterThanOrEqual(n);
      expect(Number.isInteger(Math.log2(size))).toBe(true);
      expect(size / 2).toBeLessThan(n);
      expect(bracketRounds(size)).toBe(Math.log2(size));
    }
  });
});

describe("tournamentBracket — chaveamento canônico", () => {
  it("seedOrder contém todos os seeds exatamente uma vez", () => {
    for (const size of [2, 4, 8, 16, 32, 64, 128, 256]) {
      const order = seedOrder(size);
      expect(order).toHaveLength(size);
      expect(new Set(order).size).toBe(size);
      expect(Math.min(...order)).toBe(1);
      expect(Math.max(...order)).toBe(size);
    }
  });

  it("cada confronto da 1a rodada soma size+1 (1 x último, 2 x penúltimo...)", () => {
    for (const size of [2, 4, 8, 16, 32, 64]) {
      const order = seedOrder(size);
      for (let i = 0; i < size; i += 2) {
        expect(order[i] + order[i + 1]).toBe(size + 1);
      }
    }
  });

  it("seed 1 e seed 2 ficam em metades opostas", () => {
    for (const size of [4, 8, 16, 32, 64, 128]) {
      const order = seedOrder(size);
      expect(order.indexOf(1)).toBeLessThan(size / 2);
      expect(order.indexOf(2)).toBeGreaterThanOrEqual(size / 2);
    }
  });

  it("byes vão para os melhores seeds e o total de partidas é size-1", () => {
    for (let n = 2; n <= 128; n++) {
      const plan = buildBracket(n);
      expect(plan.matches).toHaveLength(plan.size - 1);
      expect(plan.byes).toBe(plan.size - n);
      const byeMatches = plan.matches.filter((m) => m.round === 1 && m.bye);
      expect(byeMatches).toHaveLength(plan.byes);
      for (const m of byeMatches) {
        const seed = m.home_seed ?? m.away_seed;
        expect(seed).not.toBeNull();
        expect(seed as number).toBeLessThanOrEqual(plan.byes === 0 ? plan.size : n);
      }
    }
  });

  it("nenhum seed aparece duas vezes na primeira rodada", () => {
    for (let n = 2; n <= 200; n++) {
      const plan = buildBracket(n);
      const seeds = plan.matches
        .filter((m) => m.round === 1)
        .flatMap((m) => [m.home_seed, m.away_seed])
        .filter((s): s is number => s !== null);
      expect(new Set(seeds).size).toBe(seeds.length);
      expect(seeds).toHaveLength(Math.min(n, plan.size));
    }
  });
});

describe("tournamentBracket — resolução de partidas", () => {
  it("bye avança sem depender de placar", () => {
    expect(resolveWinner({ round: 1, slot: 0, home_seed: 3, away_seed: null, home_score: 0, away_score: 99 })).toBe(3);
    expect(resolveWinner({ round: 1, slot: 0, home_seed: null, away_seed: 7, home_score: 99, away_score: 0 })).toBe(7);
    expect(resolveWinner({ round: 1, slot: 0, home_seed: null, away_seed: null, home_score: 0, away_score: 0 })).toBeNull();
  });

  it("empate é sempre resolvido pelo melhor seed (determinístico)", () => {
    for (let a = 1; a <= 40; a++) {
      for (let b = 1; b <= 40; b++) {
        if (a === b) continue;
        const w = resolveWinner({ round: 1, slot: 0, home_seed: a, away_seed: b, home_score: 5, away_score: 5 });
        expect(w).toBe(Math.min(a, b));
      }
    }
  });
});

describe("tournamentBracket — simulação de centenas de torneios", () => {
  it("500 torneios aleatórios sempre produzem exatamente 1 campeão válido", () => {
    let simulations = 0;
    for (let seed = 1; seed <= 500; seed++) {
      const random = rng(seed * 7919);
      const participants = 2 + Math.floor(random() * 63);
      const { plan, champion, runnerUp, wins, decided } = playTournament(participants, random);
      simulations++;
      expect(champion).not.toBeNull();
      expect(champion as number).toBeGreaterThanOrEqual(1);
      expect(champion as number).toBeLessThanOrEqual(participants);
      expect(runnerUp).not.toBe(champion);
      expect(decided).toBeGreaterThan(0);
      expect(decided).toBeLessThanOrEqual(plan.matches.length);
      // Ninguém pode vencer mais partidas que o número de rodadas.
      for (const [, w] of wins) expect(w).toBeLessThanOrEqual(plan.rounds);
      expect(wins.get(champion as number) ?? 0).toBeGreaterThanOrEqual(
        participants > 1 ? 1 : 0,
      );
    }
    expect(simulations).toBe(500);
  });

  it("torneio de 2 participantes decide em 1 partida", () => {
    const { plan, champion } = playTournament(2, rng(42));
    expect(plan.rounds).toBe(1);
    expect(plan.matches).toHaveLength(1);
    expect([1, 2]).toContain(champion);
  });
});

describe("tournamentBracket — economia", () => {
  it("recompensas nunca são negativas e byes não pagam", () => {
    const zeroed = awardFor(-3, "eliminated", RULES);
    expect(zeroed).toEqual({ coins: 0, xp: 0 });
    expect(awardFor(0, "champion", RULES)).toEqual({ coins: 100, xp: 250 });
    expect(awardFor(3, "runner_up", RULES)).toEqual({ coins: 70, xp: 175 });
  });

  it("teto econômico: campeão de 256 nunca excede o máximo teórico", () => {
    const rounds = bracketRounds(256);
    const max = awardFor(rounds, "champion", RULES);
    expect(max.coins).toBe(rounds * 10 + 100);
    expect(max.xp).toBe(rounds * 25 + 250);
    for (let s = 1; s <= 300; s++) {
      const random = rng(s * 104729);
      const { wins, champion } = playTournament(2 + Math.floor(random() * 254), random);
      const award = awardFor(wins.get(champion as number) ?? 0, "champion", RULES);
      expect(award.coins).toBeLessThanOrEqual(max.coins);
      expect(award.xp).toBeLessThanOrEqual(max.xp);
    }
  });

  it("regras negativas são saneadas para zero", () => {
    const bad = awardFor(5, "champion", {
      coinsPerWin: -10, xpPerWin: -5, coinsChampion: -100, xpChampion: -1, coinsRunnerUp: -1, xpRunnerUp: -1,
    });
    expect(bad).toEqual({ coins: 0, xp: 0 });
  });
});

describe("tournamentBracket — utilidades de UI", () => {
  it("ranqueia seeds de forma estável e determinística", () => {
    const a = rankSeeds([
      { id: "c", label: "Carlos", score: 10 },
      { id: "a", label: "Ana", score: 10 },
      { id: "b", label: "Bruno", score: 30 },
    ]);
    expect(a.map((s) => s.id)).toEqual(["b", "a", "c"]);
    const b = rankSeeds([
      { id: "a", label: "Ana", score: 10 },
      { id: "b", label: "Bruno", score: 30 },
      { id: "c", label: "Carlos", score: 10 },
    ]);
    expect(b.map((s) => s.id)).toEqual(a.map((s) => s.id));
  });

  it("progresso fica sempre entre 0 e 100", () => {
    expect(tournamentProgress(0, 0)).toBe(0);
    expect(tournamentProgress(5, 0)).toBe(0);
    expect(tournamentProgress(99, 10)).toBe(100);
    for (let total = 1; total <= 255; total++) {
      for (let d = 0; d <= total; d++) {
        const p = tournamentProgress(d, total);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(100);
      }
    }
  });

  it("rótulos de rodada em PT-BR", () => {
    expect(roundLabel(4, 4)).toBe("Final");
    expect(roundLabel(3, 4)).toBe("Semifinal");
    expect(roundLabel(2, 4)).toBe("Quartas de final");
    expect(roundLabel(1, 4)).toBe("Oitavas de final");
    expect(roundLabel(1, 6)).toBe("Rodada 1");
  });
});
