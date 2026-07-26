import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  actionPlansService,
  type ActionItemStatus,
  type ActionPlanStatus,
} from "@/services/actionPlansService";
import { logger } from "@/services/loggingService";

const STALE = 60 * 1000;

export function useActionPlans(status: ActionPlanStatus | "all" = "all") {
  return useQuery({
    queryKey: ["action-plans", status],
    queryFn: () => actionPlansService.list(status),
    staleTime: STALE,
  });
}

export function useActionPlanItems(planId: string | null) {
  return useQuery({
    queryKey: ["action-plans", "items", planId],
    queryFn: () => actionPlansService.listItems(planId as string),
    enabled: !!planId,
    staleTime: STALE,
  });
}

function reportError(err: unknown, fallback: string) {
  const message = err instanceof Error ? err.message : fallback;
  logger.error(fallback, message);
  toast.error(fallback, { description: message });
}

export function useUpdateActionItemStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: ActionItemStatus }) =>
      actionPlansService.updateItemStatus(itemId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      toast.success("Ação atualizada");
    },
    onError: (err: unknown) => reportError(err, "Não foi possível atualizar a ação"),
  });
}

export function useUpdateActionPlanStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ planId, status }: { planId: string; status: ActionPlanStatus }) =>
      actionPlansService.updatePlanStatus(planId, status),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["action-plans"] });
      toast.success("Plano atualizado");
    },
    onError: (err: unknown) => reportError(err, "Não foi possível atualizar o plano"),
  });
}
