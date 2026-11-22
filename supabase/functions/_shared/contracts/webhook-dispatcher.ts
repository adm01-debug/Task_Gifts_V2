// Contrato VERSIONADO do webhook-dispatcher (v1 → v2) com depreciação controlada.
//
// Política:
// - v1 (sem `version`): formato histórico `{ subscription_id, event_type, payload }`. DEPRECIADO:
//   continua aceito até WEBHOOK_V1_SUNSET e toda resposta a um corpo v1 carrega os headers
//   `Deprecation`, `Sunset` e `Link rel="deprecation"` (RFC 8594 / RFC 9745). Depois da data,
//   422 `UNSUPPORTED_VERSION`.
// - v2 (`version: "v2"`): envelope `{ version, subscription_id, event: { type, id?, occurred_at? },
//   payload, metadata? }`. Campos novos são opcionais; o id do evento vira `id` no envelope entregue
//   ao assinante e permite idempotência do lado dele.
// - Os dois formatos normalizam para `WebhookDispatch` (um só caminho no handler).
import { defineContract, jsonRecord, texto, uuid, z } from "./common.ts";
import {
  buildValidationError,
  type ValidationError,
  type ValidationErrorField,
  zodIssuesToFields,
} from "../validation.ts";

export const WEBHOOK_CONTRACT_VERSIONS = ["v1", "v2"] as const;
export type WebhookContractVersion = (typeof WEBHOOK_CONTRACT_VERSIONS)[number];

/** Última versão: é a que novos integradores devem usar. */
export const WEBHOOK_CURRENT_VERSION: WebhookContractVersion = "v2";

/** Data a partir da qual v1 deixa de ser aceita (UTC). */
export const WEBHOOK_V1_SUNSET = new Date("2027-05-31T00:00:00.000Z");

/** URL pública da documentação de depreciação (apontada no header Link). */
export const WEBHOOK_DEPRECATION_DOC_URL =
  "https://github.com/adm01-debug/Task_Gifts_V2/blob/main/docs/agentes/edge-functions.md#versionamento-do-webhook-dispatcher";

export const WebhookEventTypeSchema = texto(128).regex(
  /^[a-z0-9_]+(\.[a-z0-9_]+)*$/i,
  "event_type deve ser 'dominio.acao' (ex.: order.created, test.ping)",
);

/** v1 — formato histórico (sem campo version). */
export const WebhookDispatchV1Schema = z.object({
  subscription_id: uuid,
  event_type: WebhookEventTypeSchema,
  payload: jsonRecord,
}).strict();

/** v2 — envelope com evento identificado e metadados. */
export const WebhookDispatchV2Schema = z.object({
  version: z.literal("v2"),
  subscription_id: uuid,
  event: z.object({
    type: WebhookEventTypeSchema,
    id: z.string().min(1).max(128).optional(),
    occurred_at: z.string().datetime({ offset: true }).optional(),
  }).strict(),
  payload: jsonRecord,
  metadata: jsonRecord.optional(),
}).strict();

/** União aceita pelo endpoint (qualquer versão suportada). */
export const WebhookDispatchRequestSchema = z.union([WebhookDispatchV2Schema, WebhookDispatchV1Schema]);

/** Forma normalizada que o handler consome, independente da versão recebida. */
export interface WebhookDispatch {
  version: WebhookContractVersion;
  subscription_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  event_id?: string;
  occurred_at?: string;
  metadata?: Record<string, unknown>;
}

export type WebhookDispatchResolution =
  | { ok: true; data: WebhookDispatch; deprecated: boolean; headers: Record<string, string> }
  | { ok: false; error: ValidationError; headers: Record<string, string> };

/** Lê `version` do corpo bruto sem validar o resto (para escolher o schema e a mensagem certa). */
export function detectWebhookVersion(raw: unknown): WebhookContractVersion | "unknown" {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return "unknown";
  const v = (raw as Record<string, unknown>).version;
  if (v === undefined) return "v1";
  if (v === "v2") return "v2";
  return "unknown";
}

export function isWebhookV1Sunset(now: Date = new Date()): boolean {
  return now.getTime() >= WEBHOOK_V1_SUNSET.getTime();
}

/** Headers de depreciação para respostas a corpos v1 (ausentes em v2). */
export function webhookDeprecationHeaders(version: WebhookContractVersion): Record<string, string> {
  const base: Record<string, string> = { "X-Contract-Version": version };
  if (version !== "v1") return base;
  return {
    ...base,
    Deprecation: `@${Math.floor(WEBHOOK_V1_SUNSET.getTime() / 1000)}`,
    Sunset: WEBHOOK_V1_SUNSET.toUTCString(),
    Link: `<${WEBHOOK_DEPRECATION_DOC_URL}>; rel="deprecation"`,
  };
}

