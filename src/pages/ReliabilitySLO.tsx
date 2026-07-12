import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Activity, Webhook, ShieldAlert, Zap, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { toCSV, downloadCSV } from "@/lib/csvExport";

interface SLOData {
  window_hours: number;
  generated_at: string;
  webhooks: { total: number; success: number; failed: number; success_rate: number; p95_ms: number; avg_ms: number; max_ms: number };
  external_api: { total: number; success: number; failed: number; success_rate: number; p95_ms: number; avg_ms: number; server_errors: number };
  security_alerts: { total: number; resolved: number; pending: number; critical: number; high: number; mttr_min: number };
}

interface TimelineRow {
  bucket: string;
  webhook_total: number;
  webhook_success: number;
  webhook_p95_ms: number;
  api_total: number;
  api_errors: number;
  api_p95_ms: number;
}

function healthColor(rate: number): string {
  if (rate >= 99) return "text-emerald-500";
  if (rate >= 95) return "text-amber-500";
  return "text-destructive";
}

function healthBadge(rate: number): "default" | "secondary" | "destructive" {
  if (rate >= 99) return "default";
  if (rate >= 95) return "secondary";
  return "destructive";
}

export default function ReliabilitySLO() {
  const [hours, setHours] = useState<number>(24);

  const { data: slo, isLoading: sloLoading } = useQuery({
    queryKey: ["reliability-slo", hours],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_reliability_slo", { p_hours: hours });
      if (error) throw error;
      return data as SLOData;
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const { data: timeline } = useQuery({
    queryKey: ["reliability-timeline", hours],
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("get_reliability_timeline", { p_hours: hours });
      if (error) throw error;
      return (data ?? []) as TimelineRow[];
    },
    staleTime: 60_000,
    refetchInterval: 60_000,
  });

  const chart = (timeline ?? []).map((r) => ({
    time: new Date(r.bucket).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    wh_rate: r.webhook_total > 0 ? Math.round((r.webhook_success / r.webhook_total) * 10000) / 100 : 100,
    wh_p95: r.webhook_p95_ms,
    api_errors: r.api_errors,
    api_p95: r.api_p95_ms,
    api_total: r.api_total,
  }));

  const handleExport = () => {
    if (!timeline || timeline.length === 0) return;
    downloadCSV(
      `reliability-slo-${new Date().toISOString().split("T")[0]}.csv`,
      toCSV(
        timeline.map((r) => ({
          bucket: r.bucket,
          webhook_total: r.webhook_total,
          webhook_success: r.webhook_success,
          webhook_success_rate_pct: r.webhook_total > 0 ? Math.round((r.webhook_success / r.webhook_total) * 10000) / 100 : 100,
          webhook_p95_ms: r.webhook_p95_ms,
          api_total: r.api_total,
          api_errors: r.api_errors,
          api_p95_ms: r.api_p95_ms,
        }))
      )
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Link to="/admin/security-runbook">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Runbook
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Activity className="w-7 h-7 text-primary" />
                Reliability & SLO Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">
                Saúde consolidada — webhooks, API externa e alertas de segurança
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[1, 6, 24, 72].map((h) => (
              <Button
                key={h}
                size="sm"
                variant={hours === h ? "default" : "outline"}
                onClick={() => setHours(h)}
              >
                {h}h
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={handleExport} disabled={!timeline?.length}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
          </div>
        </div>

        {sloLoading && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando métricas SLO...</CardContent></Card>
        )}

        {slo && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Webhooks card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Webhook className="w-4 h-4 text-primary" /> Webhooks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className={`text-3xl font-bold ${healthColor(slo.webhooks.success_rate)}`}>
                    {slo.webhooks.success_rate}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {slo.webhooks.success}/{slo.webhooks.total} entregues • {slo.webhooks.failed} falhas
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Badge variant="outline">p95 {slo.webhooks.p95_ms}ms</Badge>
                    <Badge variant="outline">avg {slo.webhooks.avg_ms}ms</Badge>
                    <Badge variant={healthBadge(slo.webhooks.success_rate)}>
                      {slo.webhooks.success_rate >= 99 ? "Saudável" : slo.webhooks.success_rate >= 95 ? "Degradado" : "Crítico"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* External API card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" /> API Externa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className={`text-3xl font-bold ${healthColor(slo.external_api.success_rate)}`}>
                    {slo.external_api.success_rate}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {slo.external_api.success}/{slo.external_api.total} requests • {slo.external_api.server_errors} 5xx
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Badge variant="outline">p95 {slo.external_api.p95_ms}ms</Badge>
                    <Badge variant="outline">avg {slo.external_api.avg_ms}ms</Badge>
                    {slo.external_api.server_errors > 0 && (
                      <Badge variant="destructive">{slo.external_api.server_errors} 5xx</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security alerts card */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-primary" /> Alertas de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-3xl font-bold">
                    {slo.security_alerts.total}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({slo.security_alerts.pending} pendentes)
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    MTTR médio: <strong>{slo.security_alerts.mttr_min}min</strong>
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {slo.security_alerts.critical > 0 && (
                      <Badge variant="destructive">{slo.security_alerts.critical} críticos</Badge>
                    )}
                    {slo.security_alerts.high > 0 && (
                      <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                        {slo.security_alerts.high} altos
                      </Badge>
                    )}
                    {slo.security_alerts.pending === 0 && (
                      <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                        Tudo tratado
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {chart.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Webhooks — taxa de sucesso & p95</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line yAxisId="left" type="monotone" dataKey="wh_rate" name="Sucesso %" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                          <Line yAxisId="right" type="monotone" dataKey="wh_p95" name="p95 (ms)" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">API Externa — volume & erros</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Area type="monotone" dataKey="api_total" name="Total" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                          <Area type="monotone" dataKey="api_errors" name="Erros" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive) / 0.25)" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <p className="text-xs text-muted-foreground text-right">
              Última atualização: {new Date(slo.generated_at).toLocaleString("pt-BR")} • auto-refresh 60s
            </p>
          </>
        )}
      </div>
    </div>
  );
}