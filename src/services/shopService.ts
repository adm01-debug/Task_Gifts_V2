import { supabase } from "@/integrations/supabase/client";
import { profilesService } from "./profilesService";
import { notificationsService } from "./notificationsService";
import { auditService } from "./auditService";
import { logger } from "./loggingService";

export type RewardCategory = "product" | "benefit" | "experience";
export type RewardRarity = "common" | "rare" | "epic" | "legendary";
export type PurchaseStatus = "pending" | "approved" | "delivered" | "cancelled";

export interface ShopPromotion {
  id: string;
  reward_id: string;
  title: string;
  description: string | null;
  discount_percent: number | null;
  discount_coins: number | null;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  max_claims: number | null;
  current_claims: number;
  created_at: string;
  updated_at: string;
  reward?: ShopReward;
}

export interface ShopReward {
  id: string;
  name: string;
  description: string | null;
  category: RewardCategory;
  price_coins: number;
  stock: number | null;
  image_url: string | null;
  rarity: RewardRarity;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShopPurchase {
  id: string;
  user_id: string;
  reward_id: string;
  status: PurchaseStatus;
  quantity: number;
  total_coins: number;
  notes: string | null;
  created_at: string;
  processed_at: string | null;
  processed_by: string | null;
  reward?: ShopReward;
  /** Governança de resgate (preenchido pela análise de risco por IA). */
  risk_score?: number | null;
  risk_level?: "low" | "medium" | "high" | "critical" | null;
  risk_factors?: unknown;
  ai_summary?: string | null;
  risk_analyzed_at?: string | null;
  requires_dual_approval?: boolean;
  first_approver_id?: string | null;
}

// Input types for mutations (without auto-generated fields)
export type CreateRewardInput = Omit<ShopReward, "id" | "created_at" | "updated_at">;
export type UpdateRewardInput = Partial<CreateRewardInput>;

export type CreatePromotionInput = Omit<ShopPromotion, "id" | "created_at" | "updated_at" | "current_claims" | "reward">;
export type UpdatePromotionInput = Partial<Omit<CreatePromotionInput, "reward_id">>;

// Query result types for supabase joins
interface PurchaseQueryResult extends Omit<ShopPurchase, 'reward'> {
  reward: ShopReward;
}

interface PromotionQueryResult extends Omit<ShopPromotion, 'reward'> {
  reward: ShopReward;
}

export const shopService = {
  // Get all active rewards
  async getRewards(): Promise<ShopReward[]> {
    const { data, error } = await supabase
      .from("shop_rewards")
      .select("*")
      .eq("is_active", true)
      .order("rarity", { ascending: false })
      .order("price_coins", { ascending: true });

    if (error) throw error;
    return (data || []) as ShopReward[];
  },

  // Get rewards by category
  async getRewardsByCategory(category: RewardCategory): Promise<ShopReward[]> {
    const { data, error } = await supabase
      .from("shop_rewards")
      .select("*")
      .eq("is_active", true)
      .eq("category", category)
      .order("price_coins", { ascending: true });

    if (error) throw error;
    return (data || []) as ShopReward[];
  },

  // Get user's purchases
  async getUserPurchases(userId: string): Promise<ShopPurchase[]> {
    const { data, error } = await supabase
      .from("shop_purchases")
      .select("*, reward:shop_rewards(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => {
      const p = row as unknown as PurchaseQueryResult;
      return {
        ...p,
        reward: p.reward as ShopReward,
      };
    }) as ShopPurchase[];
  },

