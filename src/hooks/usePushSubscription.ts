import { useCallback, useEffect, useState } from "react";
import { pushSubscriptionService } from "@/services/pushSubscriptionService";
import { toast } from "sonner";

export function usePushSubscription() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    const ok = pushSubscriptionService.isSupported();
    setSupported(ok);
    if (ok) setSubscribed(await pushSubscriptionService.isSubscribed());
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = useCallback(async (next: boolean) => {
    setLoading(true);
    try {
      if (next) {
        const res = await pushSubscriptionService.subscribe();
        if (!res.ok) {
          const map: Record<string, string> = {
            unsupported: "Este dispositivo não suporta notificações push.",
            permission_denied: "Você negou a permissão de notificações.",
            vapid_not_configured: "Push ainda não configurado no servidor.",
            not_authenticated: "Faça login para ativar notificações.",
            persist_failed: "Não foi possível salvar a inscrição.",
            invalid_subscription: "Falha ao criar inscrição.",
          };
          toast.error(map[res.reason ?? ""] ?? "Não foi possível ativar.");
          return;
        }
        toast.success("Notificações ativadas neste dispositivo.");
        setSubscribed(true);
      } else {
        await pushSubscriptionService.unsubscribe();
        toast.success("Notificações desativadas neste dispositivo.");
        setSubscribed(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return { supported, subscribed, loading, toggle, refresh };
}