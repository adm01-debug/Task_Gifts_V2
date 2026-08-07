import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  buildEngagementInsights,
  summarizeInsights,
  SEVERITY_CLASS,
  SEVERITY_LABEL,
  type EngagementInsight,
  type InsightEngineInput,
  type InsightKind,
} from "@/lib/engagementInsights";

export interface AutoInsightsProps extends InsightEngineInput {
  isLoading?: boolean;
  /** Habilita o atalho de geração de plano 5W2H em insights de fator. */
  canGeneratePlan?: boolean;
  generatingFactorKey?: string | null;
  onGeneratePlan?: (factorKey: string) => void;
  className?: string;
}

const KIND_ICON: Record<InsightKind, typeof Lightbulb> = {
  pillar_critical: AlertTriangle,
  factor_weak: AlertTriangle,
  market_gap: TrendingUp,
  nps_decline: AlertTriangle,
  low_participation: AlertTriangle,
  strength: Sparkles,
};

function InsightRow({
  insight,
  canGeneratePlan,
  generatingFactorKey,
  onGeneratePlan,
}: {
  insight: EngagementInsight;
  canGeneratePlan?: boolean;
  generatingFactorKey?: string | null;
  onGeneratePlan?: (factorKey: string) => void;
}) {
  const Icon = KIND_ICON[insight.kind] ?? Lightbulb;
  const showAction = Boolean(canGeneratePlan && insight.factorKey && onGeneratePlan);
  const isGenerating = Boolean(insight.factorKey && generatingFactorKey === insight.factorKey);

  return (
    <li className="rounded-lg border border-border bg-card/60 p-4 transition-colors hover:bg-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium leading-tight">{insight.title}</p>
              <Badge variant="outline" className={cn("text-xs", SEVERITY_CLASS[insight.severity])}>
                {SEVERITY_LABEL[insight.severity]}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{insight.description}</p>
            <p className="text-sm">{insight.recommendation}</p>
          </div>
        </div>

        {showAction && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            disabled={isGenerating}
            onClick={() => onGeneratePlan?.(insight.factorKey as string)}
          >
            {isGenerating ? "Gerando..." : "Gerar plano"}
            <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </li>
  );
}

export function AutoInsights({
  isLoading,
  canGeneratePlan,
  generatingFactorKey,
  onGeneratePlan,
  className,
  ...input
}: AutoInsightsProps) {
  const insights = useMemo(
    () => buildEngagementInsights(input),
    // Dependências explícitas: o motor é puro, recalcula só quando a origem muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input.overview, input.pillars, input.factors, input.benchmark, input.nps],
  );
  const summary = useMemo(() => summarizeInsights(insights), [insights]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base">Insights automáticos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" aria-hidden />
          Insights automáticos
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={SEVERITY_CLASS.critical}>
            {summary.critical} crítico(s)
          </Badge>
          <Badge variant="outline" className={SEVERITY_CLASS.positive}>
            {summary.strengths} ponto(s) forte(s)
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum alerta relevante neste recorte — os indicadores estão dentro das faixas esperadas.
          </p>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight) => (
              <InsightRow
                key={insight.id}
                insight={insight}
                canGeneratePlan={canGeneratePlan}
                generatingFactorKey={generatingFactorKey}
                onGeneratePlan={onGeneratePlan}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
