import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { sequenceGameService } from "@/services/sequenceGameService";
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