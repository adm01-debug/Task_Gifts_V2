import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

/** Equipe de uma campanha de vendas (meta coletiva). */
export interface CampaignTeam {
  id: string;
  campaign_id: string;
  name: string;
  color: string | null;
  department_id: string | null;
  target_team: number;
  progress: number;
  progress_percent: number;
  rank_position: number | null;
  members_count: number;
  awarded_at: string | null;
  xp_awarded: number;
  coins_awarded: number;
  created_at: string;
  updated_at: string;
}

/** Membro de uma equipe, já enriquecido com o perfil público. */
export interface CampaignTeamMember {
  id: string;
  team_id: string;
  campaign_id: string;
  user_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    level: number | null;
  } | null;
}

export interface CampaignTeamInsert {
  campaign_id: string;
  name: string;
  color?: string | null;
  department_id?: string | null;
  target_team: number;
}

export interface TeamSplitResult {
  teams_awarded: number;
  members_awarded: number;
  members_skipped?: number;
  total_xp_paid?: number;
  total_coins_paid?: number;
  batch_id?: string | null;
  reason?: string;
}

/** Lote de execução do rateio coletivo (trilha de auditoria). */
export interface TeamSplitBatch {
  id: string;
  campaign_id: string;
  executed_by: string | null;
  share_mode: string;
  pool_xp: number;
  pool_coins: number;
  teams_awarded: number;
  members_awarded: number;
  members_skipped: number;
  total_xp_paid: number;
  total_coins_paid: number;
  status: string;
  reason: string | null;
  reverted_at: string | null;
  reverted_by: string | null;
  created_at: string;
}

/** Linha individual do rateio: paga ou pulada, sempre com motivo. */
export interface TeamSplitEntry {
  id: string;
  batch_id: string;
  campaign_id: string;
  team_id: string | null;
  team_name: string | null;
  user_id: string | null;
  user_identifier: string | null;
  member_progress: number;
  team_progress: number;
  team_target: number;
  share_percent: number;
  xp_allocated: number;
  coins_allocated: number;
  outcome: "paid" | "skipped" | string;
  failure_reason: string | null;
  created_at: string;
}

