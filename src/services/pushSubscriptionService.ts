import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import {
  normalizeDeviceLabel,
  type PushSyncEvent,
  type PushSyncEventType,
} from "@/lib/deviceLabel";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/**
 * Registra um evento de sincronização. Nunca propaga erro: o histórico é
 * telemetria de apoio e não pode derrubar o fluxo de inscrição.
 */
async function recordSyncEvent(params: {
  userId: string;
  event: PushSyncEventType;
  endpoint?: string | null;
  deviceLabel?: string | null;
  detail?: string | null;
}): Promise<void> {
  try {
    await db.from("push_sync_events").insert({
      user_id: params.userId,
      endpoint: params.endpoint ?? null,
      device_label: normalizeDeviceLabel(params.deviceLabel),
      event: params.event,
      detail: params.detail ?? null,
    });
  } catch (err) {
    logger.error("push_sync_event_failed", "push", err);
  }
}

const SW_URL = "/push-sw.js";

function isPreviewHost(): boolean {
  if (typeof window === "undefined") return true;
  const h = window.location.hostname;
  return (
    h.startsWith("id-preview--") ||
    h.startsWith("preview--") ||
    h.endsWith(".lovableproject.com") ||
    h.endsWith(".lovableproject-dev.com") ||
    h.endsWith(".beta.lovable.dev") ||
    window.self !== window.top
  );
}

export const pushSubscriptionService = {
  isSupported(): boolean {
    return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && !isPreviewHost();
  },

  async getPublicKey(): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke("push-public-key");
      if (error) return null;
      return (data as { publicKey: string | null } | null)?.publicKey ?? null;
    } catch {
      return null;
    }
  },

  async subscribe(deviceLabel?: string): Promise<{ ok: boolean; reason?: string }> {
    if (!this.isSupported()) return { ok: false, reason: "unsupported" };
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return { ok: false, reason: "permission_denied" };

    const publicKey = await this.getPublicKey();
    if (!publicKey) return { ok: false, reason: "vapid_not_configured" };

    const registration = await navigator.serviceWorker.register(SW_URL, { scope: "/" });
    await navigator.serviceWorker.ready;

    let sub = await registration.pushManager.getSubscription();
    if (!sub) {
      const key = urlBase64ToUint8Array(publicKey);
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: key.buffer as ArrayBuffer,
      });
    }

    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!sub.endpoint || !p256dh || !auth) return { ok: false, reason: "invalid_subscription" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, reason: "not_authenticated" };

    // Preserva o apelido já salvo pelo usuário quando a renovação não traz um novo.
    const { data: existing } = await db
      .from("push_subscriptions")
      .select("id, device_label")
      .eq("user_id", user.id)
      .eq("endpoint", sub.endpoint)
      .maybeSingle();

    const label =
      normalizeDeviceLabel(deviceLabel) ??
      normalizeDeviceLabel((existing as { device_label?: string } | null)?.device_label);

    const { error } = await db
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          device_label: label,
          disabled_at: null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );
    if (error) {
      logger.error("push_subscribe_failed", "push", error);
      await recordSyncEvent({
        userId: user.id,
        event: "failed",
        endpoint: sub.endpoint,
        deviceLabel: label,
        detail: "Não foi possível salvar a inscrição.",
      });
      return { ok: false, reason: "persist_failed" };
    }

    await recordSyncEvent({
      userId: user.id,
      event: existing ? "refreshed" : "subscribed",
      endpoint: sub.endpoint,
      deviceLabel: label,
    });
    return { ok: true };
  },

  /** Inscrição deste navegador (endpoint atual) do usuário logado. */
  async getCurrentDevice(): Promise<{
    id: string;
    endpoint: string;
    device_label: string | null;
    user_agent: string | null;
    last_used_at: string | null;
  } | null> {
    try {
      if (!this.isSupported()) return null;
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      if (!sub?.endpoint) return null;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await db
        .from("push_subscriptions")
        .select("id, endpoint, device_label, user_agent, last_used_at")
        .eq("user_id", user.id)
        .eq("endpoint", sub.endpoint)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    } catch (err) {
      logger.error("push_current_device_failed", "push", err);
      return null;
    }
  },

  /**
   * Renomeia o dispositivo atual no servidor (perfil do usuário), não em
   * armazenamento local — o apelido acompanha a conta em qualquer estação.
   */
  async renameCurrentDevice(label: string): Promise<{ ok: boolean; label: string | null; reason?: string }> {
    const normalized = normalizeDeviceLabel(label);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { ok: false, label: null, reason: "not_authenticated" };
      const current = await this.getCurrentDevice();
      if (!current) return { ok: false, label: null, reason: "no_subscription" };

      const { error } = await db
        .from("push_subscriptions")
        .update({ device_label: normalized })
        .eq("id", current.id)
        .eq("user_id", user.id);
      if (error) throw error;

      await recordSyncEvent({
        userId: user.id,
        event: "renamed",
        endpoint: current.endpoint,
        deviceLabel: normalized,
      });
      return { ok: true, label: normalized };
    } catch (err) {
      logger.error("push_rename_device_failed", "push", err);
      return { ok: false, label: null, reason: "persist_failed" };
    }
  },

  /** Histórico curto de sincronizações do usuário logado. */
  async listSyncEvents(limit = 20): Promise<PushSyncEvent[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await db
        .from("push_sync_events")
        .select("id, event, device_label, detail, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as PushSyncEvent[];
    } catch (err) {
      logger.error("push_sync_history_failed", "push", err);
      return [];
    }
  },

  async unsubscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        const { data: { user } } = await supabase.auth.getUser();
        const { data: row } = user
          ? await db
              .from("push_subscriptions")
              .select("device_label")
              .eq("user_id", user.id)
              .eq("endpoint", endpoint)
              .maybeSingle()
          : { data: null };

        await sub.unsubscribe();
        await db
          .from("push_subscriptions")
          .update({ disabled_at: new Date().toISOString() })
          .eq("endpoint", endpoint);

        if (user) {
          await recordSyncEvent({
            userId: user.id,
            event: "disabled",
            endpoint,
            deviceLabel: (row as { device_label?: string } | null)?.device_label ?? null,
          });
        }
      }
      return true;
    } catch (err) {
      logger.error("push_unsubscribe_failed", "push", err);
      return false;
    }
  },

  async isSubscribed(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    const sub = await reg?.pushManager.getSubscription();
    return !!sub;
  },
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}