  // Purchase a reward
  async purchaseReward(
    userId: string,
    rewardId: string,
    quantity: number = 1
  ): Promise<ShopPurchase> {
    // Get reward details
    const { data: reward, error: rewardError } = await supabase
      .from("shop_rewards")
      .select("*")
      .eq("id", rewardId)
      .maybeSingle();

    if (rewardError || !reward) throw new Error("Recompensa não encontrada");
    
    const typedReward = reward as ShopReward;

    // Check stock
    if (typedReward.stock !== null && typedReward.stock < quantity) {
      throw new Error("Estoque insuficiente");
    }

    // Get user's coins
    const profile = await profilesService.getById(userId);
    if (!profile) throw new Error("Perfil não encontrado");

    const totalCost = typedReward.price_coins * quantity;
    if (profile.coins < totalCost) {
      throw new Error("Moedas insuficientes");
    }

    // Deduct coins
    await supabase
      .from("profiles")
      .update({ coins: profile.coins - totalCost })
      .eq("id", userId);

    // Update stock if limited
    if (typedReward.stock !== null) {
      await supabase
        .from("shop_rewards")
        .update({ stock: typedReward.stock - quantity })
        .eq("id", rewardId);
    }

    // Create purchase record
    const { data: purchase, error: purchaseError } = await supabase
      .from("shop_purchases")
      .insert({
        user_id: userId,
        reward_id: rewardId,
        quantity,
        total_coins: totalCost,
      })
      .select()
      .maybeSingle();

    if (purchaseError) throw purchaseError;
    if (!purchase) throw new Error("Failed to create purchase record");

    // Log audit
    try {
      await auditService.log({
        user_id: userId,
        action: "coins_spent",
        entity_type: "shop_purchase",
        entity_id: purchase.id,
        new_data: {
          reward_name: typedReward.name,
          quantity,
          total_coins: totalCost,
        },
      });
    } catch (e) {
      logger.apiError("Failed to audit purchase", e, "shopService");
    }

    // Send notification
    try {
      await notificationsService.create({
        user_id: userId,
        type: "achievement",
        title: "🛍️ Compra Realizada!",
        message: `Você resgatou: ${typedReward.name}`,
        data: {
          reward_id: rewardId,
          reward_name: typedReward.name,
          total_coins: totalCost,
        },
      });
    } catch (e) {
      logger.apiError("Failed to create purchase notification", e, "shopService");
    }

    return purchase as ShopPurchase;
  },

  // Get rarity config
  getRarityConfig(rarity: RewardRarity) {
    const configs = {
      common: {
        label: "Comum",
        color: "bg-zinc-500",
        textColor: "text-zinc-500",
        borderColor: "border-zinc-500",
        bgGlow: "",
      },
      rare: {
        label: "Raro",
        color: "bg-blue-500",
        textColor: "text-blue-500",
        borderColor: "border-blue-500",
        bgGlow: "shadow-blue-500/20",
      },
      epic: {
        label: "Épico",
        color: "bg-purple-500",
        textColor: "text-purple-500",
        borderColor: "border-purple-500",
        bgGlow: "shadow-purple-500/30",
      },
      legendary: {
        label: "Lendário",
        color: "bg-amber-500",
        textColor: "text-amber-500",
        borderColor: "border-amber-500",
        bgGlow: "shadow-amber-500/40",
      },
    };
    return configs[rarity];
  },

  // Get category config
  getCategoryConfig(category: RewardCategory) {
    const configs = {
      product: { label: "Produto", icon: "🎁" },
      benefit: { label: "Benefício", icon: "🌟" },
      experience: { label: "Experiência", icon: "🎯" },
    };
    return configs[category];
  },

  // ========== ADMIN FUNCTIONS ==========

  // Get all rewards (including inactive) - admin only
  async getAllRewardsAdmin(): Promise<ShopReward[]> {
    const { data, error } = await supabase
      .from("shop_rewards")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as ShopReward[];
  },

  // Create a new reward
  async createReward(
    reward: CreateRewardInput
  ): Promise<ShopReward> {
    const { data, error } = await supabase
      .from("shop_rewards")
      .insert(reward)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to create reward");
    return data as ShopReward;
  },

  // Update a reward
  async updateReward(
    id: string,
    updates: UpdateRewardInput
  ): Promise<ShopReward> {
    const { data, error } = await supabase
      .from("shop_rewards")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Reward not found");
    return data as ShopReward;
  },

