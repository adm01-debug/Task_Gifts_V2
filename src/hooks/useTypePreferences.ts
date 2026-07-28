import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";
import type { Json } from "@/integrations/supabase/types";
import {
  type ChannelMap,
  type NotificationChannel,
  mergeChannelPreference,
  mergeManyChannelPreferences,
  normalizeTypePrefs,
  resolveChannels,
} from "@/lib/notificationTypePrefs";

/**
 * Hook de acesso a `notification_preferences.type_preferences`.
 *
 * Por que existe: tres telas distintas (jogos, campanhas e relatorio executivo)
 * escrevem no MESMO documento JSONB. Cada uma duplicava a mesma sequencia
 * "ler -> merge -> upsert -> rollback otimista", e qualquer divergencia nessa
 * sequencia causa perda silenciosa das preferencias dos outros modulos.
 * Centralizamos aqui, sobre o motor puro `notificationTypePrefs`.
 *
 * Garantias:
 *  - Escrita sempre aditiva (nunca sobrescreve tipos/canais de outros modulos).
 *  - Se a leitura previa falhar, a escrita e abortada (nunca gravamos sobre
 *    um estado desconhecido).
 *  - UI otimista com rollback deterministico para o valor anterior ao clique.
 *  - Cleanup por `cancelled` para evitar setState apos unmount.
 */

export interface UseTypePreferencesOptions {
  /** Tipos de notificacao gerenciados por esta tela. */
  types: readonly string[];
  /** Defaults por tipo — usados quando o banco nao tem valor explicito. */
  defaultsFor: (type: string) => ChannelMap;
  /** Prioridade gravada na primeira escrita de cada tipo. */
  priorityFor?: (type: string) => string | undefined;
  /** Usado apenas em logs, para identificar o modulo de origem. */
  moduleName: string;
}

export type PreferenceValues = Record<string, ChannelMap>;

export interface UseTypePreferencesResult {
  loading: boolean;
  /** Identificador da celula em gravacao (`tipo:canal`) ou `bulk:<canal>`. */
  saving: string | null;
  values: PreferenceValues;
  setCell: (type: string, channel: NotificationChannel, value: boolean) => Promise<void>;
  setChannelForAll: (channel: NotificationChannel, value: boolean) => Promise<void>;
}

export function useTypePreferences(
  options: UseTypePreferencesOptions,
): UseTypePreferencesResult {
  const { types, defaultsFor, priorityFor, moduleName } = options;
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Guardamos as opcoes em ref: elas costumam ser literais recriados a cada
  // render e nao devem re-disparar o efeito de carga.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const buildDefaults = useCallback((): PreferenceValues => {
    const { types: t, defaultsFor: d } = optionsRef.current;
    return t.reduce<PreferenceValues>((acc, type) => {
      acc[type] = { ...d(type) };
      return acc;
    }, {});
  }, []);

  const [values, setValues] = useState<PreferenceValues>(buildDefaults);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("type_preferences")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        if (cancelled) return;
        const prefs = normalizeTypePrefs(data?.type_preferences);
        const { types: t, defaultsFor: d } = optionsRef.current;
        setValues(
          t.reduce<PreferenceValues>((acc, type) => {
            acc[type] = resolveChannels(prefs, type, d(type));
            return acc;
          }, {}),
        );
      } catch (err: unknown) {
        logger.error(`Falha ao carregar preferências (${moduleName})`, String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, moduleName]);

  /** Le o documento atual. Lanca em erro — o chamador aborta a escrita. */
  const readCurrent = useCallback(async (): Promise<unknown> => {
    if (!user?.id) return {};
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("type_preferences")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data?.type_preferences ?? {};
  }, [user?.id]);

  const write = useCallback(
    async (next: Record<string, unknown>) => {
      if (!user?.id) return;
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, type_preferences: next as unknown as Json },
          { onConflict: "user_id" },
        );
      if (error) throw error;
    },
    [user?.id],
  );

  const setCell = useCallback(
    async (type: string, channel: NotificationChannel, value: boolean) => {
      if (!user?.id) return;
      const cellId = `${type}:${channel}`;
      const previous = values[type]?.[channel] ?? optionsRef.current.defaultsFor(type)[channel];
      setSaving(cellId);
      setValues((v) => ({
        ...v,
        [type]: { ...(v[type] ?? optionsRef.current.defaultsFor(type)), [channel]: value },
      }));
      try {
        const current = await readCurrent();
        const next = mergeChannelPreference(
          current,
          type,
          channel,
          value,
          optionsRef.current.defaultsFor(type),
          optionsRef.current.priorityFor?.(type),
        );
        await write(next);
        toast.success("Preferência atualizada");
      } catch (err: unknown) {
        logger.error(`Falha ao salvar preferência (${moduleName})`, String(err));
        toast.error("Não foi possível salvar a preferência");
        setValues((v) => ({ ...v, [type]: { ...v[type], [channel]: previous } }));
      } finally {
        setSaving(null);
      }
    },
    [user?.id, values, readCurrent, write, moduleName],
  );

  const setChannelForAll = useCallback(
    async (channel: NotificationChannel, value: boolean) => {
      if (!user?.id) return;
      const snapshot = values;
      const list = optionsRef.current.types;
      setSaving(`bulk:${channel}`);
      setValues((v) =>
        list.reduce<PreferenceValues>(
          (acc, type) => ({
            ...acc,
            [type]: { ...(v[type] ?? optionsRef.current.defaultsFor(type)), [channel]: value },
          }),
          { ...v },
        ),
      );
      try {
        const current = await readCurrent();
        const next = mergeManyChannelPreferences(
          current,
          list,
          channel,
          value,
          optionsRef.current.defaultsFor,
        );
        await write(next);
        toast.success("Preferências atualizadas");
      } catch (err: unknown) {
        logger.error(`Falha ao salvar preferências em lote (${moduleName})`, String(err));
        toast.error("Não foi possível salvar as preferências");
        setValues(snapshot);
      } finally {
        setSaving(null);
      }
    },
    [user?.id, values, readCurrent, write, moduleName],
  );

  return { loading, saving, values, setCell, setChannelForAll };
}
