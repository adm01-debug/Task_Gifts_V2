import { describe, it, expect } from "vitest";
import {
  BOSS_HISTORY_CSV_HEADERS,
  bossHistoryFileName,
  buildBossHistoryCsv,
} from "@/lib/bossHistoryExport";
import { summarizeBossHistory, type BossHistoryInput } from "@/lib/bossHistory";

const STATUSES = ["draft", "running", "defeated", "expired", "settled"] as const;

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}

function makeBattles(seed: number, count: number): BossHistoryInput[] {
  const rand = rng(seed);
  return Array.from({ length: count }, (_, i) => {
    const total = Math.trunc(rand() * 5000);
    return {
      id: `b-${seed}-${i}`,
      title: rand() < 0.15 ? '=SOMA(A1),"perigoso"\nquebra' : `Chefão ${i}`,
      status: STATUSES[Math.trunc(rand() * STATUSES.length)],
      total_hp: total,
      current_hp: rand() < 0.1 ? -50 : Math.trunc(rand() * total * 1.2),
      starts_at: new Date(1700000000000 + i * 3600_000).toISOString(),
      ends_at: new Date(1700000000000 + i * 7200_000).toISOString(),
      defeated_at: rand() < 0.5 ? new Date(1700000000000 + i * 5400_000).toISOString() : null,
      settled_at: null,
      coins_pool: Math.trunc(rand() * 900),
      xp_pool: Math.trunc(rand() * 900),
      department_id: rand() < 0.5 ? "dep-a" : "dep-b",
    };
  });
}

function parseRows(csv: string): string[] {
  return csv.replace(/^\uFEFF/, "").trimEnd().split("\r\n");
}

describe("buildBossHistoryCsv — simulação massiva", () => {
  it("mantém invariantes em 600 cenários", () => {
    for (let seed = 1; seed <= 600; seed++) {
      const battles = makeBattles(seed, 12);
      const dep = seed % 3 === 0 ? "dep-a" : null;
      const csv = buildBossHistoryCsv(battles, { departmentId: dep });
      const lines = parseRows(csv);
      const expected = summarizeBossHistory(battles, { departmentId: dep, limit: 0 });

      // cabeçalho + 1 linha por batalha concluída (quebras internas são escapadas)
      const header = lines[0];
      expect(header).toBe(BOSS_HISTORY_CSV_HEADERS.map((h) => `"${h}"`).join(","));
      expect(csv.startsWith("\uFEFF")).toBe(true);

      const body = csv.replace(/^\uFEFF/, "").slice(header.length + 2);
      for (const row of expected.rows) {
        expect(body).toContain(`"${row.id}"`);
      }
      // nenhuma célula pode iniciar fórmula
      const cells = body.match(/"(?:[^"]|"")*"/g) ?? [];
      for (const c of cells) {
        expect(/^"[=+\-@]/.test(c)).toBe(false);
      }
    }
  });

  it("ignora rascunhos e batalhas em andamento", () => {
    const csv = buildBossHistoryCsv([
      { id: "d", status: "draft", total_hp: 10, current_hp: 10 },
      { id: "r", status: "running", total_hp: 10, current_hp: 5 },
      { id: "s", status: "settled", total_hp: 10, current_hp: 0 },
    ]);
    expect(csv).toContain('"s"');
    expect(csv).not.toContain('"d"');
    expect(csv).not.toContain('"r"');
  });

  it("escapa aspas duplicando-as", () => {
    const csv = buildBossHistoryCsv([
      { id: "x", title: 'Boss "Alfa"', status: "defeated", total_hp: 10, current_hp: 0 },
    ]);
    expect(csv).toContain('"Boss ""Alfa"""');
  });

  it("gera nome de arquivo seguro", () => {
    expect(bossHistoryFileName("Operações & Logística", new Date("2026-07-28T10:00:00Z")))
      .toBe("chefao-historico-operacoes-logistica-2026-07-28.csv");
    expect(bossHistoryFileName(null, new Date("2026-07-28T10:00:00Z")))
      .toBe("chefao-historico-geral-2026-07-28.csv");
  });
});
