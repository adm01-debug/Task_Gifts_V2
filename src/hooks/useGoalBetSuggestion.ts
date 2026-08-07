import { useQuery } from "@tanstack/react-query";
import { salesCampaignsService } from "@/services/salesCampaignsService";
import {
  extractGoalBetCampaignName,
  resolveGoalBetOutcome,
  type GoalBetOption,
  type GoalBetOutcome,
} from "@/lib/goalBetSettlement";

/**
 * Sugere o desfecho de um mercado nascido da Aposta de Meta, cruzando as
 * opções com o placar final da campanha. Retorna `null` para mercados comuns.
 * A decisão continua sendo do administrador — isto é apenas evidência.
 */
export function useGoalBetSuggestion(
  title: string | undefined,
  options: readonly GoalBetOption[] | undefined,
  enabled = true,
) {
  const campaignName = title ? extractGoalBetCampaignName(title) : null;

  return useQuery<GoalBetOutcome | null>({
    queryKey: ["goal-bet-suggestion", campaignName, (options ?? []).map((o) => o.id).join("|")],
    enabled: enabled && !!campaignName && (options ?? []).length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const campaigns = await salesCampaignsService.list();
      const campaign = campaigns.find((c) => c.name.trim() === campaignName);
      if (!campaign) return null;

      const participants = await salesCampaignsService.listParticipants(campaign.id);
      return resolveGoalBetOutcome({
        options: options ?? [],
        candidates: participants.map((p) => ({
          userId: p.user_id,
          name: p.profile?.display_name ?? null,
          progress: Number(p.progress ?? 0),
          target: Number(p.target_adjusted ?? 0),
          progressPercent: Number(p.progress_percent ?? 0),
          declined: !!p.declined_at,
        })),
      });
    },
  });
}