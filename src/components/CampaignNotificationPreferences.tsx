import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { logger } from "@/services/loggingService";

import type { Json } from "@/integrations/supabase/types";
import {
  type ChannelMap,
  type NotificationChannel,
  mergeChannelPreference,
  normalizeTypePrefs,
  resolveChannels,
} from "@/lib/notificationTypePrefs";

type Channel = NotificationChannel;

type CampaignPrefKey =
  | "campaign_enrolled"
  | "campaign_progress"
  | "campaign_milestone"
  | "campaign_completed"
  | "campaign_closed";

const ROWS: Array<{ key: CampaignPrefKey; label: string; description: string }> = [
  { key: "campaign_enrolled",  label: "Nova campanha",       description: "Quando você é inscrito em uma campanha." },
  { key: "campaign_progress",  label: "Progresso registrado", description: "A cada venda ou avanço registrado." },
  { key: "campaign_milestone", label: "Marcos (25/50/75%)",   description: "Ao cruzar cada marco de progresso." },
  { key: "campaign_completed", label: "Meta batida",          description: "Quando você atinge 100% da meta." },
  { key: "campaign_closed",    label: "Campanha encerrada",   description: "Ao final da campanha, com sua posição." },
];

const CHANNELS: Array<{ key: Channel; label: string }> = [
  { key: "in_app", label: "In-app" },
  { key: "push",   label: "Push" },
  { key: "email",  label: "E-mail" },
];

// Defaults por (tipo × canal). E-mail padrão só em marcos terminais.
const DEFAULTS: Record<CampaignPrefKey, Record<Channel, boolean>> = {
  campaign_enrolled:  { in_app: true, push: true, email: false },
  campaign_progress:  { in_app: true, push: true, email: false },
  campaign_milestone: { in_app: true, push: true, email: false },
  campaign_completed: { in_app: true, push: true, email: true  },
  campaign_closed:    { in_app: true, push: true, email: true  },
};

type Values = Record<CampaignPrefKey, Record<Channel, boolean>>;

function cloneDefaults(): Values {
  return (Object.keys(DEFAULTS) as CampaignPrefKey[]).reduce((acc, k) => {
    acc[k] = { ...DEFAULTS[k] };
    return acc;
  }, {} as Values);
}

export function CampaignNotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // `${key}:${channel}`
  const [values, setValues] = useState<Values>(cloneDefaults);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    (async () => {
      try {
        const { data, error } = await supabase
          .from("notification_preferences")
          .select("type_preferences")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        const prefs = normalizeTypePrefs(data?.type_preferences);
        const next = (Object.keys(DEFAULTS) as CampaignPrefKey[]).reduce((acc, k) => {
          acc[k] = resolveChannels(prefs, k, DEFAULTS[k] as ChannelMap);
          return acc;
        }, cloneDefaults());
        setValues(next);
      } catch (err: unknown) {
        logger.error("Falha ao carregar preferências de campanhas", String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const persist = async (key: CampaignPrefKey, channel: Channel, nextValue: boolean) => {
    if (!user?.id) return;
    const cellId = `${key}:${channel}`;
    setSaving(cellId);
    const previous = values[key][channel];
    setValues((v) => ({ ...v, [key]: { ...v[key], [channel]: nextValue } }));
    try {
      const { data: existing, error: readError } = await supabase
        .from("notification_preferences")
        .select("type_preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      if (readError) throw readError;
      // Merge aditivo: preserva os demais canais, a prioridade previa e as
      // preferencias escritas por outros modulos (jogos, relatorios).
      const next = mergeChannelPreference(
        existing?.type_preferences,
        key,
        channel,
        nextValue,
        DEFAULTS[key] as ChannelMap,
        key === "campaign_completed" ? "high" : "normal",
      );
      const { error } = await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, type_preferences: next as unknown as Json },
          { onConflict: "user_id" },
        );
      if (error) throw error;
      toast.success("Preferência atualizada");
    } catch (err: unknown) {
      logger.error("Falha ao salvar preferência de campanha", String(err));
      toast.error("Não foi possível salvar a preferência");
      setValues((v) => ({ ...v, [key]: { ...v[key], [channel]: previous } }));
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" aria-hidden />
          Notificações de campanhas
        </CardTitle>
        <CardDescription>
          Escolha por canal (in-app, push e e-mail) quais avisos de campanhas você quer receber.
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
                        <Label
                          htmlFor={`pref-${cellId}`}
                          className="text-xs text-muted-foreground"
                        >
                          {c.label}
                        </Label>
                        <Switch
                          id={`pref-${cellId}`}
                          checked={values[row.key][c.key]}
                          disabled={saving === cellId}
                          onCheckedChange={(v) => persist(row.key, c.key, v)}
                          aria-label={`${row.label} · ${c.label}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              As RPCs <code>user_wants_in_app_notification</code>, <code>user_wants_push_notification</code> e{" "}
              <code>user_wants_email_notification</code> respeitam estas preferências antes de qualquer envio.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default CampaignNotificationPreferences;