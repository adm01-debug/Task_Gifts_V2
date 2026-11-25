import { useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList } from "lucide-react";
import { useTypePreferences } from "@/hooks/useTypePreferences";
import type { ChannelMap, NotificationChannel } from "@/lib/notificationTypePrefs";

type SurveyPrefKey = "engagement_survey_reminder" | "climate_survey_reminder";

const ROWS: Array<{ key: SurveyPrefKey; label: string; description: string }> = [
  {
    key: "engagement_survey_reminder",
    label: "Lembrete da pesquisa de engajamento",
    description: "Aviso semanal enquanto você tiver pergunta pendente em um ciclo aberto.",
  },
  {
    key: "climate_survey_reminder",
    label: "Lembrete da pesquisa de clima",
    description: "Aviso nos últimos dias da pesquisa, se você ainda não respondeu.",
  },
];

// Somente os canais que estes lembretes realmente usam. Os dois tipos chamam
// `user_wants_in_app_notification` e `enqueue_push` no banco; nenhum envia e-mail,
// então um interruptor de e-mail aqui prometeria um envio que não existe.
const CHANNELS: Array<{ key: NotificationChannel; label: string }> = [
  { key: "in_app", label: "In-app" },
  { key: "push", label: "Push" },
];

const DEFAULTS: Record<SurveyPrefKey, ChannelMap> = {
  engagement_survey_reminder: { in_app: true, push: true, email: false },
  climate_survey_reminder: { in_app: true, push: true, email: false },
};

const FALLBACK: ChannelMap = { in_app: true, push: true, email: false };
const TYPES = ROWS.map((r) => r.key);

export function SurveyNotificationPreferences() {
  const defaultsFor = useCallback(
    (type: string): ChannelMap => DEFAULTS[type as SurveyPrefKey] ?? FALLBACK,
    [],
  );
  const priorityFor = useCallback(() => "high", []);
  const { loading, saving, values, setCell } = useTypePreferences({
    types: TYPES,
    defaultsFor,
    priorityFor,
    moduleName: "avisos de pesquisa",
  });

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-primary" aria-hidden />
          Avisos de pesquisa
        </CardTitle>
        <CardDescription>
          Escolha por onde receber os lembretes das pesquisas de engajamento e de clima.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
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
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {CHANNELS.map((c) => {
                    const cellId = row.key + ":" + c.key;
                    return (
                      <div
                        key={c.key}
                        className="flex items-center justify-between gap-2 rounded-md border border-border/30 bg-background/40 px-2 py-1.5"
                      >
                        <Label htmlFor={"pref-" + cellId} className="text-xs text-muted-foreground">
                          {c.label}
                        </Label>
                        <Switch
                          id={"pref-" + cellId}
                          checked={values[row.key]?.[c.key] ?? DEFAULTS[row.key][c.key]}
                          disabled={saving === cellId}
                          onCheckedChange={(v) => setCell(row.key, c.key, v)}
                          aria-label={row.label + " · " + c.label}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <p className="pt-1 text-[11px] text-muted-foreground">
              Vale para os lembretes automáticos dos ciclos de pesquisa. As perguntas em si continuam
              disponíveis nas páginas de engajamento e de clima.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SurveyNotificationPreferences;