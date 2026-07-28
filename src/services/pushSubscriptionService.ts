import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";
import { invokeEdgeSafe } from "@/lib/requestId";
import {
  normalizeDeviceLabel,
  type PushSyncEvent,
  type PushSyncEventType,
} from "@/lib/deviceLabel";
import {
  buildRevocationBroadcast,
  buildRevocationNotice,
  type PushDeviceEntry,
  type PushDeviceRow,
} from "@/lib/pushDevices";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";

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
      const { data, error } = await invokeEdgeSafe<{ publicKey: string | null }>("push-public-key");
      if (error) return null;
      return data?.publicKey ?? null;
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
          // Une esta inscrição ao aparelho registrado em `user_devices`.
          device_fingerprint: getDeviceFingerprint(),
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

  /** Endpoint da inscrição deste navegador, se houver. */
  async getCurrentEndpoint(): Promise<string | null> {
    try {
      if (!this.isSupported()) return null;
      const reg = await navigator.serviceWorker.getRegistration(SW_URL);
      const sub = await reg?.pushManager.getSubscription();
      return sub?.endpoint ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Aparelhos da conta já unificados por impressão digital: acessos com push,
   * acessos sem push e inscrições antigas sem fingerprint aparecem uma vez só.
   */
  async listDevices(): Promise<PushDeviceRow[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await db.rpc("get_account_devices");
      if (error) throw error;
      type AccountDeviceRow = {
        device_key: string;
        fingerprint: string | null;
        subscription_id: string | null;
        endpoint: string | null;
        device_label: string | null;
        user_agent: string | null;
        browser: string | null;
        os: string | null;
        device_type: string | null;
        is_trusted: boolean | null;
        push_active: boolean | null;
        last_seen_at: string | null;
        last_used_at: string | null;
        created_at: string | null;
        disabled_at: string | null;
        disabled_reason: string | null;
        failure_count: number | null;
      };
      return ((data ?? []) as AccountDeviceRow[]).map((r) => ({
        id: r.device_key,
        endpoint: r.endpoint ?? "",
        device_fingerprint: r.fingerprint,
        subscription_id: r.subscription_id,
        device_label: r.device_label,
        user_agent: r.user_agent,
        browser: r.browser,
        os: r.os,
        device_type: r.device_type,
        is_trusted: r.is_trusted,
        push_active: r.push_active,
        last_seen_at: r.last_seen_at,
        last_used_at: r.last_used_at,
        created_at: r.created_at,
        disabled_at: r.disabled_at,
        disabled_reason: r.disabled_reason,
        failure_count: r.failure_count,
      }));
    } catch (err) {
      logger.error("push_list_devices_failed", "push", err);
      return [];
    }
  },

  /**
   * Revoga um dispositivo remoto. A RPC faz update + log numa transação só,
   * com trava de linha para tolerar cliques simultâneos em abas diferentes.
   * Quando o alvo é o próprio navegador, também cancela a inscrição local.
   */
  async revokeDevice(
    subscriptionId: string | null,
    options: { isCurrent?: boolean; label?: string; fingerprint?: string | null; deviceKey?: string } = {},
  ): Promise<{ ok: boolean; alreadyRevoked?: boolean; reason?: string }> {
    try {
      // Com inscrição de push, a RPC já derruba em cascata todas as demais
      // inscrições do mesmo aparelho e marca o acesso como removido. Sem
      // inscrição (aparelho só com histórico de login), revoga por fingerprint.
      const { data, error } = subscriptionId
        ? await db.rpc("revoke_push_device", {
            p_subscription_id: subscriptionId,
            p_reason: "revoked_by_user",
          })
        : await db.rpc("revoke_device_by_fingerprint", {
            p_fingerprint: options.fingerprint ?? "",
            p_reason: "revoked_by_user",
          });
      if (error) {
        const msg = String(error.message ?? "");
        if (msg.includes("device_not_found")) return { ok: false, reason: "not_found" };
        if (msg.includes("not_authenticated")) return { ok: false, reason: "not_authenticated" };
        throw error;
      }

      if (options.isCurrent) {
        // Melhor esforço: se o navegador não soltar a inscrição, o servidor
        // já parou de enviar porque a linha está com disabled_at preenchido.
        try {
          const reg = await navigator.serviceWorker.getRegistration(SW_URL);
          const sub = await reg?.pushManager.getSubscription();
          await sub?.unsubscribe();
        } catch (err) {
          logger.error("push_local_unsubscribe_failed", "push", err);
        }
      }

      const row = Array.isArray(data) ? data[0] : data;
      const alreadyRevoked = row?.revoked === false;
      // Avisa a conta (todos os aparelhos veem o alerta in-app) apenas quando
      // houve mudança real de estado — reprocessar não deve gerar ruído.
      if (!alreadyRevoked) {
        await this.notifyRevocation({
          id: subscriptionId ?? options.deviceKey ?? options.fingerprint ?? "device",
          label: options.label ?? "Dispositivo desconhecido",
          isCurrent: options.isCurrent === true,
        });
      }
      return { ok: true, alreadyRevoked };
    } catch (err) {
      logger.error("push_revoke_device_failed", "push", err);
      return { ok: false, reason: "revoke_failed" };
    }
  },

  /**
   * Registra o aviso in-app de revogação. Best-effort: uma falha aqui não
   * pode reverter nem mascarar a revogação, que é a ação de segurança.
   */
  async notifyRevocation(
    entry: Pick<PushDeviceEntry, "id" | "label" | "isCurrent">,
  ): Promise<void> {
    const notice = buildRevocationNotice(entry);
    if (!notice) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await db.from("notifications").insert({
        user_id: user.id,
        type: notice.type,
        title: notice.title,
        message: notice.message,
        data: notice.data,
      });
      await recordSyncEvent({
        userId: user.id,
        event: "revoked",
        deviceLabel: notice.data.device_label,
        detail: notice.message,
      });
    } catch (err) {
      logger.error("push_revocation_notice_failed", "push", err);
    }

    // Push real aos demais aparelhos: quem não executou a ação precisa saber
    // fora do app. Best-effort — falha aqui não desfaz a revogação.
    const broadcast = buildRevocationBroadcast(entry);
    if (broadcast) {
      try {
        await invokeEdgeSafe("push-device-revoked", {
          body: {
            exclude_subscription_id: broadcast.exclude_subscription_id,
            title: broadcast.title,
            message: broadcast.message,
            url: broadcast.url,
            data: broadcast.data,
          },
        });
      } catch (err) {
        logger.error("push_revocation_broadcast_failed", "push", err);
      }
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
        // Escopo explícito por usuário: a RLS já protege, mas um filtro só por
        // endpoint dependeria dela como única barreira.
        if (user) {
          await db
            .from("push_subscriptions")
            .update({ disabled_at: new Date().toISOString(), disabled_reason: "disabled_by_user" })
            .eq("endpoint", endpoint)
            .eq("user_id", user.id);
        }

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