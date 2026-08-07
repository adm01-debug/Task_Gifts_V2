import { describe, it, expect } from "vitest";
import {
  buildBoardChallengeCsv,
  boardChallengeFileName,
  BOARD_CHALLENGE_CSV_HEADERS,
} from "@/lib/boardStatsExport";
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

function bodyLines(csv: string): string[] {
  // remove BOM, contexto e linha em branco; sobra cabeçalho + dados
  const lines = csv.replace(/^\uFEFF/, "").replace(/\r\n$/, "").split("\r\n");
  return lines.slice(2);
}

describe("boardStatsExport — invariantes", () => {
  it("mantém cabeçalho estável e uma linha por desafio", () => {
    const rows: BoardChallengeStatRow[] = [
      { challenge_id: "a", question: "Qual o SLA?", tile_position: 3, attempts: 10, correct_attempts: 7, accuracy: 70, distinct_players: 6, blocked_players: 0 },
      { challenge_id: "b", question: "Prazo, em dias?", tile_position: 8, attempts: 4, correct_attempts: 1, accuracy: 25, distinct_players: 4, blocked_players: 2 },
    ];
    const lines = bodyLines(buildBoardChallengeCsv(rows, { now: NOW }));
    expect(lines[0]).toBe(BOARD_CHALLENGE_CSV_HEADERS.map((h) => `"${h}"`).join(","));
    expect(lines).toHaveLength(3);
  });

  it("neutraliza CSV injection e escapa aspas/vírgulas/quebras", () => {
    const csv = buildBoardChallengeCsv(
      [{ challenge_id: "x", question: '=CMD("rm")\nlinha, dois', tile_position: 1, attempts: 1, correct_attempts: 1, accuracy: 100, distinct_players: 1, blocked_players: 0 }],
      { now: NOW },
    );
    expect(csv).toContain(`"'=CMD(""rm"")\nlinha, dois"`);
  });

  it("não quebra com payload vazio, nulo ou corrompido", () => {
    for (const input of [null, undefined, [] as BoardChallengeStatRow[]]) {
      const csv = buildBoardChallengeCsv(input, { now: NOW });
      expect(bodyLines(csv)).toHaveLength(1);
    }
    const corrupted = [
      { challenge_id: "", question: "", tile_position: NaN, attempts: Infinity, correct_attempts: -5, accuracy: NaN, distinct_players: -1, blocked_players: NaN },
    ] as unknown as BoardChallengeStatRow[];
    expect(() => buildBoardChallengeCsv(corrupted, { now: NOW })).not.toThrow();
    expect(buildBoardChallengeCsv(corrupted, { now: NOW })).not.toContain("NaN");
  });

  it("nome do arquivo é slug seguro e determinístico", () => {
    expect(boardChallengeFileName("Trilha de Integração 2026!", NOW)).toBe(
      "tabuleiro-calibracao-trilha-de-integracao-2026-2026-07-28.csv",
    );
    expect(boardChallengeFileName(null, NOW)).toBe("tabuleiro-calibracao-geral-2026-07-28.csv");
    expect(boardChallengeFileName("", new Date(NaN))).toBe("tabuleiro-calibracao-geral-sem-data.csv");
  });
});

describe("boardStatsExport — simulação em massa", () => {
  it("500 relatórios aleatórios permanecem consistentes com o motor", () => {
    for (let seed = 1; seed <= 500; seed++) {
      const rnd = mulberry(seed);
      const n = Math.floor(rnd() * 12);
      const rows: BoardChallengeStatRow[] = Array.from({ length: n }, (_, i) => {
        const attempts = Math.floor(rnd() * 40);
        return {
          challenge_id: `c${i}`,
          question: rnd() > 0.9 ? `="perigo";${i}` : `Pergunta ${i}`,
          tile_position: i,
          attempts,
          // propositalmente pode exceder attempts: o motor deve saturar
          correct_attempts: Math.floor(rnd() * 45),
          accuracy: rnd() * 200 - 50,
          distinct_players: Math.floor(rnd() * 20),
          blocked_players: Math.floor(rnd() * 5),
        };
      });

      const csv = buildBoardChallengeCsv(rows, { now: NOW });
      const report = buildChallengeReport(rows);
      const lines = bodyLines(csv);

      expect(lines).toHaveLength(rows.length + 1);
      expect(csv.startsWith("\uFEFF")).toBe(true);
      expect(csv.endsWith("\r\n")).toBe(true);
      // toda linha de dado carrega exatamente a acurácia saneada do motor
      report.items.forEach((item, idx) => {
        expect(lines[idx + 1]).toContain(`"${item.accuracyPct}"`);
        expect(item.correct_attempts).toBeLessThanOrEqual(item.attempts);
      });
      // nenhuma célula de fórmula escapa sem o apóstrofo protetor
      expect(/,"[=+@]/.test(csv)).toBe(false);
    }
  });
});
