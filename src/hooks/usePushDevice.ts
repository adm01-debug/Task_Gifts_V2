import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pushSubscriptionService } from "@/services/pushSubscriptionService";
import { normalizeDeviceLabel } from "@/lib/deviceLabel";

const DEVICE_KEY = ["push", "current-device"] as const;
const SYNC_KEY = ["push", "sync-events"] as const;

/** Inscrição deste navegador + apelido persistido no perfil do usuário. */
export function usePushDevice() {
  const queryClient = useQueryClient();

  const device = useQuery({
    queryKey: DEVICE_KEY,
    queryFn: () => pushSubscriptionService.getCurrentDevice(),
    staleTime: 30_000,
  });

  const rename = useMutation({
    mutationFn: async (label: string) => {
      const res = await pushSubscriptionService.renameCurrentDevice(label);
      if (!res.ok) {
        const map: Record<string, string> = {
          not_authenticated: "Faça login para renomear este dispositivo.",
          no_subscription: "Ative as notificações neste dispositivo antes de dar um apelido.",
          persist_failed: "Não foi possível salvar o apelido.",
        };
        throw new Error(map[res.reason ?? ""] ?? "Não foi possível salvar o apelido.");
      }
      return res.label;
    },
    onSuccess: (label) => {
      toast.success(label ? `Apelido salvo: ${label}` : "Apelido removido.");
      void queryClient.invalidateQueries({ queryKey: DEVICE_KEY });
      void queryClient.invalidateQueries({ queryKey: SYNC_KEY });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o apelido.");
    },
  });

  const save = useCallback(
    (label: string) => {
      const normalized = normalizeDeviceLabel(label);
      // Sem mudança efetiva não vale uma escrita nem um evento de histórico.
      if (normalized === (normalizeDeviceLabel(device.data?.device_label) ?? null)) return;
      rename.mutate(label);
    },
    [device.data?.device_label, rename],
  );

  return {
    device: device.data ?? null,
    isLoading: device.isLoading,
    isSaving: rename.isPending,
    save,
  };
}

/** Histórico curto das últimas sincronizações deste usuário. */
export function usePushSyncHistory(limit = 20) {
  return useQuery({
    queryKey: [...SYNC_KEY, limit],
    queryFn: () => pushSubscriptionService.listSyncEvents(limit),
    staleTime: 30_000,
  });
}
