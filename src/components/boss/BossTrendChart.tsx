import { useMemo } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildBossHistoryTrend } from "@/lib/bossHistoryTrend";
import type { BossHistoryInput } from "@/lib/bossHistory";
import { cn } from "@/lib/utils";

export interface BossTrendChartProps {
  battles: readonly BossHistoryInput[];
  departmentId?: string | null;
  months?: number;
  className?: string;
}

/** Série mensal de vitórias/derrotas derivada do motor puro de tendência. */
export function BossTrendChart({
  battles,
  departmentId = null,
  months = 12,
  className,
}: BossTrendChartProps) {
  const trend = useMemo(
    () => buildBossHistoryTrend(battles, { departmentId, months }),
    [battles, departmentId, months],
  );

  const active = trend.points.filter((p) => p.battles > 0);
  if (active.length < 2) return null;

  const delta = trend.winRateDeltaPp;
  const DeltaIcon = delta === null || delta === 0 ? Minus : delta > 0 ? TrendingUp : TrendingDown;

  return (
    <div className={cn("rounded-lg border border-border/60 bg-background/60 p-3", className)}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Tendência mensal ({trend.points.length} meses)
        </p>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <DeltaIcon className="h-3.5 w-3.5" />
          {delta === null
            ? "sem comparativo"
            : `${delta > 0 ? "+" : ""}${delta} p.p. vs mês anterior`}
        </span>
      </div>

      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={trend.points} margin={{ top: 4, right: 4, bottom: 0, left: -22 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              className="fill-muted-foreground"
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              fontSize={11}
              className="fill-muted-foreground"
            />
            <Tooltip
              cursor={{ className: "fill-muted/40" }}
              contentStyle={{
                background: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 8,
                fontSize: 12,
                color: "hsl(var(--popover-foreground))",
              }}
              formatter={(value: number, _name, item) => {
                const point = item?.payload as { defeats?: number } | undefined;
                return [`${value} vitória(s) · ${point?.defeats ?? 0} derrota(s)`, "Resultado"];
              }}
            />
            <Bar dataKey="victories" radius={[4, 4, 0, 0]}>
              {trend.points.map((point) => (
                <Cell
                  key={point.month}
                  className={point.battles > 0 ? "fill-primary" : "fill-muted"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {trend.bestMonth && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          Melhor mês: {trend.bestMonth.label} ({trend.bestMonth.victories} vitórias)
          {trend.undated > 0 && ` · ${trend.undated} sem data de encerramento`}
        </p>
      )}
    </div>
  );
}
