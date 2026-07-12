import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingDown, TrendingUp, Minus, Download, ShieldAlert, CheckCircle2, Users } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { toCSV, downloadCSV } from "@/lib/csvExport";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface DigestRow {
  week_key: string;
  sla_pct: number | null;
  avg_mttr_min: number | null;
  total: number;
  pending: number;
  critical: number;
  high: number;
  top: Array<{ type: string; count: number }>;
  created_at: string;
  ack_count: number;
  acknowledged_by_me: boolean;
  acknowledgments: Array<{ user_id: string; at: string }>;
}

function slaColor(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct >= 95) return "text-emerald-500";
  if (pct >= 85) return "text-amber-500";
  return "text-destructive";
}

function trendIcon(curr: number | null, prev: number | null) {
  if (curr === null || prev === null) return <Minus className="w-4 h-4 text-muted-foreground" />;
  if (curr > prev) return <TrendingUp className="w-4 h-4 text-emerald-500" />;
  if (curr < prev) return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export default function SecurityDigests() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["security-digest-history", 12],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_security_digest_history", { p_weeks: 12 });
      if (error) throw error;
      return (data ?? []) as unknown as DigestRow[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const ackMutation = useMutation({
    mutationFn: async (week_key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.rpc as any)("acknowledge_security_digest", { p_week_key: week_key });
      if (error) throw error;
      return data;
    },
    onSuccess: (_res, week_key) => {
      toast.success(`Digest ${week_key} marcado como revisado`);
      qc.invalidateQueries({ queryKey: ["security-digest-history", 12] });
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Falha ao registrar revisão");
    },
  });

  const digests = (data ?? []).slice().reverse(); // oldest → newest para gráfico
  const chartData = digests.map((d) => ({
    week: d.week_key,
    sla: d.sla_pct ?? 0,
    mttr: d.avg_mttr_min ?? 0,
    total: d.total,
  }));

  const handleExport = () => {
    if (!data || data.length === 0) return;
    const rows = data.map((d) => ({
        semana: d.week_key,
        sla_pct: d.sla_pct ?? "",
        mttr_min: d.avg_mttr_min ?? "",
        total: d.total,
        pendentes: d.pending,
        criticos: d.critical,
        altos: d.high,
        top_ofensores: d.top.map((t) => `${t.type}:${t.count}`).join(" | "),
        gerado_em: d.created_at,
    }));
    downloadCSV(`security-digests-${new Date().toISOString().split("T")[0]}.csv`, toCSV(rows));
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
                <ShieldAlert className="w-7 h-7 text-primary" />
                Histórico de Digests de Segurança
              </h1>
              <p className="text-sm text-muted-foreground">
                Últimas 12 semanas — SLA, MTTR e top ofensores
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={handleExport} disabled={!data || data.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {isLoading && (
          <Card><CardContent className="p-8 text-center text-muted-foreground">Carregando histórico...</CardContent></Card>
        )}

        {error && (
          <Card><CardContent className="p-8 text-center text-destructive">Erro ao carregar digests.</CardContent></Card>
        )}

        {!isLoading && !error && (!data || data.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground mb-2">Nenhum digest publicado ainda.</p>
              <p className="text-xs text-muted-foreground">
                O digest é gerado toda segunda-feira às 13:00 UTC pelo cron <code>security-weekly-digest</code>.
              </p>
            </CardContent>
          </Card>
        )}

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tendência SLA e MTTR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" domain={[0, 100]} tick={{ fontSize: 11 }} label={{ value: "SLA %", angle: -90, position: "insideLeft", fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} label={{ value: "MTTR min", angle: 90, position: "insideRight", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="left" type="monotone" dataKey="sla" name="SLA %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="mttr" name="MTTR (min)" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4">
          {data?.map((d, idx) => {
            const prev = data[idx + 1];
            return (
              <Card key={d.week_key} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-lg">Semana {d.week_key}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Publicado em {new Date(d.created_at).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={d.pending > 0 ? "destructive" : "secondary"}>
                        {d.pending} pendente{d.pending !== 1 ? "s" : ""}
                      </Badge>
                      {d.critical > 0 && <Badge variant="destructive">{d.critical} crítico{d.critical !== 1 ? "s" : ""}</Badge>}
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" /> {d.ack_count} revisão{d.ack_count !== 1 ? "es" : ""}
                      </Badge>
                      {d.acknowledged_by_me ? (
                        <Badge className="gap-1 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> Revisado por você
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={ackMutation.isPending}
                          onClick={() => ackMutation.mutate(d.week_key)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Marcar como revisado
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        SLA {trendIcon(d.sla_pct, prev?.sla_pct ?? null)}
                      </div>
                      <div className={`text-2xl font-bold ${slaColor(d.sla_pct)}`}>
                        {d.sla_pct !== null ? `${d.sla_pct}%` : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        MTTR médio {trendIcon(prev?.avg_mttr_min ?? null, d.avg_mttr_min)}
                      </div>
                      <div className="text-2xl font-bold">
                        {d.avg_mttr_min !== null ? `${d.avg_mttr_min}min` : "—"}
                      </div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-2xl font-bold">{d.total}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Alta severidade</div>
                      <div className="text-2xl font-bold text-amber-500">{d.high}</div>
                    </div>
                  </div>

                  {d.top.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">Top ofensores</p>
                      <div className="flex flex-wrap gap-2">
                        {d.top.map((t) => (
                          <Badge key={t.type} variant="outline" className="font-mono">
                            {t.type} · {t.count}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}