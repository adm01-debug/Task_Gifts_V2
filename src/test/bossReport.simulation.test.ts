import { describe, it, expect } from "vitest";
import {
  buildBossReport,
  buildBossReportCsv,
  bossReportFileName,
} from "@/lib/bossReport";
import { summarizeBossHistory, type BossHistoryInput } from "@/lib/bossHistory";

const STATUSES = ["draft", "running", "defeated", "expired", "settled"] as const;
const NOW = new Date("2026-07-28T12:00:00Z");

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
  const deps = ["dep-a", "dep-b", "dep-c", null];
  return Array.from({ length: count }, (_, i) => {
    const total = Math.trunc(rand() * 4000) + 1;
    const end = NOW.getTime() - Math.trunc(rand() * 400) * 86_400_000;
    const dated = rand() > 0.1;
    return {
      id: `b-${seed}-${i}`,
      title: rand() < 0.15 ? '=SOMA(A1),"perigo"' : `Chefão ${i}`,
      status: STATUSES[Math.trunc(rand() * STATUSES.length)],
      total_hp: total,
      current_hp: Math.trunc(rand() * total),
      starts_at: new Date(end - 7200_000).toISOString(),
      ends_at: dated ? new Date(end).toISOString() : null,
      defeated_at: rand() < 0.5 && dated ? new Date(end).toISOString() : null,
      coins_pool: Math.trunc(rand() * 500),
      xp_pool: Math.trunc(rand() * 500),
      department_id: deps[Math.trunc(rand() * deps.length)],
    };
  });
}

describe("buildBossReport — simulação massiva", () => {
  it("mantém coerência entre seções em 600 cenários", () => {
    for (let seed = 1; seed <= 600; seed++) {
      const battles = makeBattles(seed, 16);
      const days = [0, 30, 90, 365][seed % 4];
      const dep = seed % 5 === 0 ? "dep-a" : null;
      const report = buildBossReport(battles, {
        departmentId: dep,
        days,
        target: 0.6,
        now: NOW,
      });

      // resumo bate com a contagem de linhas detalhadas
      expect(report.history.rows.length).toBe(report.history.concluded);
      expect(report.history.victories + report.history.defeats).toBe(
        report.history.concluded,
      );
      // tendência nunca soma mais batalhas do que o recorte
      const trendTotal = report.trend.points.reduce((s, p) => s + p.battles, 0);
      expect(trendTotal).toBeLessThanOrEqual(report.history.concluded);
      // comparativo nunca soma mais batalhas do que o recorte
      const compTotal = report.comparison.rows.reduce((s, r) => s + r.battles, 0);
      expect(compTotal).toBeLessThanOrEqual(report.history.concluded);
      // filtro de departamento é respeitado em todas as seções
      if (dep) {
        for (const row of report.comparison.rows) expect(row.departmentId).toBe(dep);
        for (const row of report.goals.rows) expect(row.departmentId).toBe(dep);
      }
      // taxas sempre em 0..1
      expect(report.history.winRate).toBeGreaterThanOrEqual(0);
      expect(report.history.winRate).toBeLessThanOrEqual(1);
    }
  });

  it("gera CSV multi-seção seguro contra injeção de fórmula", () => {
    const report = buildBossReport(makeBattles(7, 40), { days: 0, now: NOW });
    const csv = buildBossReportCsv(report, { "dep-a": "=CMD()", "dep-b": 'Ops, "Norte"' });

    expect(csv.startsWith("\uFEFF")).toBe(true);
    for (const section of [
      "PARAMETROS", "RESUMO", "TENDENCIA_MENSAL",
      "COMPARATIVO_DEPARTAMENTOS", "METAS_WIN_RATE", "BATALHAS",
    ]) {
      expect(csv).toContain(`"secao","${section}"`);
    }
    expect(csv).toContain(`"Ops, ""Norte"""`);
    const cells = csv.match(/"(?:[^"]|"")*"/g) ?? [];
    for (const c of cells) expect(/^"[=+\-@]/.test(c)).toBe(false);
  });

  it("sem janela, o resumo equivale ao motor de histórico", () => {
    const battles = makeBattles(21, 30);
    const report = buildBossReport(battles, { days: 0, now: NOW });
    const direct = summarizeBossHistory(battles, { limit: 0 });
    expect(report.history.concluded).toBe(direct.concluded);
    expect(report.history.victories).toBe(direct.victories);
    expect(report.history.totalHpDestroyed).toBe(direct.totalHpDestroyed);
  });

  it("nomes de arquivo são saneados e estáveis", () => {
    expect(
      bossReportFileName({ departmentLabel: "../../etc/passwd", days: 90 }, "csv", NOW),
    ).toBe("chefao-relatorio-etc-passwd-90d-2026-07-28.csv");
    expect(
      bossReportFileName({ departmentLabel: "Toda a empresa", days: 0 }, "pdf", NOW),
    ).toBe("chefao-relatorio-toda-a-empresa-total-2026-07-28.pdf");
  });

  it("retorna relatório vazio sem batalhas concluídas", () => {
    const report = buildBossReport(
      [{ id: "d", status: "draft", total_hp: 10, current_hp: 10 }],
      { days: 90, now: NOW },
    );
    expect(report.history.concluded).toBe(0);
    expect(report.comparison.rows.length).toBe(0);
  });
});