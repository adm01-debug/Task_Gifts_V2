import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { 
  avatarService, 
  AvatarItemWithOwnership, 
  UserAvatarConfig,
  AvatarCategory 
} from "@/services/avatarService";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

export const avatarKeys = {
  all: ["avatar"] as const,
  items: (userId: string) => [...avatarKeys.all, "items", userId] as const,
  config: (userId: string) => [...avatarKeys.all, "config", userId] as const,
};

export function useAvatarItems(userId: string | undefined, userLevel: number = 1, userStreak: number = 0) {
  const queryClient = useQueryClient();

  // Initialize default items on first load
  useEffect(() => {
    if (userId) {
      avatarService.initializeDefaultItems(userId).catch((err) => 
        logger.warn("Failed to initialize default avatar items", err instanceof Error ? err.message : String(err))
      );
    }
  }, [userId]);

  return useQuery<AvatarItemWithOwnership[]>({
    queryKey: avatarKeys.items(userId || ""),
    queryFn: () => avatarService.getItemsWithOwnership(userId!, userLevel, userStreak),
    enabled: !!userId,
  });
}

export function useAvatarConfig(userId: string | undefined) {
  return useQuery<UserAvatarConfig | null>({
    queryKey: avatarKeys.config(userId || ""),
    queryFn: () => avatarService.getUserConfig(userId!),
    enabled: !!userId,
  });
}

export function useUnlockItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, itemId }: { userId: string; itemId: string }) =>
      avatarService.unlockItem(userId, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.items(variables.userId) });
      toast.success("Item desbloqueado!", { description: "Novo item adicionado à sua coleção" });
    },
    onError: () => {
      toast.error("Erro ao desbloquear item");
    },
  });
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, itemId, price }: { userId: string; itemId: string; price: number }) =>
      avatarService.purchaseItem(userId, itemId, price),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.items(variables.userId) });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("Item comprado!", { description: "Novo item adicionado à sua coleção" });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao comprar item");
    },
  });
}

export function useUpdateAvatarConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      userId, 
      category, 
      itemId 
    }: { 
      userId: string; 
      category: AvatarCategory; 
      itemId: string | null;
    }) => avatarService.updateConfig(userId, category, itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: avatarKeys.config(variables.userId) });
      toast.success("Avatar atualizado!");
    },
    onError: () => {
      toast.error("Erro ao atualizar avatar");
    },
  });
}
