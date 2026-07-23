import { useMemo, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Smartphone, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { usePushHistory } from "@/hooks/usePushHistory";
import { cn } from "@/lib/utils";
import type { PushLogStatus } from "@/services/pushHistoryService";

function deviceLabelFromUA(ua: string | null | undefined): string {
  if (!ua) return "Dispositivo desconhecido";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/windows/i.test(ua)) return "Windows";
  if (/linux/i.test(ua)) return "Linux";
  return "Navegador";
}

function statusMeta(s: PushLogStatus) {
  switch (s) {
    case "sent":
      return { label: "Enviado", cls: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", Icon: CheckCircle2 };
    case "failed":
      return { label: "Falha", cls: "bg-destructive/15 text-destructive border-destructive/30", Icon: XCircle };
    case "invalidated":
      return { label: "Inscrição inválida", cls: "bg-amber-500/15 text-amber-500 border-amber-500/30", Icon: AlertTriangle };
    case "skipped":
      return { label: "Ignorado", cls: "bg-muted text-muted-foreground border-border", Icon: AlertTriangle };
  }
}

export function PushNotificationHistory() {
  const [deviceId, setDeviceId] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const { logs, devices, isLoading, refetch } = usePushHistory(deviceId === "all" ? null : deviceId);

  const filtered = useMemo(
    () => (status === "all" ? logs : logs.filter((l) => l.status === status)),
    [logs, status],
  );

  const counts = useMemo(() => {
    const c = { sent: 0, failed: 0, invalidated: 0, skipped: 0 } as Record<PushLogStatus, number>;
    for (const l of logs) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [logs]);

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" /> Histórico de notificações Web Push
          </CardTitle>
          <CardDescription>
            Últimos envios por dispositivo — status, horário e erro retornado pelo servidor de push.
          </CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={refetch} className="shrink-0">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500">✓ {counts.sent} enviados</Badge>
          <Badge variant="outline" className="border-destructive/30 text-destructive">✕ {counts.failed} falhas</Badge>
          <Badge variant="outline" className="border-amber-500/30 text-amber-500">! {counts.invalidated} inválidos</Badge>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger>
                <SelectValue placeholder="Dispositivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os dispositivos ({devices.length})</SelectItem>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.device_label || deviceLabelFromUA(d.endpoint)}
                    {d.disabled_at ? " · desativado" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:w-52">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <Filter className="mr-2 h-3.5 w-3.5" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="sent">Enviado</SelectItem>
                <SelectItem value="failed">Falha</SelectItem>
                <SelectItem value="invalidated">Inscrição inválida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum envio registrado ainda para este filtro.
          </div>
        ) : (
          <ScrollArea className="h-[420px] pr-2">
            <ul className="space-y-2">
              {filtered.map((log) => {
                const meta = statusMeta(log.status);
                const Icon = meta.Icon;
                const when = new Date(log.created_at);
                return (
                  <li
                    key={log.id}
                    className="rounded-lg border border-border bg-card/50 p-3 transition-colors hover:bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4 shrink-0", meta.cls.split(" ")[1])} />
                          <p className="truncate text-sm font-medium">{log.title}</p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{log.message}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                          <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", meta.cls)}>
                            {meta.label}
                            {log.status_code ? ` · ${log.status_code}` : ""}
                          </Badge>
                          <span className="font-mono">{log.type}</span>
                          <span>·</span>
                          <span title={format(when, "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}>
                            {formatDistanceToNow(when, { addSuffix: true, locale: ptBR })}
                          </span>
                          {log.device_label ? (
                            <>
                              <span>·</span>
                              <span>{log.device_label}</span>
                            </>
                          ) : null}
                        </div>
                        {log.error ? (
                          <p className="mt-2 rounded border border-destructive/20 bg-destructive/5 px-2 py-1 font-mono text-[11px] text-destructive/80">
                            {log.error.slice(0, 240)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default PushNotificationHistory;