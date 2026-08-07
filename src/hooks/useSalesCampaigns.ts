import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  salesCampaignsService,
  type CampaignInsert,
  type SalesCampaign,
} from "@/services/salesCampaignsService";
import { useToast } from "@/hooks/use-toast";
import { useSoundEffects } from "@/hooks/useSoundEffects";
import { useHaptics } from "@/hooks/useHaptics";

export function useSalesCampaigns(status?: SalesCampaign["status"]) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const list = useQuery({
    queryKey: ["sales-campaigns", status ?? "all"],
    queryFn: () => salesCampaignsService.list(status),
    staleTime: 1000 * 60 * 2,
  });

  const createMut = useMutation({
    mutationFn: (payload: CampaignInsert) => salesCampaignsService.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-campaigns"] });
      toast({ title: "Campanha criada!" });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao criar campanha";
      toast({ title: "Falha", description: msg, variant: "destructive" });
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<CampaignInsert> }) =>
      salesCampaignsService.update(id, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-campaigns"] });
      toast({ title: "Campanha atualizada" });
    },
  });

  const removeMut = useMutation({
    mutationFn: (id: string) => salesCampaignsService.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-campaigns"] });
      toast({ title: "Campanha removida" });
    },
  });

  return {
    campaigns: list.data ?? [],
    isLoading: list.isLoading,
    refetch: list.refetch,
    create: createMut.mutate,
    isCreating: createMut.isPending,
    update: updateMut.mutate,
    remove: removeMut.mutate,
  };
}

export function useSalesCampaign(id: string | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { playQuestCompleteSound, playXPSound, playEpicCelebrationSound } = useSoundEffects();
  const haptics = useHaptics();

  const campaign = useQuery({
    queryKey: ["sales-campaign", id],
    queryFn: () => salesCampaignsService.getById(id!),
    enabled: !!id,
  });

  const participants = useQuery({
    queryKey: ["sales-campaign", id, "participants"],
    queryFn: () => salesCampaignsService.listParticipants(id!),
    enabled: !!id,
  });

  const myParticipation = useQuery({
    queryKey: ["sales-campaign", id, "me"],
    queryFn: () => salesCampaignsService.getMyParticipation(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["sales-campaign", id] });
  };

  const acceptMut = useMutation({
    mutationFn: (targetAdjusted?: number) => salesCampaignsService.acceptGoal(id!, targetAdjusted),
    onSuccess: () => {
      invalidate();
      toast({ title: "Meta aceita! Vá em busca do prêmio." });
    },
  });

  const declineMut = useMutation({
    mutationFn: () => salesCampaignsService.declineGoal(id!),
    onSuccess: () => {
      invalidate();
      toast({ title: "Meta recusada" });
    },
  });

  const logProgressMut = useMutation({
    mutationFn: (params: { delta: number; userId?: string; note?: string }) =>
      salesCampaignsService.logProgress({
        campaignId: id!,
        delta: params.delta,
        userId: params.userId,
        note: params.note,
      }),
    onSuccess: (res) => {
      invalidate();
      if (res.justCompleted) {
        playEpicCelebrationSound();
        haptics.questCompleted();
        toast({
          title: "🏆 Meta concluída!",
          description: "Parabéns, você atingiu a meta desta campanha!",
        });
      } else if (res.milestoneCrossed) {
        const m = res.milestoneCrossed;
        const emoji = m === 75 ? "🔥" : m === 50 ? "⚡" : "🚀";
        playQuestCompleteSound();
        haptics.streakMilestone(m === 75 ? 30 : m === 50 ? 7 : 3);
        toast({
          title: `${emoji} ${m}% da meta atingido!`,
          description: "Continue firme, você está no ritmo certo.",
        });
      } else {
        playXPSound();
        haptics.trigger("light");
        toast({ title: "Progresso registrado!" });
      }
    },
  });

  const bulkEnrollMut = useMutation({
    mutationFn: () => salesCampaignsService.bulkEnroll(id!),
    onSuccess: (res) => {
      invalidate();
      toast({
        title: "Enrollment concluído",
        description: `${res.enrolled} participante(s) adicionado(s) à campanha.`,
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Erro ao enrollar participantes";
      toast({ title: "Falha no enrollment", description: msg, variant: "destructive" });
    },
  });

  return {
    campaign: campaign.data,
    participants: participants.data ?? [],
    myParticipation: myParticipation.data,
    isLoading: campaign.isLoading,
    accept: acceptMut.mutate,
    isAccepting: acceptMut.isPending,
    decline: declineMut.mutate,
    logProgress: logProgressMut.mutate,
    isLoggingProgress: logProgressMut.isPending,
    bulkEnroll: bulkEnrollMut.mutate,
    isBulkEnrolling: bulkEnrollMut.isPending,
  };
}