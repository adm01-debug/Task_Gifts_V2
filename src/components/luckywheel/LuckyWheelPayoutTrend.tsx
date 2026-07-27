import { useMemo, useState } from "react";
import { Activity, AlertTriangle, Coins, Download, LineChart as LineChartIcon, TrendingDown, TrendingUp } from "lucide-react";
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

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { downloadCSV } from "@/lib/csvExport";
import { useLuckyWheelPayoutSnapshots } from "@/hooks/useLuckyWheel";
import { buildPayoutTrend, buildPayoutTrendCsv, type PayoutTrendPoint } from "@/lib/luckyWheelPayoutHistory";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "30", label: "Últimos 30 dias" },
  { value: "60", label: "Últimos 60 dias" },
  { value: "90", label: "Últimos 90 dias" },
] as const;

const numberFormat = new Intl.NumberFormat("pt-BR");
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 });

function shortDate(date: string): string {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

interface StatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "warn" | "danger";
}

function Stat({ icon, label, value, hint, tone = "default" }: StatProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p
        className={cn(
          "mt-2 text-2xl font-semibold tabular-nums",
          tone === "warn" && "text-amber-600 dark:text-amber-400",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * Série histórica de χ² e custo da Roleta, alimentada pelos snapshots diários
 * do cron. Todo o cálculo vem do motor puro `buildPayoutTrend` — este
 * componente apenas apresenta.
 */
export function LuckyWheelPayoutTrend() {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("30");
  const days = Number(period);
  const { data, isLoading, isError } = useLuckyWheelPayoutSnapshots(days);

  const trend = useMemo(
    () => buildPayoutTrend(data ?? [], { days, endDate: new Date().toISOString().slice(0, 10) }),
    [data, days],
  );

  const chartData = useMemo(
    () =>
      trend.points.map((point) => ({
        date: shortDate(point.date),
        fullDate: point.date,
        chiRatio: point.chiCritical > 0 ? Number((point.chiSquare / point.chiCritical).toFixed(3)) : null,
        coins: point.present ? point.coinsPaid : null,
        projected: point.present ? point.projectedCoins : null,
        status: point.status,
      })),
    [trend.points],
  );

  if (isLoading) {
    /* estado de carregamento */
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tendência de payout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Não foi possível carregar a série histórica</AlertTitle>
        <AlertDescription>
          Verifique sua permissão de administrador e tente novamente em instantes.
        </AlertDescription>
      </Alert>
    );
  }

  const { summary } = trend;
  const hasData = summary.daysWithData > 0;
  const costTone = Math.abs(summary.coinsDeviation) > 0.25 ? "danger" : Math.abs(summary.coinsDeviation) > 0.1 ? "warn" : "default";

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <LineChartIcon className="h-5 w-5 text-primary" />
            Tendência de χ² e custo
          </CardTitle>
          <CardDescription>
            Snapshots diários consolidados pelo job automático das 4h. Lacunas indicam dias sem execução.
          </CardDescription>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
            <SelectTrigger className="w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full sm:w-auto"
            onClick={handleExport}
            disabled={trend.summary.daysWithData === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!hasData ? (
          <Alert>
            <Activity className="h-4 w-4" />
            <AlertTitle>Ainda sem snapshots no período</AlertTitle>
            <AlertDescription>
              O job diário grava o primeiro ponto na próxima execução. Nada a reconciliar por enquanto.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            icon={<Coins className="h-4 w-4" />}
            label="Custo em moedas"
            value={numberFormat.format(summary.totalCoinsPaid)}
            hint={`Projetado: ${numberFormat.format(summary.totalProjectedCoins)}`}
          />
          <Stat
            icon={summary.coinsDeviation >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            label="Desvio de custo"
            value={percentFormat.format(summary.coinsDeviation)}
            hint={`${numberFormat.format(Math.round(summary.avgCoinsPerSpin))} moedas por giro`}
            tone={costTone}
          />
          <Stat
            icon={<Activity className="h-4 w-4" />}
            label="Dias fora do padrão"
            value={`${summary.warnDays + summary.criticalDays}/${summary.daysWithData}`}
            hint={`${summary.criticalDays} crítico(s) · ${summary.gaps} dia(s) sem snapshot`}
            tone={summary.criticalDays > 0 ? "danger" : summary.warnDays > 0 ? "warn" : "default"}
          />
          <Stat
            icon={<TrendingUp className="h-4 w-4" />}
            label="Tendência diária"
            value={`${summary.coinsTrendPerDay >= 0 ? "+" : ""}${numberFormat.format(Math.round(summary.coinsTrendPerDay))}`}
            hint="Moedas/dia pela regressão linear"
            tone={summary.coinsTrendPerDay > 0 ? "warn" : "default"}
          />
        </div>

        {summary.worstDay ? (
          <Alert variant={summary.criticalDays > 0 ? "destructive" : "default"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Pior dia do período: {summary.worstDay.date}</AlertTitle>
            <AlertDescription>
              χ² de {summary.worstDay.chiSquare.toFixed(2)} contra limite crítico de{" "}
              {summary.worstDay.chiCritical.toFixed(2)} ({summary.worstDay.degreesOfFreedom} g.l.), com{" "}
              {numberFormat.format(summary.worstDay.spins)} giros e desvio de custo de{" "}
              {percentFormat.format(summary.worstDay.coinsDeviation)}.
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value, name) =>
                  typeof value === "number"
                    ? [numberFormat.format(value), String(name)]
                    : ["sem dados", String(name)]
                }
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="coins"
                name="Moedas pagas"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="projected"
                name="Projetado"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                connectNulls={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="chiRatio"
                name="χ² / limite crítico"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="outline">χ²/limite acima de 1 = distribuição fora do peso configurado</Badge>
          <Badge variant="outline">{summary.days} dia(s) na janela</Badge>
          <Badge variant="outline">
            Tendência de χ² normalizado: {summary.chiTrendPerDay >= 0 ? "+" : ""}
            {summary.chiTrendPerDay.toFixed(3)}/dia
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export type { PayoutTrendPoint };