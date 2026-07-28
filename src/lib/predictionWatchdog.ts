/**
 * Vigilância operacional do Mercado de Previsões.
 *
 * Por que existe: entre o travamento e a apuração as moedas dos participantes
 * ficam imobilizadas. Se o cron de travamento falhar (mercado vencido ainda
 * aberto) ou um administrador esquecer de apurar, o prejuízo é silencioso —
 * ninguém reclama de uma aposta que simplesmente nunca é resolvida.
 *
 * Este módulo é puro e espelha exatamente a função SQL
 * `check_prediction_markets_health()`. Ele decide *o que* alertar; o SQL apenas
 * persiste. Manter a decisão aqui permite simular milhares de estados sem tocar
 * no banco.
 *
 * Invariantes (validadas em src/test/predictionWatchdog.simulation.test.ts):
 *   W1. Cada mercado gera no máximo um alerta (nunca duplica o mesmo problema).
 *   W2. Mercado terminal (apurado/anulado) jamais gera alerta.
 *   W3. A chave de deduplicação é estável para o mesmo mercado + tipo + hora.
 *   W4. A severidade é monotônica no atraso: nunca diminui com mais tempo.
 *   W5. Sem moedas em risco, a severidade nunca chega a 'critical'.
 */

import type { PredictionAdminStatus } from "./predictionAdmin";

export type PredictionAlertType =
  | "prediction_lock_overdue"
  | "prediction_settlement_overdue";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export interface WatchedMarket {
  id: string;
  title: string;
  status: PredictionAdminStatus;
  /** ISO do horário em que os aportes deveriam parar. */
  locksAt: string;
  /** Moedas apostadas ainda não liquidadas. */
  totalPool: number;
}

export interface PredictionAlert {
  marketId: string;
  type: PredictionAlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  /** Idempotência: um alerta por mercado/tipo por hora. */
  dedupeKey: string;
  overdueMinutes: number;
  coinsAtRisk: number;
}

/** Tolerância antes de acusar falha do cron de travamento (o job roda a cada 5min). */
export const LOCK_GRACE_MS = 15 * 60 * 1000;
/** Tolerância antes de cobrar a apuração de um mercado travado. */
export const SETTLEMENT_GRACE_MS = 24 * 60 * 60 * 1000;

const HOUR_MS = 3_600_000;

function parseTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

/** Bucket horário em UTC — mesma expressão usada por `date_trunc('hour', now())`. */
export function hourBucket(now: number): string {
  return new Date(Math.floor(now / HOUR_MS) * HOUR_MS).toISOString();
}

/**
 * Severidade cresce com o atraso e com o dinheiro parado.
 * Sem moedas em risco o problema é operacional, nunca crítico (W5).
 */
export function severityFor(overdueMs: number, coinsAtRisk: number): AlertSeverity {
  const hours = overdueMs / HOUR_MS;
  if (coinsAtRisk <= 0) return hours >= 24 ? "medium" : "low";
  if (hours >= 72) return "critical";
  if (hours >= 24) return "high";
  if (hours >= 4) return "medium";
  return "low";
}

/** Avalia um único mercado. Retorna null quando está saudável. */
export function evaluateMarket(market: WatchedMarket, now: number): PredictionAlert | null {
  if (market.status === "settled" || market.status === "voided") return null; // W2
  if (market.status === "draft") return null;

  const locksAt = parseTime(market.locksAt);
  if (Number.isNaN(locksAt)) return null;

  const elapsed = now - locksAt;
  const coins = Math.max(0, market.totalPool);

  if (market.status === "open") {
    if (elapsed < LOCK_GRACE_MS) return null;
    const minutes = Math.floor(elapsed / 60_000);
    return {
      marketId: market.id,
      type: "prediction_lock_overdue",
      severity: severityFor(elapsed, coins),
      title: "Mercado de previsão vencido continua aberto",
      description:
        `“${market.title}” deveria ter travado há ${minutes} minuto(s) e ainda aceita aportes. ` +
        `A rotina automática de travamento pode estar falhando. ${coins} moeda(s) em risco.`,
      dedupeKey: `prediction_lock_overdue:${market.id}:${hourBucket(now)}`,
      overdueMinutes: minutes,
      coinsAtRisk: coins,
    };
  }

  // locked
  if (elapsed < SETTLEMENT_GRACE_MS) return null;
  const minutes = Math.floor(elapsed / 60_000);
  return {
    marketId: market.id,
    type: "prediction_settlement_overdue",
    severity: severityFor(elapsed, coins),
    title: "Mercado de previsão travado sem apuração",
    description:
      `“${market.title}” está travado há ${Math.floor(minutes / 60)} hora(s) sem resultado. ` +
      `${coins} moeda(s) seguem imobilizadas até a apuração.`,
    dedupeKey: `prediction_settlement_overdue:${market.id}:${hourBucket(now)}`,
    overdueMinutes: minutes,
    coinsAtRisk: coins,
  };
}

export interface WatchdogReport {
  alerts: PredictionAlert[];
  /** Soma das moedas imobilizadas em mercados problemáticos. */
  coinsAtRisk: number;
  worstSeverity: AlertSeverity | null;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

/** Avalia a carteira inteira, ordenando do problema mais grave para o menor. */
export function runWatchdog(markets: readonly WatchedMarket[], now: number): WatchdogReport {
  const alerts: PredictionAlert[] = [];
  for (const market of markets) {
    const alert = evaluateMarket(market, now);
    if (alert) alerts.push(alert);
  }

  alerts.sort(
    (a, b) =>
      SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
      b.overdueMinutes - a.overdueMinutes ||
      a.marketId.localeCompare(b.marketId),
  );

  return {
    alerts,
    coinsAtRisk: alerts.reduce((acc, a) => acc + a.coinsAtRisk, 0),
    worstSeverity: alerts.length > 0 ? alerts[0].severity : null,
  };
}