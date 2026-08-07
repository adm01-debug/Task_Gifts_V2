import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { duelsService, DuelWithProfiles } from "@/services/duelsService";
import { toast } from "sonner";
import { showErrorToast } from "@/lib/errorMessages";

export const duelKeys = {
  all: ["duels"] as const,
  user: (userId: string) => [...duelKeys.all, "user", userId] as const,
  active: (userId: string) => [...duelKeys.all, "active", userId] as const,
  opponents: (userId: string) => [...duelKeys.all, "opponents", userId] as const,
};

export function useUserDuels(userId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("duels-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "direct_duels",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: duelKeys.user(userId) });
          queryClient.invalidateQueries({ queryKey: duelKeys.active(userId) });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery<DuelWithProfiles[]>({
    queryKey: duelKeys.user(userId || ""),
    queryFn: () => duelsService.getUserDuels(userId!),
    enabled: !!userId,
  });
}

export function useActiveDuel(userId: string | undefined) {
  return useQuery<DuelWithProfiles | null>({
    queryKey: duelKeys.active(userId || ""),
    queryFn: () => duelsService.getActiveDuel(userId!),
    enabled: !!userId,
    refetchInterval: 30000, // Refresh every 30 seconds for live updates
  });
}

export function useActiveDuels() {
  return useQuery<DuelWithProfiles[]>({
    queryKey: [...duelKeys.all, "all-active"],
    queryFn: () => duelsService.getAllActiveDuels(),
    refetchInterval: 30000,
  });
}

export function usePotentialOpponents(userId: string | undefined) {
  return useQuery({
    queryKey: duelKeys.opponents(userId || ""),
    queryFn: () => duelsService.getPotentialOpponents(userId!),
    enabled: !!userId,
  });
}

export function useCreateDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      challengerId,
      opponentId,
      durationHours,
      message,
    }: {
      challengerId: string;
      opponentId: string;
      durationHours?: number;
      message?: string;
    }) => duelsService.createDuel(challengerId, opponentId, durationHours, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: duelKeys.user(variables.challengerId) });
      queryClient.invalidateQueries({ queryKey: duelKeys.active(variables.challengerId) });
      toast.success("Desafio enviado!", { description: "Aguardando resposta do oponente" });
    },
    onError: (error: Error) => {
      showErrorToast(error, "criar desafio");
    },
  });
}

export function useAcceptDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ duelId, userId }: { duelId: string; userId: string }) =>
      duelsService.acceptDuel(duelId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: duelKeys.all });
      toast.success("Duelo aceito!", { description: "Que vença o melhor!" });
    },
    onError: (error: Error) => {
      showErrorToast(error, "aceitar duelo");
    },
  });
}

export function useDeclineDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ duelId, userId }: { duelId: string; userId: string }) =>
      duelsService.declineDuel(duelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duelKeys.all });
      toast.info("Desafio recusado");
    },
    onError: (error: Error) => {
      showErrorToast(error, "recusar duelo");
    },
  });
}

export function useCancelDuel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ duelId, userId }: { duelId: string; userId: string }) =>
      duelsService.cancelDuel(duelId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: duelKeys.all });
      toast.info("Desafio cancelado");
    },
    onError: () => {
      toast.error("Erro ao cancelar duelo");
    },
  });
}
