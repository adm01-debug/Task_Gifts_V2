import { defineContract, EmptyBodySchema, z } from "./common.ts";

/** Resposta: alertas operacionais para admin (ordenados por severidade). */
export const AdminAlertSchema = z.object({
  type: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string(),
  message: z.string(),
  affectedUsers: z.number().int().nonnegative().optional(),
  data: z.record(z.unknown()).optional(),
});

export const AdminAlertsResponseSchema = z.object({ alerts: z.array(AdminAlertSchema) });

export const adminAlertsContract = defineContract({
  name: "admin-alerts",
  methods: ["POST"],
  auth: "user",
  request: EmptyBodySchema,
  response: AdminAlertsResponseSchema,
  bodyRequired: false,
});
