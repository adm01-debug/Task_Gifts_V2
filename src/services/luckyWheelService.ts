import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export type LuckyWheelPrizeType = "coins" | "xp" | "achievement" | "nothing";
export type LuckyWheelRarity = "common" | "rare" | "epic" | "legendary";

export interface LuckyWheelPrize {
  id: string;
  label: string;
  prize_type: LuckyWheelPrizeType;
  amount: number;
  weight: number;
  color: string;
  icon: string;
  rarity: LuckyWheelRarity;
  is_active: boolean;
}

export interface LuckyWheelSpin {
  id: string;
  prize_label: string;
  prize_type: LuckyWheelPrizeType;
  amount: number;
  spin_date: string;
  created_at: string;
}

export interface LuckyWheelStatus {
  can_spin: boolean;
  today: string;
  total_spins: number;
  last_spin: Pick<LuckyWheelSpin, "prize_label" | "prize_type" | "amount" | "spin_date" | "created_at"> | null;
}

export interface LuckyWheelSpinResult {
  success: boolean;
  reason?: "already_spun" | "no_prizes";
  /** true quando o servidor devolveu um giro já registrado (retentativa idempotente). */
  replayed?: boolean;
  prize_id?: string;
  prize_label?: string;
  prize_type?: LuckyWheelPrizeType;
  amount?: number;
  rarity?: LuckyWheelRarity;
  new_xp?: number | null;
  new_level?: number | null;
}

export const luckyWheelService = {
  /** Prêmios ativos, na mesma ordem determinística usada pelo sorteio no servidor. */
  async getPrizes(): Promise<LuckyWheelPrize[]> {
    const { data, error } = await supabase
      .from("lucky_wheel_prizes")
      .select("id, label, prize_type, amount, weight, color, icon, rarity, is_active")
      .eq("is_active", true)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      logger.apiError("getLuckyWheelPrizes", error, "luckyWheelService");
      throw error;
    }
    return (data ?? []) as LuckyWheelPrize[];
  },

  async getStatus(): Promise<LuckyWheelStatus> {
    const { data, error } = await supabase.rpc("get_lucky_wheel_status");
    if (error) {
      logger.apiError("getLuckyWheelStatus", error, "luckyWheelService");
      throw error;
    }
    return data as unknown as LuckyWheelStatus;
  },

  /**
   * O sorteio e o crédito acontecem exclusivamente no servidor (RPC SECURITY DEFINER).
   * `dedupeKey` garante idempotência: reenviar a mesma chave devolve o mesmo prêmio,
   * sem creditar XP/moedas novamente (rede instável, duplo toque, retry automático).
   */
  async spin(dedupeKey?: string): Promise<LuckyWheelSpinResult> {
    const { data, error } = await supabase.rpc(
      "spin_lucky_wheel",
      dedupeKey ? { p_dedupe_key: dedupeKey } : {},
    );
    if (error) {
      logger.apiError("spinLuckyWheel", error, "luckyWheelService");
      throw error;
    }
    return data as unknown as LuckyWheelSpinResult;
  },

  async getHistory(userId: string, limit = 15): Promise<LuckyWheelSpin[]> {
    const { data, error } = await supabase
      .from("lucky_wheel_spins")
      .select("id, prize_label, prize_type, amount, spin_date, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.apiError("getLuckyWheelHistory", error, "luckyWheelService");
      throw error;
    }
    return (data ?? []) as LuckyWheelSpin[];
  },
};

export interface LuckyWheelPrizeInput {
  label: string;
  prize_type: LuckyWheelPrizeType;
  amount: number;
  weight: number;
  color: string;
  icon: string;
  rarity: LuckyWheelRarity;
  is_active: boolean;
}

const ADMIN_PRIZE_COLUMNS =
  "id, label, prize_type, amount, weight, color, icon, rarity, is_active";

/**
 * Operações administrativas de calibração. A RLS de `lucky_wheel_prizes`
 * já restringe escrita a `has_role(auth.uid(), 'admin')`; o cliente nunca
 * consegue alterar pesos sem esse papel, mesmo chamando direto o endpoint.
 */
export const luckyWheelAdminService = {
  /** Inclui prêmios inativos (visível apenas para admins pela policy de SELECT). */
  async listAll(): Promise<LuckyWheelPrize[]> {
    const { data, error } = await supabase
      .from("lucky_wheel_prizes")
      .select(ADMIN_PRIZE_COLUMNS)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      logger.apiError("listAllLuckyWheelPrizes", error, "luckyWheelAdminService");
      throw error;
    }
    return (data ?? []) as LuckyWheelPrize[];
  },

  async create(input: LuckyWheelPrizeInput): Promise<LuckyWheelPrize> {
    const { data, error } = await supabase
      .from("lucky_wheel_prizes")
      .insert(input)
      .select(ADMIN_PRIZE_COLUMNS)
      .single();

    if (error) {
      logger.apiError("createLuckyWheelPrize", error, "luckyWheelAdminService");
      throw error;
    }
    return data as LuckyWheelPrize;
  },

  async update(id: string, patch: Partial<LuckyWheelPrizeInput>): Promise<void> {
    const { error } = await supabase.from("lucky_wheel_prizes").update(patch).eq("id", id);
    if (error) {
      logger.apiError("updateLuckyWheelPrize", error, "luckyWheelAdminService");
      throw error;
    }
  },

  /**
   * Salva várias calibrações de uma vez. Percorre em série para que uma falha
   * de RLS/constraint identifique exatamente qual prêmio a causou.
   */
  async saveMany(patches: ReadonlyArray<{ id: string } & Partial<LuckyWheelPrizeInput>>): Promise<void> {
    for (const { id, ...patch } of patches) {
      if (Object.keys(patch).length === 0) continue;
      await luckyWheelAdminService.update(id, patch);
    }
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("lucky_wheel_prizes").delete().eq("id", id);
    if (error) {
      logger.apiError("deleteLuckyWheelPrize", error, "luckyWheelAdminService");
      throw error;
    }
  },
};