/**
 * Request ID propagation helper (Fase 23).
 *
 * Gera um requestId único por chamada e envia como `x-request-id` para
 * Edge Functions, permitindo correlação end-to-end com breadcrumbs do Sentry
 * (ver `supabase/functions/_shared/sentry.ts` → `withSentry`).
 *
 * Uso preferido:
 *   const { data, error } = await invokeEdge('ai-coach', { body });
 */
import { supabase } from "@/integrations/supabase/client";
import { describeEdgeError, type EdgeErrorInfo } from "@/lib/edgeErrors";

export function newRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type InvokeOptions = Parameters<typeof supabase.functions.invoke>[1] & {
  requestId?: string;
};

export async function invokeEdge<T = unknown>(
  fnName: string,
  options: InvokeOptions = {},
) {
  const requestId = options.requestId ?? newRequestId();
  const headers = {
    "x-request-id": requestId,
    ...(options.headers ?? {}),
  };
  const result = await supabase.functions.invoke<T>(fnName, {
    ...options,
    headers,
  });
  return { ...result, requestId };
}
/**
 * Backoff exponencial com jitter determinístico por tentativa.
 * Exportado puro para permitir simulação exaustiva em testes.
 */
export function backoffDelayMs(attempt: number, baseMs = 300, capMs = 8000): number {
  const safeAttempt = Number.isFinite(attempt) && attempt > 0 ? Math.floor(attempt) : 1;
  const exponential = Math.min(baseMs * 2 ** (safeAttempt - 1), capMs);
  // Jitter de até 25% evita "thundering herd" quando vários clientes falham juntos.
  const jitter = exponential * 0.25 * Math.random();
  return Math.round(Math.min(exponential + jitter, capMs));
}

export interface SafeInvokeResult<T> {
  data: T | null;
  error: EdgeErrorInfo | null;
  requestId: string;
  attempts: number;
}

/**
 * `invokeEdge` + tratamento canônico de erro + retry apenas em falhas
 * transitórias (rede/5xx). Nunca repete 429/401/403/4xx — repetir um rate
 * limit só piora o problema que o originou.
 */
export async function invokeEdgeSafe<T = unknown>(
  fnName: string,
  options: InvokeOptions & { maxAttempts?: number } = {},
): Promise<SafeInvokeResult<T>> {
  const { maxAttempts = 3, ...invokeOptions } = options;
  const requestId = invokeOptions.requestId ?? newRequestId();
  let lastError: EdgeErrorInfo | null = null;

  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
    const { data, error } = await invokeEdge<T>(fnName, { ...invokeOptions, requestId });

    if (!error) {
      return { data: (data ?? null) as T | null, error: null, requestId, attempts: attempt };
    }

    lastError = await describeEdgeError(error);
    if (!lastError.retryable || attempt >= maxAttempts) break;

    await new Promise((resolve) => setTimeout(resolve, backoffDelayMs(attempt)));
  }

  return { data: null, error: lastError, requestId, attempts: maxAttempts };
}
