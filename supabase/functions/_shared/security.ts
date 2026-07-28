import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-request-id",
};

export async function verifyUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    throw new Error("Missing Authorization header");
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
    throw new Error("Invalid token");
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
    throw new Error("Unauthorized");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw new Error("Unauthorized");
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
    throw new Error("Unauthorized");
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
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

