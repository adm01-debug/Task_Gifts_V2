import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Gamepad2 } from "lucide-react";
import { logger } from "@/services/loggingService";
import {
  type ChannelMap,
  type NotificationChannel,
  mergeChannelPreference,
  mergeManyChannelPreferences,
  normalizeTypePrefs,
  resolveChannels,
} from "@/lib/notificationTypePrefs";

const CHANNELS: Array<{ key: NotificationChannel; label: string }> = [
  { key: "in_app", label: "In-app" },
  { key: "push", label: "Push" },
  { key: "email", label: "E-mail" },
];

interface GameRow {
  key: string;
  label: string;
  description: string;
  defaults: ChannelMap;
}

/**
 * E-mail fica desligado por padrao em todos os eventos de jogo: sao de alta
 * frequencia e o custo de irritacao supera o ganho de engajamento.
 */
const ROWS: readonly GameRow[] = [
  {
    key: "card_pack",
    label: "Pacotes de cartas",
    description: "Ao receber um pacote por tarefa no prazo, trilha concluída ou sequência.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "card_set_reward",
    label: "Coleção completa",
    description: "Quando você fecha um conjunto do álbum e libera a recompensa.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "auction",
    label: "Leilões",
    description: "Lance superado, encerramento e resultado da apuração.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "prediction_market",
    label: "Mercado de previsões",
    description: "Abertura, travamento e liquidação dos mercados em que você apostou.",
    defaults: { in_app: true, push: true, email: false },
  },
  {
    key: "lucky_wheel",
    label: "Roleta da sorte",
    description: "Lembrete do giro diário disponível.",
    defaults: { in_app: true, push: false, email: false },
  },
  {
    key: "tournament",
    label: "Torneios e duelos",
    description: "Confrontos agendados, resultados e avanço de chave.",
    defaults: { in_app: true, push: true, email: false },
  },
];

const ALL_KEYS = ROWS.map((r) => r.key);
const defaultsFor = (type: string): ChannelMap =>
  ROWS.find((r) => r.key === type)?.defaults ?? { in_app: true, push: true, email: false };

type Values = Record<string, ChannelMap>;

function buildDefaults(): Values {
  return ROWS.reduce<Values>((acc, row) => {
    acc[row.key] = { ...row.defaults };
    return acc;
  }, {});
}

/**
 * Matriz de preferencias dos eventos de jogo (tipo x canal).
 * Toda escrita passa pelo motor puro `notificationTypePrefs`, que faz merge
 * aditivo - nao sobrescreve as preferencias de campanhas nem de relatorios.
 */
export function GameNotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [values, setValues] = useState<Values>(buildDefaults);

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
        const next = ROWS.reduce<Values>((acc, row) => {
          acc[row.key] = resolveChannels(prefs, row.key, row.defaults);
          return acc;
        }, {});
        setValues(next);
      } catch (err: unknown) {
        logger.error("Falha ao carregar preferências de jogos", String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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

  const persistCell = async (type: string, channel: NotificationChannel, value: boolean) => {
    if (!user?.id) return;
    const cellId = `${type}:${channel}`;
    const previous = values[type][channel];
    setSaving(cellId);
    setValues((v) => ({ ...v, [type]: { ...v[type], [channel]: value } }));
    try {
      const current = await readCurrent();
      const next = mergeChannelPreference(current, type, channel, value, defaultsFor(type));
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, type_preferences: next }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Preferência atualizada");
    } catch (err: unknown) {
      logger.error("Falha ao salvar preferência de jogo", String(err));
      toast.error("Não foi possível salvar a preferência");
      setValues((v) => ({ ...v, [type]: { ...v[type], [channel]: previous } }));
    } finally {
      setSaving(null);
    }
  };

  const persistAllPush = async (value: boolean) => {
    if (!user?.id) return;
    const previous = values;
    setSaving("bulk:push");
    setValues((v) =>
      ALL_KEYS.reduce<Values>((acc, k) => ({ ...acc, [k]: { ...v[k], push: value } }), { ...v }),
    );
    try {
      const current = await readCurrent();
      const next = mergeManyChannelPreferences(current, ALL_KEYS, "push", value, defaultsFor);
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, type_preferences: next }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success(value ? "Push de jogos ativado" : "Push de jogos silenciado");
    } catch (err: unknown) {
      logger.error("Falha ao salvar preferências de jogos em lote", String(err));
      toast.error("Não foi possível salvar as preferências");
      setValues(previous);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Gamepad2 className="h-4 w-4 text-primary" aria-hidden />
          Notificações dos jogos
        </CardTitle>
        <CardDescription>
          Controle por canal os avisos de pacotes de cartas, leilões, previsões, roleta e torneios.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[36px]"
                disabled={saving !== null}
                onClick={() => persistAllPush(false)}
              >
                Silenciar push
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-[36px]"
                disabled={saving !== null}
                onClick={() => persistAllPush(true)}
              >
                Ativar push
              </Button>
            </div>
            {ROWS.map((row) => (
              <div key={row.key} className="rounded-lg border border-border/40 bg-card/40 p-3">
                <div className="mb-2">
                  <Label className="text-sm font-medium">{row.label}</Label>
                  <p className="text-xs text-muted-foreground">{row.description}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {CHANNELS.map((c) => {
                    const cellId = `${row.key}:${c.key}`;
                    return (
                      <div
                        key={c.key}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/30 bg-background/40 px-2 py-1.5"
                      >
                        <Label htmlFor={`game-pref-${cellId}`} className="text-xs text-muted-foreground">
                          {c.label}
                        </Label>
                        <Switch
                          id={`game-pref-${cellId}`}
                          checked={values[row.key][c.key]}
                          disabled={saving !== null}
                          onCheckedChange={(v) => persistCell(row.key, c.key, v)}
                          aria-label={`${row.label} - ${c.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              O gatilho <code>card_pack_notify</code> e a fila <code>push_outbox</code> consultam estas
              preferências antes de enfileirar qualquer envio.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default GameNotificationPreferences;
