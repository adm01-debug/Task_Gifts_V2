import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createEngagementReport,
  createTeamPerformanceReport,
  exportReport,
  type ReportData,
} from "@/lib/exportReports";

const makeReport = (): ReportData => ({
  title: "Relatório de Teste",
  subtitle: "Subtítulo do relatório",
  generatedAt: new Date("2026-01-02T10:30:00Z"),
  generatedBy: "gestor@empresa.com",
  sections: [],
});

describe("exportReports", () => {
  let capturedBlob: Blob | null;
  let downloadedFilename: string;

  const readBlob = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });

  beforeEach(() => {
    capturedBlob = null;
    downloadedFilename = "";
    (URL as unknown as { createObjectURL: (blob: Blob) => string }).createObjectURL = (blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    };
    (URL as unknown as { revokeObjectURL: (url: string) => void }).revokeObjectURL = () => {};
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadedFilename = this.download;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const exportCsv = async (report: ReportData, filename = "relatorio-teste") => {
    exportReport(report, { format: "csv", filename, includeTimestamp: false });
    expect(capturedBlob).not.toBeNull();
    return readBlob(capturedBlob as Blob);
  };

  it("gera CSV com cabeçalho, título das seções e colunas declaradas", async () => {
    const report = makeReport();
    report.sections = [
      {
        title: "Membros",
        type: "table",
        columns: [
          { key: "nome", label: "Nome" },
          { key: "xp", label: "XP" },
        ],
        data: [
          { nome: "Silva, Ana", xp: 12 },
          { nome: 'Diz "oi"', xp: 30 },
        ],
      },
    ];

    const csv = await exportCsv(report);

    expect(csv).toContain("# Relatório de Teste");
    expect(csv).toContain("# Subtítulo do relatório");
    expect(csv).toContain("# Por: gestor@empresa.com");
    expect(csv).toContain("## Membros");
    expect(csv).toContain("Nome,XP");
    expect(csv).toContain('"Silva, Ana",12');
    expect(csv).toContain('"Diz ""oi""",30');
    expect(downloadedFilename).toBe("relatorio-teste.csv");
  });

  it("formata percentual e marca valores ausentes com -", async () => {
    const report = makeReport();
    report.sections = [
      {
        title: "Resumo",
        type: "summary",
        columns: [
          { key: "metrica", label: "Métrica" },
          { key: "valor", label: "Valor", format: "percent" },
        ],
        data: [{ metrica: "Conclusão", valor: 42.5 }],
      },
      {
        title: "Vazios",
        type: "table",
        columns: [
          { key: "nome", label: "Nome" },
          { key: "xp", label: "XP" },
        ],
        data: [{ nome: "Ana" }],
      },
    ];

    const csv = await exportCsv(report);

    expect(csv).toContain("Conclusão,42.5%");
    expect(csv).toContain("Ana,-");
  });

  it("infere colunas da primeira linha quando não declaradas", async () => {
    const report = makeReport();
    report.sections = [{ title: "Sem colunas", type: "table", data: [{ a: "1", b: "2" }] }];

    const csv = await exportCsv(report);

    expect(csv).toContain("## Sem colunas");
    expect(csv).toContain("a,b");
    expect(csv).toContain("1,2");
  });

  it("não quebra quando o relatório não tem seções", async () => {
    const csv = await exportCsv(makeReport());

    expect(csv).toContain("# Relatório de Teste");
    expect(csv).not.toContain("##");
  });

  it("createTeamPerformanceReport monta resumo e performance individual", async () => {
    const report = createTeamPerformanceReport("Time Alpha", "gestor@empresa.com", [
      { name: "Ana", level: 5, xp: 1200, questsCompleted: 10, streak: 3, coins: 250 },
      { name: "Bruno", level: 3, xp: 800, questsCompleted: 4, streak: 1, coins: 90 },
    ]);

    expect(report.title).toBe("Relatório de Performance - Time Alpha");
    expect(report.sections).toHaveLength(2);
    expect(report.sections[0].data).toEqual(
      expect.arrayContaining([
        { metric: "Total de Membros", value: 2 },
        { metric: "XP Total da Equipe", value: 2000 },
        { metric: "Quests Completadas", value: 14 },
      ]),
    );

    const csv = await exportCsv(report);
    expect(csv).toContain("## Performance Individual");
    expect(csv).toContain("Ana");
    expect(csv).toContain("Bruno");
    expect(csv).toContain("Moedas");
  });

  it("createEngagementReport monta as três seções esperadas", () => {
    const report = createEngagementReport("gestor@empresa.com", {
      dailyActiveUsers: 10,
      weeklyActiveUsers: 40,
      monthlyActiveUsers: 120,
      avgSessionDuration: 18,
      topAchievements: [{ name: "Primeira Quest", unlocks: 7 }],
      topTrails: [{ name: "Trilha de Vendas", completions: 5 }],
    });

    expect(report.title).toBe("Relatório de Engajamento");
    expect(report.sections.map((s) => s.title)).toEqual([
      "Métricas de Usuários Ativos",
      "Conquistas Mais Desbloqueadas",
      "Trilhas Mais Completadas",
    ]);
    expect(report.sections[0].data).toEqual(
      expect.arrayContaining([{ metric: "Tempo Médio de Sessão", value: "18 min" }]),
    );
  });
});