import { describe, it, expect } from "vitest";
import { buildBoardChallengePdfModel } from "@/lib/boardStatsPdf";
import { buildChallengeReport, type BoardChallengeStatRow } from "@/lib/boardStats";

const NOW = new Date("2026-07-28T12:00:00.000Z");

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("boardStatsPdf — invariantes", () => {
  it("gera nome .pdf coerente com o CSV e cabeçalho estável", () => {
    const model = buildBoardChallengePdfModel([], { trailLabel: "Integração", now: NOW });
    expect(model.fileName).toBe("tabuleiro-calibracao-integracao-2026-07-28.pdf");
    expect(model.head[0]).toHaveLength(9);
    expect(model.body).toHaveLength(0);
    expect(model.attentionBody).toHaveLength(0);
  });

  it("tolera payload nulo/corrompido sem lançar nem vazar NaN", () => {
    for (const input of [null, undefined, [{}] as unknown as BoardChallengeStatRow[]]) {
      const model = buildBoardChallengePdfModel(input, { now: NOW });
      expect(JSON.stringify(model)).not.toContain("NaN");
    }
    expect(buildBoardChallengePdfModel([], { now: new Date(NaN) }).subtitle).toContain("—");
  });
});

describe("boardStatsPdf — simulação em massa", () => {
  it("400 relatórios aleatórios batem exatamente com o motor", () => {
    for (let seed = 1; seed <= 400; seed++) {
      const rnd = mulberry(seed);
      const n = Math.floor(rnd() * 15);
      const rows: BoardChallengeStatRow[] = Array.from({ length: n }, (_, i) => ({
        challenge_id: `c${i}`,
        question: `Pergunta ${i}`,
        tile_position: i,
        attempts: Math.floor(rnd() * 40),
        correct_attempts: Math.floor(rnd() * 45),
        accuracy: rnd() * 150,
        distinct_players: Math.floor(rnd() * 20),
        blocked_players: Math.floor(rnd() * 4),
      }));

      const model = buildBoardChallengePdfModel(rows, { now: NOW });
      const report = buildChallengeReport(rows);

      expect(model.body).toHaveLength(report.items.length);
      expect(model.attentionBody.length).toBe(report.needsAttention.length);
      // prioridades são sempre um subconjunto do corpo principal
      expect(model.attentionBody.length).toBeLessThanOrEqual(model.body.length);
      report.items.forEach((item, idx) => {
        expect(model.body[idx][4]).toBe(`${item.accuracyPct}%`);
        expect(model.body[idx][3]).toBeLessThanOrEqual(model.body[idx][2] as number);
      });
      // toda linha tem exatamente o número de colunas do cabeçalho
      expect(model.body.every((r) => r.length === model.head[0].length)).toBe(true);
    }
  });
});
