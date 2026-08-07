import { describe, expect, it } from "vitest";
import { parseSequenceProcedureStats } from "@/lib/sequenceProcedureStats";
import {
  SEQUENCE_REPORT_SECTIONS,
  buildSequenceStatsCsv,
  sequenceStatsFileName,
} from "@/lib/sequenceProcedureStatsExport";

const stats = parseSequenceProcedureStats({
  summary: {
    attempts: 4,
    players: 2,
    perfect_attempts: 1,
    avg_accuracy: 72.5,
    avg_duration_ms: 45000,
    best_duration_ms: 30000,
    coins_awarded: 40,
    xp_awarded: 80,
  },
  steps: [{ step_id: "s1", label: '=SOMA(A1);"drop"', position: 1, evaluated: 4, correct: 2 }],
  leaderboard: [
    { user_id: "u1", display_name: "Ana, Silva", attempts: 3, perfect_attempts: 1, best_accuracy: 100 },
  ],
  daily: [{ day: "2026-02-01", attempts: 4, perfect_attempts: 1 }],
  recent: [
    {
      id: "a1",
      display_name: "Ana",
      steps_total: 4,
      correct_positions: 4,
      is_perfect: true,
      duration_ms: 30000,
      coins_awarded: 20,
      xp_awarded: 40,
      created_at: "2026-02-01T12:00:00.000Z",
    },
  ],
});

const meta = { procedureTitle: "Abertura do Galpão", days: 30, generatedAt: new Date("2026-02-02T10:00:00Z") };

describe("buildSequenceStatsCsv", () => {
  const csv = buildSequenceStatsCsv(stats, meta);

  it("emite todas as seções na ordem esperada", () => {
    const positions = SEQUENCE_REPORT_SECTIONS.map((section) => csv.indexOf(`"${section}"`));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("usa CRLF e aspas em todas as células (RFC 4180)", () => {
    expect(csv).toContain("\r\n");
    expect(csv.split("\r\n")[0]).toBe('"secao","PARAMETROS"');
  });

  it("neutraliza fórmulas e escapa aspas/vírgulas", () => {
    expect(csv).toContain(`"'=SOMA(A1);""drop"""`);
    expect(csv).toContain('"Ana, Silva"');
  });

  it("reflete os números do resumo", () => {
    expect(csv).toContain('"taxa_perfeitas_pct","25"');
    expect(csv).toContain('"precisao_media_pct","72.5"');
  });

  it("não quebra com relatório vazio", () => {
    const empty = buildSequenceStatsCsv(parseSequenceProcedureStats(null), meta);
    expect(empty).toContain('"RESUMO"');
    expect(empty).toContain('"tentativas","0"');
  });
});

describe("sequenceStatsFileName", () => {
  it("gera slug seguro sem acentos nem path traversal", () => {
    expect(sequenceStatsFileName({ procedureTitle: "../../Ação Crítica", days: 7 }, "csv", new Date("2026-02-02T00:00:00Z")))
      .toBe("sop-relatorio-acao-critica-7d-2026-02-02.csv");
  });

  it("tem fallback para título vazio e janela inválida", () => {
    expect(sequenceStatsFileName({ procedureTitle: "  ", days: 0 }, "pdf", new Date("2026-02-02T00:00:00Z")))
      .toBe("sop-relatorio-procedimento-total-2026-02-02.pdf");
  });
});