import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shopService,
  type RewardCategory,
  type ShopReward,
  type PurchaseStatus,
  type ShopPromotion,
  type CreateRewardInput,
  type CreatePromotionInput,
  type UpdatePromotionInput,
} from "@/services/shopService";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const shopKeys = {
  all: ["shop"] as const,
  rewards: () => [...shopKeys.all, "rewards"] as const,
  rewardsByCategory: (category: RewardCategory) =>
    [...shopKeys.rewards(), category] as const,
  purchases: (userId: string) => [...shopKeys.all, "purchases", userId] as const,
  adminRewards: () => [...shopKeys.all, "admin", "rewards"] as const,
  adminPurchases: () => [...shopKeys.all, "admin", "purchases"] as const,
};

export function useShopRewards() {
  return useQuery({
    queryKey: shopKeys.rewards(),
    queryFn: () => shopService.getRewards(),
    staleTime: 60000,
  });
}

export function useShopRewardsByCategory(category: RewardCategory) {
  return useQuery({
    queryKey: shopKeys.rewardsByCategory(category),
    queryFn: () => shopService.getRewardsByCategory(category),
    staleTime: 60000,
  });
}

export function useUserPurchases() {
  const { user } = useAuth();

  return useQuery({
    queryKey: shopKeys.purchases(user?.id ?? ""),
    queryFn: () => shopService.getUserPurchases(user!.id),
    enabled: !!user,
    staleTime: 30000,
  });
}

export function usePurchaseReward() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ rewardId, quantity = 1 }: { rewardId: string; quantity?: number }) =>
      shopService.purchaseReward(user!.id, rewardId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      toast.success("🎉 Recompensa resgatada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao resgatar recompensa");
    },
  });
}

// ========== ADMIN HOOKS ==========

export function useAdminRewards() {
  return useQuery({
    queryKey: shopKeys.adminRewards(),
    queryFn: () => shopService.getAllRewardsAdmin(),
    staleTime: 30000,
  });
}

export function useAdminPurchases() {
  return useQuery({
    queryKey: shopKeys.adminPurchases(),
    queryFn: () => shopService.getAllPurchasesAdmin(),
    staleTime: 30000,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reward: CreateRewardInput) =>
      shopService.createReward(reward),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Recompensa criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar recompensa");
    },
  });
}

export function useUpdateReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<ShopReward, "id" | "created_at">> }) =>
      shopService.updateReward(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Recompensa atualizada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar recompensa");
    },
  });
}

export function useDeleteReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shopService.deleteReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Recompensa removida!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover recompensa");
    },
  });
}

export function useUpdatePurchaseStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ purchaseId, status, notes }: { purchaseId: string; status: PurchaseStatus; notes?: string }) =>
      shopService.updatePurchaseStatus(purchaseId, status, user!.id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Status do pedido atualizado!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });
}

// ========== PROMOTIONS HOOKS ==========

export function useActivePromotions() {
  return useQuery({
    queryKey: [...shopKeys.all, "promotions", "active"],
    queryFn: () => shopService.getActivePromotions(),
    staleTime: 30000,
    refetchInterval: 60000, // Refresh every minute for countdown accuracy
  });
}

export function useAdminPromotions() {
  return useQuery({
    queryKey: [...shopKeys.all, "promotions", "admin"],
    queryFn: () => shopService.getAllPromotionsAdmin(),
    staleTime: 30000,
  });
}

export function useCreatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promotion: CreatePromotionInput) =>
      shopService.createPromotion(promotion),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Promoção criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao criar promoção");
    },
  });
}

export function useUpdatePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdatePromotionInput }) =>
      shopService.updatePromotion(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Promoção atualizada!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao atualizar promoção");
    },
  });
}

export function useDeletePromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => shopService.deletePromotion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shopKeys.all });
      toast.success("Promoção removida!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao remover promoção");
    },
  });
}
