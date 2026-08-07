import { useCallback, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pushSubscriptionService } from "@/services/pushSubscriptionService";
import { normalizeDeviceLabel } from "@/lib/deviceLabel";
import { getDeviceFingerprint } from "@/lib/deviceFingerprint";
import {
  buildDeviceList,
  canRevokeDevice,
  summarizeDevices,
  type PushDeviceEntry,
} from "@/lib/pushDevices";

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
const DEVICES_KEY = ["push", "devices"] as const;
const ENDPOINT_KEY = ["push", "current-endpoint"] as const;

/**
 * Lista de dispositivos inscritos + revogação remota.
 *
 * A lista é derivada da camada pura `buildDeviceList`, que decide status,
 * rótulo e ordenação — o hook só cuida de cache, invalidação e feedback.
 */
export function usePushDevices() {
  const queryClient = useQueryClient();

  const endpoint = useQuery({
    queryKey: ENDPOINT_KEY,
    queryFn: () => pushSubscriptionService.getCurrentEndpoint(),
    staleTime: 60_000,
  });

  const query = useQuery({
    queryKey: DEVICES_KEY,
    queryFn: () => pushSubscriptionService.listDevices(),
    staleTime: 30_000,
  });

  const devices = useMemo(
    () =>
      buildDeviceList(query.data, {
        currentEndpoint: endpoint.data ?? null,
        // Sem push ativo neste navegador ainda dá para reconhecer o aparelho
        // atual pela impressão digital, evitando revogar a si mesmo sem aviso.
        currentFingerprint: getDeviceFingerprint(),
      }),
    [query.data, endpoint.data],
  );

  const revoke = useMutation({
    mutationFn: async (entry: PushDeviceEntry) => {
      const guard = canRevokeDevice(entry, { confirmedCurrent: true });
      if (!guard.allowed) throw new Error(guard.reason ?? "not_allowed");
      const res = await pushSubscriptionService.revokeDevice(entry.subscriptionId, {
        isCurrent: entry.isCurrent,
        label: entry.label,
        fingerprint: entry.fingerprint,
        deviceKey: entry.id,
      });
      if (!res.ok) {
        const map: Record<string, string> = {
          not_found: "Este dispositivo não está mais na sua conta.",
          not_authenticated: "Faça login novamente para remover dispositivos.",
          revoke_failed: "Não foi possível remover o acesso deste dispositivo.",
        };
        throw new Error(map[res.reason ?? ""] ?? "Não foi possível remover o acesso deste dispositivo.");
      }
      return { entry, alreadyRevoked: res.alreadyRevoked === true };
    },
    onSuccess: ({ entry, alreadyRevoked }) => {
      toast.success(
        alreadyRevoked
          ? `${entry.label} já estava sem acesso.`
          : `Acesso removido de ${entry.label}.`,
      );
      void queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
      void queryClient.invalidateQueries({ queryKey: DEVICE_KEY });
      void queryClient.invalidateQueries({ queryKey: SYNC_KEY });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o acesso.");
    },
  });

  return {
    devices,
    summary: useMemo(() => summarizeDevices(devices), [devices]),
    isLoading: query.isLoading || endpoint.isLoading,
    revoke: revoke.mutate,
    revokingId: revoke.isPending ? (revoke.variables as PushDeviceEntry | undefined)?.id ?? null : null,
  };
}

export function usePushSyncHistory(limit = 20) {
  return useQuery({
    queryKey: [...SYNC_KEY, limit],
    queryFn: () => pushSubscriptionService.listSyncEvents(limit),
    staleTime: 30_000,
  });
}
