import { defineContract, uuid, z } from "./common.ts";

/**
 * Corpo opcional: sem `userId` analisa o próprio usuário autenticado; `checkAllUsers`
 * exige admin (verificado no handler). Chamadores: src/hooks/useCompetencyAlerts.ts e
 * src/services/notificationsService.ts.
 */
export const CompetencyAlertsRequestSchema = z.object({
  userId: uuid.optional(),
  checkAllUsers: z.boolean().optional(),
});

export const CompetencyAlertsResponseSchema = z.object({
  success: z.literal(true),
  analyzed: z.number().int().nonnegative(),
  results: z.array(z.object({
    userId: z.string(),
    gaps: z.array(z.string()),
    notificationsCreated: z.number().int().nonnegative(),
  })),
});

export const competencyAlertsContract = defineContract({
  name: "competency-alerts",
  methods: ["POST"],
  auth: "user",
  request: CompetencyAlertsRequestSchema,
  response: CompetencyAlertsResponseSchema,
  bodyRequired: false,
});
