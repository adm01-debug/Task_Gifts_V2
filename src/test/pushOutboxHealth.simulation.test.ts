import { describe, it, expect } from "vitest";
import {
  evaluateOutboxHealth,
  OUTBOX_THRESHOLDS,
  type OutboxHealthSnapshot,
} from "@/lib/pushOutboxHealth";

/** PRNG determinístico (mulberry32) para reprodutibilidade das simulações. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomSnapshot(r: () => number): OutboxHealthSnapshot {
  const processing = Math.floor(r() * 60);
  return {
    pending: Math.floor(r() * 800),
    processing,
    stuck: Math.floor(r() * (processing + 5)),
    sent: Math.floor(r() * 2000),
    failed: Math.floor(r() * 300),
    skipped: Math.floor(r() * 200),
    oldestPendingMinutes: Math.floor(r() * 90),
    minutesSinceLastDispatch: r() < 0.1 ? null : Math.floor(r() * 60),
  };
}

const healthy: OutboxHealthSnapshot = {
  pending: 0,
  processing: 0,
  stuck: 0,
  sent: 500,
  failed: 0,
  skipped: 10,
  oldestPendingMinutes: 0,
  minutesSinceLastDispatch: 1,
};

describe("pushOutboxHealth — invariantes", () => {
  it("fila saudável recebe score 100 e severidade ok", () => {
    const report = evaluateOutboxHealth(healthy);
    expect(report.score).toBe(100);
    expect(report.severity).toBe("ok");
    expect(report.alerts).toHaveLength(0);
  });

  it("fila vazia sem histórico não acusa despachante parado", () => {
    const report = evaluateOutboxHealth({ ...healthy, sent: 0, skipped: 0, minutesSinceLastDispatch: null });
    expect(report.alerts.map((a) => a.code)).not.toContain("stale_dispatcher");
  });

  it("backlog crítico rebaixa severidade e score", () => {
    const report = evaluateOutboxHealth({ ...healthy, pending: OUTBOX_THRESHOLDS.backlogCritical, minutesSinceLastDispatch: 1 });
    expect(report.severity).toBe("critical");
    expect(report.score).toBeLessThanOrEqual(60);
  });

  it("despachante parado com fila acumulada é crítico", () => {
    const report = evaluateOutboxHealth({ ...healthy, pending: 5, minutesSinceLastDispatch: null });
    expect(report.alerts.some((a) => a.code === "stale_dispatcher" && a.severity === "critical")).toBe(true);
  });

  it("entradas negativas ou NaN são normalizadas sem quebrar", () => {
    const report = evaluateOutboxHealth({
      pending: -10,
      processing: Number.NaN,
      stuck: -3,
      sent: Number.POSITIVE_INFINITY,
      failed: -1,
      skipped: 0,
      oldestPendingMinutes: -99,
      minutesSinceLastDispatch: Number.NaN,
    });
    expect(report.score).toBe(100);
    expect(report.failureRate).toBe(0);
  });

  it("stuck nunca excede processing", () => {
    const a = evaluateOutboxHealth({ ...healthy, processing: 2, stuck: 999, minutesSinceLastDispatch: 1 });
    const b = evaluateOutboxHealth({ ...healthy, processing: 2, stuck: 2, minutesSinceLastDispatch: 1 });
    expect(a.score).toBe(b.score);
  });
});

describe("pushOutboxHealth — 600 cenários aleatórios", () => {
  it("mantém score em [0,100], taxas em [0,1] e coerência de severidade", () => {
    const r = rng(20260728);
    for (let i = 0; i < 600; i++) {
      const snap = randomSnapshot(r);
      const report = evaluateOutboxHealth(snap);

      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(report.score)).toBe(true);
      expect(report.failureRate).toBeGreaterThanOrEqual(0);
      expect(report.failureRate).toBeLessThanOrEqual(1);
      expect(report.deliveryRate).toBeGreaterThanOrEqual(0);
      expect(report.deliveryRate).toBeLessThanOrEqual(1);

      const hasCritical = report.alerts.some((a) => a.severity === "critical");
      expect(report.severity).toBe(hasCritical ? "critical" : report.alerts.length > 0 ? "warning" : "ok");
      if (hasCritical) expect(report.score).toBeLessThanOrEqual(60);
      if (report.severity === "ok") expect(report.score).toBe(100);

      // Códigos de alerta nunca se repetem.
      const codes = report.alerts.map((a) => a.code);
      expect(new Set(codes).size).toBe(codes.length);
    }
  });

  it("é monotônico: mais pendências nunca aumentam o score", () => {
    const r = rng(4242);
    for (let i = 0; i < 200; i++) {
      const base = randomSnapshot(r);
      const worse = { ...base, pending: base.pending + 250 };
      expect(evaluateOutboxHealth(worse).score).toBeLessThanOrEqual(evaluateOutboxHealth(base).score);
    }
  });

  it("é determinístico para o mesmo snapshot", () => {
    const r = rng(7);
    for (let i = 0; i < 100; i++) {
      const snap = randomSnapshot(r);
      expect(evaluateOutboxHealth(snap)).toEqual(evaluateOutboxHealth(snap));
    }
  });
});
