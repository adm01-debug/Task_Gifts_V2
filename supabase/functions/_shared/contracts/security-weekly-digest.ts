import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Resposta: digest semanal de segurança (SLA/MTTR/top alertas + metadados). */
export const SecurityWeeklyDigestResponseSchema = z.object({
  ok: z.literal(true),
  week: z.string(),
  total: z.number().int().nonnegative(),
  resolved: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  sla_pct: z.number().nonnegative(),
  avg_mttr_min: z.number().nullable(),
  top: z.array(z.object({ type: z.string(), count: z.number().int().nonnegative() })),
  slack_status: z.number().int().nullable(),
  notified_admins: z.number().int().nonnegative(),
});

export const securityWeeklyDigestContract = defineContract({
  name: "security-weekly-digest",
  methods: ["POST"],
  auth: "service",
  request: EmptyBodySchema,
  response: SecurityWeeklyDigestResponseSchema,
  bodyRequired: false,
});