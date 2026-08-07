import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { campaignTeamsService } from "@/services/campaignTeamsService";
import { salesCampaignsService } from "@/services/salesCampaignsService";
import {
  buildTeamMetrics,
  campaignInPeriod,
  resolvePeriod,
  summarizeTeamMetrics,
  type MetricsCampaign,
  type MetricsTeam,
  type PeriodPreset,
} from "@/lib/campaignTeamMetrics";

/**
 * Estado + dados do dashboard consolidado de ranking por equipe.
 *
 * O recorte de período filtra as campanhas por intersecção de vigência; as
 * equipes são buscadas apenas das campanhas visíveis, evitando payload inútil.
 */
export function useCampaignTeamsDashboard() {
  const [campaignId, setCampaignId] = useState<string>("all");
  const [period, setPeriod] = useState<PeriodPreset>("365d");

  const campaignsQuery = useQuery({
    queryKey: ["sales-campaigns", "all-for-teams"],
    queryFn: () => salesCampaignsService.list(),
    staleTime: 1000 * 60,
  });

  const campaigns = useMemo<MetricsCampaign[]>(
    () =>
      (campaignsQuery.data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        metric_unit: c.metric_unit ?? "un",
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status,
      })),
    [campaignsQuery.data],
  );

  const range = useMemo(() => resolvePeriod(period), [period]);

  const visibleCampaigns = useMemo(
    () =>
      campaigns
        .filter((c) => campaignInPeriod(c, range))
        .filter((c) => campaignId === "all" || c.id === campaignId),
    [campaigns, range, campaignId],
  );

  const visibleIds = useMemo(
    () => visibleCampaigns.map((c) => c.id).sort(),
    [visibleCampaigns],
  );

  const teamsQuery = useQuery({
    queryKey: ["campaign-teams", "dashboard", visibleIds],
    queryFn: () => campaignTeamsService.listByCampaigns(visibleIds),
    enabled: visibleIds.length > 0,
    staleTime: 1000 * 30,
  });

  const membersQuery = useQuery({
    queryKey: ["campaign-teams", "dashboard", "members", visibleIds],
    queryFn: () => campaignTeamsService.countMembersByCampaigns(visibleIds),
    enabled: visibleIds.length > 0,
    staleTime: 1000 * 30,
  });

  const rows = useMemo(
    () =>
      buildTeamMetrics(
        (teamsQuery.data ?? []) as MetricsTeam[],
        visibleCampaigns,
        membersQuery.data ?? new Map<string, number>(),
      ),
    [teamsQuery.data, visibleCampaigns, membersQuery.data],
  );

  const summary = useMemo(() => summarizeTeamMetrics(rows), [rows]);

  return {
    campaignId,
    setCampaignId,
    period,
    setPeriod,
    range,
    campaigns,
    visibleCampaigns,
    rows,
    summary,
    isLoading:
      campaignsQuery.isLoading ||
      (visibleIds.length > 0 && (teamsQuery.isLoading || membersQuery.isLoading)),
  };
}