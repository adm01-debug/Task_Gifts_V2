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
import {
  isFunctionDeployed,
  isEdgeAvailable,
  isEdgeSkillsDisabled,
  markEdgeUnavailable,
} from "@/lib/edgeAvailability";
import * as Sentry from "@sentry/react";

/**
 * Correlação com o Sentry: cada invocação gera breadcrumb com `requestId`,
 * e falhas marcam a tag `edge.request_id`. Isso permite cruzar o evento do
 * front com os logs da edge function (`withSentry` injeta o mesmo id).
 * Envolvido em try/catch porque telemetria jamais pode quebrar o fluxo.
 */
function breadcrumb(
  fnName: string,
  requestId: string,
  level: "info" | "error",
  extra?: Record<string, unknown>,
): void {
  try {
    Sentry.addBreadcrumb({
      category: "edge-function",
      type: "http",
      level,
      message: `${fnName} (${requestId})`,
      data: { fnName, requestId, ...extra },
    });
  } catch {
    /* telemetria é best-effort */
  }
}

function tagFailure(fnName: string, requestId: string, info: EdgeErrorInfo): void {
  try {
    Sentry.withScope((scope) => {
      scope.setTag("edge.function", fnName);
      scope.setTag("edge.request_id", requestId);
      scope.setTag("edge.error_kind", info.kind);
      scope.setContext("edge_error", {
        status: info.status,
        kind: info.kind,
        retryable: info.retryable,
        retryAfterSeconds: info.retryAfterSeconds,
      });
      // Erros de rate limit/permissão são esperados: registramos como mensagem,
      // não como exceção, para não poluir o alerting com ruído operacional.
      scope.setLevel(info.kind === "server_error" || info.kind === "network" ? "error" : "warning");
      Sentry.captureMessage(`edge:${fnName}:${info.kind}`);
    });
  } catch {
    /* telemetria é best-effort */
  }
}

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
  breadcrumb(fnName, requestId, result.error ? "error" : "info", {
    ok: !result.error,
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

  // Global kill-switch: when edge skills are disabled (set via
  // localStorage "edge-skills:disabled"), every call short-circuits without
  // touching the network. Useful while the functions are still being deployed.
  // Layer 1 — compiled allowlist (zero network traffic for undeployed functions):
  if (!isFunctionDeployed(fnName)) {
    return {
      data: null,
      error: {
        kind: "not_found",
        status: 404,
        retryAfterSeconds: null,
        message: `Edge function '${fnName}' nao encontrada (allowlist)`,
        retryable: false,
      },
      requestId: invokeOptions.requestId ?? newRequestId(),
      attempts: 0,
    };
  }

  if (isEdgeSkillsDisabled() || isEdgeAvailable(fnName) === false) {
    return {
      data: null,
      error: {
        kind: "not_found",
        status: 404,
        retryAfterSeconds: null,
        message: `Edge function '${fnName}' desabilitada`,
        retryable: false,
      },
      requestId: invokeOptions.requestId ?? newRequestId(),
      attempts: 0,
    };
  }

  const requestId = invokeOptions.requestId ?? newRequestId();
  let lastError: EdgeErrorInfo | null = null;
  let usedAttempts = 0;

  for (let attempt = 1; attempt <= Math.max(1, maxAttempts); attempt++) {
    usedAttempts = attempt;
    const { data, error } = await invokeEdge<T>(fnName, { ...invokeOptions, requestId });

    if (!error) {
      return { data: (data ?? null) as T | null, error: null, requestId, attempts: attempt };
    }

    lastError = await describeEdgeError(error);
    tagFailure(fnName, requestId, lastError);

    // Remember 404 so subsequent calls short-circuit instead of retrying.
    if (lastError.status === 404) {
      markEdgeUnavailable(fnName);
      break;
    }

    if (!lastError.retryable || attempt >= maxAttempts) break;

    await new Promise((resolve) => setTimeout(resolve, backoffDelayMs(attempt)));
  }

  return { data: null, error: lastError, requestId, attempts: usedAttempts };
}
