import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import { profilesService } from "./profilesService";

export interface SalesCampaign {
  id: string;
  org_id: string | null;
  department_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  product_name: string | null;
  metric_key: string;
  metric_unit: string;
  start_date: string;
  end_date: string;
  target_global: number;
  target_individual_default: number;
  progress_global: number;
  split_rule: {
    type: "proportional" | "flat" | "top_only";
    xp_per_unit?: number;
    coin_per_unit?: number;
    global_bonus_xp?: number;
    global_bonus_coins?: number;
    top_n?: number;
  };
  xp_reward: number;
  coin_reward: number;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  cover_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignParticipant {
  id: string;
  campaign_id: string;
  user_id: string;
  target_adjusted: number;
  progress: number;
  progress_percent: number;
  accepted_at: string | null;
  declined_at: string | null;
  completed_at: string | null;
  xp_earned: number;
  coins_earned: number;
  rank_position: number | null;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    level: number | null;
  } | null;
}

export interface CampaignInsert {
  name: string;
  description?: string;
  sku?: string;
  product_name?: string;
  metric_key?: string;
  metric_unit?: string;
  start_date: string;
  end_date: string;
  target_global: number;
  target_individual_default: number;
  department_id?: string | null;
  status?: SalesCampaign["status"];
  split_rule?: SalesCampaign["split_rule"];
  xp_reward?: number;
  coin_reward?: number;
}

// Supabase types are regenerated after migration; use loose cast until then.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const salesCampaignsService = {
  async list(status?: SalesCampaign["status"]): Promise<SalesCampaign[]> {
    try {
      let q = db.from("sales_campaigns").select("*").order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as SalesCampaign[];
    } catch (err) {
      logger.apiError("list sales_campaigns", err, "salesCampaignsService");
      return [];
    }
  },

  async getById(id: string): Promise<SalesCampaign | null> {
    const { data, error } = await db.from("sales_campaigns").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return (data ?? null) as SalesCampaign | null;
  },

  async create(payload: CampaignInsert): Promise<SalesCampaign> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { data, error } = await db
      .from("sales_campaigns")
      .insert({ ...payload, created_by: user.id })
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as SalesCampaign;
  },

  async update(id: string, updates: Partial<CampaignInsert>): Promise<SalesCampaign> {
    const { data, error } = await db.from("sales_campaigns").update(updates).eq("id", id).select().maybeSingle();
    if (error) throw error;
    return data as SalesCampaign;
  },

  async remove(id: string): Promise<void> {
    const { error } = await db.from("sales_campaigns").delete().eq("id", id);
    if (error) throw error;
  },

  // ==== Participants ====
  async listParticipants(campaignId: string): Promise<CampaignParticipant[]> {
    const { data, error } = await db
      .from("campaign_participants")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("rank_position", { ascending: true, nullsFirst: false });
    if (error) throw error;
    const rows = (data ?? []) as CampaignParticipant[];
    if (rows.length === 0) return rows;

    const ids = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles } = await db
      .from("profiles_public")
      .select("id, display_name, avatar_url, level")
      .in("id", ids);
    const byId = new Map<string, { display_name: string | null; avatar_url: string | null; level: number | null }>();
    (profiles ?? []).forEach((p: { id: string; display_name: string | null; avatar_url: string | null; level: number | null }) => {
      byId.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url, level: p.level });
    });
    return rows.map((r) => ({ ...r, profile: byId.get(r.user_id) ?? null }));
  },

  async getMyParticipation(campaignId: string): Promise<CampaignParticipant | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await db
      .from("campaign_participants")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as CampaignParticipant | null;
  },

  async acceptGoal(campaignId: string, targetAdjusted?: number): Promise<CampaignParticipant> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const campaign = await this.getById(campaignId);
    if (!campaign) throw new Error("Campanha não encontrada");
    const target = targetAdjusted ?? campaign.target_individual_default;

    // Upsert
    const { data, error } = await db
      .from("campaign_participants")
      .upsert(
        {
          campaign_id: campaignId,
          user_id: user.id,
          target_adjusted: target,
          accepted_at: new Date().toISOString(),
          declined_at: null,
        },
        { onConflict: "campaign_id,user_id" },
      )
      .select()
      .maybeSingle();
    if (error) throw error;
    return data as CampaignParticipant;
  },

  async declineGoal(campaignId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");
    const { error } = await db
      .from("campaign_participants")
      .upsert(
        {
          campaign_id: campaignId,
          user_id: user.id,
          declined_at: new Date().toISOString(),
          accepted_at: null,
        },
        { onConflict: "campaign_id,user_id" },
      );
    if (error) throw error;
  },

  async logProgress(params: {
    campaignId: string;
    userId?: string;
    delta: number;
    source?: string;
    referenceId?: string;
    note?: string;
  }): Promise<CampaignParticipant> {
    const { data: { user } } = await supabase.auth.getUser();
    const uid = params.userId ?? user?.id;
    if (!uid) throw new Error("Não autenticado");

    const participant = await db
      .from("campaign_participants")
      .select("*")
      .eq("campaign_id", params.campaignId)
      .eq("user_id", uid)
      .maybeSingle();

    const prev = (participant.data?.progress ?? 0) as number;
    const next = prev + params.delta;

    const { data, error } = await db
      .from("campaign_participants")
      .upsert(
        {
          campaign_id: params.campaignId,
          user_id: uid,
          progress: next,
          accepted_at: participant.data?.accepted_at ?? new Date().toISOString(),
        },
        { onConflict: "campaign_id,user_id" },
      )
      .select()
      .maybeSingle();
    if (error) throw error;

    await db.from("campaign_progress_events").insert({
      campaign_id: params.campaignId,
      user_id: uid,
      delta: params.delta,
      previous_value: prev,
      new_value: next,
      source: params.source ?? "manual",
      reference_id: params.referenceId,
      note: params.note,
    });

    // Recalculate aggregate and ranking
    await db.rpc("recalc_campaign_progress", { _campaign_id: params.campaignId });

    // Reward on individual completion
    const campaign = await this.getById(params.campaignId);
    if (campaign && next >= (data as CampaignParticipant).target_adjusted && (data as CampaignParticipant).target_adjusted > 0) {
      const rule = campaign.split_rule ?? { type: "proportional" };
      const xp = Math.max(campaign.xp_reward, Math.round((rule.xp_per_unit ?? 0) * next));
      const coins = Math.max(campaign.coin_reward, Math.round((rule.coin_per_unit ?? 0) * next));
      if (xp > 0) await profilesService.addXp(uid, xp, `campaign_${campaign.metric_key}`);
      if (coins > 0) await profilesService.addCoins(uid, coins);

      await db
        .from("campaign_participants")
        .update({ xp_earned: xp, coins_earned: coins })
        .eq("id", (data as CampaignParticipant).id);
    }

    return data as CampaignParticipant;
  },
};