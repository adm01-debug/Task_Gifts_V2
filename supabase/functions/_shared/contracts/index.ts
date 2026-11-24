// Registro ÚNICO dos contratos das edge functions. Um contrato por pasta em supabase/functions/
// (o teste registry.contract.spec.ts falha se alguma função ficar sem contrato).
import type { EdgeContract } from "./common.ts";
import { adminAlertsContract } from "./admin-alerts.ts";
import { aiCoachContract } from "./ai-coach.ts";
import { aiCourseBuilderContract } from "./ai-course-builder.ts";
import { burnRateMonitorContract } from "./burn-rate-monitor.ts";
import { churnPredictionContract } from "./churn-prediction.ts";
import { competencyAlertsContract } from "./competency-alerts.ts";
import { detectNewDeviceContract } from "./detect-new-device.ts";
import { dispatchCriticalAlertContract } from "./dispatch-critical-alert.ts";
import { errorBudgetMonitorContract } from "./error-budget-monitor.ts";
import { generateQuizQuestionsContract } from "./generate-quiz-questions.ts";
import { migrateHelperContract } from "./migrate-helper.ts";
import { passkeyAuthContract } from "./passkey-auth.ts";
import { pushDeviceRevokedContract } from "./push-device-revoked.ts";
import { pushOutboxDispatcherContract } from "./push-outbox-dispatcher.ts";
import { pushPublicKeyContract } from "./push-public-key.ts";
import { rewardApprovalReviewContract } from "./reward-approval-review.ts";
import { sendCampaignPushContract } from "./send-campaign-push.ts";
import { trailRecommendationsContract } from "./trail-recommendations.ts";
import { verifyIpContract } from "./verify-ip.ts";
import { webhookDispatcherContract } from "./webhook-dispatcher.ts";
import { webhookHealthMonitorContract } from "./webhook-health-monitor.ts";
import { webhookPingContract } from "./webhook-ping.ts";
import { securityWeeklyDigestContract } from "./security-weekly-digest.ts";

export * from "./common.ts";
export * from "./admin-alerts.ts";
export * from "./ai-coach.ts";
export * from "./ai-course-builder.ts";
export * from "./burn-rate-monitor.ts";
export * from "./churn-prediction.ts";
export * from "./competency-alerts.ts";
export * from "./detect-new-device.ts";
export * from "./dispatch-critical-alert.ts";
export * from "./error-budget-monitor.ts";
export * from "./generate-quiz-questions.ts";
export * from "./migrate-helper.ts";
export * from "./passkey-auth.ts";
export * from "./push-device-revoked.ts";
export * from "./push-outbox-dispatcher.ts";
export * from "./push-public-key.ts";
export * from "./reward-approval-review.ts";
export * from "./send-campaign-push.ts";
export * from "./trail-recommendations.ts";
export * from "./verify-ip.ts";
export * from "./webhook-dispatcher.ts";
export * from "./webhook-health-monitor.ts";
export * from "./webhook-ping.ts";
export * from "./security-weekly-digest.ts";

export const CONTRACTS = {
  "admin-alerts": adminAlertsContract,
  "ai-coach": aiCoachContract,
  "ai-course-builder": aiCourseBuilderContract,
  "burn-rate-monitor": burnRateMonitorContract,
  "churn-prediction": churnPredictionContract,
  "competency-alerts": competencyAlertsContract,
  "detect-new-device": detectNewDeviceContract,
  "dispatch-critical-alert": dispatchCriticalAlertContract,
  "error-budget-monitor": errorBudgetMonitorContract,
  "generate-quiz-questions": generateQuizQuestionsContract,
  "migrate-helper": migrateHelperContract,
  "passkey-auth": passkeyAuthContract,
  "push-device-revoked": pushDeviceRevokedContract,
  "push-outbox-dispatcher": pushOutboxDispatcherContract,
  "push-public-key": pushPublicKeyContract,
  "reward-approval-review": rewardApprovalReviewContract,
  "send-campaign-push": sendCampaignPushContract,
  "trail-recommendations": trailRecommendationsContract,
  "verify-ip": verifyIpContract,
  "webhook-dispatcher": webhookDispatcherContract,
  "webhook-health-monitor": webhookHealthMonitorContract,
  "webhook-ping": webhookPingContract,
  "security-weekly-digest": securityWeeklyDigestContract,
} as const satisfies Record<string, EdgeContract>;

export type EdgeFunctionName = keyof typeof CONTRACTS;

export const EDGE_FUNCTION_NAMES = Object.keys(CONTRACTS).sort() as EdgeFunctionName[];

export function getContract(name: string): EdgeContract | undefined {
  return (CONTRACTS as Record<string, EdgeContract>)[name];
}
