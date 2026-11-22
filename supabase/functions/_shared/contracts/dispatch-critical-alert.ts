import { defineContract, z, jsonRecord } from "./common.ts";

/** Corpo: dispatch de alerta crítico (enviado pelos monitores e pelo trigger do banco). */
export const AlertPayloadSchema = z.object({
  alert_id: z.string().optional(),
  alert_type: z.string().trim().min(1).max(120),
  severity: z.string().trim().min(1).max(20),
  title: z.string().trim().min(1).max(300).optional(),
  description: z.string().nullable().optional(),
  /** burn-rate-monitor envia `message` em vez de `title` (dispatch usa como fallback). */
  message: z.string().nullable().optional(),
  metadata: jsonRecord.nullable().optional(),
});

/** Resposta 2xx: escalonado (severity + results) OU ignorado (severity abaixo do limiar). */
export const DispatchCriticalAlertResponseSchema = z.discriminatedUnion("skipped", [
  z.object({
    success: z.literal(true),
    skipped: z.literal(false),
    severity: z.string(),
    results: z.record(z.unknown()),
  }),
  z.object({
    success: z.literal(true),
    skipped: z.literal(true),
    reason: z.string(),
  }),
]);

export const dispatchCriticalAlertContract = defineContract({
  name: "dispatch-critical-alert",
  methods: ["POST"],
  auth: "service",
  request: AlertPayloadSchema,
  response: DispatchCriticalAlertResponseSchema,
  bodyRequired: true,
});