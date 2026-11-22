import { defineContract } from "./common.ts";
import {
  WebhookDispatchRequestSchema,
  WebhookDispatcherResponseSchema,
  WEBHOOK_CONTRACT_VERSIONS,
  resolveWebhookDispatch,
} from "./webhook-dispatcher.ts";

/**
 * Ponte de autenticacao admin -> webhook-dispatcher (service-only).
 * Front chama webhook-ping com o JWT de sessao do admin; aqui valida a role,
 * re-valida o mesmo contrato zod do dispatcher (422 identico) e delega o envio
 * via service key, sem duplicar a logica de entrega/HMAC.
 */
export const webhookPingContract = defineContract({
  name: "webhook-ping",
  methods: ["POST"],
  auth: "user", // admin autenticado (verifyUser + has_role "admin")
  request: WebhookDispatchRequestSchema,
  response: WebhookDispatcherResponseSchema,
  versions: WEBHOOK_CONTRACT_VERSIONS,
  bodyRequired: true,
  validate: (raw, options) => {
    const r = resolveWebhookDispatch(raw, options);
    return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error };
  },
});
