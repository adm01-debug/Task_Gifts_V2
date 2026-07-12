import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, CheckCircle2, Webhook, ShieldAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, BarChart, Bar } from "recharts";

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

interface HourlyPoint {
  bucket: string;
  total: number;
  successful: number;
  failed: number;
  avg_duration_ms: number | null;
  p95_duration_ms: number | null;
}

interface HourlyBySubscription {
  subscription_id: string;
  subscription_name: string | null;
  subscription_url: string | null;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  success_rate_pct: number | null;
}

const HEALTH_THRESHOLD = 90;
const HEALTH_MIN_SAMPLE = 5;

export default function WebhooksAdmin() {
  useEffect(() => {
    document.title = "Observabilidade de Webhooks — Últimas 24h";
  }, []);

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

  const { data: hourly, isLoading: hourlyLoading } = useQuery<HourlyPoint[]>({
    queryKey: ["webhook-delivery-hourly-24h"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_webhook_delivery_hourly_24h");
      if (error) throw error;
      return ((data as HourlyPoint[]) || []).map((p) => ({
        ...p,
        bucket: new Date(p.bucket).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        total: Number(p.total),
        successful: Number(p.successful),
        failed: Number(p.failed),
        avg_duration_ms: p.avg_duration_ms !== null ? Number(p.avg_duration_ms) : null,
        p95_duration_ms: p.p95_duration_ms !== null ? Number(p.p95_duration_ms) : null,
      }));
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: lastHour } = useQuery<HourlyBySubscription[]>({
    queryKey: ["webhook-delivery-stats-1h"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_webhook_delivery_stats_1h" as never);
      if (error) throw error;
      return (data as HourlyBySubscription[]) || [];
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const degraded = (lastHour || []).filter(
    (s) =>
      Number(s.total_deliveries) >= HEALTH_MIN_SAMPLE &&
      Number(s.success_rate_pct ?? 100) < HEALTH_THRESHOLD,
  );

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

      {degraded.length > 0 && (
        <Alert variant="destructive" className="border-destructive/40 bg-destructive/5">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>
            {degraded.length === 1
              ? "1 assinatura degradada na última hora"
              : `${degraded.length} assinaturas degradadas na última hora`}
          </AlertTitle>
          <AlertDescription>
            Taxa de sucesso abaixo de {HEALTH_THRESHOLD}% (amostra mínima de {HEALTH_MIN_SAMPLE} entregas):
            <ul className="mt-2 space-y-1 text-sm">
              {degraded.map((d) => (
                <li key={d.subscription_id} className="flex items-center justify-between gap-3">
                  <span className="font-medium truncate">{d.subscription_name || d.subscription_url || d.subscription_id}</span>
                  <span className="tabular-nums whitespace-nowrap">
                    {Number(d.success_rate_pct ?? 0).toFixed(1)}% · {d.failed_deliveries}/{d.total_deliveries} falhas
                  </span>
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

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

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Volume de Entregas por Hora</CardTitle></CardHeader>
          <CardContent className="h-72">
            {hourlyLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="bucket" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Bar dataKey="successful" name="Sucesso" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="failed" name="Falhas" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Latência por Hora (ms)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {hourlyLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourly || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="bucket" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend />
                  <Line type="monotone" dataKey="avg_duration_ms" name="Média" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="p95_duration_ms" name="P95" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
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
                      <TableRow key={row.subscription_id} className="hover:bg-muted/40">
                        <TableCell>
                          <Link to={`/admin/webhooks/${row.subscription_id}`} className="block hover:underline">
                            <div className="font-medium">{row.subscription_name || "—"}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-xs">{row.subscription_url}</div>
                          </Link>
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