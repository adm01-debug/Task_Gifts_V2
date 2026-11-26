/**
 * Motor determinístico da fila de push (`push_outbox`).
 *
 * Espelha, em TypeScript puro, a máquina de estados executada por
 * `claim_push_outbox` + a Edge Function `push-outbox-dispatcher`.
 * Serve para simulação: qualquer divergência entre este motor e o runtime
 * é um bug de entrega (duplicidade, perda ou loop infinito de retry).
 */

export type OutboxStatus =
  | "pending"
  | "processing"
  | "deferred"
  | "sent"
  | "failed"
  | "skipped";

/** Resultado agregado do envio para todos os dispositivos de um usuário. */
export type DispatchResult =
  | { kind: "no_subscription" }
  | { kind: "delivered" }
  | { kind: "transient_error"; error: string }
  | { kind: "permanent_error"; error: string };

export interface OutboxItem {
  id: string;
  status: OutboxStatus;
  attempts: number;
  lastError: string | null;
  /** Fim da janela de silencio; preenchido apenas com status `deferred`. */
  deferredUntil?: string | null;
}

/** Tentativas máximas antes de considerar a linha definitivamente falha. */
export const MAX_PUSH_ATTEMPTS = 3;

/** Estados terminais: nunca voltam para a fila. */
export function isTerminal(status: OutboxStatus): boolean {
  return status === "sent" || status === "failed" || status === "skipped";
}

/**
 * Aplica uma rodada do despachante sobre um item já reivindicado.
 * Invariantes garantidas:
 * - `attempts` é estritamente crescente e limitado por MAX_PUSH_ATTEMPTS;
 * - item terminal nunca é reprocessado;
 * - erro permanente encerra imediatamente (não consome retries à toa).
 */
export function applyDispatch(item: OutboxItem, result: DispatchResult): OutboxItem {
  if (isTerminal(item.status)) return item;

  const attempts = item.attempts + 1;

  switch (result.kind) {
    case "delivered":
      return { ...item, status: "sent", attempts, lastError: null };
    case "no_subscription":
      return { ...item, status: "skipped", attempts, lastError: "no_active_subscription" };
    case "permanent_error":
      return { ...item, status: "failed", attempts, lastError: result.error };
    case "transient_error":
      return attempts >= MAX_PUSH_ATTEMPTS
        ? { ...item, status: "failed", attempts, lastError: result.error }
        : { ...item, status: "pending", attempts, lastError: result.error };
  }
}

/**
 * Reivindicação em lote: apenas itens pendentes entram, respeitando o teto.
 * Itens presos em `processing` além do timeout são reciclados antes.
 */
/**
 * Janela de silencio do usuario, como lida de `notification_preferences`
 * (`do_not_disturb_*`, com `quiet_hours_*` de legado resolvido antes).
 * Horarios no formato `HH:MM` ou `HH:MM:SS`.
 */
export interface QuietHoursPreference {
  enabled: boolean;
  start: string | null;
  end: string | null;
  /** `false` = nao silenciar sabado/domingo. */
  weekends: boolean;
}

/** America/Sao_Paulo e' UTC-3 fixo (o Brasil nao tem horario de verao desde 2019). */
const SAO_PAULO_OFFSET_MS = -3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function minutesOfDay(value: string | null): number | null {
  if (!value) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

/**
 * Fim da janela de silencio se `now` cai dentro dela; `null` se pode enviar.
 * Espelha `public.push_quiet_hours_until(_user_id)`:
 * - `start < end` = janela no mesmo dia; `start > end` cruza a meia-noite;
 * - `start === end` ou horario ausente = janela desligada;
 * - `weekends = false` nao silencia sabado nem domingo (na madrugada vale o dia
 *   em que a janela comecou: a noite de sexta ainda e' sexta).
 */
export function quietHoursUntil(now: Date, pref: QuietHoursPreference): Date | null {
  if (!pref.enabled) return null;
  const start = minutesOfDay(pref.start);
  const end = minutesOfDay(pref.end);
  if (start === null || end === null || start === end) return null;

  const local = new Date(now.getTime() + SAO_PAULO_OFFSET_MS);
  const minutes = local.getUTCHours() * 60 + local.getUTCMinutes();
  // A madrugada pertence ao dia em que a janela comecou (a noite de sexta
  // continua sendo sexta). Espelha o SQL.
  const dayStart = start > end && minutes < end ? new Date(local.getTime() - DAY_MS) : local;
  const weekday = dayStart.getUTCDay();
  if (!pref.weekends && (weekday === 0 || weekday === 6)) return null;

  let endDay = local;
  if (start < end) {
    if (minutes < start || minutes >= end) return null;
  } else if (minutes >= start) {
    endDay = new Date(local.getTime() + DAY_MS);
  } else if (minutes >= end) {
    return null;
  }

  const endUtc = Date.UTC(
    endDay.getUTCFullYear(),
    endDay.getUTCMonth(),
    endDay.getUTCDate(),
    Math.floor(end / 60),
    end % 60,
    0,
    0,
  );
  return new Date(endUtc - SAO_PAULO_OFFSET_MS);
}

/**
 * Adia o item ate' o fim da janela: nao consome tentativa, porque esperar nao e'
 * falha de entrega (o banco mantem `attempts` intacto).
 */
export function deferForQuietHours(item: OutboxItem, until: Date): OutboxItem {
  return {
    ...item,
    status: "deferred",
    deferredUntil: until.toISOString(),
    lastError: "deferred_by_quiet_hours",
  };
}

/**
 * Devolve para a fila quem ja' venceu a janela. `deferred_until` nulo tambem
 * volta: linha adiada sem prazo ficaria presa para sempre.
 */
export function releaseDeferred(items: OutboxItem[], now: Date): OutboxItem[] {
  const limit = now.getTime();
  return items.map((i) => {
    if (i.status !== "deferred") return i;
    const until = i.deferredUntil ? Date.parse(i.deferredUntil) : Number.NaN;
    if (!Number.isNaN(until) && until > limit) return i;
    return { ...i, status: "pending" as const, deferredUntil: null };
  });
}

export function claimBatch(
  items: OutboxItem[],
  limit: number,
  stuckIds: ReadonlySet<string> = new Set(),
  now: Date = new Date(0),
): { claimed: OutboxItem[]; next: OutboxItem[] } {
  const recycled = releaseDeferred(items, now).map((i) =>
    i.status === "processing" && stuckIds.has(i.id) ? { ...i, status: "pending" as const } : i,
  );

  const cap = Math.max(1, Math.min(limit, 500));
  const claimedIds = new Set(
    recycled.filter((i) => i.status === "pending").slice(0, cap).map((i) => i.id),
  );

  const next = recycled.map((i) =>
    claimedIds.has(i.id) ? { ...i, status: "processing" as const } : i,
  );

  return { claimed: next.filter((i) => claimedIds.has(i.id)), next };
}
