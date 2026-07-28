import { describe, expect, it } from "vitest";
import {
  analyzeChallenge,
  buildChallengeReport,
  classifyDifficulty,
  medalForRank,
  trailProgressPct,
  MIN_SAMPLE_FOR_CALIBRATION,
  type BoardChallengeStatRow,
} from "@/lib/boardStats";

function row(partial: Partial<BoardChallengeStatRow>): BoardChallengeStatRow {
  return {
    challenge_id: "c1",
    question: "Pergunta",
    tile_position: 3,
    attempts: 0,
    correct_attempts: 0,
    accuracy: 0,
    distinct_players: 0,
    blocked_players: 0,
    ...partial,
  };
}

describe("boardStats — invariantes de acurácia", () => {
  it("nunca produz acurácia fora de 0..100 em 500 cenários aleatórios", () => {
    for (let i = 0; i < 500; i++) {
      const attempts = Math.floor(Math.random() * 400);
      // Injeta propositalmente acertos maiores que tentativas (dado corrompido).
      const correct = Math.floor(Math.random() * 500);
      const analyzed = analyzeChallenge(row({ attempts, correct_attempts: correct }));

      expect(analyzed.accuracyPct).toBeGreaterThanOrEqual(0);
      expect(analyzed.accuracyPct).toBeLessThanOrEqual(100);
      expect(analyzed.correct_attempts).toBeLessThanOrEqual(analyzed.attempts);
    }
  });

  it("resiste a NaN, Infinity, negativos e nulos", () => {
    const hostile = analyzeChallenge({
      challenge_id: undefined as unknown as string,
      question: "",
      tile_position: Number.NaN,
      attempts: Number.POSITIVE_INFINITY,
      correct_attempts: -50,
      accuracy: Number.NaN,
      distinct_players: Number.NEGATIVE_INFINITY,
      blocked_players: Number.NaN,
    });

    expect(hostile.attempts).toBe(0);
    expect(hostile.correct_attempts).toBe(0);
    expect(hostile.accuracyPct).toBe(0);
    expect(hostile.distinct_players).toBe(0);
    expect(hostile.difficulty).toBe("sem-dados");
    expect(hostile.question).toBe("Pergunta removida");
  });

  it("classifica as cinco faixas de dificuldade", () => {
    expect(classifyDifficulty(0, 100)).toBe("sem-dados");
    expect(classifyDifficulty(10, 95)).toBe("muito-facil");
    expect(classifyDifficulty(10, 75)).toBe("equilibrado");
    expect(classifyDifficulty(10, 45)).toBe("dificil");
    expect(classifyDifficulty(10, 10)).toBe("critico");
  });
});

describe("boardStats — sinalizadores de calibração", () => {
  it("marca amostra insuficiente e não acusa problema de enunciado", () => {
    const analyzed = analyzeChallenge(
      row({ attempts: MIN_SAMPLE_FOR_CALIBRATION - 1, correct_attempts: 0 }),
    );
    expect(analyzed.flags).toContain("amostra-insuficiente");
    expect(analyzed.flags).not.toContain("revisar-enunciado");
  });

  it("acusa enunciado a revisar apenas com amostra suficiente", () => {
    const analyzed = analyzeChallenge(row({ attempts: 40, correct_attempts: 4 }));
    expect(analyzed.difficulty).toBe("critico");
    expect(analyzed.flags).toContain("revisar-enunciado");
  });

  it("acusa desafio fácil demais para o prêmio pago", () => {
    const analyzed = analyzeChallenge(row({ attempts: 40, correct_attempts: 39 }));
    expect(analyzed.flags).toContain("recompensa-baixa-demais");
  });

  it("sempre sinaliza jogadores travados, mesmo sem amostra", () => {
    const analyzed = analyzeChallenge(row({ attempts: 0, blocked_players: 3 }));
    expect(analyzed.flags).toEqual(["jogadores-travados"]);
  });
});

describe("boardStats — relatório agregado", () => {
  it("agrega totais e ordena os que precisam de atenção", () => {
    const report = buildChallengeReport([
      row({ challenge_id: "a", attempts: 10, correct_attempts: 9 }),
      row({ challenge_id: "b", attempts: 20, correct_attempts: 2, blocked_players: 1 }),
      row({ challenge_id: "c", attempts: 20, correct_attempts: 1, blocked_players: 7 }),
    ]);

    expect(report.totalAttempts).toBe(50);
    expect(report.totalCorrect).toBe(12);
    expect(report.overallAccuracy).toBe(24);
    expect(report.blockedPlayers).toBe(8);
    expect(report.needsAttention.map((i) => i.challenge_id)).toEqual(["c", "b"]);
  });

  it("lida com lista vazia, nula e indefinida sem dividir por zero", () => {
    for (const input of [[], null, undefined]) {
      const report = buildChallengeReport(input);
      expect(report.items).toEqual([]);
      expect(report.overallAccuracy).toBe(0);
      expect(report.totalAttempts).toBe(0);
      expect(report.needsAttention).toEqual([]);
    }
  });

  it("mantém consistência agregada em 200 relatórios sintéticos", () => {
    for (let i = 0; i < 200; i++) {
      const size = 1 + Math.floor(Math.random() * 12);
      const rows = Array.from({ length: size }, (_, idx) => {
        const attempts = Math.floor(Math.random() * 60);
        return row({
          challenge_id: `q${idx}`,
          tile_position: idx,
          attempts,
          correct_attempts: Math.floor(Math.random() * (attempts + 1)),
          blocked_players: Math.floor(Math.random() * 3),
        });
      });

      const report = buildChallengeReport(rows);
      expect(report.totalCorrect).toBeLessThanOrEqual(report.totalAttempts);
      expect(report.overallAccuracy).toBeGreaterThanOrEqual(0);
      expect(report.overallAccuracy).toBeLessThanOrEqual(100);
      expect(report.items).toHaveLength(size);
    }
  });
});

describe("boardStats — ranking", () => {
  it("atribui medalhas apenas ao pódio", () => {
    expect(medalForRank(1)).toBe("ouro");
    expect(medalForRank(2)).toBe("prata");
    expect(medalForRank(3)).toBe("bronze");
    expect(medalForRank(4)).toBeNull();
    expect(medalForRank(Number.NaN)).toBeNull();
    expect(medalForRank("2")).toBe("prata");
  });

  it("calcula progresso sem estourar limites", () => {
    expect(trailProgressPct(0, 21)).toBe(0);
    expect(trailProgressPct(20, 21)).toBe(100);
    expect(trailProgressPct(999, 21)).toBe(100);
    expect(trailProgressPct(5, 0)).toBe(100);
    expect(trailProgressPct(0, 0)).toBe(0);
    expect(trailProgressPct(Number.NaN, Number.NaN)).toBe(0);
  });
});