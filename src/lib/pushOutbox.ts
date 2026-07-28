/**
 * Motor determinístico da fila de push (`push_outbox`).
 *
 * Espelha, em TypeScript puro, a máquina de estados executada por
 * `claim_push_outbox` + a Edge Function `push-outbox-dispatcher`.
 * Serve para simulação: qualquer divergência entre este motor e o runtime
 * é um bug de entrega (duplicidade, perda ou loop infinito de retry).
 */

export type OutboxStatus = "pending" | "processing" | "sent" | "failed" | "skipped";

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
export function claimBatch(
  items: OutboxItem[],
  limit: number,
  stuckIds: ReadonlySet<string> = new Set(),
): { claimed: OutboxItem[]; next: OutboxItem[] } {
  const recycled = items.map((i) =>
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
