import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Resposta: monitor de burn rate — alertas disparados + metadados. */
export const BurnRateMonitorResponseSchema = z.object({
  ok: z.literal(true),
  triggered: z.array(
    z.object({
      alertType: z.string(),
      severity: z.enum(["high", "critical"]),
      id: z.string().nullable(),
    })
  ),
  evaluated_at: z.string(),
  slo: z.number(),
});

export const burnRateMonitorContract = defineContract({
  name: "burn-rate-monitor",
  methods: ["POST"],
  auth: "service",
  request: EmptyBodySchema,
  response: BurnRateMonitorResponseSchema,
  bodyRequired: false,
});