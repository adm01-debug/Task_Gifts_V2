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