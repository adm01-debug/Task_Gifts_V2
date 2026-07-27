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
    type: "proportional" | "flat" | "top_only" | "team_split";
    xp_per_unit?: number;
    coin_per_unit?: number;
    global_bonus_xp?: number;
    global_bonus_coins?: number;
    top_n?: number;
    /** Prêmio coletivo distribuído entre os membros da equipe que bate a meta. */
    team_pool_xp?: number;
    team_pool_coins?: number;
    /** `proportional` (padrão) rateia pela contribuição; `equal` divide igualmente. */
    team_share?: "proportional" | "equal";
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

/** Verifica se o usuário aceita determinado tipo de notificação in-app. */
async function userWantsNotification(userId: string, type: string): Promise<boolean> {
  try {
    const { data, error } = await db.rpc("user_wants_in_app_notification", {
      _user_id: userId,
      _type: type,
    });
    if (error) return true; // fallback permissivo
    return data !== false;
  } catch {
    return true;
  }
}

/** Filtra em lote uma lista de usuários pelas preferências in-app. */
async function filterUsersByPreference(userIds: string[], type: string): Promise<string[]> {
  if (userIds.length === 0) return [];
  try {
    const { data, error } = await db
      .from("notification_preferences")
      .select("user_id, in_app_enabled, type_preferences")
      .in("user_id", userIds);
    if (error) return userIds;
    type Row = {
      user_id: string;
      in_app_enabled: boolean | null;
      type_preferences: Record<string, { in_app?: boolean } | boolean | null> | null;
    };
    const prefs = new Map<string, Row>();
    (data ?? []).forEach((row: Row) => prefs.set(row.user_id, row));
    return userIds.filter((uid) => {
      const p = prefs.get(uid);
      if (!p) return true;
      if (p.in_app_enabled === false) return false;
      const entry = p.type_preferences?.[type];
      if (entry == null) return true;
      if (typeof entry === "boolean") return entry;
      return entry.in_app !== false;
    });
  } catch {
    return userIds;
  }
}

