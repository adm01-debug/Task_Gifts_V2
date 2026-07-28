import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { boardTrailService } from "@/services/boardTrailService";

export function useBoardTrails() {
  return useQuery({
    queryKey: ["board-trails"],
    queryFn: () => boardTrailService.listTrails(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBoardTrail(trailId: string | null) {
  return useQuery({
    queryKey: ["board-trail", trailId],
    queryFn: () => boardTrailService.getTrail(trailId as string),
    enabled: Boolean(trailId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBoardPlayerState(trailId: string | null) {
  return useQuery({
    queryKey: ["board-player-state", trailId],
    queryFn: () => boardTrailService.getPlayerState(trailId as string),
    enabled: Boolean(trailId),
  });
}

export function useAdvanceBoardTrail(trailId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dedupeKey: string) =>
      boardTrailService.advance(trailId as string, dedupeKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-player-state", trailId] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useAdminBoardTrails() {
  return useQuery({
    queryKey: ["board-trails", "admin"],
    queryFn: () => boardTrailService.listAllTrails(),
    staleTime: 60 * 1000,
  });
}

export function useSaveBoardTrail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof boardTrailService.saveTrail>[0]) =>
      boardTrailService.saveTrail(input),
    onSuccess: (trailId) => {
      queryClient.invalidateQueries({ queryKey: ["board-trails"] });
      queryClient.invalidateQueries({ queryKey: ["board-trail", trailId] });
    },
  });
}

export function useDeleteBoardTrail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (trailId: string) => boardTrailService.deleteTrail(trailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board-trails"] });
    },
  });
}