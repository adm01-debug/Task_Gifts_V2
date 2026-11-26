import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  savedFiltersService,
  type SavedFilter,
  type SavedFilterPayload,
} from "@/services/savedFiltersService";

export const savedFilterKeys = {
  all: ["saved_filters"] as const,
  list: (entityType: string) => [...savedFilterKeys.all, entityType] as const,
};

export function useSavedFilters(entityType: string) {
  return useQuery({
    queryKey: savedFilterKeys.list(entityType),
    queryFn: () => savedFiltersService.list(entityType),
    enabled: !!entityType,
  });
}

/** O filtro marcado como padrao, que a pagina aplica ao abrir. */
export function useDefaultSavedFilter(entityType: string): SavedFilter | undefined {
  const { data } = useSavedFilters(entityType);
  return data?.find((f) => f.is_default);
}

export function useSaveSavedFilter(entityType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; filters: SavedFilterPayload; isDefault?: boolean }) =>
      savedFiltersService.save({ entityType, ...input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(entityType) });
    },
  });
}

export function useSetDefaultSavedFilter(entityType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) =>
      isDefault
        ? savedFiltersService.setDefault(id)
        : savedFiltersService.clearDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(entityType) });
    },
  });
}

export function useDeleteSavedFilter(entityType: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => savedFiltersService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: savedFilterKeys.list(entityType) });
    },
  });
}