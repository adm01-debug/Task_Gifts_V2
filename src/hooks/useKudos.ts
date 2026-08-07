import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { kudosService, type KudosInsert, type KudosWithDetails } from "@/services/kudosService";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export const kudosKeys = {
  all: ["kudos"] as const,
  badges: () => [...kudosKeys.all, "badges"] as const,
  recent: (limit: number) => [...kudosKeys.all, "recent", limit] as const,
  received: (userId: string) => [...kudosKeys.all, "received", userId] as const,
  given: (userId: string) => [...kudosKeys.all, "given", userId] as const,
  count: (userId: string) => [...kudosKeys.all, "count", userId] as const,
};

export function useKudosBadges() {
  return useQuery({
    queryKey: kudosKeys.badges(),
    queryFn: () => kudosService.getBadges(),
    staleTime: 300000, // 5 minutes - badges don't change often
  });
}

export function useRecentKudos(limit = 20) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Real-time subscription for new kudos
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("kudos-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "kudos",
        },
        (payload) => {
          // Invalidate queries to refetch with new data
          queryClient.invalidateQueries({ queryKey: kudosKeys.recent(limit) });
          
          // If this kudos is for the current user, show a toast
          const newKudos = payload.new as { to_user_id: string };
          if (newKudos.to_user_id === user.id) {
            toast({
              title: "🎉 Você recebeu um reconhecimento!",
              description: "Alguém te reconheceu pelo seu trabalho!",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient, limit, toast]);

  return useQuery({
    queryKey: kudosKeys.recent(limit),
    queryFn: () => kudosService.getRecentKudos(limit),
  });
}

export function useKudosReceived(userId: string) {
  return useQuery({
    queryKey: kudosKeys.received(userId),
    queryFn: () => kudosService.getKudosReceived(userId),
    enabled: !!userId,
  });
}

export function useKudosGiven(userId: string) {
  return useQuery({
    queryKey: kudosKeys.given(userId),
    queryFn: () => kudosService.getKudosGiven(userId),
    enabled: !!userId,
  });
}

export function useKudosCount(userId: string) {
  return useQuery({
    queryKey: kudosKeys.count(userId),
    queryFn: () => kudosService.getKudosCount(userId),
    enabled: !!userId,
  });
}

export function useGiveKudos() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (kudos: KudosInsert) => kudosService.giveKudos(kudos),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: kudosKeys.all });
      queryClient.invalidateQueries({ queryKey: ['combo'] });
      
      const comboText = result.comboResult && result.comboResult.bonusXp > 0 
        ? ` (+${result.comboResult.bonusXp} bônus combo!)`
        : '';
      
      toast({
        title: "Reconhecimento enviado! 🎉",
        description: `Seu colega receberá ${result.comboResult?.finalXp || 25} XP${comboText}`,
      });
    },
    onError: () => {
      toast({
        title: "Erro ao enviar reconhecimento",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteKudos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => kudosService.deleteKudos(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: kudosKeys.all });
    },
  });
}
