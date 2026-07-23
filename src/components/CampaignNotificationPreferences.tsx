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

type TypePrefs = Record<string, { push?: boolean; email?: boolean; in_app?: boolean; priority?: string }>;

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

const DEFAULTS: Record<CampaignPrefKey, boolean> = {
  campaign_enrolled: true,
  campaign_progress: true,
  campaign_milestone: true,
  campaign_completed: true,
  campaign_closed: true,
};

export function CampaignNotificationPreferences() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<CampaignPrefKey | null>(null);
  const [values, setValues] = useState<Record<CampaignPrefKey, boolean>>({ ...DEFAULTS });

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
        const prefs = (data?.type_preferences as TypePrefs) || {};
        const next = { ...DEFAULTS };
        (Object.keys(DEFAULTS) as CampaignPrefKey[]).forEach((k) => {
          const v = prefs[k]?.in_app;
          if (typeof v === "boolean") next[k] = v;
        });
        setValues(next);
      } catch (err: unknown) {
        logger.error("Falha ao carregar preferências de campanhas", String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const persist = async (key: CampaignPrefKey, nextValue: boolean) => {
    if (!user?.id) return;
    setSaving(key);
    const previous = values[key];
    setValues((v) => ({ ...v, [key]: nextValue }));
    try {
      const { data: existing } = await supabase
        .from("notification_preferences")
        .select("type_preferences")
        .eq("user_id", user.id)
        .maybeSingle();
      const current = (existing?.type_preferences as TypePrefs) || {};
      const prior = current[key] || {};
      const next: TypePrefs = {
        ...current,
        [key]: {
          push: prior.push ?? true,
          email: prior.email ?? (key === "campaign_completed" || key === "campaign_closed"),
          in_app: nextValue,
          priority: prior.priority ?? (key === "campaign_completed" ? "high" : "normal"),
        },
      };
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: user.id, type_preferences: next }, { onConflict: "user_id" });
      if (error) throw error;
      toast.success("Preferência atualizada");
    } catch (err: unknown) {
      logger.error("Falha ao salvar preferência de campanha", String(err));
      toast.error("Não foi possível salvar a preferência");
      setValues((v) => ({ ...v, [key]: previous }));
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
          Escolha quais avisos in-app você quer receber sobre campanhas comerciais.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : (
          ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 rounded-lg border border-border/40 bg-card/40 p-3">
              <div className="min-w-0">
                <Label htmlFor={`pref-${row.key}`} className="text-sm font-medium">{row.label}</Label>
                <p className="text-xs text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                id={`pref-${row.key}`}
                checked={values[row.key]}
                disabled={saving === row.key}
                onCheckedChange={(v) => persist(row.key, v)}
              />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default CampaignNotificationPreferences;