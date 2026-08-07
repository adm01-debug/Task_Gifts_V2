import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useCallback, useMemo } from "react";
import { leaguesService, League } from "@/services/leaguesService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useLeagues() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const leaguesQuery = useQuery({
    queryKey: ["leagues"],
    queryFn: () => leaguesService.getAllLeagues(),
  });

  const myLeagueQuery = useQuery({
    queryKey: ["leagues", "mine"],
    queryFn: () => leaguesService.getMyLeague(),
    retry: 1,
  });

  const leaderboardQuery = useQuery({
    queryKey: ["leagues", "leaderboard"],
    queryFn: async () => {
      const myLeague = await leaguesService.getMyLeague();
      if (!myLeague) return [];
      return leaguesService.getLeagueLeaderboard(myLeague.league_id);
    },
    enabled: !!myLeagueQuery.data,
    retry: 1,
  });

  const historyQuery = useQuery({
    queryKey: ["leagues", "history"],
    queryFn: () => leaguesService.getMyLeagueHistory(),
  });

  // Realtime subscription para league_members
  useEffect(() => {
    const channel = supabase
      .channel('league-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_members',
        },
        () => {
          // Invalidar queries quando houver mudanças
          queryClient.invalidateQueries({ queryKey: ["leagues", "mine"] });
          queryClient.invalidateQueries({ queryKey: ["leagues", "leaderboard"] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'league_history',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["leagues", "history"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createLeagueMutation = useMutation({
    mutationFn: (league: Omit<League, 'id' | 'created_at'>) => leaguesService.createLeague(league),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
      toast({ title: "Liga criada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao criar liga", variant: "destructive" });
    },
  });

  const updateLeagueMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<League, 'id' | 'created_at'>> }) => 
      leaguesService.updateLeague(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
      toast({ title: "Liga atualizada com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar liga", variant: "destructive" });
    },
  });

  const deleteLeagueMutation = useMutation({
    mutationFn: (id: string) => leaguesService.deleteLeague(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leagues"] });
      toast({ title: "Liga removida com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao remover liga", variant: "destructive" });
    },
  });

  const leagues = useMemo(() => leaguesQuery.data ?? [], [leaguesQuery.data]);
  const myLeague = myLeagueQuery.data;
  const leaderboard = useMemo(() => leaderboardQuery.data ?? [], [leaderboardQuery.data]);
  const history = useMemo(() => historyQuery.data ?? [], [historyQuery.data]);
  const isLoading = leaguesQuery.isLoading || myLeagueQuery.isLoading;
  const error = myLeagueQuery.error ?? leaguesQuery.error ?? null;

  const createLeague = createLeagueMutation.mutate;
  const updateLeague = updateLeagueMutation.mutate;
  const deleteLeague = deleteLeagueMutation.mutate;

  return useMemo(() => ({
    leagues,
    myLeague,
    leaderboard,
    history,
    isLoading,
    error,
    createLeague,
    updateLeague,
    deleteLeague,
    isCreating: createLeagueMutation.isPending,
    isUpdating: updateLeagueMutation.isPending,
    isDeleting: deleteLeagueMutation.isPending,
  }), [
    leagues,
    myLeague,
    leaderboard,
    history,
    isLoading,
    error,
    createLeague,
    updateLeague,
    deleteLeague,
    createLeagueMutation.isPending,
    updateLeagueMutation.isPending,
    deleteLeagueMutation.isPending
  ]);
}