/** Dispara push best-effort via edge function `send-campaign-push`. */
async function sendCampaignPush(params: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  if (!params.userIds.length) return;
  try {
    await supabase.functions.invoke("send-campaign-push", {
      body: {
        user_ids: params.userIds,
        type: params.type,
        title: params.title,
        message: params.message,
        url: params.url,
        data: params.data,
      },
    });
  } catch (err) {
    logger.apiError("send-campaign-push", err, "salesCampaignsService");
  }
}

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

  /**
   * Enrolla em massa todos os membros do departamento da campanha
   * (ou toda a organização, se department_id = null).
   * Idempotente: usa upsert em (campaign_id,user_id).
   */
  async bulkEnroll(campaignId: string): Promise<{ enrolled: number }> {
    const campaign = await this.getById(campaignId);
    if (!campaign) throw new Error("Campanha não encontrada");

    let userIds: string[] = [];
    if (campaign.department_id) {
      const { data, error } = await db
        .from("team_members")
        .select("user_id")
        .eq("department_id", campaign.department_id);
      if (error) throw error;
      userIds = Array.from(
        new Set(
          (data ?? [])
            .map((r: { user_id: string | null }) => r.user_id)
            .filter((v: string | null): v is string => !!v),
        ),
      );
    } else {
      const { data, error } = await db.from("profiles_public").select("id");
      if (error) throw error;
      userIds = (data ?? []).map((r: { id: string }) => r.id);
    }

    if (userIds.length === 0) return { enrolled: 0 };

    const rows = userIds.map((uid) => ({
      campaign_id: campaignId,
      user_id: uid,
      target_adjusted: campaign.target_individual_default,
      accepted_at: new Date().toISOString(),
      declined_at: null,
    }));

    const { error } = await db
      .from("campaign_participants")
      .upsert(rows, { onConflict: "campaign_id,user_id", ignoreDuplicates: false });
    if (error) throw error;

    // Notificação in-app (best-effort): respeita preferências do usuário.
    try {
      const allowedIds = await filterUsersByPreference(userIds, "campaign_enrolled");
      if (allowedIds.length > 0) {
        const notifRows = allowedIds.map((uid) => ({
          user_id: uid,
          type: "campaign_enrolled",
          title: `Você foi inscrito em: ${campaign.name}`,
          message: campaign.target_individual_default
            ? `Meta individual sugerida: ${campaign.target_individual_default} ${campaign.metric_unit ?? ""}. Aceite para começar.`
            : "Acesse a campanha para aceitar sua meta e começar.",
          data: { campaign_id: campaignId, kind: "bulk_enroll" },
        }));
        await db.from("notifications").insert(notifRows);
      }
    } catch {
      // Não bloqueia o enrollment se a notificação falhar.
    }

    return { enrolled: rows.length };
  },

  async logProgress(params: {
    campaignId: string;
    userId?: string;
    delta: number;
    source?: string;
    referenceId?: string;
    note?: string;
  }): Promise<{
    participant: CampaignParticipant;
    justCompleted: boolean;
    milestoneCrossed: 25 | 50 | 75 | null;
  }> {
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
    const participantRow = data as CampaignParticipant;
    const wasCompleted = !!participant.data?.completed_at;
    const justCompleted =
      !wasCompleted &&
      participantRow.target_adjusted > 0 &&
      next >= participantRow.target_adjusted;
    if (campaign && justCompleted) {
      const rule = campaign.split_rule ?? { type: "proportional" };
      const xp = Math.max(campaign.xp_reward, Math.round((rule.xp_per_unit ?? 0) * next));
      const coins = Math.max(campaign.coin_reward, Math.round((rule.coin_per_unit ?? 0) * next));
      if (xp > 0) await profilesService.addXp(uid, xp, `campaign_${campaign.metric_key}`);
      if (coins > 0) await profilesService.addCoins(uid, coins);

      const completedAt = new Date().toISOString();
      await db
        .from("campaign_participants")
        .update({ xp_earned: xp, coins_earned: coins, completed_at: completedAt })
        .eq("id", participantRow.id);

      try {
        const allowed = await userWantsNotification(uid, "campaign_completed");
        if (!allowed) throw new Error("skip");
        const pct = Math.round((next / participantRow.target_adjusted) * 100);
        const dateLabel = new Date(completedAt).toLocaleDateString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        const rewardParts: string[] = [];
        if (xp > 0) rewardParts.push(`+${xp} XP`);
        if (coins > 0) rewardParts.push(`+${coins} moedas`);
        const rewardTxt = rewardParts.length ? ` ${rewardParts.join(" e ")}.` : "";
        await db.from("notifications").insert({
          user_id: uid,
          type: "campaign_completed",
          title: `🏆 Meta concluída: ${campaign.name}`,
          message: `Você atingiu ${next}/${participantRow.target_adjusted} (${pct}%) em ${dateLabel}.${rewardTxt}`,
          data: {
            campaign_id: campaign.id,
            progress: next,
            target: participantRow.target_adjusted,
            percent: pct,
            xp_earned: xp,
            coins_earned: coins,
            completed_at: completedAt,
          },
        });
        void sendCampaignPush({
          userIds: [uid],
          type: "campaign_completed",
          title: `🏆 Meta concluída: ${campaign.name}`,
          message: `Você atingiu ${pct}% da meta.${rewardTxt}`,
          url: `/campanhas/${campaign.id}`,
          data: {
            campaign_id: campaign.id,
            progress: next,
            target: participantRow.target_adjusted,
            percent: pct,
          },
        });
      } catch (err) {
        // Não bloqueia o fluxo se a notificação falhar.
      }
    }

    // Milestone notifications (25/50/75%) — disparadas apenas na transição
    let milestoneCrossed: 25 | 50 | 75 | null = null;
    if (campaign && !justCompleted && participantRow.target_adjusted > 0) {
      try {
        const target = participantRow.target_adjusted;
        const prevPct = (prev / target) * 100;
        const nextPct = (next / target) * 100;
        const milestones = [25, 50, 75] as const;
        const crossed = milestones.find((m) => prevPct < m && nextPct >= m && nextPct < 100);
        if (crossed && (await userWantsNotification(uid, "campaign_milestone"))) {
          milestoneCrossed = crossed;
          const emoji = crossed === 75 ? "🔥" : crossed === 50 ? "⚡" : "🚀";
          await db.from("notifications").insert({
            user_id: uid,
            type: "campaign_milestone",
            title: `${emoji} ${crossed}% da meta em ${campaign.name}`,
            message: `Você já atingiu ${next}/${target} ${campaign.metric_unit ?? ""}. Continue firme!`.trim(),
            data: {
              campaign_id: campaign.id,
              milestone: crossed,
              progress: next,
              target,
            },
          });
          void sendCampaignPush({
            userIds: [uid],
            type: "campaign_milestone",
            title: `${emoji} ${crossed}% da meta`,
            message: `${campaign.name}: ${next}/${target} ${campaign.metric_unit ?? ""}`.trim(),
            url: `/campanhas/${campaign.id}`,
            data: {
              campaign_id: campaign.id,
              milestone: crossed,
              progress: next,
              target,
            },
          });
        }
      } catch {
        // Silencioso: milestone é opcional.
      }
    }

    return { participant: data as CampaignParticipant, justCompleted, milestoneCrossed };
  },
};