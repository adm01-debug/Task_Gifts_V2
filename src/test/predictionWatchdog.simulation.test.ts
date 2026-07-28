import { describe, expect, it } from "vitest";
import {
  LOCK_GRACE_MS,
  SETTLEMENT_GRACE_MS,
  evaluateMarket,
  hourBucket,
  runWatchdog,
  severityFor,
  type WatchedMarket,
} from "@/lib/predictionWatchdog";
import type { PredictionAdminStatus } from "@/lib/predictionAdmin";

function makeRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0xffffffff;
  };
}

const NOW = Date.UTC(2026, 5, 10, 14, 37, 12);
const MIN = 60_000;
const HOUR = 3_600_000;

function market(over: Partial<WatchedMarket> = {}): WatchedMarket {
  return {
    id: "m1",
    title: "Bateremos a meta?",
    status: "open",
    locksAt: new Date(NOW - HOUR).toISOString(),
    totalPool: 500,
    ...over,
  };
}

describe("predictionWatchdog — regras individuais", () => {
  it("ignora rascunhos e estados terminais", () => {
    for (const status of ["draft", "settled", "voided"] as PredictionAdminStatus[]) {
      expect(evaluateMarket(market({ status }), NOW)).toBeNull();
    }
  });

  it("respeita a carência antes de acusar falha do cron", () => {
    expect(evaluateMarket(market({ locksAt: new Date(NOW - LOCK_GRACE_MS + MIN).toISOString() }), NOW)).toBeNull();
    const alert = evaluateMarket(market({ locksAt: new Date(NOW - LOCK_GRACE_MS).toISOString() }), NOW);
    expect(alert?.type).toBe("prediction_lock_overdue");
    expect(alert?.overdueMinutes).toBe(15);
  });

  it("cobra a apuração só depois de 24h travado", () => {
    const locked = { status: "locked" as const };
    expect(
      evaluateMarket(market({ ...locked, locksAt: new Date(NOW - SETTLEMENT_GRACE_MS + MIN).toISOString() }), NOW),
    ).toBeNull();
    const alert = evaluateMarket(
      market({ ...locked, locksAt: new Date(NOW - SETTLEMENT_GRACE_MS).toISOString() }),
      NOW,
    );
    expect(alert?.type).toBe("prediction_settlement_overdue");
    expect(alert?.severity).toBe("high");
  });

  it("ignora datas corrompidas em vez de lançar", () => {
    expect(evaluateMarket(market({ locksAt: "não-é-data" }), NOW)).toBeNull();
  });

  it("deriva severidade do atraso e do dinheiro parado", () => {
    expect(severityFor(HOUR, 0)).toBe("low");
    expect(severityFor(48 * HOUR, 0)).toBe("medium");
    expect(severityFor(HOUR, 100)).toBe("low");
    expect(severityFor(5 * HOUR, 100)).toBe("medium");
    expect(severityFor(25 * HOUR, 100)).toBe("high");
    expect(severityFor(80 * HOUR, 100)).toBe("critical");
  });

  it("gera chave de deduplicação estável dentro da mesma hora", () => {
    const a = evaluateMarket(market(), NOW);
    const b = evaluateMarket(market(), NOW + 20 * MIN > NOW - (NOW % HOUR) + HOUR ? NOW : NOW + 60_000);
    expect(a?.dedupeKey).toBe(b?.dedupeKey);
    expect(hourBucket(NOW)).toBe("2026-06-10T14:00:00.000Z");
    const nextHour = evaluateMarket(market(), NOW + HOUR);
    expect(nextHour?.dedupeKey).not.toBe(a?.dedupeKey);
  });
});

describe("predictionWatchdog — simulação massiva (800 cenários)", () => {
  it("mantém unicidade, ordenação e monotonicidade de severidade", () => {
    const statuses: PredictionAdminStatus[] = ["draft", "open", "locked", "settled", "voided"];
    const order = { low: 0, medium: 1, high: 2, critical: 3 } as const;
    let scenarios = 0;

    for (let seed = 1; seed <= 800; seed += 1) {
      const rnd = makeRandom(seed);
      const count = 1 + Math.floor(rnd() * 25);
      const markets: WatchedMarket[] = [];

      for (let i = 0; i < count; i += 1) {
        markets.push({
          id: `mk-${seed}-${i}`,
          title: `Mercado ${i}`,
          status: statuses[Math.floor(rnd() * statuses.length)],
          locksAt:
            rnd() < 0.04
              ? "corrompido"
              : new Date(NOW - Math.floor(rnd() * 200) * HOUR + Math.floor(rnd() * 50) * HOUR).toISOString(),
          totalPool: rnd() < 0.2 ? 0 : Math.floor(rnd() * 8_000),
        });
      }

      const report = runWatchdog(markets, NOW);

      // W1: no máximo um alerta por mercado, e chaves globalmente únicas.
      const ids = report.alerts.map((a) => a.marketId);
      expect(new Set(ids).size).toBe(ids.length);
      expect(new Set(report.alerts.map((a) => a.dedupeKey)).size).toBe(report.alerts.length);

      for (const alert of report.alerts) {
        const source = markets.find((m) => m.id === alert.marketId) as WatchedMarket;
        // W2
        expect(["open", "locked"]).toContain(source.status);
        // Tipo coerente com o estado.
        expect(alert.type).toBe(
          source.status === "open" ? "prediction_lock_overdue" : "prediction_settlement_overdue",
        );
        // W5
        if (alert.coinsAtRisk === 0) expect(alert.severity).not.toBe("critical");
        expect(alert.overdueMinutes).toBeGreaterThan(0);
        expect(alert.description.length).toBeGreaterThan(20);
        expect(alert.dedupeKey.startsWith(alert.type)).toBe(true);
      }

      // Ordenação decrescente por severidade.
      for (let i = 1; i < report.alerts.length; i += 1) {
        expect(order[report.alerts[i - 1].severity]).toBeGreaterThanOrEqual(
          order[report.alerts[i].severity],
        );
      }

      // Soma de moedas em risco bate com os alertas emitidos.
      expect(report.coinsAtRisk).toBe(
        report.alerts.reduce((acc, a) => acc + a.coinsAtRisk, 0),
      );
      expect(report.worstSeverity).toBe(report.alerts[0]?.severity ?? null);

      // W4: mais tempo nunca reduz a severidade nem apaga um alerta existente.
      const later = runWatchdog(markets, NOW + 12 * HOUR);
      for (const alert of report.alerts) {
        const future = later.alerts.find((a) => a.marketId === alert.marketId);
        expect(future).toBeDefined();
        expect(order[(future as (typeof later.alerts)[number]).severity]).toBeGreaterThanOrEqual(
          order[alert.severity],
        );
      }

      scenarios += 1;
    }

    expect(scenarios).toBe(800);
  });
});