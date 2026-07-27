import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import type { WarStanding } from "@/lib/departmentWar";
import { normalizeFeed, type WarFeedItem } from "@/lib/warFeed";

export type DepartmentWarStatus = "draft" | "running" | "finished" | "cancelled";

export interface DepartmentWar {
  id: string;
  title: string;
  description: string | null;
  status: DepartmentWarStatus;
  starts_at: string;
  ends_at: string;
  fairness_alpha: number;
  per_user_cap: number;
  participation_bonus: number;
  coins_pool: number;
  xp_pool: number;
  placement_shares: number[];
  per_member_coins_cap: number;
  settled_at: string | null;
}

export interface DepartmentWarMetric {
  id: string;
  metric_key: string;
  label: string;
  weight: number;
}

export interface DepartmentWarBoard {
  success: boolean;
  reason?: string;
  war?: DepartmentWar;
  standings: WarStanding[];
}

export interface WarContributionRow {
  id: string;
  metric_key: string;
  amount: number;
  created_at: string;
}

interface StandingRow {
  department_id?: string | null;
  name?: string | null;
  headcount?: number | null;
  raw_score?: number | string | null;
  capped_out?: number | string | null;
  contributors?: number | null;
  participation_rate?: number | string | null;
  score?: number | string | null;
  position?: number | null;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapWar(raw: Record<string, unknown> | null | undefined): DepartmentWar | undefined {
  if (!raw) return undefined;
  const shares = raw.placement_shares;
  return {
    id: String(raw.id ?? ""),
    title: String(raw.title ?? ""),
    description: (raw.description as string | null) ?? null,
    status: (raw.status as DepartmentWarStatus) ?? "draft",
    starts_at: String(raw.starts_at ?? ""),
    ends_at: String(raw.ends_at ?? ""),
    fairness_alpha: toNumber(raw.fairness_alpha, 0.5),
    per_user_cap: toNumber(raw.per_user_cap),
    participation_bonus: toNumber(raw.participation_bonus),
    coins_pool: toNumber(raw.coins_pool),
    xp_pool: toNumber(raw.xp_pool),
    placement_shares: Array.isArray(shares) ? shares.map((s) => toNumber(s)) : [],
    per_member_coins_cap: toNumber(raw.per_member_coins_cap),
    settled_at: (raw.settled_at as string | null) ?? null,
  };
}

function mapStandings(raw: unknown): WarStanding[] {
  if (!Array.isArray(raw)) return [];
  return (raw as StandingRow[]).map((row) => ({
    department_id: String(row.department_id ?? ""),
    name: String(row.name ?? ""),
    headcount: toNumber(row.headcount),
    raw_score: toNumber(row.raw_score),
    capped_out: toNumber(row.capped_out),
    contributors: toNumber(row.contributors),
    participation_rate: toNumber(row.participation_rate),
    score: toNumber(row.score),
    position: toNumber(row.position, 1),
  }));
}

export const departmentWarService = {
  /** Guerras visiveis para o usuario (RLS filtra rascunhos). */
  async list(): Promise<DepartmentWar[]> {
    const { data, error } = await supabase
      .from("department_wars")
      .select("*")
      .order("ends_at", { ascending: false })
      .limit(50);

    if (error) {
      logger.error("Falha ao listar guerras de departamentos", "departmentWarService.list", error);
      throw error;
    }
    return (data ?? [])
      .map((row) => mapWar(row as Record<string, unknown>))
      .filter((war): war is DepartmentWar => !!war);
  },

  /** Placar ao vivo calculado no banco (fonte de verdade). */
  async board(warId: string): Promise<DepartmentWarBoard> {
    const { data, error } = await supabase.rpc("get_department_war_standings", {
      p_war_id: warId,
    });

    if (error) {
      logger.error("Falha ao carregar placar da guerra", "departmentWarService.board", error);
      throw error;
    }

    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      success: payload.success === true,
      reason: payload.reason as string | undefined,
      war: mapWar(payload.war as Record<string, unknown> | undefined),
      standings: mapStandings(payload.standings),
    };
  },

  async metrics(warId: string): Promise<DepartmentWarMetric[]> {
    const { data, error } = await supabase
      .from("department_war_metrics")
      .select("id, metric_key, label, weight")
      .eq("war_id", warId)
      .order("weight", { ascending: false });

    if (error) {
      logger.error("Falha ao carregar metricas da guerra", "departmentWarService.metrics", error);
      throw error;
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      metric_key: row.metric_key,
      label: row.label,
      weight: toNumber(row.weight),
    }));
  },

  /** Contribuicoes do proprio usuario (RLS garante o escopo). */
  async myContributions(warId: string, userId: string): Promise<WarContributionRow[]> {
    const { data, error } = await supabase
      .from("department_war_contributions")
      .select("id, metric_key, amount, created_at")
      .eq("war_id", warId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      logger.error("Falha ao carregar suas contribuicoes", "departmentWarService.myContributions", error);
      throw error;
    }
    return (data ?? []).map((row) => ({
      id: row.id,
      metric_key: row.metric_key,
      amount: toNumber(row.amount),
      created_at: row.created_at,
    }));
  },

  /** Encerramento e credito de premios (apenas admin, idempotente no banco). */
  async settle(warId: string): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc("settle_department_war", {
      p_war_id: warId,
    });
    if (error) {
      logger.error("Falha ao encerrar a guerra", "departmentWarService.settle", error);
      throw error;
    }
    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      success: payload.success === true,
      reason: payload.reason as string | undefined,
    };
  },

  async syncHeadcount(warId: string): Promise<{ success: boolean; reason?: string }> {
    const { data, error } = await supabase.rpc("sync_department_war_headcount", {
      p_war_id: warId,
    });
    if (error) {
      logger.error("Falha ao sincronizar o efetivo dos departamentos", "departmentWarService.syncHeadcount", error);
      throw error;
    }
    const payload = (data ?? {}) as Record<string, unknown>;
    return {
      success: payload.success === true,
      reason: payload.reason as string | undefined,
    };
  },
};