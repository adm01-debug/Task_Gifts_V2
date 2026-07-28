import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { BossDamageRules, BossDamageSource } from "@/lib/bossBattle";
import { DEFAULT_DAMAGE_RULES } from "@/lib/bossBattle";

export type BossBattleStatus = "draft" | "running" | "defeated" | "expired" | "settled";

export interface BossBattle {
  id: string;
  title: string;
  description: string | null;
  department_id: string | null;
  status: BossBattleStatus;
  total_hp: number;
  current_hp: number;
  starts_at: string;
  ends_at: string;
  damage_rules: BossDamageRules;
  per_user_cap: number;
  coins_pool: number;
  xp_pool: number;
  min_share: number;
  per_user_coins_cap: number;
  defeated_at: string | null;
  settled_at: string | null;
}

export interface BossDamageEntry {
  id: string;
  user_id: string;
  source: BossDamageSource;
  damage: number;
  wasted: number;
  created_at: string;
}

export interface DealDamageResult {
  applied: number;
  wasted: number;
  defeated: boolean;
  duplicate: boolean;
  reason?: string;
}

/** Normaliza as regras vindas do JSONB para o formato do motor puro. */
function parseRules(raw: unknown): BossDamageRules {
  if (!raw || typeof raw !== "object") return DEFAULT_DAMAGE_RULES;
  const value = raw as Partial<BossDamageRules>;
  return {
    base: { ...DEFAULT_DAMAGE_RULES.base, ...(value.base ?? {}) },
    maxMultiplier: Number(value.maxMultiplier) > 0 ? Number(value.maxMultiplier) : DEFAULT_DAMAGE_RULES.maxMultiplier,
    perUserCap: Number(value.perUserCap) > 0 ? Number(value.perUserCap) : 0,
  };
}

function mapBattle(row: Record<string, unknown>): BossBattle {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    description: (row.description as string | null) ?? null,
    department_id: (row.department_id as string | null) ?? null,
    status: (row.status as BossBattleStatus) ?? "draft",
    total_hp: Number(row.total_hp ?? 0),
    current_hp: Number(row.current_hp ?? 0),
    starts_at: String(row.starts_at ?? ""),
    ends_at: String(row.ends_at ?? ""),
    damage_rules: parseRules(row.damage_rules),
    per_user_cap: Number(row.per_user_cap ?? 0),
    coins_pool: Number(row.coins_pool ?? 0),
    xp_pool: Number(row.xp_pool ?? 0),
    min_share: Number(row.min_share ?? 0),
    per_user_coins_cap: Number(row.per_user_coins_cap ?? 0),
    defeated_at: (row.defeated_at as string | null) ?? null,
    settled_at: (row.settled_at as string | null) ?? null,
  };
}

export const bossBattleService = {
  async list(): Promise<BossBattle[]> {
    const { data, error } = await supabase
      .from("boss_battles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      logger.error("Falha ao listar chefões", String(error.message));
      throw error;
    }
    return (data || []).map((row) => mapBattle(row as Record<string, unknown>));
  },

  async myDamage(battleId: string, userId: string): Promise<BossDamageEntry[]> {
    const { data, error } = await supabase
      .from("boss_battle_damage")
      .select("id, user_id, source, damage, wasted, created_at")
      .eq("battle_id", battleId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      logger.error("Falha ao carregar golpes", String(error.message));
      throw error;
    }
    return (data || []) as unknown as BossDamageEntry[];
  },

  /** Dano sempre server-side: RPC SECURITY DEFINER com dedupe_key idempotente. */
  async dealDamage(params: {
    battleId: string;
    source: BossDamageSource;
    dedupeKey: string;
    sourceId?: string | null;
    multiplier?: number;
    amount?: number;
  }): Promise<DealDamageResult> {
    const { data, error } = await supabase.rpc("deal_boss_damage", {
      _battle_id: params.battleId,
      _source: params.source,
      _dedupe_key: params.dedupeKey,
      _source_id: params.sourceId ?? null,
      _multiplier: params.multiplier ?? 1,
      _amount: params.amount ?? null,
    });
    if (error) {
      logger.error("Falha ao aplicar dano no chefão", String(error.message));
      throw error;
    }
    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      applied: Number(payload.applied ?? 0),
      wasted: Number(payload.wasted ?? 0),
      defeated: Boolean(payload.defeated),
      duplicate: Boolean(payload.duplicate),
      reason: payload.reason ? String(payload.reason) : undefined,
    };
  },

  async settle(battleId: string): Promise<{ coins: number; xp: number; alreadySettled: boolean }> {
    const { data, error } = await supabase.rpc("settle_boss_battle", { _battle_id: battleId });
    if (error) {
      logger.error("Falha ao apurar chefão", String(error.message));
      throw error;
    }
    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      coins: Number(payload.coins ?? 0),
      xp: Number(payload.xp ?? 0),
      alreadySettled: Boolean(payload.already_settled),
    };
  },
};