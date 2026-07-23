import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

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
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
    }

    const json = sub.toJSON();
    const p256dh = json.keys?.p256dh;
    const auth = json.keys?.auth;
    if (!sub.endpoint || !p256dh || !auth) return { ok: false, reason: "invalid_subscription" };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, reason: "not_authenticated" };

    const { error } = await (supabase as unknown as { from: (t: string) => { upsert: (r: unknown, o: unknown) => Promise<{ error: { message: string } | null }> } })
      .from("push_subscriptions")
      .upsert(
        {
          user_id: user.id,
          endpoint: sub.endpoint,
          p256dh,
          auth,
          user_agent: navigator.userAgent,
          device_label: deviceLabel ?? null,
          disabled_at: null,
          last_used_at: new Date().toISOString(),
        },
        { onConflict: "user_id,endpoint" },
      );
    if (error) {
      logger.error("push_subscribe_failed", { message: error.message });
      return { ok: false, reason: "persist_failed" };
    }
    return { ok: true };
  },

  async unsubscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        const endpoint = sub.endpoint;
        await sub.unsubscribe();
        await (supabase as unknown as { from: (t: string) => { update: (r: unknown) => { eq: (c: string, v: string) => Promise<unknown> } } })
          .from("push_subscriptions")
          .update({ disabled_at: new Date().toISOString() })
          .eq("endpoint", endpoint);
      }
      return true;
    } catch (err) {
      logger.error("push_unsubscribe_failed", { err: (err as Error).message });
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