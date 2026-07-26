import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus, HelpCircle } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  buildNpsSeries,
  npsZone,
  NPS_ZONE_LABEL,
  type NpsHistoryPoint,
  type NpsTrend,
} from "@/lib/npsHistory";

export interface NpsHistoryChartProps {
  rows: NpsHistoryPoint[] | undefined;
  bucket?: "month" | "week";
  isLoading?: boolean;
  className?: string;
}

const METRIC_TITLE: Record<string, string> = {
  eNPS: "eNPS — recomendação da empresa",
  LNPS: "LNPS — recomendação da liderança",
};

const TREND_META: Record<NpsTrend, { icon: typeof TrendingUp; label: string; tone: string }> = {
  up: { icon: TrendingUp, label: "Em alta", tone: "text-success" },
  down: { icon: TrendingDown, label: "Em queda", tone: "text-destructive" },
  flat: { icon: Minus, label: "Estável", tone: "text-muted-foreground" },
  unknown: { icon: HelpCircle, label: "Sem série", tone: "text-muted-foreground" },
};

const ZONE_TONE: Record<string, string> = {
  critical: "text-destructive",
  attention: "text-warning",
  good: "text-primary",
  excellent: "text-success",
  unknown: "text-muted-foreground",
};

/** Série histórica de eNPS/LNPS com tendência período a período. */
export function NpsHistoryChart({
  rows,
  bucket = "month",
  isLoading = false,
  className,
}: NpsHistoryChartProps) {
  const series = useMemo(() => buildNpsSeries(rows, bucket), [rows, bucket]);

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (series.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Ainda não há períodos com respondentes suficientes para montar a série histórica.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("grid grid-cols-1 gap-4 lg:grid-cols-2", className)}>
      {series.map((serie) => {
        const trend = TREND_META[serie.trend];
        const TrendIcon = trend.icon;
        const zone = npsZone(serie.latest);
        return (
          <Card key={serie.metric}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    {METRIC_TITLE[serie.metric] ?? serie.metric}
                  </CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {serie.points.length} período(s) com base suficiente
                  </p>
                </div>
                <Badge variant="outline" className={cn("gap-1", trend.tone)}>
                  <TrendIcon className="h-3.5 w-3.5" aria-hidden />
                  {trend.label}
                  {serie.delta !== null && (
                    <span className="tabular-nums">
                      {serie.delta > 0 ? "+" : ""}
                      {serie.delta}
                    </span>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-3">
                <span className={cn("text-4xl font-bold tabular-nums", ZONE_TONE[zone])}>
                  {serie.latest ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">{NPS_ZONE_LABEL[zone]}</span>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={serie.points}
                    margin={{ top: 8, right: 8, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      domain={[-100, 100]}
                      ticks={[-100, -50, 0, 50, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        color: "hsl(var(--popover-foreground))",
                      }}
                      formatter={(value: number | string) => [String(value), "Score"]}
                      labelFormatter={(label: string) => `Período ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-md bg-muted/50 p-2">
                  <dt className="text-muted-foreground">Melhor</dt>
                  <dd className="font-semibold tabular-nums">{serie.best ?? "—"}</dd>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <dt className="text-muted-foreground">Pior</dt>
                  <dd className="font-semibold tabular-nums">{serie.worst ?? "—"}</dd>
                </div>
                <div className="rounded-md bg-muted/50 p-2">
                  <dt className="text-muted-foreground">Anterior</dt>
                  <dd className="font-semibold tabular-nums">{serie.previous ?? "—"}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
