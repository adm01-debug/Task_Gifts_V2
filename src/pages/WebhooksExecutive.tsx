import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, AlertTriangle, ArrowLeft, CheckCircle2, Timer, TrendingDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

interface UnstableEndpoint {
  subscription_id: string;
  subscription_name: string | null;
  subscription_url: string | null;
  total: number;
  successful: number;
  failed_deliveries: number;
  success_rate_pct: number | null;
}

interface DailyPoint {
  day: string;
  total: number;
  successful: number;
  failed: number;
  sla_pct: number | null;
}

interface ExecutiveMetrics {
  sla_pct: number | null;
  mttr_seconds: number | null;
  total_deliveries: number;
  successful_deliveries: number;
  failed_deliveries: number;
  unstable_endpoints: UnstableEndpoint[];
  daily: DailyPoint[];
  generated_at: string;
}

function formatMttr(seconds: number | null): string {
  if (seconds === null || seconds === undefined) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export default function WebhooksExecutive() {
  const { data, isLoading } = useQuery({
    queryKey: ["webhook-executive-7d"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_webhook_executive_metrics_7d");
      if (error) throw error;
      return data as unknown as ExecutiveMetrics;
    },
    refetchInterval: 60_000,
  });

  const slaColor =
    !data?.sla_pct ? "text-muted-foreground"
    : data.sla_pct >= 99 ? "text-emerald-500"
    : data.sla_pct >= 95 ? "text-amber-500"
    : "text-destructive";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/admin/webhooks" aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Saúde executiva de webhooks
            </h1>
            <p className="text-sm text-muted-foreground">SLA, MTTR e endpoints mais instáveis nos últimos 7 dias</p>
          </div>
        </div>
        {data?.generated_at && (
          <Badge variant="outline" className="text-xs">
            Atualizado {new Date(data.generated_at).toLocaleTimeString("pt-BR")}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> SLA global
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className={`text-3xl font-bold ${slaColor}`}>
                {data?.sla_pct !== null && data?.sla_pct !== undefined ? `${data.sla_pct}%` : "—"}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {data?.successful_deliveries ?? 0} de {data?.total_deliveries ?? 0} entregas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Timer className="h-4 w-4" /> MTTR médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-bold">{formatMttr(data?.mttr_seconds ?? null)}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Tempo médio até recuperação (janela 6h)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Falhas 7d
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-bold text-destructive">{data?.failed_deliveries ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Entregas com status de erro</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingDown className="h-4 w-4" /> Endpoints instáveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-3xl font-bold">{data?.unstable_endpoints?.length ?? 0}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Assinaturas com ≥1 falha</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SLA diário (últimos 7 dias)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          {isLoading ? <Skeleton className="h-full w-full" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.daily ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                <Legend />
                <Line type="monotone" dataKey="sla_pct" name="SLA %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-destructive" />
            Ranking dos endpoints mais instáveis (7d)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : !data?.unstable_endpoints?.length ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              Nenhuma assinatura com falhas nos últimos 7 dias. 🎉
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead className="text-right">Falhas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Taxa de sucesso</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.unstable_endpoints.map((e, idx) => (
                  <TableRow key={e.subscription_id}>
                    <TableCell className="font-mono text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{e.subscription_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[320px]">{e.subscription_url}</div>
                    </TableCell>
                    <TableCell className="text-right text-destructive font-semibold">{e.failed_deliveries}</TableCell>
                    <TableCell className="text-right">{e.total}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={
                        (e.success_rate_pct ?? 0) >= 95 ? "secondary"
                        : (e.success_rate_pct ?? 0) >= 80 ? "outline"
                        : "destructive"
                      }>
                        {e.success_rate_pct ?? 0}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link to={`/admin/webhooks/${e.subscription_id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}