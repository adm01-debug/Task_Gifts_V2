import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Activity, Clock, Timer, Download, TrendingDown } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

type Row = {
  week_start: string;
  alert_type: string;
  incidents: number;
  acknowledged: number;
  resolved: number;
  mtta_seconds: number | null;
  mttr_seconds: number | null;
  p95_mttr_seconds: number | null;
};

function fmtDuration(sec: number | null | undefined) {
  if (sec == null || Number.isNaN(sec)) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}min`;
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function IncidentMetrics() {
  const [days, setDays] = useState("30");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["incident-metrics", days],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_incident_metrics", { p_days: Number(days) });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
    refetchInterval: 60_000,
  });

  const types = useMemo(() => Array.from(new Set(data.map((r) => r.alert_type))).sort(), [data]);
  const filtered = useMemo(
    () => (typeFilter === "all" ? data : data.filter((r) => r.alert_type === typeFilter)),
    [data, typeFilter]
  );

  const totals = useMemo(() => {
    let inc = 0, ack = 0, res = 0, mttaSum = 0, mttaN = 0, mttrSum = 0, mttrN = 0;
    for (const r of filtered) {
      inc += r.incidents; ack += r.acknowledged; res += r.resolved;
      if (r.mtta_seconds != null) { mttaSum += r.mtta_seconds * r.acknowledged; mttaN += r.acknowledged; }
      if (r.mttr_seconds != null) { mttrSum += r.mttr_seconds * r.resolved; mttrN += r.resolved; }
    }
    return {
      incidents: inc,
      ackRate: inc > 0 ? Math.round((ack / inc) * 100) : 0,
      resRate: inc > 0 ? Math.round((res / inc) * 100) : 0,
      mtta: mttaN > 0 ? mttaSum / mttaN : null,
      mttr: mttrN > 0 ? mttrSum / mttrN : null,
    };
  }, [filtered]);

  const trend = useMemo(() => {
    const byWeek = new Map<string, { week: string; incidents: number; mtta: number | null; mttr: number | null; ackW: number; resW: number; mttaSum: number; mttrSum: number }>();
    for (const r of filtered) {
      const k = r.week_start;
      const entry = byWeek.get(k) ?? { week: k, incidents: 0, mtta: null, mttr: null, ackW: 0, resW: 0, mttaSum: 0, mttrSum: 0 };
      entry.incidents += r.incidents;
      if (r.mtta_seconds != null) { entry.mttaSum += r.mtta_seconds * r.acknowledged; entry.ackW += r.acknowledged; }
      if (r.mttr_seconds != null) { entry.mttrSum += r.mttr_seconds * r.resolved; entry.resW += r.resolved; }
      byWeek.set(k, entry);
    }
    return Array.from(byWeek.values())
      .map((e) => ({
        week: new Date(e.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
        incidents: e.incidents,
        mtta_min: e.ackW > 0 ? +(e.mttaSum / e.ackW / 60).toFixed(1) : null,
        mttr_min: e.resW > 0 ? +(e.mttrSum / e.resW / 60).toFixed(1) : null,
      }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }, [filtered]);

  const exportCSV = () => {
    const rows = [["week_start", "alert_type", "incidents", "acknowledged", "resolved", "mtta_seconds", "mttr_seconds", "p95_mttr_seconds"]];
    filtered.forEach((r) => rows.push([
      r.week_start, r.alert_type, String(r.incidents), String(r.acknowledged), String(r.resolved),
      r.mtta_seconds?.toFixed(0) ?? "", r.mttr_seconds?.toFixed(0) ?? "", r.p95_mttr_seconds?.toFixed(0) ?? "",
    ]));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `incident-metrics-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/admin/security-runbook" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="w-4 h-4" /> Security
          </Link>
          <h1 className="text-3xl font-bold mt-1 flex items-center gap-2">
            <Activity className="w-7 h-7 text-primary" /> Incident Metrics
          </h1>
          <p className="text-muted-foreground text-sm">MTTA · MTTR · P95 por semana e por tipo de alerta.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="h-9 w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Atualizar</Button>
          <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Incidentes</div>
          <div className="text-2xl font-bold">{totals.incidents}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> MTTA (média)</div>
          <div className="text-2xl font-bold">{fmtDuration(totals.mtta)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" /> MTTR (média)</div>
          <div className="text-2xl font-bold">{fmtDuration(totals.mttr)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground">Ack rate</div>
          <div className="text-2xl font-bold">{totals.ackRate}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Resolved rate</div>
          <div className="text-2xl font-bold">{totals.resRate}%</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Tendência semanal</CardTitle></CardHeader>
        <CardContent>
          <div className="w-full h-72">
            <ResponsiveContainer>
              <LineChart data={trend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="incidents" stroke="hsl(var(--primary))" name="Incidentes" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="mtta_min" stroke="#f59e0b" name="MTTA (min)" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="mttr_min" stroke="#10b981" name="MTTR (min)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Detalhamento por semana × tipo</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Sem incidentes no período.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-xs text-muted-foreground border-b">
                <tr>
                  <th className="text-left py-2 px-2">Semana</th>
                  <th className="text-left py-2 px-2">Tipo</th>
                  <th className="text-right py-2 px-2">Incidentes</th>
                  <th className="text-right py-2 px-2">Ack</th>
                  <th className="text-right py-2 px-2">Resolved</th>
                  <th className="text-right py-2 px-2">MTTA</th>
                  <th className="text-right py-2 px-2">MTTR</th>
                  <th className="text-right py-2 px-2">P95 MTTR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-2 px-2">{new Date(r.week_start).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2 px-2"><Badge variant="outline" className="font-mono text-[10px]">{r.alert_type}</Badge></td>
                    <td className="py-2 px-2 text-right font-semibold">{r.incidents}</td>
                    <td className="py-2 px-2 text-right">{r.acknowledged}</td>
                    <td className="py-2 px-2 text-right">{r.resolved}</td>
                    <td className="py-2 px-2 text-right">{fmtDuration(r.mtta_seconds)}</td>
                    <td className="py-2 px-2 text-right">{fmtDuration(r.mttr_seconds)}</td>
                    <td className="py-2 px-2 text-right text-muted-foreground">{fmtDuration(r.p95_mttr_seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}