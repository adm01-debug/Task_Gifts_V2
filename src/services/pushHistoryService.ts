import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export type PushLogStatus = "sent" | "failed" | "invalidated" | "skipped";

export interface PushNotificationLog {
  id: string;
  user_id: string;
  subscription_id: string | null;
  endpoint: string | null;
  device_label: string | null;
  campaign_id: string | null;
  type: string;
  title: string;
  message: string;
  url: string | null;
  status: PushLogStatus;
  status_code: number | null;
  error: string | null;
  data: Record<string, unknown> | null;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export const pushHistoryService = {
  /** Lista o histórico do usuário atual. Opcionalmente filtra por subscription (dispositivo). */
  async listMine(params: { subscriptionId?: string | null; limit?: number } = {}): Promise<PushNotificationLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      let q = db
        .from("push_notification_logs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(params.limit ?? 100);
      if (params.subscriptionId) q = q.eq("subscription_id", params.subscriptionId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as PushNotificationLog[];
    } catch (err) {
      logger.apiError("push_history_list", err, "pushHistoryService");
      return [];
    }
  },

  /** Lista dispositivos ativos/desativados do usuário para filtro. */
  async listMyDevices(): Promise<Array<{ id: string; device_label: string | null; endpoint: string; disabled_at: string | null; last_used_at: string | null }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await db
        .from("push_subscriptions")
        .select("id, device_label, endpoint, disabled_at, last_used_at")
        .eq("user_id", user.id)
        .order("last_used_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data ?? [];
    } catch (err) {
      logger.apiError("push_history_devices", err, "pushHistoryService");
      return [];
    }
  },
};