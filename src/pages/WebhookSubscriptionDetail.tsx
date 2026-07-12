import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, CheckCircle2, ChevronDown, Clock, Webhook, XCircle } from "lucide-react";

interface DeliveryLog {
  id: string;
  event_type: string | null;
  response_status: number | null;
  success: boolean;
  error_message: string | null;
  attempt_count: number | null;
  duration_ms: number | null;
  response_body: string | null;
  payload: unknown;
  created_at: string;
}

interface Subscription {
  id: string;
  name: string | null;
  url: string | null;
  event_types: string[] | null;
  is_active: boolean | null;
  last_status: number | null;
  last_triggered_at: string | null;
}

export default function WebhookSubscriptionDetail() {
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    document.title = "Detalhes da Assinatura — Webhooks";
  }, []);

  const { data: sub, isLoading: subLoading } = useQuery<Subscription | null>({
    queryKey: ["webhook-subscription", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .select("id, name, url, event_types, is_active, last_status, last_triggered_at")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return (data as Subscription) || null;
    },
  });

  const { data: logs, isLoading, error, refetch, isFetching } = useQuery<DeliveryLog[]>({
    queryKey: ["webhook-delivery-logs", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_webhook_delivery_logs" as never, {
        p_subscription_id: id,
        p_limit: 100,
      });
      if (error) throw error;
      return (data as DeliveryLog[]) || [];
    },
    refetchInterval: 30_000,
  });

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/webhooks" className="flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </Button>
      </div>

      <header className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
          <Webhook className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">
            {subLoading ? "Carregando..." : sub?.name || "Assinatura sem nome"}
          </h1>
          <p className="text-sm text-muted-foreground truncate">{sub?.url || "—"}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {sub?.is_active === false && <Badge variant="destructive">Inativa</Badge>}
            {sub?.last_status != null && (
              <Badge variant="outline">Último status: {sub.last_status}</Badge>
            )}
            {sub?.event_types?.map((e) => (
              <Badge key={e} variant="secondary">
                {e}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Timeline de Entregas (últimas 100)</CardTitle>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Atualizando…" : "Atualizar"}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">
              Não foi possível carregar os logs: {(error as Error).message}
            </p>
          ) : !logs || logs.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Nenhuma entrega registrada para esta assinatura.
            </p>
          ) : (
            <ol className="relative border-l border-border/60 ml-3 space-y-3">
              {logs.map((log) => (
                <TimelineItem key={log.id} log={log} />
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function TimelineItem({ log }: { log: DeliveryLog }) {
  const [open, setOpen] = useState(false);
  const statusColor = log.success
    ? "bg-primary/10 text-primary border-primary/30"
    : "bg-destructive/10 text-destructive border-destructive/30";
  return (
    <li className="ml-4">
      <span
        className={`absolute -left-[7px] mt-2 w-3 h-3 rounded-full border-2 ${
          log.success ? "bg-primary border-primary" : "bg-destructive border-destructive"
        }`}
      />
      <Collapsible open={open} onOpenChange={setOpen}>
        <div className={`rounded-lg border p-3 ${statusColor}`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              {log.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium truncate">{log.event_type || "evento"}</span>
              <Badge variant="outline" className="tabular-nums">
                {log.response_status ?? "—"}
              </Badge>
              <Badge variant="secondary" className="tabular-nums">
                {log.attempt_count ?? 1} tent.
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1 tabular-nums">
                <Clock className="w-3 h-3" />
                {log.duration_ms ?? 0} ms
              </span>
              <span className="tabular-nums">
                {new Date(log.created_at).toLocaleString("pt-BR")}
              </span>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
          {log.error_message && (
            <p className="text-xs mt-2 text-destructive-foreground/90">{log.error_message}</p>
          )}
          <CollapsibleContent className="mt-3 space-y-3">
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Payload</summary>
              <pre className="mt-2 p-2 rounded bg-muted/50 overflow-x-auto max-h-64 text-[11px]">
                {JSON.stringify(log.payload, null, 2)}
              </pre>
            </details>
            {log.response_body && (
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Response body</summary>
                <pre className="mt-2 p-2 rounded bg-muted/50 overflow-x-auto max-h-64 text-[11px]">
                  {log.response_body}
                </pre>
              </details>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </li>
  );
}