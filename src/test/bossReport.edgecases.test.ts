/**
 * Casos-limite do relatório consolidado do Chefão.
 *
 * Foco em branches que a simulação aleatória raramente cobre:
 * fronteiras exatas da janela, datas inválidas, meses vazios, virada de ano,
 * saneamento de parâmetros e contagem de batalhas sem data.
 */
import { describe, it, expect } from "vitest";
import {
  buildBossReport,
  buildBossReportCsv,
  bossReportFileName,
  resolveDepartmentName,
  pct,
} from "@/lib/bossReport";
import { NO_DEPARTMENT } from "@/lib/bossDepartmentComparison";
import type { BossHistoryInput } from "@/lib/bossHistory";

const NOW = new Date("2026-07-28T12:00:00.000Z");
const DAY = 86_400_000;

function battle(over: Partial<BossHistoryInput> & { id: string }): BossHistoryInput {
  return {
    status: "settled",
    total_hp: 100,
    current_hp: 0,
    starts_at: "2026-01-01T00:00:00.000Z",
    ends_at: "2026-01-02T00:00:00.000Z",
    defeated_at: "2026-01-02T00:00:00.000Z",
    coins_pool: 10,
    xp_pool: 20,
    department_id: "dep-a",
    ...over,
  } as BossHistoryInput;
}

/** `concludedAt` = settled_at || defeated_at || ends_at. */
function at(iso: string, id: string, extra: Partial<BossHistoryInput> = {}) {
  return battle({ id, ends_at: iso, defeated_at: iso, settled_at: iso, ...extra });
}

describe("buildBossReport — fronteiras da janela", () => {
  const from = new Date(NOW.getTime() - 30 * DAY);

  it("inclui os extremos exatos e exclui 1 ms fora", () => {
    const battles = [
      at(from.toISOString(), "borda-inicio"),
      at(new Date(from.getTime() - 1).toISOString(), "antes"),
      at(NOW.toISOString(), "borda-fim"),
      at(new Date(NOW.getTime() + 1).toISOString(), "futuro"),
    ];
    const report = buildBossReport(battles, { days: 30, now: NOW });
    const ids = report.history.rows.map((r) => r.id).sort();
    expect(ids).toEqual(["borda-fim", "borda-inicio"]);
    expect(report.meta.consideredBattles).toBe(2);
  });

  it("janela 0 traz todo o histórico, inclusive o futuro registrado", () => {
    const battles = [
      at("2020-01-01T00:00:00.000Z", "antigo"),
      at(new Date(NOW.getTime() + 10 * DAY).toISOString(), "futuro"),
    ];
    const report = buildBossReport(battles, { days: 0, now: NOW });
    expect(report.history.concluded).toBe(2);
    expect(report.meta.from).toBeNull();
  });

  it("normaliza dias inválidos (NaN, negativo, fracionário)", () => {
    const battles = [at("2026-07-20T00:00:00.000Z", "x")];
    expect(buildBossReport(battles, { days: Number.NaN, now: NOW }).meta.days).toBe(0);
    expect(buildBossReport(battles, { days: -30, now: NOW }).meta.days).toBe(0);
    expect(buildBossReport(battles, { days: 90.9, now: NOW }).meta.days).toBe(90);
  });

  it("usa o relógio real quando `now` é uma data inválida", () => {
    const report = buildBossReport([], { days: 30, now: new Date("data-ruim") });
    expect(Number.isFinite(Date.parse(report.meta.to))).toBe(true);
  });
});

