import { defineContract, uuid, z } from "./common.ts";

/**
 * Corpo opcional: sem `userId` recomenda para o próprio usuário; outro `userId` exige
 * admin/gestor (verificado no handler). Chamadores: src/components/TrailRecommendations.tsx,
 * src/components/manager/TeamCompetencyDashboard.tsx.
 */
export const TrailRecommendationsRequestSchema = z.object({
  userId: uuid.optional(),
});

export const TrailRecommendationSchema = z.object({
  trailId: z.string(),
  title: z.string(),
  reason: z.string(),
  priority: z.enum(["alta", "média", "baixa"]),
  skillGap: z.string().optional(),
});

export const TrailRecommendationsResponseSchema = z.object({
  recommendations: z.array(TrailRecommendationSchema),
  analysis: z.object({
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
    nextSteps: z.string(),
  }).partial().optional(),
});

export const trailRecommendationsContract = defineContract({
  name: "trail-recommendations",
  methods: ["POST"],
  auth: "user",
  request: TrailRecommendationsRequestSchema,
  response: TrailRecommendationsResponseSchema,
  bodyRequired: false,
});
