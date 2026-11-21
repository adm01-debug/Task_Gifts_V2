import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { logger } from "./loggingService";

export type AvatarCategory = 'background' | 'frame' | 'accessory' | 'effect' | 'badge_style';
export type AvatarRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type UnlockType = 'default' | 'level' | 'achievement' | 'purchase' | 'streak' | 'special';

export interface AvatarItem {
  id: string;
  name: string;
  description: string | null;
  category: AvatarCategory;
  icon: string;
  preview_color: string | null;
  rarity: AvatarRarity;
  unlock_type: UnlockType;
  unlock_requirement: number | null;
  unlock_achievement_key: string | null;
  price_coins: number | null;
  is_active: boolean;
  created_at: string;
}

export interface UserAvatarItem {
  id: string;
  user_id: string;
  item_id: string;
  unlocked_at: string;
}

export interface UserAvatarConfig {
  id: string;
  user_id: string;
  selected_background: string | null;
  selected_frame: string | null;
  selected_accessory: string | null;
  selected_effect: string | null;
  selected_badge_style: string | null;
  updated_at: string;
}

export interface AvatarItemWithOwnership extends AvatarItem {
  owned: boolean;
  canUnlock: boolean;
  unlockReason?: string;
}

export const avatarService = {
  async getAllItems(): Promise<AvatarItem[]> {
    const { data, error } = await supabase
      .from("avatar_items")
      .select("*")
      .eq("is_active", true)
      .order("category")
      .order("rarity");

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      category: item.category as AvatarCategory,
      rarity: item.rarity as AvatarRarity,
      unlock_type: item.unlock_type as UnlockType,
    }));
  },

  async getUserOwnedItems(userId: string): Promise<UserAvatarItem[]> {
    const { data, error } = await supabase
      .from("user_avatar_items")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;
    return data || [];
  },

  async getUserConfig(userId: string): Promise<UserAvatarConfig | null> {
    const { data, error } = await supabase
      .from("user_avatar_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getItemsWithOwnership(
    userId: string,
    userLevel: number,
    userStreak: number
  ): Promise<AvatarItemWithOwnership[]> {
    const [allItems, ownedItems] = await Promise.all([
      this.getAllItems(),
      this.getUserOwnedItems(userId),
    ]);

    const ownedIds = new Set(ownedItems.map(i => i.item_id));

    return allItems.map(item => {
      const owned = ownedIds.has(item.id);
      let canUnlock = false;
      let unlockReason = "";

      if (owned) {
        canUnlock = false;
      } else if (item.unlock_type === 'default') {
        canUnlock = true;
        unlockReason = "Disponível gratuitamente";
      } else if (item.unlock_type === 'level') {
        canUnlock = userLevel >= (item.unlock_requirement || 0);
        unlockReason = canUnlock 
          ? "Desbloqueável agora!" 
          : `Necessário nível ${item.unlock_requirement}`;
      } else if (item.unlock_type === 'streak') {
        canUnlock = userStreak >= (item.unlock_requirement || 0);
        unlockReason = canUnlock 
          ? "Desbloqueável agora!" 
          : `Necessário streak de ${item.unlock_requirement} dias`;
      } else if (item.unlock_type === 'purchase') {
        canUnlock = true;
        unlockReason = `${item.price_coins} coins`;
      } else if (item.unlock_type === 'achievement') {
        unlockReason = "Desbloqueie uma conquista especial";
      } else if (item.unlock_type === 'special') {
        unlockReason = "Item especial de evento";
      }

      return { ...item, owned, canUnlock, unlockReason };
    });
  },

  async unlockItem(userId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from("user_avatar_items")
      .insert({ user_id: userId, item_id: itemId });

    if (error) throw error;
  },

  async purchaseItem(userId: string, itemId: string, price: number): Promise<void> {
    // Deduct coins atomically via RPC (SECURITY DEFINER) — valida saldo no banco
    const { error: spendError } = await (supabase as any).rpc("spend_coins", {
      p_user_id: userId,
      p_amount: price,
    });

    if (spendError) {
      throw new Error(spendError.message === "coins insuficientes" ? "Coins insuficientes" : spendError.message);
    }

    await this.unlockItem(userId, itemId);
  },

  async updateConfig(
    userId: string,
    category: AvatarCategory,
    itemId: string | null
  ): Promise<UserAvatarConfig> {
    const columnMap = {
      background: 'selected_background',
      frame: 'selected_frame',
      accessory: 'selected_accessory',
      effect: 'selected_effect',
      badge_style: 'selected_badge_style',
    } as const;

    const column = columnMap[category];
    const changes: Database["public"]["Tables"]["user_avatar_config"]["Update"] = {};
    changes[column] = itemId;
    
    // Check if config exists
    const existingConfig = await this.getUserConfig(userId);

    if (existingConfig) {
      const { data, error } = await supabase
        .from("user_avatar_config")
        .update(changes)
        .eq("user_id", userId)
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to update avatar config");
      return data;
    } else {
      const { data, error } = await supabase
        .from("user_avatar_config")
        .insert({ user_id: userId, ...changes })
        .select()
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Failed to create avatar config");
      return data;
    }
  },

  async initializeDefaultItems(userId: string): Promise<void> {
    // Get all default items
    const { data: defaultItems } = await supabase
      .from("avatar_items")
      .select("id")
      .eq("unlock_type", "default");

    if (!defaultItems || defaultItems.length === 0) return;

    // Check which ones user already has
    const { data: ownedItems } = await supabase
      .from("user_avatar_items")
      .select("item_id")
      .eq("user_id", userId);

    const ownedIds = new Set(ownedItems?.map(i => i.item_id) || []);
    const itemsToAdd = defaultItems.filter(i => !ownedIds.has(i.id));

    if (itemsToAdd.length === 0) return;

    // Add default items
    const { error } = await supabase
      .from("user_avatar_items")
      .insert(itemsToAdd.map(i => ({ user_id: userId, item_id: i.id })));

    if (error) logger.warn('Error initializing default items', error instanceof Error ? error.message : String(error));
  },
};
