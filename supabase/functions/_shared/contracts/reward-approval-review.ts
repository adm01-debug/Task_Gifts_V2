import { defineContract, uuid, z } from "./common.ts";

/** Chamador: src/services/purchaseGovernanceService.ts (analyzeRisk). */
export const RewardApprovalReviewRequestSchema = z.object({
  purchase_id: uuid,
});

export const RewardApprovalReviewResponseSchema = z.object({
  score: z.number().min(0).max(100),
  level: z.string(),
  factors: z.array(z.unknown()),
  summary: z.string(),
  recommendation: z.enum(["approve", "review", "reject"]),
  requires_dual_approval: z.boolean(),
  ai_available: z.boolean(),
});

export const rewardApprovalReviewContract = defineContract({
  name: "reward-approval-review",
  methods: ["POST"],
  auth: "user",
  request: RewardApprovalReviewRequestSchema,
  response: RewardApprovalReviewResponseSchema,
  bodyRequired: true,
});