// Tipos gerados são atualizados após a migração; cast defensivo até lá.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const campaignTeamsService = {
  /** Lista as equipes de uma campanha, já ordenadas pelo ranking coletivo. */
  async list(campaignId: string): Promise<CampaignTeam[]> {
    try {
      const { data, error } = await db
        .from("campaign_teams")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("rank_position", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as CampaignTeam[];
    } catch (err) {
      logger.apiError("list campaign_teams", err, "campaignTeamsService");
      return [];
    }
  },

  /**
   * Lista equipes de várias campanhas em uma única viagem.
   * Usado pelo dashboard consolidado (filtro por campanha + período).
   */
  async listByCampaigns(campaignIds: string[]): Promise<CampaignTeam[]> {
    const ids = Array.from(new Set(campaignIds.filter(Boolean)));
    if (ids.length === 0) return [];
    try {
      const { data, error } = await db
        .from("campaign_teams")
        .select("*")
        .in("campaign_id", ids);
      if (error) throw error;
      return (data ?? []) as CampaignTeam[];
    } catch (err) {
      logger.apiError("list campaign_teams by campaigns", err, "campaignTeamsService");
      return [];
    }
  },

  /**
   * Conta membros por equipe em várias campanhas.
   * PostgREST não expõe `GROUP BY`, então agregamos no cliente sobre um
   * payload enxuto (apenas `team_id`).
   */
  async countMembersByCampaigns(campaignIds: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const ids = Array.from(new Set(campaignIds.filter(Boolean)));
    if (ids.length === 0) return counts;
    try {
      const { data, error } = await db
        .from("campaign_team_members")
        .select("team_id")
        .in("campaign_id", ids);
      if (error) throw error;
      (data ?? []).forEach((row: { team_id: string }) => {
        counts.set(row.team_id, (counts.get(row.team_id) ?? 0) + 1);
      });
      return counts;
    } catch (err) {
      logger.apiError("count campaign_team_members", err, "campaignTeamsService");
      return counts;
    }
  },

  /** Lista os membros de todas as equipes de uma campanha com perfil público. */
  async listMembers(campaignId: string): Promise<CampaignTeamMember[]> {
    try {
      const { data, error } = await db
        .from("campaign_team_members")
        .select("*")
        .eq("campaign_id", campaignId);
      if (error) throw error;
      const rows = (data ?? []) as CampaignTeamMember[];
      if (rows.length === 0) return rows;

      const ids = Array.from(new Set(rows.map((r) => r.user_id)));
      const { data: profiles } = await db
        .from("profiles_public")
        .select("id, display_name, avatar_url, level")
        .in("id", ids);
      const byId = new Map<string, CampaignTeamMember["profile"]>();
      (profiles ?? []).forEach(
        (p: { id: string; display_name: string | null; avatar_url: string | null; level: number | null }) => {
          byId.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url, level: p.level });
        },
      );
      return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
    } catch (err) {
      logger.apiError("list campaign_team_members", err, "campaignTeamsService");
      return [];
    }
  },

  async create(payload: CampaignTeamInsert): Promise<CampaignTeam> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await db
      .from("campaign_teams")
      .insert({ ...payload, created_by: user?.id ?? null })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as CampaignTeam;
  },

  async update(id: string, updates: Partial<CampaignTeamInsert>): Promise<CampaignTeam> {
    const { data, error } = await db
      .from("campaign_teams")
      .update(updates)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as CampaignTeam;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from("campaign_teams").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Move (ou adiciona) colaboradores para uma equipe.
   * O índice único (campaign_id, user_id) garante que cada pessoa fique em
   * apenas uma equipe por campanha — por isso usamos upsert com esse conflito.
   */
  async setMembers(params: { campaignId: string; teamId: string; userIds: string[] }): Promise<number> {
    const unique = Array.from(new Set(params.userIds.filter(Boolean)));
    if (unique.length === 0) return 0;
    const rows = unique.map((uid) => ({
      team_id: params.teamId,
      campaign_id: params.campaignId,
      user_id: uid,
    }));
    const { error } = await db
      .from("campaign_team_members")
      .upsert(rows, { onConflict: "campaign_id,user_id" });
    if (error) throw error;
    await this.recalc(params.campaignId);
    return rows.length;
  },

  async removeMember(params: { campaignId: string; userId: string }): Promise<void> {
    const { error } = await db
      .from("campaign_team_members")
      .delete()
      .eq("campaign_id", params.campaignId)
      .eq("user_id", params.userId);
    if (error) throw error;
    await this.recalc(params.campaignId);
  },

  /** Recalcula progresso e ranking coletivo no servidor. */
  async recalc(campaignId: string): Promise<void> {
    const { error } = await db.rpc("recalc_campaign_teams", { _campaign_id: campaignId });
    if (error) throw error;
  },

  /**
   * Executa o rateio do prêmio coletivo (`team_split`).
   * Idempotente no servidor: equipes já premiadas têm `awarded_at` preenchido.
   */
  async awardTeamSplit(campaignId: string): Promise<TeamSplitResult> {
    const { data, error } = await db.rpc("award_campaign_team_split", { _campaign_id: campaignId });
    if (error) throw error;
    return (data ?? { teams_awarded: 0, members_awarded: 0 }) as TeamSplitResult;
  },

  /** Histórico de lotes de rateio da campanha (mais recentes primeiro). */
  async listSplitBatches(campaignId: string): Promise<TeamSplitBatch[]> {
    try {
      const { data, error } = await db
        .from("campaign_team_split_batches")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as TeamSplitBatch[];
    } catch (err) {
      logger.apiError("list campaign_team_split_batches", err, "campaignTeamsService");
      return [];
    }
  },

  /** Linhas auditáveis de um lote: pagas primeiro, depois as puladas. */
  async listSplitEntries(batchId: string): Promise<TeamSplitEntry[]> {
    try {
      const { data, error } = await db
        .from("campaign_team_split_entries")
        .select("*")
        .eq("batch_id", batchId)
        .order("outcome", { ascending: true })
        .order("xp_allocated", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TeamSplitEntry[];
    } catch (err) {
      logger.apiError("list campaign_team_split_entries", err, "campaignTeamsService");
      return [];
    }
  },

  /**
   * Reverte um lote de rateio: estorna XP/moedas, libera as equipes para novo
   * rateio e fecha o lote na trilha. Idempotente na própria RPC.
   */
  async revertSplitBatch(batchId: string, reason?: string): Promise<TeamSplitRevertResult> {
    const { data, error } = await db.rpc("revert_campaign_team_split", {
      _batch_id: batchId,
      _reason: reason?.trim() || null,
    });
    if (error) {
      logger.apiError("revert_campaign_team_split", error, "campaignTeamsService");
      throw error;
    }
    return (data ?? { reverted: false, reason: "batch_not_found" }) as TeamSplitRevertResult;
  },
};