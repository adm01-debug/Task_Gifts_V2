import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Resposta: monitor de orçamento de erros — alvos avaliados + criados/disparados. */
export const ErrorBudgetMonitorResponseSchema = z.object({
  ok: z.literal(true),
  evaluated: z.array(
    z.object({
      target: z.string(),
      burn_pct: z.number(),
      bucket: z.enum(["critical", "high"]).nullable(),
    })
  ),
  created: z.number().int().nonnegative(),
  dispatched: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  generated_at: z.string(),
});

export const errorBudgetMonitorContract = defineContract({
  name: "error-budget-monitor",
  methods: ["POST"],
  auth: "service",
  request: EmptyBodySchema,
  response: ErrorBudgetMonitorResponseSchema,
  bodyRequired: false,
});