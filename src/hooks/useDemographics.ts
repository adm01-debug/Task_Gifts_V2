import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  demographicsService,
  type DemographicAttributeInsert,
  type DemographicAttributeUpdate,
} from "@/services/demographicsService";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";

export const demographicKeys = {
  all: ["demographic_attributes"] as const,
  lists: () => [...demographicKeys.all, "list"] as const,
  list: (onlyActive: boolean) => [...demographicKeys.lists(), { onlyActive }] as const,
  values: () => [...demographicKeys.all, "values"] as const,
  myValues: () => [...demographicKeys.values(), "mine"] as const,
  allValuesRoot: () => [...demographicKeys.values(), "all"] as const,
  allValues: (userId: string | null) =>
    [...demographicKeys.allValuesRoot(), { userId }] as const,
};

export function useDemographicAttributes(options?: { onlyActive?: boolean }) {
  const onlyActive = options?.onlyActive ?? false;
  return useQuery({
    queryKey: demographicKeys.list(onlyActive),
    queryFn: () => demographicsService.listAttributes({ onlyActive }),
  });
}

export function useMyDemographicValues() {
  return useQuery({
    queryKey: demographicKeys.myValues(),
    queryFn: () => demographicsService.listMyValues(),
  });
}

export function useAllDemographicValues() {
  // A chave carrega o usuario logado: se outra pessoa entrar na mesma aba, o
  // cache da consulta anterior (que pode ter vindo de um admin) nao e' reusado.
  const { user } = useAuth();
  const userId = user?.id ?? null;
  return useQuery({
    queryKey: demographicKeys.allValues(userId),
    queryFn: () => demographicsService.listAllValues(),
    enabled: !!userId,
  });
}

function useInvalidarTudo() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: demographicKeys.all });
  };
}

export function useCreateDemographicAttribute() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (input: DemographicAttributeInsert) =>
      demographicsService.createAttribute(input),
    onSuccess: invalidar,
  });
}

export function useUpdateDemographicAttribute() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: DemographicAttributeUpdate }) =>
      demographicsService.updateAttribute(id, updates),
    onSuccess: invalidar,
  });
}

export function useDeleteDemographicAttribute() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: (id: string) => demographicsService.deleteAttribute(id),
    onSuccess: invalidar,
  });
}

export function useSetDemographicOrder() {
  const invalidar = useInvalidarTudo();
  return useMutation({
    mutationFn: ({ id, orderIndex }: { id: string; orderIndex: number }) =>
      demographicsService.setOrder(id, orderIndex),
    onSuccess: invalidar,
  });
}

export function useSaveDemographicValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      attributeId: string;
      value?: string | null;
      valuesArray?: Json;
      numberValue?: number | null;
      dateValue?: string | null;
    }) => demographicsService.saveValue(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demographicKeys.myValues() });
      queryClient.invalidateQueries({ queryKey: demographicKeys.allValuesRoot() });
    },
  });
}

export function useSetPreferNotAnswer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attributeId: string) => demographicsService.setPreferNotAnswer(attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demographicKeys.myValues() });
      queryClient.invalidateQueries({ queryKey: demographicKeys.allValuesRoot() });
    },
  });
}

export function useClearDemographicValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (attributeId: string) => demographicsService.clearValue(attributeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: demographicKeys.myValues() });
      queryClient.invalidateQueries({ queryKey: demographicKeys.allValuesRoot() });
    },
  });
}