import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, verifyUser, errorResponse } from "../_shared/security.ts";
import { parseJsonBody, validationErrorResponse, z } from "../_shared/validation.ts";
import { resolveWebhookDispatch } from "../_shared/contracts/webhook-dispatcher.ts";
import { withSentry, addBreadcrumb } from "../_shared/sentry.ts";

// Ponte de autenticacao admin -> webhook-dispatcher (service-only).
// O front chama webhook-ping com o JWT de sessao do admin; aqui valida a role,
// re-valida o mesmo contrato zod do dispatcher (422 identico no formato unico,
// headers v1/v2 preservados) e delega o envio ao webhook-dispatcher via service key.
serve(withSentry("webhook-ping", async (req, { requestId }) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // 1. So admin autenticado.
    const user = await verifyUser(req);
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Acesso restrito a administradores", requestId }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Mesmo contrato do webhook-dispatcher (422 no formato unico).
    const rawBody = await parseJsonBody(req, z.unknown(), {
      headers: corsHeaders, requestId, emptyAsObject: false,
    });
    if (!rawBody.ok) return rawBody.response;
    const resolved = resolveWebhookDispatch(rawBody.data, { requestId });
    const contractHeaders = { ...corsHeaders, ...resolved.headers };
    if (!resolved.ok) return validationErrorResponse(resolved.error, contractHeaders);

    const { subscription_id, event_type, payload } = resolved.data;
    addBreadcrumb("webhook-ping:start", { subscription_id, event_type, requestId });

    // 3. Verifica que a assinatura existe e esta ativa.
    const { data: subscription, error: subError } = await supabase
      .from("webhook_subscriptions")
      .select("id")
      .eq("id", subscription_id)
      .eq("is_active", true)
      .single();
    if (subError || !subscription) {
      // 409 (e nao 404): distingue "assinatura inativa" de "funcao nao publicada",
      // que o front trata como indisponivel e bloqueia pings seguintes na aba.
      return new Response(JSON.stringify({ error: "Assinatura nao encontrada ou inativa", requestId }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Delega o envio ao dispatcher (service key) para nao duplicar a logica de entrega.
    const dispatcherUrl = supabaseUrl.replace(/\/$/, "") + "/functions/v1/webhook-dispatcher";
    const dispatchResponse = await fetch(dispatcherUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + serviceKey,
        "x-request-id": requestId,
      },
      body: JSON.stringify({ subscription_id, event_type, payload }),
    });

    const responseBody = await dispatchResponse.text();
    return new Response(responseBody, {
      status: dispatchResponse.status,
      headers: { ...contractHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}));