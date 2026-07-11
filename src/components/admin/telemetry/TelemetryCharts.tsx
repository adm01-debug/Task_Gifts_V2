import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";

interface TelemetryRow {
  id: string;
  operation: string;
  table_name: string | null;
  rpc_name: string | null;
  duration_ms: number;
  severity: string;
  created_at: string;
}

interface TelemetryChartsProps {
  rows: TelemetryRow[];
  timeFilter: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "#eab308", "hsl(var(--muted-foreground))"];
const SEVERITY_COLORS: Record<string, string> = {
  normal: "hsl(var(--primary))",
  slow: "#eab308",
  very_slow: "hsl(var(--destructive))",
  error: "#dc2626",
};

export function TelemetryCharts({ rows, timeFilter }: TelemetryChartsProps) {
  // Duration by table with avg AND max
  const durationByTable = useMemo(() => {
    const map = new Map<string, { name: string; avgMs: number; maxMs: number; count: number; totalMs: number }>();
    for (const r of rows) {
      const key = r.rpc_name || r.table_name || "unknown";
      const prev = map.get(key) || { name: key, avgMs: 0, maxMs: 0, count: 0, totalMs: 0 };
      prev.count++;
      prev.totalMs += r.duration_ms;
      prev.maxMs = Math.max(prev.maxMs, r.duration_ms);
      prev.avgMs = Math.round(prev.totalMs / prev.count);
      map.set(key, prev);
    }
    return [...map.values()].sort((a, b) => b.avgMs - a.avgMs).slice(0, 10);
  }, [rows]);

  const severityDistribution = useMemo(() => {
    const counts: Record<string, number> = { slow: 0, very_slow: 0, error: 0, normal: 0 };
    for (const r of rows) {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    }
    return [
      { name: "Normal", value: counts.normal || 0 },
      { name: "Lenta", value: counts.slow || 0 },
      { name: "Muito Lenta", value: counts.very_slow || 0 },
      { name: "Erro", value: counts.error || 0 },
    ].filter(d => d.value > 0);
  }, [rows]);

  // Stacked AreaChart timeline by severity
  const timeline = useMemo(() => {
    type Bucket = { time: string; normal: number; slow: number; very_slow: number; error: number; avgMs: number; maxMs: number; totalMs: number; count: number };
    const buckets = new Map<string, Bucket>();

    for (const r of rows) {
      const d = new Date(r.created_at);
      let key: string;
      if (timeFilter === "1h") {
        d.setMinutes(Math.floor(d.getMinutes() / 5) * 5, 0, 0);
        key = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      } else if (timeFilter === "6h") {
        d.setMinutes(Math.floor(d.getMinutes() / 15) * 15, 0, 0);
        key = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      } else {
        d.setMinutes(0, 0, 0);
        key = d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
      }

      const prev: Bucket = buckets.get(key) || { time: key, normal: 0, slow: 0, very_slow: 0, error: 0, avgMs: 0, maxMs: 0, totalMs: 0, count: 0 };
      const sev = r.severity as "normal" | "slow" | "very_slow" | "error";
      prev[sev] = (prev[sev] || 0) + 1;
      prev.count++;
      prev.totalMs += r.duration_ms;
      prev.maxMs = Math.max(prev.maxMs, r.duration_ms);
      prev.avgMs = Math.round(prev.totalMs / prev.count);
      buckets.set(key, prev);
    }
    return [...buckets.values()].reverse();
  }, [rows, timeFilter]);

  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Stacked AreaChart - Volume por Severidade */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Volume de Queries por Severidade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Area type="monotone" dataKey="normal" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Normal" />
              <Area type="monotone" dataKey="slow" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.4} name="Lenta" />
              <Area type="monotone" dataKey="very_slow" stackId="1" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.4} name="Muito Lenta" />
              <Area type="monotone" dataKey="error" stackId="1" stroke="#dc2626" fill="#dc2626" fillOpacity={0.5} name="Erro" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Duração Média vs Máxima por Tabela */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Duração Média / Máxima por Tabela (ms)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={durationByTable} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="avgMs" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Média (ms)" />
              <Bar dataKey="maxMs" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} name="Máxima (ms)" fillOpacity={0.5} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Severity Pie */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Distribuição por Severidade</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={severityDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                {severityDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
