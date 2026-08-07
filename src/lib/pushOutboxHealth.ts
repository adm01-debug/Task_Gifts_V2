/**
 * Motor de diagnóstico de saúde da fila de push (`push_outbox`).
 *
 * Traduz o snapshot bruto retornado por `get_push_outbox_health` em um
 * score 0..100 + alertas acionáveis. Determinístico e puro para permitir
 * simulação massiva de cenários (ver src/test/pushOutboxHealth.simulation.test.ts).
 */

export interface OutboxHealthSnapshot {
  /** Itens aguardando despacho. */
  pending: number;
  /** Itens reivindicados e ainda não finalizados. */
  processing: number;
  /** Itens presos em `processing` além do timeout do despachante. */
  stuck: number;
  /** Entregues na janela analisada. */
  sent: number;
  /** Falhas definitivas na janela analisada. */
  failed: number;
  /** Ignorados (usuário sem assinatura ativa ou preferência desligada). */
  skipped: number;
  /** Idade, em minutos, do item pendente mais antigo (0 se a fila está vazia). */
  oldestPendingMinutes: number;
  /** Minutos desde o último despacho concluído (null se nunca houve). */
  minutesSinceLastDispatch: number | null;
}

export type HealthSeverity = "ok" | "warning" | "critical";

export interface HealthAlert {
  code:
    | "backlog"
    | "stuck_items"
    | "failure_rate"
    | "stale_dispatcher"
    | "aging_queue";
  severity: Exclude<HealthSeverity, "ok">;
  message: string;
}

export interface OutboxHealthReport {
  score: number;
  severity: HealthSeverity;
  alerts: HealthAlert[];
  /** Percentual de falhas sobre o total terminal (0..1). */
  failureRate: number;
  /** Percentual de entregas sobre o total terminal (0..1). */
  deliveryRate: number;
  totalTerminal: number;
}

/** Limiares operacionais — alinhados aos SLAs de notificação. */
export const OUTBOX_THRESHOLDS = {
  backlogWarning: 100,
  backlogCritical: 500,
  agingWarningMinutes: 10,
  agingCriticalMinutes: 30,
  failureRateWarning: 0.1,
  failureRateCritical: 0.25,
  staleDispatcherWarningMinutes: 5,
  staleDispatcherCriticalMinutes: 15,
} as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitize(value: number): number {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

/**
 * Avalia o snapshot e retorna score + alertas.
 * Invariantes: score sempre em [0,100]; severidade "critical" implica score <= 60;
 * fila totalmente saudável (sem backlog, sem falhas, despachante recente) => score 100.
 */
export function evaluateOutboxHealth(raw: OutboxHealthSnapshot): OutboxHealthReport {
  const pending = sanitize(raw.pending);
  const processing = sanitize(raw.processing);
  const stuck = clamp(sanitize(raw.stuck), 0, processing);
  const sent = sanitize(raw.sent);
  const failed = sanitize(raw.failed);
  const skipped = sanitize(raw.skipped);
  const oldestPendingMinutes = pending > 0 ? sanitize(raw.oldestPendingMinutes) : 0;
  const minutesSinceLastDispatch =
    raw.minutesSinceLastDispatch === null || !Number.isFinite(raw.minutesSinceLastDispatch)
      ? null
      : Math.max(0, Math.floor(raw.minutesSinceLastDispatch));

  const totalTerminal = sent + failed + skipped;
  const failureRate = totalTerminal === 0 ? 0 : failed / totalTerminal;
  const deliveryRate = totalTerminal === 0 ? 1 : sent / totalTerminal;

  const alerts: HealthAlert[] = [];
  let penalty = 0;

  if (pending >= OUTBOX_THRESHOLDS.backlogCritical) {
    alerts.push({ code: "backlog", severity: "critical", message: `Backlog crítico: ${pending} notificações pendentes.` });
    penalty += 40;
  } else if (pending >= OUTBOX_THRESHOLDS.backlogWarning) {
    alerts.push({ code: "backlog", severity: "warning", message: `Backlog elevado: ${pending} notificações pendentes.` });
    penalty += 15;
  }

  if (oldestPendingMinutes >= OUTBOX_THRESHOLDS.agingCriticalMinutes) {
    alerts.push({ code: "aging_queue", severity: "critical", message: `Item mais antigo aguardando há ${oldestPendingMinutes} min.` });
    penalty += 30;
  } else if (oldestPendingMinutes >= OUTBOX_THRESHOLDS.agingWarningMinutes) {
    alerts.push({ code: "aging_queue", severity: "warning", message: `Item mais antigo aguardando há ${oldestPendingMinutes} min.` });
    penalty += 10;
  }

  if (stuck > 0) {
    const severity: "warning" | "critical" = stuck >= 25 ? "critical" : "warning";
    alerts.push({ code: "stuck_items", severity, message: `${stuck} item(ns) preso(s) em processamento.` });
    penalty += severity === "critical" ? 30 : 12;
  }

  if (totalTerminal > 0) {
    if (failureRate >= OUTBOX_THRESHOLDS.failureRateCritical) {
      alerts.push({ code: "failure_rate", severity: "critical", message: `Taxa de falha em ${(failureRate * 100).toFixed(1)}%.` });
      penalty += 35;
    } else if (failureRate >= OUTBOX_THRESHOLDS.failureRateWarning) {
      alerts.push({ code: "failure_rate", severity: "warning", message: `Taxa de falha em ${(failureRate * 100).toFixed(1)}%.` });
      penalty += 12;
    }
  }

  // Despachante parado só é problema quando existe trabalho na fila.
  if (pending + processing > 0) {
    const idle = minutesSinceLastDispatch;
    if (idle === null || idle >= OUTBOX_THRESHOLDS.staleDispatcherCriticalMinutes) {
      alerts.push({ code: "stale_dispatcher", severity: "critical", message: "Despachante sem execuções recentes com fila acumulada." });
      penalty += 35;
    } else if (idle >= OUTBOX_THRESHOLDS.staleDispatcherWarningMinutes) {
      alerts.push({ code: "stale_dispatcher", severity: "warning", message: `Último despacho há ${idle} min.` });
      penalty += 12;
    }
  }

  const hasCritical = alerts.some((a) => a.severity === "critical");
  let score = clamp(100 - penalty, 0, 100);
  if (hasCritical) score = Math.min(score, 60);

  const severity: HealthSeverity = hasCritical ? "critical" : alerts.length > 0 ? "warning" : "ok";

  return { score, severity, alerts, failureRate, deliveryRate, totalTerminal };
}
