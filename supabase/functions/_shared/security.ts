import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// ──────────────────────────────────────────────────────────────────
// CORS: origens permitidas (Onda 2 — 2026-10-30).
// Em produção lemos ALLOWED_ORIGINS do environment da Edge Function
// (separadas por vírgula). Se a variável não estiver definida, o
// comportamento cai para wildcard apenas em dev local (deno serve).
// ──────────────────────────────────────────────────────────────────
function buildCorsHeaders(req: Request): Record<string, string> {
  const raw = Deno.env.get("ALLOWED_ORIGINS") ?? "";
  const origin = req.headers.get("origin") ?? "";
  const allowed = raw.split(",").map((s) => s.trim()).filter(Boolean);

  let allowOrigin = "null"; // restritivo por padrão
  if (allowed.length === 0) {
    allowOrigin = origin || "*"; // só em dev local (sem secret)
  } else if (
    allowed.some(
      (o) =>
        o === origin ||
        (o.endsWith("*") && origin.startsWith(o.slice(0, -1)))
    )
  ) {
    allowOrigin = origin; // origem está na allowlist
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-request-id",
    "Vary": "Origin",
  };
}

/** Compatibilidade: código existente que usa corsHeaders diretamente. */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id",
};

/** Retorna os cabeçalhos CORS corretos para a origem da request. */
export function getCorsHeaders(req: Request): Record<string, string> {
  return buildCorsHeaders(req);
}


/**
 * Erro com status HTTP explícito. Sem isto, falhas de autenticação eram
 * lançadas como `Error` genérico e os handlers devolviam 500 — o cliente não
 * conseguia distinguir "não autenticado" de "servidor quebrado", e o texto
 * interno do erro vazava no corpo da resposta.
 */
export class HttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly publicMessage = message) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Resposta de erro padronizada: preserva o status de `HttpError` e nunca
 * expõe a mensagem de exceções inesperadas (mantidas apenas no log).
 */
export function errorResponse(error: unknown, requestId?: string, req?: Request): Response {
  const isHttp = error instanceof HttpError;
  const status = isHttp ? error.status : 500;
  const body: Record<string, unknown> = {
    error: isHttp ? error.publicMessage : "Erro interno do servidor",
  };
  if (requestId) body.requestId = requestId;
  if (!isHttp) console.error("[errorResponse] erro não tratado", error);
  const headers = req ? getCorsHeaders(req) : corsHeaders;
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

export async function verifyUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Missing Authorization header", "Não autenticado");
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabaseClient.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, "Invalid token", "Não autenticado");
  }

  return user;
}

/**
 * Verifies that the request has a valid service role key or internal secret.
 * Used for cron jobs and internal system calls.
 */
function timingSafeEqual(a: string, b: string): boolean {
  // Compara sempre o mesmo número de bytes para não vazar o tamanho/prefixo
  // do segredo através do tempo de resposta.
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let diff = bufA.length ^ bufB.length;
  const len = Math.max(bufA.length, bufB.length);
  for (let i = 0; i < len; i++) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return diff === 0;
}

export function verifyServiceRole(req: Request): true {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new HttpError(401, "Unauthorized");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new HttpError(401, "Unauthorized");
  }

  // Segredos aceitos, em ordem de preferência. Valores vazios/ausentes nunca
  // podem virar um "match" acidental — daí o filtro de truthiness.
  const accepted = [
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),
    Deno.env.get("INTERNAL_FUNCTION_SECRET"),
    Deno.env.get("CRON_SECRET"),
  ].filter((v): v is string => typeof v === "string" && v.length > 0);

  // Percorre TODOS os candidatos (sem short-circuit) para manter o tempo estável.
  let ok = false;
  for (const secret of accepted) {
    if (timingSafeEqual(token, secret)) ok = true;
  }

  if (!ok) {
    throw new HttpError(401, "Unauthorized");
  }
  return true;
}

/**
 * Guarda padrão para funções agendadas: valida o chamador e, em caso de falha,
 * devolve 401 genérico (sem detalhar o motivo, para não ajudar um atacante).
 */
export function guardInternalRequest(req: Request): Response | null {
  try {
    verifyServiceRole(req);
    return null;
  } catch {
    const headers = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
}

