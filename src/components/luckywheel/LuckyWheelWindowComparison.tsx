import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Minus, ScaleIcon, TrendingDown, TrendingUp } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLuckyWheelPayoutSnapshots } from "@/hooks/useLuckyWheel";
import { decideComparisonAlerts, type ComparisonAlertSeverity } from "@/lib/luckyWheelComparisonAlerts";
import {
  comparePayoutWindows,
  type SignificanceTest,
  type SignificanceVerdict,
} from "@/lib/luckyWheelPayoutComparison";
import { buildPayoutTrend } from "@/lib/luckyWheelPayoutHistory";
import { cn } from "@/lib/utils";

const WINDOWS = [
  { value: "7", label: "Semana atual × anterior" },
  { value: "14", label: "Quinzena atual × anterior" },
  { value: "30", label: "Mês atual × anterior" },
] as const;

const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

const VERDICT_LABEL: Record<SignificanceVerdict, string> = {
  insufficient: "Amostra insuficiente",
  stable: "Estável",
  significant: "Variação significativa",
};

/** Teto padrão de custo por giro usado para sinalizar estouro de orçamento. */
const COINS_PER_SPIN_BUDGET = 30;

const SEVERITY_LABEL: Record<ComparisonAlertSeverity, string> = {
  critical: "Crítico",
  high: "Alto",
  medium: "Médio",
  low: "Baixo",
};

function formatValue(test: SignificanceTest, value: number): string {
  return test.metric === "coinsDeviation" ? percent.format(value) : decimal.format(value);
}

function VerdictBadge({ verdict }: { verdict: SignificanceVerdict }) {
  return (
    <Badge
      variant={verdict === "significant" ? "destructive" : verdict === "stable" ? "secondary" : "outline"}
    >
      {VERDICT_LABEL[verdict]}
    </Badge>
  );
}

/**
 * Comparação estatística entre a janela atual e a anterior (teste t de Welch
 * com beta incompleta exata). Todo o cálculo vem do motor puro
 * `comparePayoutWindows` — este componente apenas apresenta.
 */
export function LuckyWheelWindowComparison() {
  const [windowSize, setWindowSize] = useState<(typeof WINDOWS)[number]["value"]>("7");
  const windowDays = Number(windowSize);
  const { data, isLoading, isError } = useLuckyWheelPayoutSnapshots(windowDays * 2);

  const comparison = useMemo(() => {
    const { points } = buildPayoutTrend(data ?? [], {
      days: windowDays * 2,
      endDate: new Date().toISOString().slice(0, 10),
    });
    return comparePayoutWindows(points, {
      windowDays,
      currentLabel: `Últimos ${windowDays} dias`,
      previousLabel: `${windowDays} dias anteriores`,
    });
  }, [data, windowDays]);

  const alerts = useMemo(
    () => decideComparisonAlerts(comparison, { coinsPerSpinBudget: COINS_PER_SPIN_BUDGET }),
    [comparison],
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação de janelas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Não foi possível comparar as janelas</AlertTitle>
        <AlertDescription>Verifique sua permissão de administrador e tente novamente.</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ScaleIcon className="h-5 w-5 text-primary" />
            Comparação de janelas
          </CardTitle>
          <CardDescription>
            Teste t de Welch sobre as séries diárias. Só marcamos variação quando ela sobrevive ao ruído
            estatístico (p &lt; 0,05).
          </CardDescription>
        </div>
        <Select value={windowSize} onValueChange={(value) => setWindowSize(value as typeof windowSize)}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WINDOWS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <VerdictBadge verdict={comparison.verdict} />
          <span>
            {comparison.previous.startDate || "—"} → {comparison.previous.endDate || "—"}
          </span>
          <ArrowRight className="h-4 w-4" />
          <span>
            {comparison.current.startDate || "—"} → {comparison.current.endDate || "—"}
          </span>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {comparison.tests.map((test) => {
            const rising = test.delta > 0;
            const Icon = test.delta === 0 ? Minus : rising ? TrendingUp : TrendingDown;
            return (
              <div
                key={test.metric}
                className={cn(
                  "rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur",
                  test.verdict === "significant" && "border-destructive/50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {test.label}
                  </span>
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      test.delta === 0
                        ? "text-muted-foreground"
                        : rising
                          ? "text-destructive"
                          : "text-emerald-600 dark:text-emerald-400",
                    )}
                  />
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{formatValue(test, test.current)}</p>
                <p className="text-xs text-muted-foreground">
                  Anterior: {formatValue(test, test.previous)}
                  {test.previous !== 0 ? ` (${percent.format(test.deltaRatio)})` : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <VerdictBadge verdict={test.verdict} />
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    p = {test.pValue < 0.0001 ? "<0,0001" : test.pValue.toFixed(4)} · d ={" "}
                    {decimal.format(test.effectSize)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <Alert variant={comparison.verdict === "significant" ? "destructive" : "default"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Leitura do período</AlertTitle>
          <AlertDescription>
            <ul className="list-disc space-y-1 pl-4">
              {comparison.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        {alerts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Alertas acionáveis
            </p>
            {alerts.map((alert) => (
              <Alert
                key={alert.dedupeKey}
                variant={alert.severity === "critical" || alert.severity === "high" ? "destructive" : "default"}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="flex flex-wrap items-center gap-2">
                  <Badge variant={alert.severity === "medium" || alert.severity === "low" ? "secondary" : "destructive"}>
                    {SEVERITY_LABEL[alert.severity]}
                  </Badge>
                  {alert.title}
                </AlertTitle>
                <AlertDescription>{alert.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
