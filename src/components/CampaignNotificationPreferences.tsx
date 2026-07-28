import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy } from "lucide-react";
import { useTypePreferences } from "@/hooks/useTypePreferences";
import type { ChannelMap, NotificationChannel } from "@/lib/notificationTypePrefs";

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
const DEFAULTS: Record<CampaignPrefKey, ChannelMap> = {
  campaign_enrolled:  { in_app: true, push: true, email: false },
  campaign_progress:  { in_app: true, push: true, email: false },
  campaign_milestone: { in_app: true, push: true, email: false },
  campaign_completed: { in_app: true, push: true, email: true  },
  campaign_closed:    { in_app: true, push: true, email: true  },
};

const TYPES = ROWS.map((r) => r.key);
const FALLBACK: ChannelMap = { in_app: true, push: true, email: false };

export function CampaignNotificationPreferences() {
  // Toda a mecanica de ler/mesclar/gravar (aditiva entre modulos) vive no hook.
  const defaultsFor = useCallback(
    (type: string): ChannelMap => DEFAULTS[type as CampaignPrefKey] ?? FALLBACK,
    [],
  );
  const priorityFor = useCallback(
    (type: string) => (type === "campaign_completed" ? "high" : "normal"),
    [],
  );
  const { loading, saving, values, setCell, setChannelForAll } = useTypePreferences({
    types: TYPES,
    defaultsFor,
    priorityFor,
    moduleName: "campanhas",
  });

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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-[36px]"
                disabled={saving !== null}
                onClick={() => setChannelForAll("push", false)}
              >
                Silenciar push
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="min-h-[36px]"
                disabled={saving !== null}
                onClick={() => setChannelForAll("push", true)}
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
                        <Label
                          htmlFor={`pref-${cellId}`}
                          className="text-xs text-muted-foreground"
                        >
                          {c.label}
                        </Label>
                        <Switch
                          id={`pref-${cellId}`}
                          checked={values[row.key]?.[c.key] ?? DEFAULTS[row.key][c.key]}
                          disabled={saving === cellId}
                          onCheckedChange={(v) => setCell(row.key, c.key, v)}
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