/**
 * Valida o corpo contra a versão detectada e normaliza. Falhas voltam já no formato único 422
 * (`VALIDATION_ERROR` para campo, `UNSUPPORTED_VERSION` para versão desconhecida/sunset).
 */
export function resolveWebhookDispatch(
  raw: unknown,
  options: { now?: Date; requestId?: string } = {},
): WebhookDispatchResolution {
  const now = options.now ?? new Date();

  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    const fields: ValidationErrorField[] = [{ field: "(body)", message: "Expected object", code: "invalid_type" }];
    const headers = { "X-Contract-Version": WEBHOOK_CURRENT_VERSION };
    return { ok: false, headers, error: buildValidationError({ fields, requestId: options.requestId }) };
  }

  const version = detectWebhookVersion(raw);

  if (version === "unknown") {
    const fields: ValidationErrorField[] = [{
      field: "version",
      message: `Versões suportadas: ${WEBHOOK_CONTRACT_VERSIONS.join(", ")} (omitir = v1)`,
      code: "invalid_enum_value",
    }];
    const headers = { "X-Contract-Version": WEBHOOK_CURRENT_VERSION };
    return { ok: false, headers, error: buildValidationError({ code: "UNSUPPORTED_VERSION", fields, requestId: options.requestId }) };
  }

  const headers = webhookDeprecationHeaders(version);

  if (version === "v1" && isWebhookV1Sunset(now)) {
    const fields: ValidationErrorField[] = [{
      field: "version",
      message: `Contrato v1 descontinuado em ${WEBHOOK_V1_SUNSET.toISOString()}; envie version: "v2"`,
      code: "sunset",
    }];
    return { ok: false, headers, error: buildValidationError({ code: "UNSUPPORTED_VERSION", fields, requestId: options.requestId }) };
  }

  if (version === "v1") {
    const parsed = WebhookDispatchV1Schema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, headers, error: buildValidationError({ fields: zodIssuesToFields(parsed.error), requestId: options.requestId }) };
    }
    return {
      ok: true,
      deprecated: true,
      headers,
      data: {
        version: "v1",
        subscription_id: parsed.data.subscription_id,
        event_type: parsed.data.event_type,
        payload: parsed.data.payload,
      },
    };
  }

  const parsed = WebhookDispatchV2Schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, headers, error: buildValidationError({ fields: zodIssuesToFields(parsed.error), requestId: options.requestId }) };
  }
  const data: WebhookDispatch = {
    version: "v2",
    subscription_id: parsed.data.subscription_id,
    event_type: parsed.data.event.type,
    payload: parsed.data.payload,
  };
  if (parsed.data.event.id !== undefined) data.event_id = parsed.data.event.id;
  if (parsed.data.event.occurred_at !== undefined) data.occurred_at = parsed.data.event.occurred_at;
  if (parsed.data.metadata !== undefined) data.metadata = parsed.data.metadata;
  return { ok: true, deprecated: false, headers, data };
}

/** Envelope ENTREGUE ao assinante (POST na URL cadastrada), assinado por HMAC. */
export const WebhookDeliveryEnvelopeSchema = z.object({
  event: z.string(),
  timestamp: z.string().datetime(),
  data: jsonRecord,
  /** Presentes só quando a origem usou v2 e informou o evento/metadados. */
  id: z.string().optional(),
  occurred_at: z.string().optional(),
  metadata: jsonRecord.optional(),
});
export type WebhookDeliveryEnvelope = z.infer<typeof WebhookDeliveryEnvelopeSchema>;

/** Monta o envelope de entrega a partir do dispatch normalizado (aditivo: v1 produz o formato antigo). */
export function buildDeliveryEnvelope(dispatch: WebhookDispatch, timestamp: string): WebhookDeliveryEnvelope {
  const envelope: WebhookDeliveryEnvelope = {
    event: dispatch.event_type,
    timestamp,
    data: dispatch.payload,
  };
  if (dispatch.event_id !== undefined) envelope.id = dispatch.event_id;
  if (dispatch.occurred_at !== undefined) envelope.occurred_at = dispatch.occurred_at;
  if (dispatch.metadata !== undefined) envelope.metadata = dispatch.metadata;
  return envelope;
}

export const WebhookDispatcherResponseSchema = z.object({
  success: z.boolean(),
  attempts: z.number().int().nonnegative(),
  duration_ms: z.number().nonnegative(),
  status: z.number().int().nullable(),
  error: z.string().nullable(),
});

export const webhookDispatcherContract = defineContract({
  name: "webhook-dispatcher",
  methods: ["POST"],
  auth: "service",
  request: WebhookDispatchRequestSchema,
  response: WebhookDispatcherResponseSchema,
  versions: WEBHOOK_CONTRACT_VERSIONS,
  bodyRequired: true,
  validate: (raw, options) => {
    const r = resolveWebhookDispatch(raw, options);
    return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.error };
  },
});