describe("buildBossReport — batalhas sem data confiável", () => {
  const undatedSet: BossHistoryInput[] = [
    battle({ id: "u1", ends_at: null, defeated_at: null, settled_at: null }),
    battle({ id: "u2", ends_at: "data-invalida", defeated_at: null, settled_at: null }),
    at("2026-07-20T00:00:00.000Z", "ok"),
  ];

  it("com janela ativa: conta em excludedUndated e não entra em nenhuma seção", () => {
    const report = buildBossReport(undatedSet, { days: 30, now: NOW });
    expect(report.meta.excludedUndated).toBe(2);
    expect(report.history.concluded).toBe(1);
    expect(report.trend.undated).toBe(0);
    expect(report.comparison.rows.reduce((s, r) => s + r.battles, 0)).toBe(1);
  });

  it("sem janela: entram no resumo mas não na tendência nem no comparativo", () => {
    const report = buildBossReport(undatedSet, { days: 0, now: NOW });
    expect(report.meta.excludedUndated).toBe(2);
    expect(report.history.concluded).toBe(3);
    expect(report.trend.undated).toBe(2);
    expect(report.comparison.excludedUndated).toBe(2);
    expect(report.comparison.rows.reduce((s, r) => s + r.battles, 0)).toBe(1);
  });

  it("rascunhos e batalhas em andamento nunca contam como sem data", () => {
    const report = buildBossReport(
      [
        battle({ id: "d", status: "draft", ends_at: null, defeated_at: null, settled_at: null }),
        battle({ id: "r", status: "running", ends_at: null, defeated_at: null, settled_at: null }),
      ],
      { days: 90, now: NOW },
    );
    expect(report.meta.excludedUndated).toBe(0);
    expect(report.history.concluded).toBe(0);
    expect(report.trend.points).toEqual([]);
  });

  it("respeita o filtro de departamento antes de contar sem data", () => {
    const report = buildBossReport(
      [
        battle({ id: "a", department_id: "dep-a", ends_at: null, defeated_at: null, settled_at: null }),
        battle({ id: "b", department_id: "dep-b", ends_at: null, defeated_at: null, settled_at: null }),
      ],
      { departmentId: "dep-a", days: 30, now: NOW },
    );
    expect(report.meta.excludedUndated).toBe(1);
    expect(report.meta.departmentLabel).toBe("Departamento");
  });
});

describe("buildBossReport — meses vazios na tendência", () => {
  it("preenche lacunas entre o primeiro e o último mês com zeros", () => {
    const report = buildBossReport(
      [
        at("2026-01-15T00:00:00.000Z", "jan"),
        at("2026-04-10T00:00:00.000Z", "abr"),
      ],
      { days: 0, now: NOW },
    );
    expect(report.trend.points.map((p) => p.month)).toEqual([
      "2026-01", "2026-02", "2026-03", "2026-04",
    ]);
    const empties = report.trend.points.filter((p) => p.battles === 0);
    expect(empties.length).toBe(2);
    for (const p of empties) {
      expect(p.winRate).toBe(0);
      expect(p.victories + p.defeats).toBe(0);
    }
  });

  it("atravessa a virada de ano sem pular meses", () => {
    const report = buildBossReport(
      [
        at("2025-11-05T00:00:00.000Z", "nov"),
        at("2026-02-05T00:00:00.000Z", "fev"),
      ],
      { days: 0, now: NOW },
    );
    expect(report.trend.points.map((p) => p.month)).toEqual([
      "2025-11", "2025-12", "2026-01", "2026-02",
    ]);
  });

  it("mês único não produz delta de tendência", () => {
    const report = buildBossReport([at("2026-07-01T00:00:00.000Z", "só")], {
      days: 0,
      now: NOW,
    });
    expect(report.trend.points.length).toBe(1);
    expect(report.trend.winRateDeltaPp).toBeNull();
  });

  it("mês vazio entre dois meses com dados não gera delta artificial", () => {
    const report = buildBossReport(
      [
        at("2026-05-10T00:00:00.000Z", "mai"),
        at("2026-07-10T00:00:00.000Z", "jul", { status: "expired", current_hp: 40 }),
      ],
      { days: 0, now: NOW },
    );
    // último mês (jul) tem batalha e o anterior (jun) está vazio → sem delta
    expect(report.trend.points.at(-2)?.battles).toBe(0);
    expect(report.trend.winRateDeltaPp).toBeNull();
  });
});

