import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sequenceGameService,
  sequenceProcedureAdminService,
} from "@/services/sequenceGameService";
import { useAuth } from "./useAuth";

export const sequenceGameKeys = {
  all: ["sequenceGame"] as const,
  procedures: () => [...sequenceGameKeys.all, "procedures"] as const,
  procedure: (id: string) => [...sequenceGameKeys.all, "procedure", id] as const,
  history: () => [...sequenceGameKeys.all, "history"] as const,
};

export function useSequenceProcedures() {
  const { user } = useAuth();
  return useQuery({
    queryKey: sequenceGameKeys.procedures(),
    queryFn: () => sequenceGameService.listProcedures(),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSequenceProcedure(procedureId: string | null) {
  return useQuery({
    queryKey: sequenceGameKeys.procedure(procedureId ?? ""),
    queryFn: () => sequenceGameService.getProcedure(procedureId as string),
    enabled: !!procedureId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSequenceHistory() {
  const { user } = useAuth();
  return useQuery({
    queryKey: sequenceGameKeys.history(),
    queryFn: () => sequenceGameService.history(),
    enabled: !!user,
    staleTime: 30 * 1000,
  });
}

export function useSubmitSequence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { procedureId: string; order: string[]; durationMs: number }) =>
      sequenceGameService.submit(input.procedureId, input.order, input.durationMs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sequenceGameKeys.history() });
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
export const sequenceAdminKeys = {
  procedures: () => [...sequenceGameKeys.all, "admin", "procedures"] as const,
  procedure: (id: string) => [...sequenceGameKeys.all, "admin", "procedure", id] as const,
  stats: (procedureId: string, days: number) =>
    [...sequenceGameKeys.all, "admin", "stats", procedureId, days] as const,
};

/** Procedimento com gabarito, para a tela de autoria (admin/gestor). */
export function useAdminSequenceProcedure(procedureId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: sequenceAdminKeys.procedure(procedureId ?? ""),
    queryFn: () => sequenceProcedureAdminService.getForAuthoring(procedureId as string),
    enabled: !!user && !!procedureId,
    staleTime: 60 * 1000,
  });
}

export function useAdminSequenceProcedures() {
  const { user } = useAuth();
  return useQuery({
    queryKey: sequenceAdminKeys.procedures(),
    queryFn: () => sequenceProcedureAdminService.listAll(),
    enabled: !!user,
    staleTime: 60 * 1000,
  });
}

export function useSaveSequenceProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof sequenceProcedureAdminService.save>[0]) =>
      sequenceProcedureAdminService.save(input),
    onSuccess: (_result, input) => {
      void queryClient.invalidateQueries({ queryKey: sequenceAdminKeys.procedures() });
      void queryClient.invalidateQueries({ queryKey: sequenceGameKeys.procedures() });
      if (input.procedureId) {
        void queryClient.invalidateQueries({
          queryKey: sequenceAdminKeys.procedure(input.procedureId),
        });
        void queryClient.invalidateQueries({
          queryKey: sequenceGameKeys.procedure(input.procedureId),
        });
      }
    },
  });
}

export function useDeleteSequenceProcedure() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (procedureId: string) => sequenceProcedureAdminService.remove(procedureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sequenceAdminKeys.procedures() });
      void queryClient.invalidateQueries({ queryKey: sequenceGameKeys.procedures() });
    },
  });
}

/** Relatório do procedimento selecionado no painel admin. */
export function useSequenceProcedureStats(procedureId: string | null, days = 30) {
  const { user } = useAuth();
  return useQuery({
    queryKey: sequenceAdminKeys.stats(procedureId ?? "", days),
    queryFn: () => sequenceProcedureAdminService.stats(procedureId as string, days),
    enabled: !!user && !!procedureId,
    staleTime: 60 * 1000,
  });
}
