import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { AuditRecord, PrizeSnapshot } from "@/lib/luckyWheelAudit";
import type { PayoutSpin } from "@/lib/luckyWheelPayout";

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

/**
 * Giros brutos do período para reconciliação de payout. A policy de SELECT de
 * `lucky_wheel_spins` só devolve giros de terceiros quando `has_role(admin)`,
 * então um não-admin recebe apenas os próprios registros — sem vazamento.
 */
export const luckyWheelPayoutService = {
  async listSpins(days = 30, limit = 5_000): Promise<PayoutSpin[]> {
    const safeDays = Math.min(365, Math.max(1, Math.floor(days)));
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("lucky_wheel_spins")
      .select("id, user_id, prize_id, prize_label, prize_type, amount, spin_date, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(Math.min(20_000, Math.max(1, limit)));

    if (error) {
      logger.apiError("listLuckyWheelSpins", error, "luckyWheelPayoutService");
      throw error;
    }
    return (data ?? []) as PayoutSpin[];
  },

  /**
   * Snapshots diários gerados pelo cron (`snapshot_lucky_wheel_payout`).
   * A tabela só é legível por admins via RLS — um não-admin recebe lista vazia.
   */
  async listSnapshots(days = 90): Promise<PayoutSnapshotRow[]> {
    const safeDays = Math.min(365, Math.max(1, Math.floor(days)));
    const since = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const { data, error } = await supabase
      .from("lucky_wheel_payout_snapshots")
      .select(
        "snapshot_date, spins, unique_users, coins_paid, xp_paid, projected_coins, projected_xp, chi_square, degrees_of_freedom, duplicate_spins, unconfigured_spins",
      )
      .gte("snapshot_date", since)
      .order("snapshot_date", { ascending: true })
      .limit(400);

    if (error) {
      logger.apiError("listLuckyWheelSnapshots", error, "luckyWheelPayoutService");
      throw error;
    }
    return (data ?? []) as PayoutSnapshotRow[];
  },
};

interface RawAuditRow {
  id: string;
  prize_id: string | null;
  operation: string;
  changed_by: string | null;
  changed_at: string;
  before_data: unknown;
  after_data: unknown;
}

function toSnapshot(value: unknown): PrizeSnapshot | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as PrizeSnapshot)
    : null;
}

/**
 * Histórico de calibração. A trilha é escrita por trigger `SECURITY DEFINER`
 * no banco e não possui policy de INSERT/UPDATE/DELETE — é append-only até
 * para administradores, que só têm permissão de leitura.
 */
export const luckyWheelAuditService = {
  async list(limit = 200): Promise<AuditRecord[]> {
    const { data, error } = await supabase
      .from("lucky_wheel_prize_audit")
      .select("id, prize_id, operation, changed_by, changed_at, before_data, after_data")
      .order("changed_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.apiError("listLuckyWheelPrizeAudit", error, "luckyWheelAuditService");
      throw error;
    }

    const rows = (data ?? []) as RawAuditRow[];
    const authorIds = [...new Set(rows.map((r) => r.changed_by).filter((v): v is string => !!v))];

    // Nomes vêm da view pública de perfis: nunca expõe e-mail ou outro PII.
    const names = new Map<string, string>();
    if (authorIds.length > 0) {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles_public")
        .select("id, display_name")
        .in("id", authorIds);
      if (profileError) {
        // Falha de nome não pode derrubar a auditoria: degrada para "Administrador".
        logger.apiError("listLuckyWheelAuditAuthors", profileError, "luckyWheelAuditService");
      }
      for (const profile of profiles ?? []) {
        if (profile.id) names.set(profile.id, profile.display_name ?? "");
      }
    }

    return rows.map<AuditRecord>((row) => ({
      id: row.id,
      prize_id: row.prize_id,
      operation: (row.operation === "INSERT" || row.operation === "DELETE"
        ? row.operation
        : "UPDATE") as AuditRecord["operation"],
      changed_by: row.changed_by,
      changed_by_name: row.changed_by ? (names.get(row.changed_by) ?? null) : null,
      changed_at: row.changed_at,
      before_data: toSnapshot(row.before_data),
      after_data: toSnapshot(row.after_data),
    }));
  },
};