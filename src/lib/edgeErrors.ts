/**
 * @fileoverview Tratamento canônico de erros de Edge Functions (Fase 24).
 * @module lib/edgeErrors
 *
 * Contexto do incidente que originou este módulo:
 * `supabase.functions.invoke` NÃO lança em respostas não-2xx — ele devolve
 * `{ data: null, error: FunctionsHttpError }`, com o `Response` original
 * pendurado em `error.context`. Componentes que liam `data.error` direto
 * quebravam com `TypeError: Cannot read properties of null`, resultando em
 * tela branca quando a função respondia 429 (rate limit).
 *
 * Este módulo centraliza:
 *  1. extração segura de status/corpo do `Response` de contexto;
 *  2. classificação determinística (pura, testável) do erro;
 *  3. mensagens em PT-BR prontas para UI, sem vazar detalhes internos.
 */

/** Categorias estáveis usadas por UI e telemetria. */
export type EdgeErrorKind =
  | "rate_limited"
  | "payment_required"
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "bad_request"
  | "server_error"
  | "network"
  | "unknown";

export interface EdgeErrorPayload {
  error?: unknown;
  message?: unknown;
  retryAfter?: unknown;
}

export interface EdgeErrorInfo {
  kind: EdgeErrorKind;
  /** Status HTTP quando conhecido. `null` para falhas de rede/erros locais. */
  status: number | null;
  /** Segundos sugeridos de espera (apenas em `rate_limited`). */
  retryAfterSeconds: number | null;
  /** Mensagem amigável em PT-BR, segura para exibir ao usuário. */
  message: string;
  /** Indica se faz sentido oferecer "Tentar novamente" imediatamente. */
  retryable: boolean;
}

const DEFAULT_RETRY_AFTER = 60;
const MAX_RETRY_AFTER = 3600;

/** Retorna a string apenas se ela tiver conteúdo útil. */
function nonEmpty(value: string | null | undefined): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Normaliza `retryAfter` vindo do corpo JSON ou do header `Retry-After`. */
export function normalizeRetryAfter(raw: unknown): number {
  const value =
    typeof raw === "number"
      ? raw
      : typeof raw === "string" && raw.trim() !== ""
        ? Number(raw)
        : Number.NaN;

  if (!Number.isFinite(value) || value <= 0) return DEFAULT_RETRY_AFTER;
  return Math.min(Math.ceil(value), MAX_RETRY_AFTER);
}

function pickPayloadMessage(payload: EdgeErrorPayload | null): string | null {
  if (!payload) return null;
  const candidate = payload.error ?? payload.message;
  if (typeof candidate === "string" && candidate.trim() !== "") {
    // Não repassamos stacks/SQL para a UI.
    if (candidate.length > 180 || /\bat\s.+:\d+:\d+/.test(candidate)) return null;
    return candidate;
  }
  return null;
}

/**
 * Classificador puro — sem I/O, para simulação exaustiva em testes.
 */
export function classifyEdgeError(
  status: number | null,
  payload: EdgeErrorPayload | null,
  fallbackMessage?: string,
): EdgeErrorInfo {
  const payloadMessage = pickPayloadMessage(payload);

  if (status === null) {
    return {
      kind: "network",
      status: null,
      retryAfterSeconds: null,
      message:
        nonEmpty(fallbackMessage) ??
        "Falha de conexão com o servidor. Verifique sua internet e tente novamente.",
      retryable: true,
    };
  }

  if (status === 429) {
    const seconds = normalizeRetryAfter(payload?.retryAfter);
    return {
      kind: "rate_limited",
      status,
      retryAfterSeconds: seconds,
      message: `Muitas solicitações seguidas. Tente novamente em ${seconds} segundos.`,
      retryable: false,
    };
  }

  if (status === 402) {
    return {
      kind: "payment_required",
      status,
      retryAfterSeconds: null,
      message: "Créditos de IA insuficientes no momento. Fale com um administrador.",
      retryable: false,
    };
  }

  if (status === 401) {
    return {
      kind: "unauthorized",
      status,
      retryAfterSeconds: null,
      message: "Sessão expirada. Entre novamente para continuar.",
      retryable: false,
    };
  }

  if (status === 403) {
    return {
      kind: "forbidden",
      status,
      retryAfterSeconds: null,
      message: payloadMessage ?? "Você não tem permissão para esta ação.",
      retryable: false,
    };
  }

  if (status === 404) {
    return {
      kind: "not_found",
      status,
      retryAfterSeconds: null,
      message: payloadMessage ?? "Recurso não encontrado.",
      retryable: false,
    };
  }

  if (status >= 500) {
    return {
      kind: "server_error",
      status,
      retryAfterSeconds: null,
      message: "O serviço está instável no momento. Tente novamente em instantes.",
      retryable: true,
    };
  }

  if (status >= 400) {
    return {
      kind: "bad_request",
      status,
      retryAfterSeconds: null,
      message: payloadMessage ?? "Não foi possível concluir a solicitação.",
      retryable: false,
    };
  }

  return {
    kind: "unknown",
    status,
    retryAfterSeconds: null,
    message: payloadMessage ?? nonEmpty(fallbackMessage) ?? "Ocorreu um erro inesperado.",
    retryable: true,
  };
}

interface ErrorWithContext {
  context?: unknown;
  message?: unknown;
}

/** Lê status + corpo do `Response` anexado pelo supabase-js, sem lançar. */
async function readContext(
  err: unknown,
): Promise<{ status: number | null; payload: EdgeErrorPayload | null }> {
  const context = (err as ErrorWithContext | null)?.context as
    | (Response & { status?: number })
    | undefined;

  if (!context || typeof context.status !== "number") {
    return { status: null, payload: null };
  }

  let payload: EdgeErrorPayload | null = null;
  try {
    const cloned = typeof context.clone === "function" ? context.clone() : context;
    payload = (await cloned.json()) as EdgeErrorPayload;
  } catch {
    payload = null;
  }

  // Header padrão prevalece quando o corpo não trouxe `retryAfter`.
  if (payload && payload.retryAfter == null && typeof context.headers?.get === "function") {
    const header = context.headers.get("retry-after");
    if (header) payload = { ...payload, retryAfter: header };
  }

  return { status: context.status, payload };
}

/**
 * Ponto de entrada para componentes/serviços: transforma qualquer erro de
 * `functions.invoke` em informação estruturada e segura.
 */
export async function describeEdgeError(err: unknown): Promise<EdgeErrorInfo> {
  const fallback =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : undefined;

  const { status, payload } = await readContext(err);
  return classifyEdgeError(status, payload, fallback);
}

/** Açúcar sintático quando só a mensagem importa. */
export async function describeEdgeErrorMessage(err: unknown): Promise<string> {
  return (await describeEdgeError(err)).message;
}
