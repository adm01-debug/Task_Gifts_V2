import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Skeleton } from "@/components/ui/skeleton";
import { usePredictionOddsHistory } from "@/hooks/usePredictionMarkets";
import {
  buildOddsHistory,
  formatProbability,
  type OddsOption,
  type OddsStake,
} from "@/lib/predictionOddsHistory";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

export interface OddsHistoryChartProps {
  market: PredictionMarketRow;
}

/** Paleta semântica — segue os tokens do tema, sem cor fixa. */
const SERIES_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, var(--secondary)))",
  "hsl(var(--chart-3, var(--accent)))",
  "hsl(var(--chart-4, var(--muted-foreground)))",
  "hsl(var(--chart-5, var(--destructive)))",
  "hsl(var(--chart-1, var(--primary)))",
];

function formatClock(t: number): string {
  return new Date(t).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Evolução da probabilidade implícita por opção.
 *
 * O servidor entrega somas por faixa de tempo (nunca aportes individuais) e o
 * replay determinístico acontece aqui, reaproveitando o mesmo motor coberto
 * por simulação.
 */
export function OddsHistoryChart({ market }: OddsHistoryChartProps) {
  const { data: rows, isLoading } = usePredictionOddsHistory(market.id);

  const options: OddsOption[] = useMemo(
    () =>
      [...market.options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ id: o.id, label: o.label })),
    [market.options],
  );

  const history = useMemo(() => {
    const stakes: OddsStake[] = (rows ?? []).map((row) => ({
      optionId: row.option_id,
      amount: row.amount,
      createdAt: row.bucket_end,
    }));
    return buildOddsHistory(stakes, options, market.rake_bps);
  }, [rows, options, market.rake_bps]);

  const chartData = useMemo(
    () =>
      history.points.map((point) => {
        const entry: Record<string, number | string> = { t: formatClock(point.t) };
        for (const option of options) {
          entry[option.id] = Number((point.probabilities[option.id] * 100).toFixed(2));
        }
        return entry;
      }),
    [history.points, options],
  );

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (history.points.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Ainda não há aportes suficientes para desenhar a evolução das cotações.
      </div>
    );
  }

  const leader = options.find((o) => o.id === history.leaderId);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        {leader && (
          <span className="text-muted-foreground">
            Favorita:{" "}
            <strong className="text-foreground">{leader.label}</strong>{" "}
            {formatProbability(
              history.points[history.points.length - 1].probabilities[leader.id],
            )}
          </span>
        )}
        <span className="text-muted-foreground">
          Viradas de liderança: <strong className="text-foreground">{history.leadChanges}</strong>
        </span>
        <span className="text-muted-foreground">
          Pote: <strong className="text-foreground">{history.finalTotalPool.toLocaleString("pt-BR")}</strong>
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="t"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              minTickGap={32}
            />
            <YAxis
              domain={[0, 100]}
              unit="%"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: "0.8rem",
              }}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}%`,
                options.find((o) => o.id === name)?.label ?? name,
              ]}
            />
            <Legend
              formatter={(name: string) => options.find((o) => o.id === name)?.label ?? name}
              wrapperStyle={{ fontSize: "0.75rem" }}
            />
            {options.map((option, index) => (
              <Line
                key={option.id}
                type="monotone"
                dataKey={option.id}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}