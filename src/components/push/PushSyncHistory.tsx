import { useMemo } from "react";
import { BellOff, BellRing, History, PencilLine, RefreshCw, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buildSyncHistory, type PushSyncEntry } from "@/lib/deviceLabel";
import { usePushSyncHistory } from "@/hooks/usePushDevice";

const EVENT_ICON: Record<PushSyncEntry["event"], typeof History> = {
  subscribed: BellRing,
  refreshed: RefreshCw,
  renamed: PencilLine,
  disabled: BellOff,
  failed: TriangleAlert,
};

const TONE_CLASS: Record<PushSyncEntry["tone"], string> = {
  success: "text-success",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
};

export interface PushSyncHistoryProps {
  /** Quantos eventos mostrar no painel. */
  limit?: number;
  className?: string;
}

/** Histórico curto das últimas sincronizações de notificações deste usuário. */
export function PushSyncHistory({ limit = 5, className }: PushSyncHistoryProps) {
  const { data, isLoading } = usePushSyncHistory(20);
  const entries = useMemo(() => buildSyncHistory(data, { limit }), [data, limit]);

  return (
    <Card className={cn("glass border-border/50", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-5 h-5 text-primary" aria-hidden />
          Últimas sincronizações
        </CardTitle>
        <CardDescription>
          Registro das ativações, renovações e alterações feitas nos seus dispositivos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma sincronização registrada ainda. Ative as notificações para começar o histórico.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((entry) => {
              const Icon = EVENT_ICON[entry.event];
              return (
                <li
                  key={entry.id}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-card/40 p-3"
                >
                  <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", TONE_CLASS[entry.tone])} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{entry.description}</p>
                    {entry.detail && (
                      <p className="text-xs text-muted-foreground">{entry.detail}</p>
                    )}
                  </div>
                  <time dateTime={entry.createdAt} className="shrink-0 text-xs text-muted-foreground">
                    {entry.relative}
                  </time>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
