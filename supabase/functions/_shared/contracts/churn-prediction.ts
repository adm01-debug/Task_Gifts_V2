import { defineContract, EmptyBodySchema, z } from "./common.ts";

export const ChurnPredictionSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  riskLevel: z.enum(["high", "medium"]),
  riskScore: z.number().min(0).max(100),
  riskIndicators: z.array(z.string()),
  interventionSuggestions: z.array(z.string()),
  metrics: z.object({
    daysInactive: z.number().optional(),
    streak: z.number().optional(),
    punctualityRate: z.number().optional(),
    recentXpGain: z.number().optional(),
  }).partial().optional(),
});

export const ChurnPredictionResponseSchema = z.object({
  predictions: z.array(ChurnPredictionSchema),
  summary: z.object({
    totalAnalyzed: z.number().optional(),
    highRiskCount: z.number().optional(),
    mediumRiskCount: z.number().optional(),
    overallHealthScore: z.number().optional(),
  }).partial(),
});

export const churnPredictionContract = defineContract({
  name: "churn-prediction",
  methods: ["POST"],
  auth: "user",
  request: EmptyBodySchema,
  response: ChurnPredictionResponseSchema,
  bodyRequired: false,
});
