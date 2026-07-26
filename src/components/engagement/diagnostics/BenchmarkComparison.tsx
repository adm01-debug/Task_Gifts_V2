import { useMemo } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PILLAR_LABELS, type ClimatePillar } from "@/services/climateSurveyService";
import {
  BENCHMARK_POSITION_CLASS,
  BENCHMARK_POSITION_LABEL,
  buildBenchmarkComparisons,
  formatGap,
  summarizeBenchmark,
  type PillarBenchmarkRow,
} from "@/lib/climateBenchmark";

export interface BenchmarkComparisonProps {
  rows: PillarBenchmarkRow[] | undefined;
  isLoading?: boolean;
}

/** Comparativo dos pilares internos com a referência de mercado (Geral / BR). */
export function BenchmarkComparison({ rows, isLoading = false }: BenchmarkComparisonProps) {
  const comparisons = useMemo(() => buildBenchmarkComparisons(rows), [rows]);
  const summary = useMemo(() => summarizeBenchmark(comparisons), [comparisons]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comparativo com o mercado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (summary.comparable === 0) {
    return null;
  }

  const GapIcon =
    summary.averageGap === null || summary.averageGap === 0
      ? Minus
      : summary.averageGap > 0
        ? TrendingUp
        : TrendingDown;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Comparativo com o mercado</CardTitle>
        <p className="text-xs text-muted-foreground">
          Referência: mercado brasileiro (todos os portes) · {summary.comparable} pilares
          comparáveis
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Gap médio</p>
            <p className="mt-1 flex items-center gap-2 text-2xl font-bold tabular-nums">
              <GapIcon className="h-5 w-5 text-muted-foreground" aria-hidden />
              {formatGap(summary.averageGap)}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Acima do mercado</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {summary.aboveMarket}
              <span className="text-sm font-normal text-muted-foreground">
                /{summary.comparable}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs text-muted-foreground">Top 25% ou melhor</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{summary.topPerformers}</p>
          </div>
        </div>

        <ul className="space-y-3">
          {comparisons.map((item) => {
            const label = PILLAR_LABELS[item.pillar as ClimatePillar]?.pt ?? item.pillar;
            const progress = item.score !== null ? Math.min(100, (item.score / 10) * 100) : 0;
            const marker = item.average !== null ? Math.min(100, (item.average / 10) * 100) : null;

            return (
              <li key={item.pillar} className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                        BENCHMARK_POSITION_CLASS[item.position],
                      )}
                    >
                      {BENCHMARK_POSITION_LABEL[item.position]}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">
                      {formatGap(item.gap)}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={progress} className="h-2" />
                  {marker !== null && (
                    <span
                      className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2 bg-foreground/60"
                      style={{ left: `${marker}%` }}
                      aria-hidden
                    />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Interno {item.score !== null ? item.score.toFixed(1) : "—"} · mercado{" "}
                  {item.average !== null ? item.average.toFixed(1) : "—"} · top 25%{" "}
                  {item.topQuartile !== null ? item.topQuartile.toFixed(1) : "—"} · top 10%{" "}
                  {item.top10 !== null ? item.top10.toFixed(1) : "—"}
                </p>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
