// Registro ÚNICO dos contratos das edge functions. Um contrato por pasta em supabase/functions/
// (o teste registry.contract.spec.ts falha se alguma função ficar sem contrato).
import type { EdgeContract } from "./common.ts";
import { adminAlertsContract } from "./admin-alerts.ts";
import { aiCoachContract } from "./ai-coach.ts";
import { aiCourseBuilderContract } from "./ai-course-builder.ts";
import { churnPredictionContract } from "./churn-prediction.ts";
import { competencyAlertsContract } from "./competency-alerts.ts";
import { detectNewDeviceContract } from "./detect-new-device.ts";
import { generateQuizQuestionsContract } from "./generate-quiz-questions.ts";
import { migrateHelperContract } from "./migrate-helper.ts";
import { pushDeviceRevokedContract } from "./push-device-revoked.ts";
import { pushOutboxDispatcherContract } from "./push-outbox-dispatcher.ts";
import { pushPublicKeyContract } from "./push-public-key.ts";
import { rewardApprovalReviewContract } from "./reward-approval-review.ts";
import { sendCampaignPushContract } from "./send-campaign-push.ts";
import { trailRecommendationsContract } from "./trail-recommendations.ts";
import { verifyIpContract } from "./verify-ip.ts";
import { webhookDispatcherContract } from "./webhook-dispatcher.ts";
import { webhookPingContract } from "./webhook-ping.ts";

export * from "./common.ts";
export * from "./admin-alerts.ts";
export * from "./ai-coach.ts";
export * from "./ai-course-builder.ts";
export * from "./churn-prediction.ts";
export * from "./competency-alerts.ts";
export * from "./detect-new-device.ts";
export * from "./generate-quiz-questions.ts";
export * from "./migrate-helper.ts";
export * from "./push-device-revoked.ts";
export * from "./push-outbox-dispatcher.ts";
export * from "./push-public-key.ts";
export * from "./reward-approval-review.ts";
export * from "./send-campaign-push.ts";
export * from "./trail-recommendations.ts";
export * from "./verify-ip.ts";
export * from "./webhook-dispatcher.ts";
export * from "./webhook-ping.ts";

export const CONTRACTS = {
  "admin-alerts": adminAlertsContract,
  "ai-coach": aiCoachContract,
  "ai-course-builder": aiCourseBuilderContract,
  "churn-prediction": churnPredictionContract,
  "competency-alerts": competencyAlertsContract,
  "detect-new-device": detectNewDeviceContract,
  "generate-quiz-questions": generateQuizQuestionsContract,
  "migrate-helper": migrateHelperContract,
  "push-device-revoked": pushDeviceRevokedContract,
  "push-outbox-dispatcher": pushOutboxDispatcherContract,
  "push-public-key": pushPublicKeyContract,
  "reward-approval-review": rewardApprovalReviewContract,
  "send-campaign-push": sendCampaignPushContract,
  "trail-recommendations": trailRecommendationsContract,
  "verify-ip": verifyIpContract,
  "webhook-dispatcher": webhookDispatcherContract,
  "webhook-ping": webhookPingContract,
} as const satisfies Record<string, EdgeContract>;

export type EdgeFunctionName = keyof typeof CONTRACTS;

export const EDGE_FUNCTION_NAMES = Object.keys(CONTRACTS).sort() as EdgeFunctionName[];

export function getContract(name: string): EdgeContract | undefined {
  return (CONTRACTS as Record<string, EdgeContract>)[name];
}
