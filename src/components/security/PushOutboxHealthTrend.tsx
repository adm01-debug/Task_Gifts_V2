import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TrendRow {
  bucket: string;
  avg_score: number;
  min_score: number;
  max_pending: number;
  max_failed: number;
  critical_count: number;
}

/** Regressão linear simples sobre os scores médios: retorna a inclinação por hora. */
function slope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - meanX) * (values[i] - meanY);
    den += (i - meanX) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

export function PushOutboxHealthTrend() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["push-outbox-health-trend"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_push_outbox_health_trend", { p_hours: 48 });
      if (error) throw error;
      return (data ?? []) as unknown as TrendRow[];
    },
    refetchInterval: 300000,
  });

  const rows = useMemo(
    () =>
      (data ?? []).map((r) => ({
        ...r,
        avg_score: Number(r.avg_score),
        label: new Date(r.bucket).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit" }),
      })),
    [data],
  );

  const trend = useMemo(() => slope(rows.map((r) => r.avg_score)), [rows]);
  const criticalHours = rows.filter((r) => r.critical_count > 0).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent><Skeleton className="h-56 w-full" /></CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Não foi possível carregar a série histórica da fila.</AlertDescription>
      </Alert>
    );
  }

  const TrendIcon = trend > 0.5 ? TrendingUp : trend < -0.5 ? TrendingDown : Minus;
  const trendLabel =
    trend > 0.5 ? "Melhorando" : trend < -0.5 ? "Degradando" : "Estável";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Tendência de Saúde (48h)
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          <Badge variant={trend < -0.5 ? "destructive" : "secondary"} className="gap-1">
            <TrendIcon className="h-3 w-3" />
            {trendLabel} ({trend.toFixed(2)} pts/h)
          </Badge>
          {criticalHours > 0 && (
            <Badge variant="destructive">{criticalHours}h com estado crítico</Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ainda não há amostras suficientes — o coletor roda a cada 15 minutos.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={rows} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="pushScoreFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
                formatter={(value: number, name: string) => [value, name === "avg_score" ? "Score médio" : name]}
              />
              <Area
                type="monotone"
                dataKey="avg_score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#pushScoreFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
