import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournamentService";
import { useAuth } from "./useAuth";

export const tournamentKeys = {
  all: ["tournaments"] as const,
  list: () => [...tournamentKeys.all, "list"] as const,
  bracket: (id: string) => [...tournamentKeys.all, "bracket", id] as const,
};

export function useTournaments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: tournamentKeys.list(),
    queryFn: () => tournamentService.list(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useTournamentBracket(tournamentId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: tournamentKeys.bracket(tournamentId ?? "none"),
    queryFn: () => tournamentService.bracket(tournamentId as string),
    enabled: !!user && !!tournamentId,
    staleTime: 15_000,
  });
}

function useInvalidateTournaments() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: tournamentKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
  };
}

export function useJoinTournament() {
  const invalidate = useInvalidateTournaments();
  return useMutation({
    mutationFn: (tournamentId: string) => tournamentService.join(tournamentId),
    onSuccess: invalidate,
  });
}

export function useStartTournament() {
  const invalidate = useInvalidateTournaments();
  return useMutation({
    mutationFn: (tournamentId: string) => tournamentService.start(tournamentId),
    onSuccess: invalidate,
  });
}

export function useReportMatch() {
  const invalidate = useInvalidateTournaments();
  return useMutation({
    mutationFn: (input: { matchId: string; homeScore: number; awayScore: number }) =>
      tournamentService.reportMatch(input.matchId, input.homeScore, input.awayScore),
    onSuccess: invalidate,
  });
}
