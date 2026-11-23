import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  mentorshipService,
  type CreateMissionInput,
  type CreateRequestInput,
  type MentorshipPair,
  type MentorshipRequest,
  type MentorshipRole,
} from "@/services/mentorshipService";
import { useAuth } from "./useAuth";

export const mentorshipKeys = {
  all: ["mentorship"] as const,
  missions: () => [...mentorshipKeys.all, "missions"] as const,
  allMissions: () => [...mentorshipKeys.all, "missions", "all"] as const,
  pairs: (userId: string | null) => [...mentorshipKeys.all, "pairs", userId] as const,
  progress: (pairId: string | null) => [...mentorshipKeys.all, "progress", pairId] as const,
  incoming: (userId: string | null) => [...mentorshipKeys.all, "incoming", userId] as const,
  sent: (userId: string | null) => [...mentorshipKeys.all, "sent", userId] as const,
  candidates: (userId: string | null, search: string) =>
    [...mentorshipKeys.all, "candidates", userId, search] as const,
};

export function useMentorshipMissions() {
  return useQuery({
    queryKey: mentorshipKeys.missions(),
    queryFn: () => mentorshipService.getActiveMissions(),
    staleTime: 60000,
  });
}

export function useAllMentorshipMissions(enabled: boolean) {
  return useQuery({
    queryKey: mentorshipKeys.allMissions(),
    queryFn: () => mentorshipService.getAllMissions(),
    enabled,
    staleTime: 60000,
  });
}

export function useMyMentorshipPairs() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mentorshipKeys.pairs(user?.id ?? null),
    queryFn: () => mentorshipService.getMyPairs(user!.id),
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function usePairProgress(pairId: string | null) {
  return useQuery({
    queryKey: mentorshipKeys.progress(pairId),
    queryFn: () => mentorshipService.getPairProgress(pairId!),
    enabled: !!pairId,
    staleTime: 15000,
  });
}

export function useIncomingMentorshipRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mentorshipKeys.incoming(user?.id ?? null),
    queryFn: () => mentorshipService.getIncomingRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 15000,
  });
}

export function useSentMentorshipRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: mentorshipKeys.sent(user?.id ?? null),
    queryFn: () => mentorshipService.getSentRequests(user!.id),
    enabled: !!user?.id,
    staleTime: 15000,
  });
}

export function useMentorshipCandidates(search: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: mentorshipKeys.candidates(user?.id ?? null, search),
    queryFn: () => mentorshipService.getCandidates(user!.id, search),
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function useMarkMentorshipPart() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({
      pair,
      missionId,
      role,
    }: {
      pair: MentorshipPair;
      missionId: string;
      role: MentorshipRole;
    }) => mentorshipService.markMyPart(pair, missionId, role),
    onSuccess: ({ xpAwarded, coinsAwarded, missionSettled }, { pair }) => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.progress(pair.id) });
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.pairs(user?.id ?? null) });
      if (xpAwarded > 0 || coinsAwarded > 0) {
        toast.success(
          `Parte concluída! +${xpAwarded} XP${coinsAwarded > 0 ? ` e +${coinsAwarded} moedas` : ""}`,
        );
      } else {
        toast.success("Parte concluída!");
      }
      if (missionSettled) {
        toast.success("Missão concluída para a dupla!");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível concluir a missão");
    },
  });
}

export function useCreateMentorshipRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateRequestInput) => mentorshipService.createRequest(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.sent(user?.id ?? null) });
      toast.success("Solicitação enviada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível enviar a solicitação");
    },
  });
}

export function useRespondMentorshipRequest() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ request, accept }: { request: MentorshipRequest; accept: boolean }) =>
      mentorshipService.respondRequest(request, user!.id, accept),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.incoming(user?.id ?? null) });
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.pairs(user?.id ?? null) });
      if (result.status === "accepted") {
        toast.success("Solicitação aceita! A dupla de mentoria está ativa.");
      } else {
        toast.success("Solicitação recusada.");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível responder a solicitação");
    },
  });
}

export function useCloseMentorshipPair() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ pairId, outcome }: { pairId: string; outcome: "completed" | "cancelled" }) =>
      mentorshipService.closePair(pairId, outcome),
    onSuccess: (_, { outcome }) => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.pairs(user?.id ?? null) });
      toast.success(outcome === "completed" ? "Mentoria concluída!" : "Mentoria encerrada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível encerrar a mentoria");
    },
  });
}

export function useCreateMentorshipMission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMissionInput) => mentorshipService.createMission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.missions() });
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.allMissions() });
      toast.success("Missão criada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível criar a missão");
    },
  });
}

export function useSetMentorshipMissionActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ missionId, isActive }: { missionId: string; isActive: boolean }) =>
      mentorshipService.setMissionActive(missionId, isActive),
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.missions() });
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.allMissions() });
      toast.success(isActive ? "Missão ativada." : "Missão desativada.");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível atualizar a missão");
    },
  });
}

export function useSeedMentorshipMissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => mentorshipService.seedDefaultMissions(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.missions() });
      queryClient.invalidateQueries({ queryKey: mentorshipKeys.allMissions() });
      toast.success("Missões iniciais criadas!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível criar as missões iniciais");
    },
  });
}