describe("buildBossReport — parâmetros e rótulos", () => {
  it("satura a meta em 0..1 e sanea a tolerância", () => {
    expect(buildBossReport([], { target: 5, now: NOW }).meta.target).toBe(1);
    expect(buildBossReport([], { target: -2, now: NOW }).meta.target).toBe(0);
    expect(buildBossReport([], { target: Number.NaN, now: NOW }).meta.target).toBe(0);
    expect(buildBossReport([], { tolerancePp: -9, now: NOW }).meta.tolerancePp).toBe(0);
  });

  it("rotula o recorte com o nome do departamento quando disponível", () => {
    const names = new Map([["dep-a", "Vendas"]]);
    expect(
      buildBossReport([], { departmentId: "dep-a", now: NOW }, names).meta.departmentLabel,
    ).toBe("Vendas");
    expect(buildBossReport([], { now: NOW }).meta.departmentLabel).toBe("Toda a empresa");
    expect(resolveDepartmentName(NO_DEPARTMENT, names)).toBe("Sem departamento");
    expect(resolveDepartmentName("dep-z", names)).toBe("Departamento");
    expect(resolveDepartmentName("dep-z", { "dep-z": "   " })).toBe("Departamento");
  });

  it("agrupa batalhas sem departamento sob a chave dedicada", () => {
    const report = buildBossReport(
      [at("2026-07-20T00:00:00.000Z", "n1", { department_id: null })],
      { days: 30, now: NOW },
    );
    expect(report.comparison.rows[0]?.departmentId).toBe(NO_DEPARTMENT);
  });

  it("metas usam janela ampla quando o recorte é o histórico completo", () => {
    const report = buildBossReport([at("2026-07-20T00:00:00.000Z", "x")], {
      days: 0,
      now: NOW,
    });
    const spanDays = Math.round(
      (Date.parse(report.goals.currentWindow.to) -
        Date.parse(report.goals.currentWindow.from)) / DAY,
    );
    expect(spanDays).toBe(3650);
  });

  it("percentual arredonda em 2 casas e neutraliza valores não finitos", () => {
    expect(pct(1 / 3)).toBe(33.33);
    expect(pct(Number.NaN)).toBe(0);
    expect(pct(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("buildBossReportCsv — casos-limite", () => {
  it("mantém todos os cabeçalhos de seção mesmo sem linhas", () => {
    const csv = buildBossReportCsv(buildBossReport([], { days: 30, now: NOW }));
    for (const s of [
      "PARAMETROS", "RESUMO", "TENDENCIA_MENSAL",
      "COMPARATIVO_DEPARTAMENTOS", "METAS_WIN_RATE", "BATALHAS",
    ]) {
      expect(csv).toContain(`"secao","${s}"`);
    }
    expect(csv).toContain('"janela_dias","30"');
  });

  it("exporta período aberto e batalha sem data com célula vazia", () => {
    const csv = buildBossReportCsv(
      buildBossReport(
        [battle({ id: "u", ends_at: null, defeated_at: null, settled_at: null })],
        { days: 0, now: NOW },
      ),
    );
    expect(csv).toContain('"periodo_de","inicio"');
    expect(csv).toContain('"janela_dias","todo o historico"');
    expect(csv).toContain('"batalhas_sem_data","1"');
    expect(csv).toMatch(/"u","Chefão sem título","settled","vitoria".*,""\r?\n?$/m);
  });

  it("nome de arquivo é saneado para janelas e rótulos hostis", () => {
    expect(bossReportFileName({ departmentLabel: "", days: 30 }, "csv", NOW)).toBe(
      "chefao-relatorio-geral-30d-2026-07-28.csv",
    );
    expect(
      bossReportFileName({ departmentLabel: "Operações & Logística", days: 0 }, "pdf", NOW),
    ).toBe("chefao-relatorio-operacoes-logistica-total-2026-07-28.pdf");
    expect(
      bossReportFileName({ departmentLabel: "A".repeat(80), days: 7 }, "csv", NOW).length,
    ).toBeLessThanOrEqual(70);
  });
});