  // Delete a reward
  async deleteReward(id: string): Promise<void> {
    const { error } = await supabase
      .from("shop_rewards")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get all purchases (admin) with user profiles
  async getAllPurchasesAdmin(): Promise<(ShopPurchase & { profile?: { display_name: string; email: string } })[]> {
    const { data, error } = await supabase
      .from("shop_purchases")
      .select("*, reward:shop_rewards(*), profile:profiles(display_name, email)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((p: unknown) => {
      const purchase = p as PurchaseQueryResult & { profile?: { display_name: string; email: string } };
      return {
        ...purchase,
        reward: purchase.reward as ShopReward,
        profile: purchase.profile,
      };
    });
  },

  // Update purchase status
  async updatePurchaseStatus(
    purchaseId: string,
    status: PurchaseStatus,
    processedBy: string,
    notes?: string
  ): Promise<void> {
    const { error } = await supabase
      .from("shop_purchases")
      .update({
        status,
        processed_by: processedBy,
        processed_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq("id", purchaseId);

    if (error) throw error;

    // Get purchase details for notification
    const { data: purchase } = await supabase
      .from("shop_purchases")
      .select("user_id, reward:shop_rewards(name)")
      .eq("id", purchaseId)
      .maybeSingle();

    if (purchase) {
      const statusLabels: Record<PurchaseStatus, string> = {
        pending: "Pendente",
        approved: "Aprovado",
        delivered: "Entregue",
        cancelled: "Cancelado",
      };

      try {
        await notificationsService.create({
          user_id: purchase.user_id,
          type: "info",
          title: "📦 Atualização do Pedido",
          message: `Seu pedido de "${(purchase.reward as { name?: string })?.name || 'item'}" foi atualizado para: ${statusLabels[status]}`,
          data: { purchase_id: purchaseId, status },
        });
      } catch (e) {
        logger.apiError("Failed to notify user", e, "shopService");
      }
    }
  },

  // ========== PROMOTIONS FUNCTIONS ==========

  // Get active promotions
  async getActivePromotions(): Promise<ShopPromotion[]> {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("shop_promotions")
      .select("*, reward:shop_rewards(*)")
      .eq("is_active", true)
      .lte("starts_at", now)
      .gt("ends_at", now)
      .order("ends_at", { ascending: true });

    if (error) throw error;
    return (data || []).map((p: unknown) => {
      const promo = p as PromotionQueryResult;
      return { ...promo, reward: promo.reward as ShopReward };
    }) as ShopPromotion[];
  },

  // Get all promotions (admin)
  async getAllPromotionsAdmin(): Promise<ShopPromotion[]> {
    const { data, error } = await supabase
      .from("shop_promotions")
      .select("*, reward:shop_rewards(*)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map((p: unknown) => {
      const promo = p as PromotionQueryResult;
      return { ...promo, reward: promo.reward as ShopReward };
    }) as ShopPromotion[];
  },

  // Create promotion
  async createPromotion(
    promotion: CreatePromotionInput
  ): Promise<ShopPromotion> {
    const { data, error } = await supabase
      .from("shop_promotions")
      .insert(promotion)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Failed to create promotion");
    return data as ShopPromotion;
  },

  // Update promotion
  async updatePromotion(
    id: string,
    updates: UpdatePromotionInput
  ): Promise<ShopPromotion> {
    const { data, error } = await supabase
      .from("shop_promotions")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Promotion not found");
    return data as ShopPromotion;
  },

  // Delete promotion
  async deletePromotion(id: string): Promise<void> {
    const { error } = await supabase
      .from("shop_promotions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Calculate discounted price
  getDiscountedPrice(
    originalPrice: number,
    discountPercent: number | null,
    discountCoins: number | null
  ): number {
    if (discountCoins) {
      return Math.max(0, originalPrice - discountCoins);
    }
    if (discountPercent) {
      return Math.round(originalPrice * (1 - discountPercent / 100));
    }
    return originalPrice;
  },
};
