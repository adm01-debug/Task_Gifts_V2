import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  campaignTeamsService,
  type CampaignTeamInsert,
} from "@/services/campaignTeamsService";
import { useToast } from "@/hooks/use-toast";

/** Equipes, membros e rateio coletivo de uma campanha de vendas. */
export function useCampaignTeams(campaignId: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const teams = useQuery({
    queryKey: ["campaign-teams", campaignId],
    queryFn: () => campaignTeamsService.list(campaignId!),
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  });

  const members = useQuery({
    queryKey: ["campaign-teams", campaignId, "members"],
    queryFn: () => campaignTeamsService.listMembers(campaignId!),
    enabled: !!campaignId,
    staleTime: 1000 * 30,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["campaign-teams", campaignId] });
    qc.invalidateQueries({ queryKey: ["sales-campaign", campaignId] });
    qc.invalidateQueries({ queryKey: ["campaign-team-split", campaignId] });
  };

  const failure = (fallback: string) => (err: unknown) => {
    const msg = err instanceof Error ? err.message : fallback;
    toast({ title: fallback, description: msg, variant: "destructive" });
  };

  const createMut = useMutation({
    mutationFn: (payload: Omit<CampaignTeamInsert, "campaign_id">) =>
      campaignTeamsService.create({ ...payload, campaign_id: campaignId! }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Equipe criada" });
    },
    onError: failure("Erro ao criar equipe"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CampaignTeamInsert> }) =>
      campaignTeamsService.update(id, updates),
    onSuccess: () => {
      invalidate();
      toast({ title: "Equipe atualizada" });
    },
    onError: failure("Erro ao atualizar equipe"),
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => campaignTeamsService.remove(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Equipe removida" });
    },
    onError: failure("Erro ao remover equipe"),
  });

  const addMembersMut = useMutation({
    mutationFn: ({ teamId, userIds }: { teamId: string; userIds: string[] }) =>
      campaignTeamsService.setMembers({ campaignId: campaignId!, teamId, userIds }),
    onSuccess: (count) => {
      invalidate();
      toast({ title: `${count} colaborador(es) na equipe` });
    },
    onError: failure("Erro ao alocar colaboradores"),
  });

  const removeMemberMut = useMutation({
    mutationFn: (userId: string) =>
      campaignTeamsService.removeMember({ campaignId: campaignId!, userId }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Colaborador removido da equipe" });
    },
    onError: failure("Erro ao remover colaborador"),
  });

  const awardMut = useMutation({
    mutationFn: () => campaignTeamsService.awardTeamSplit(campaignId!),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: res.teams_awarded > 0 ? "Rateio concluído" : "Nada a ratear",
        description:
          res.reason === "empty_pool"
            ? "Defina o prêmio coletivo (XP/moedas) na regra de rateio da campanha."
            : res.teams_awarded > 0
              ? `${res.teams_awarded} equipe(s) premiada(s), ${res.members_awarded} colaborador(es) contemplado(s).`
              : "Nenhuma equipe bateu a meta coletiva ainda.",
      });
    },
    onError: failure("Erro ao ratear prêmio coletivo"),
  });

  return {
    teams: teams.data ?? [],
    members: members.data ?? [],
    isLoading: teams.isLoading || members.isLoading,
    create: createMut.mutate,
    isCreating: createMut.isPending,
    update: updateMut.mutate,
    remove: removeMut.mutate,
    addMembers: addMembersMut.mutate,
    isAddingMembers: addMembersMut.isPending,
    removeMember: removeMemberMut.mutate,
    awardTeamSplit: awardMut.mutate,
    isAwarding: awardMut.isPending,
  };
}