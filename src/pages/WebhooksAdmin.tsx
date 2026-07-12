import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, CheckCircle2, Webhook } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

interface WebhookStat {
  subscription_id: string;
  subscription_name: string | null;
  subscription_url: string | null;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate_pct: number | null;
  avg_duration_ms: number | null;
  p50_duration_ms: number | null;
  p95_duration_ms: number | null;
  p99_duration_ms: number | null;
  max_duration_ms: number | null;
  avg_attempts: number | null;
  last_delivery_at: string | null;
}

export default function WebhooksAdmin() {
  useSEO({
    title: "Observabilidade de Webhooks — Últimas 24h",
    description: "Painel administrativo com métricas de entrega, latência P50/P95/P99 e taxa de sucesso por assinatura de webhook.",
  });

  const { data, isLoading, error } = useQuery<WebhookStat[]>({
    queryKey: ["webhook-delivery-stats-24h"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_webhook_delivery_stats_24h");
      if (error) throw error;
      return (data as WebhookStat[]) || [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const totals = (data || []).reduce(
    (acc, s) => {
      acc.total += Number(s.total_deliveries || 0);
      acc.ok += Number(s.successful_deliveries || 0);
      acc.fail += Number(s.failed_deliveries || 0);
      return acc;
    },
    { total: 0, ok: 0, fail: 0 },
  );
  const globalSuccess = totals.total > 0 ? ((totals.ok / totals.total) * 100).toFixed(2) : "—";

  return (
    <main className="container mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Webhook className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Observabilidade de Webhooks</h1>
          <p className="text-sm text-muted-foreground">Métricas de entrega das últimas 24 horas — atualiza a cada 60s.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" />Total de Entregas</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totals.total}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" />Taxa de Sucesso Global</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{globalSuccess}{globalSuccess !== "—" ? "%" : ""}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-destructive" />Falhas nas Últimas 24h</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-destructive">{totals.fail}</p></CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle>Detalhamento por Assinatura</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">Não foi possível carregar as métricas: {(error as Error).message}</p>
          ) : !data || data.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma entrega registrada nas últimas 24h.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assinatura</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">P50 (ms)</TableHead>
                    <TableHead className="text-right">P95 (ms)</TableHead>
                    <TableHead className="text-right">P99 (ms)</TableHead>
                    <TableHead className="text-right">Tentativas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row) => {
                    const rate = Number(row.success_rate_pct ?? 0);
                    const rateVariant = rate >= 99 ? "default" : rate >= 90 ? "secondary" : "destructive";
                    return (
                      <TableRow key={row.subscription_id}>
                        <TableCell>
                          <div className="font-medium">{row.subscription_name || "—"}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-xs">{row.subscription_url}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{row.total_deliveries}</TableCell>
                        <TableCell className="text-right"><Badge variant={rateVariant}>{rate.toFixed(1)}%</Badge></TableCell>
                        <TableCell className="text-right tabular-nums">{row.p50_duration_ms ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.p95_duration_ms ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{row.p99_duration_ms ?? "—"}</TableCell>
                        <TableCell className="text-right tabular-nums">{Number(row.avg_attempts ?? 0).toFixed(2)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}