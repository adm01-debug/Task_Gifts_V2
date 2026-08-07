import { describe, it, expect } from "vitest";
import {
  anomalyCodeLabel,
  buildReviewIndex,
  buildWagerIntegrityCsv,
  reviewStatusLabel,
  wagerIntegrityFileName,
} from "@/lib/wagerIntegrityExport";
import type { WagerIntegrityReport } from "@/lib/wagerIntegrity";
import type { WagerIntegrityReview } from "@/services/wagerIntegrityReviewService";

const AT = new Date("2026-03-05T13:07:00");

function report(overrides: Partial<WagerIntegrityReport> = {}): WagerIntegrityReport {
  return {
    anomalies: [],
    evaluated: 12,
    skipped: 3,
    netDistributed: -420,
    healthScore: 91,
    ...overrides,
  };
}

const anomaly = {
  code: "accuracy_outlier" as const,
  severity: "critical" as const,
  userId: "u1",
  displayName: "Ana",
  title: "Acurácia muito acima do acaso",
  detail: "94% em 18 apostas (z=3.8)",
  metric: 3.8,
};

describe("wagerIntegrityExport", () => {
  it("inclui metadados do relatório no cabeçalho", () => {
    const csv = buildWagerIntegrityCsv({ report: report(), windowDays: 30, generatedAt: AT });
    expect(csv).toContain('"Gerado em";"05/03/2026 13:07"');
    expect(csv).toContain('"Janela (dias)";"30"');
    expect(csv).toContain('"Índice de saúde";"91"');
    expect(csv).toContain('"Moedas líquidas distribuídas";"-420"');
  });

  it("exporta anomalia sem apuração como Pendente", () => {
    const csv = buildWagerIntegrityCsv({
      report: report({ anomalies: [anomaly] }),
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('"Ana";"u1";"Crítico";"Acurácia improvável"');
    expect(csv).toContain('"Pendente"');
  });

  it("casa a apuração pela chave usuário+código+janela", () => {
    const review: WagerIntegrityReview = {
      id: "r1",
      targetUserId: "u1",
      anomalyCode: "accuracy_outlier",
      windowDays: 30,
      status: "confirmed",
      notes: "Conluio comprovado",
      metric: 3.8,
      updatedAt: "2026-03-04T10:00:00",
    };
    const csv = buildWagerIntegrityCsv({
      report: report({ anomalies: [anomaly] }),
      reviews: [review],
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('"Confirmada";"Conluio comprovado";"04/03/2026 10:00"');
  });

  it("não casa apuração de outra janela", () => {
    const review: WagerIntegrityReview = {
      id: "r1",
      targetUserId: "u1",
      anomalyCode: "accuracy_outlier",
      windowDays: 7,
      status: "confirmed",
      notes: null,
      metric: 1,
      updatedAt: null,
    };
    const csv = buildWagerIntegrityCsv({
      report: report({ anomalies: [anomaly] }),
      reviews: [review],
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('"Pendente"');
    expect(csv).not.toContain('"Confirmada"');
  });

  it("neutraliza CSV injection no nome do jogador", () => {
    const csv = buildWagerIntegrityCsv({
      report: report({ anomalies: [{ ...anomaly, displayName: "=CMD()" }] }),
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain(`"'=CMD()"`);
  });

  it("escapa aspas duplicando-as", () => {
    const csv = buildWagerIntegrityCsv({
      report: report({ anomalies: [{ ...anomaly, detail: 'disse "ok"' }] }),
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('"disse ""ok"""');
  });

  it("tolera métrica não finita", () => {
    const csv = buildWagerIntegrityCsv({
      report: report({ anomalies: [{ ...anomaly, metric: Number.NaN }] }),
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('""');
  });

  it("ignora apurações malformadas no índice", () => {
    const index = buildReviewIndex([
      { targetUserId: "", anomalyCode: "net_drain", windowDays: 30 } as WagerIntegrityReview,
      undefined as unknown as WagerIntegrityReview,
    ]);
    expect(index.size).toBe(0);
  });

  it("rotula códigos conhecidos e desconhecidos", () => {
    expect(anomalyCodeLabel("net_drain")).toBe("Drenagem de saldo");
    expect(anomalyCodeLabel("outro")).toBe("outro");
    expect(reviewStatusLabel(undefined)).toBe("Pendente");
    expect(reviewStatusLabel("false_positive")).toBe("Falso positivo");
  });

  it("gera nome de arquivo ordenável", () => {
    expect(wagerIntegrityFileName(90, new Date("2026-03-05T13:00:00Z"))).toBe(
      "integridade-wager-90d-2026-03-05.csv",
    );
  });

  it("usa CRLF entre linhas para compatibilidade com Excel", () => {
    const csv = buildWagerIntegrityCsv({ report: report(), windowDays: 7, generatedAt: AT });
    expect(csv.includes("\r\n")).toBe(true);
  });
});

describe("wagerIntegrityExport — histórico", () => {
  const event = {
    id: "e1",
    targetUserId: "u1",
    anomalyCode: "net_drain" as const,
    windowDays: 30 as const,
    previousStatus: "investigating" as const,
    newStatus: "confirmed" as const,
    notes: "=SOMA(1)",
    changedBy: "admin-id",
    changedByName: "Bruno",
    createdAt: "2026-03-04T09:30:00",
  };

  it("exporta bloco de histórico com autor e transição", () => {
    const csv = buildWagerIntegrityCsv({
      report: report(),
      events: [event],
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('"Histórico de apurações";"1"');
    expect(csv).toContain('"Em apuração";"Confirmada"');
    expect(csv).toContain('"Bruno";"04/03/2026 09:30"');
    expect(csv).toContain(`"'=SOMA(1)"`);
  });

  it("omite o bloco quando não há eventos", () => {
    const csv = buildWagerIntegrityCsv({ report: report(), events: [], windowDays: 30, generatedAt: AT });
    expect(csv).not.toContain("Histórico de apurações");
  });

  it("marca criação sem status anterior com travessão", () => {
    const csv = buildWagerIntegrityCsv({
      report: report(),
      events: [{ ...event, previousStatus: null, notes: null, changedByName: null }],
      windowDays: 30,
      generatedAt: AT,
    });
    expect(csv).toContain('"—";"Confirmada"');
    expect(csv).toContain('"admin-id"');
  });
});
