import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Resposta: monitor de saúde de webhooks — assinaturas verificadas e degradadas. */
export const WebhookHealthMonitorResponseSchema = z.object({
  checked: z.number().int().nonnegative(),
  degraded: z.number().int().nonnegative(),
  threshold_pct: z.number(),
  min_sample: z.number(),
  degraded_subscriptions: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      success_rate_pct: z.number().nullable(),
      total: z.number().int().nonnegative(),
      failed: z.number().int().nonnegative(),
    })
  ),
  requestId: z.string(),
});

export const webhookHealthMonitorContract = defineContract({
  name: "webhook-health-monitor",
  methods: ["POST"],
  auth: "service",
  request: EmptyBodySchema,
  response: WebhookHealthMonitorResponseSchema,
  bodyRequired: false,
});