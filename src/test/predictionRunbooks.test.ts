import { describe, expect, it } from "vitest";

import { alertTypeToRunbookSlug, getRunbook, RUNBOOKS } from "@/lib/runbooks";
import { runWatchdog, type WatchedMarket } from "@/lib/predictionWatchdog";

const NOW = Date.UTC(2026, 6, 28, 12, 0, 0);
const HOUR = 3_600_000;

/**
 * Um alerta sem runbook é um beco sem saída para quem está de plantão: o link
 * existe na interface mas leva a uma página vazia. Este teste amarra os dois
 * lados — qualquer novo tipo de alerta do vigia quebra aqui até ter runbook.
 */
describe("cobertura de runbooks para os alertas de previsão", () => {
  const markets: WatchedMarket[] = [
    { id: "m-open", title: "Aberto vencido", status: "open", locksAt: NOW - 6 * HOUR, totalPool: 4200 },
    { id: "m-locked", title: "Travado sem apuração", status: "locked", locksAt: NOW - 96 * HOUR, totalPool: 9100 },
  ];

  const report = runWatchdog(markets, NOW);

  it("gera exatamente um alerta de cada tipo no cenário base", () => {
    expect(report.alerts.map((a) => a.type).sort()).toEqual([
      "prediction_lock_overdue",
      "prediction_settlement_overdue",
    ]);
  });

  it("todo alerta emitido resolve para um runbook existente", () => {
    for (const alert of report.alerts) {
      const slug = alertTypeToRunbookSlug(alert.type);
      const runbook = getRunbook(slug);
      expect(runbook, `runbook ausente para ${alert.type}`).toBeDefined();
      expect(runbook?.slug).toBe(slug);
    }
  });

  it("os runbooks de previsão têm as quatro fases preenchidas", () => {
    for (const slug of ["prediction-lock-overdue", "prediction-settlement-overdue"]) {
      const rb = RUNBOOKS[slug];
      expect(rb.diagnose.length).toBeGreaterThan(0);
      expect(rb.mitigate.length).toBeGreaterThan(0);
      expect(rb.recover.length).toBeGreaterThan(0);
      expect(rb.postmortem.length).toBeGreaterThan(0);
      expect(rb.owner).not.toBe("");
    }
  });

  it("converte underscore em hífen sem alterar o resto do identificador", () => {
    expect(alertTypeToRunbookSlug("prediction_lock_overdue")).toBe("prediction-lock-overdue");
    expect(alertTypeToRunbookSlug("burn_rate_fast")).toBe("burn-rate-fast");
    expect(alertTypeToRunbookSlug("ip_blocked")).toBe("ip-blocked");
  });
});