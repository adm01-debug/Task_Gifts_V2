import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, BellRing, CheckCircle2, Loader2, RefreshCw, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { evaluateOutboxHealth, type OutboxHealthSnapshot } from "@/lib/pushOutboxHealth";

interface RawHealth {
  window_hours: number;
  pending: number;
  processing: number;
  stuck: number;
  sent: number;
  failed: number;
  skipped: number;
  oldest_pending_minutes: number;
  minutes_since_last_dispatch: number | null;
  top_errors: Array<{ error: string; count: number }>;
  recent_failures: Array<{
    id: string;
    type: string;
    title: string;
    attempts: number;
    last_error: string | null;
    created_at: string;
  }>;
}

function toSnapshot(raw: RawHealth): OutboxHealthSnapshot {
  return {
    pending: Number(raw.pending),
    processing: Number(raw.processing),
    stuck: Number(raw.stuck),
    sent: Number(raw.sent),
    failed: Number(raw.failed),
    skipped: Number(raw.skipped),
    oldestPendingMinutes: Number(raw.oldest_pending_minutes),
    minutesSinceLastDispatch:
      raw.minutes_since_last_dispatch === null ? null : Number(raw.minutes_since_last_dispatch),
  };
}

export function PushOutboxHealthPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["push-outbox-health"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_push_outbox_health", { p_hours: 24 });
      if (error) throw error;
      return data as unknown as RawHealth;
    },
    refetchInterval: 60000,
  });

  const report = useMemo(() => (data ? evaluateOutboxHealth(toSnapshot(data)) : null), [data]);

  const requeueMutation = useMutation({
    mutationFn: async (ids?: string[]) => {
      const { data, error } = await supabase.rpc("requeue_push_outbox", {
        p_ids: ids ?? undefined,
        p_include_stuck: true,
      });
      if (error) throw error;
      return Number(data ?? 0);
    },
    onSuccess: (count: number) => {
      toast.success(
        count > 0
          ? `${count} notificação(ões) reenfileirada(s).`
          : "Nenhuma notificação elegível para reenvio.",
      );
      queryClient.invalidateQueries({ queryKey: ["push-outbox-health"] });
    },
    onError: () => toast.error("Não foi possível reenfileirar as notificações."),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-56" /></CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data || !report) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Não foi possível carregar a saúde da fila de notificações.</AlertDescription>
      </Alert>
    );
  }

  const severityStyles: Record<string, string> = {
    ok: "text-emerald-500",
    warning: "text-amber-500",
    critical: "text-destructive",
  };

  const metrics = [
    { label: "Pendentes", value: data.pending },
    { label: "Processando", value: data.processing },
    { label: "Entregues (24h)", value: data.sent },
    { label: "Falhas (24h)", value: data.failed },
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BellRing className="h-5 w-5 text-primary" />
            Fila de Notificações Push
          </CardTitle>
          <CardDescription>
            Saúde do outbox nas últimas {data.window_hours}h · entrega {(report.deliveryRate * 100).toFixed(1)}%
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => requeueMutation.mutate(undefined)}
            disabled={requeueMutation.isPending || (data.failed === 0 && data.stuck === 0)}
          >
            {requeueMutation.isPending
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <RotateCcw className="mr-2 h-4 w-4" />}
            Reenfileirar falhas
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Score de saúde</span>
            <span className={cn("font-semibold", severityStyles[report.severity])}>{report.score}/100</span>
          </div>
          <Progress value={report.score} />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-2xl font-bold">{m.value}</p>
            </div>
          ))}
        </div>

        {report.alerts.length === 0 ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <AlertDescription>Fila saudável — nenhum alerta ativo.</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {report.alerts.map((alert) => (
              <Alert key={alert.code} variant={alert.severity === "critical" ? "destructive" : "default"}>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="flex items-center gap-2">
                  <Badge variant={alert.severity === "critical" ? "destructive" : "secondary"}>
                    {alert.severity === "critical" ? "Crítico" : "Atenção"}
                  </Badge>
                  {alert.message}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {data.top_errors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Principais erros</p>
            <div className="flex flex-wrap gap-2">
              {data.top_errors.map((e) => (
                <Badge key={e.error} variant="outline" className="max-w-full truncate">
                  {e.error} · {e.count}x
                </Badge>
              ))}
            </div>
          </div>
        )}

        {data.recent_failures.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Falhas recentes</p>
            <div className="space-y-2">
              {data.recent_failures.slice(0, 8).map((f) => (
                <div key={f.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{f.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {f.type} · {f.attempts} tentativa(s) · {f.last_error ?? "erro desconhecido"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => requeueMutation.mutate([f.id])}
                    disabled={requeueMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
