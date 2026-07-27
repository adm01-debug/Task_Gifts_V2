import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { departmentWarService } from "@/services/departmentWarService";
import { useAuth } from "./useAuth";

export const departmentWarKeys = {
  all: ["department-wars"] as const,
  list: () => [...departmentWarKeys.all, "list"] as const,
  board: (id: string) => [...departmentWarKeys.all, "board", id] as const,
  metrics: (id: string) => [...departmentWarKeys.all, "metrics", id] as const,
  contributions: (id: string, userId: string) =>
    [...departmentWarKeys.all, "contributions", id, userId] as const,
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