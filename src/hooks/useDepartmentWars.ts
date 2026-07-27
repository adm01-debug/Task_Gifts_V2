import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { departmentWarService } from "@/services/departmentWarService";
import { departmentWarAdminService } from "@/services/departmentWarAdminService";
import type { WarConfigDraft } from "@/lib/departmentWarConfig";
import { useAuth } from "./useAuth";

export const departmentWarKeys = {
  all: ["department-wars"] as const,
  list: () => [...departmentWarKeys.all, "list"] as const,
  board: (id: string) => [...departmentWarKeys.all, "board", id] as const,
  metrics: (id: string) => [...departmentWarKeys.all, "metrics", id] as const,
  contributions: (id: string, userId: string) =>
    [...departmentWarKeys.all, "contributions", id, userId] as const,
  feed: (id: string) => [...departmentWarKeys.all, "feed", id] as const,
};

export function useDepartmentWars() {
  const { user } = useAuth();
  return useQuery({
    queryKey: departmentWarKeys.list(),
    queryFn: () => departmentWarService.list(),
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useDepartmentWarBoard(warId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: departmentWarKeys.board(warId ?? "none"),
    queryFn: () => departmentWarService.board(warId as string),
    enabled: !!user && !!warId,
    staleTime: 15_000,
  });
}

export function useDepartmentWarMetrics(warId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: departmentWarKeys.metrics(warId ?? "none"),
    queryFn: () => departmentWarService.metrics(warId as string),
    enabled: !!user && !!warId,
    staleTime: 60_000,
  });
}

export function useMyWarContributions(warId?: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: departmentWarKeys.contributions(warId ?? "none", user?.id ?? "anon"),
    queryFn: () => departmentWarService.myContributions(warId as string, user!.id),
    enabled: !!user && !!warId,
    staleTime: 30_000,
  });
}

/**
 * Feed ao vivo. Combina polling curto com realtime: o realtime cobre a latencia
 * baixa, e o refetch periodico garante que o feed nao "congele" caso o socket
 * caia silenciosamente (o que acontece em rede movel instavel).
 */
export function useDepartmentWarFeed(warId?: string, limit = 30) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: departmentWarKeys.feed(warId ?? "none"),
    queryFn: () => departmentWarService.feed(warId as string, limit),
    enabled: !!user && !!warId,
    staleTime: 10_000,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!warId || !user) return;

    const channel = supabase
      .channel(`war-feed-${warId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "department_war_contributions",
          filter: `war_id=eq.${warId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey: departmentWarKeys.feed(warId) });
          void queryClient.invalidateQueries({ queryKey: departmentWarKeys.board(warId) });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [warId, user, queryClient]);

  return query;
}

function useInvalidateWars() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: departmentWarKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
  };
}

export function useSettleDepartmentWar() {
  const invalidate = useInvalidateWars();
  return useMutation({
    mutationFn: (warId: string) => departmentWarService.settle(warId),
    onSuccess: invalidate,
  });
}

export function useSyncWarHeadcount() {
  const invalidate = useInvalidateWars();
  return useMutation({
    mutationFn: (warId: string) => departmentWarService.syncHeadcount(warId),
    onSuccess: invalidate,
  });
}
export function useWarDepartmentOptions(enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: [...departmentWarKeys.all, "department-options"],
    queryFn: () => departmentWarAdminService.departmentOptions(),
    enabled: !!user && enabled,
    staleTime: 5 * 60_000,
  });
}

export function useCreateDepartmentWar() {
  const invalidate = useInvalidateWars();
  return useMutation({
    mutationFn: (draft: Partial<WarConfigDraft>) => departmentWarAdminService.create(draft),
    onSuccess: invalidate,
  });
}

export function useUpdateDepartmentWar() {
  const invalidate = useInvalidateWars();
  return useMutation({
    mutationFn: ({ warId, draft }: { warId: string; draft: Partial<WarConfigDraft> }) =>
      departmentWarAdminService.update(warId, draft),
    onSuccess: invalidate,
  });
}

export function useSetDepartmentWarStatus() {
  const invalidate = useInvalidateWars();
  return useMutation({
    mutationFn: ({ warId, status }: { warId: string; status: "running" | "cancelled" }) =>
      departmentWarAdminService.setStatus(warId, status),
    onSuccess: invalidate,
  });
}
