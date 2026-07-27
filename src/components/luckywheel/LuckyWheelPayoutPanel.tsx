import { useMemo, useState } from "react";
import { AlertTriangle, Coins, Info, ShieldCheck, TrendingUp, Users } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLuckyWheelAdminPrizes, useLuckyWheelSpins } from "@/hooks/useLuckyWheel";
import type { OddsPrize } from "@/lib/luckyWheelOdds";
import {
  buildPayoutReport,
  payoutSeverity,
  type PrizeReconciliation,
  type ReconciliationStatus,
} from "@/lib/luckyWheelPayout";
import { cn } from "@/lib/utils";

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
] as const;

const STATUS_META: Record<ReconciliationStatus, { label: string; className: string }> = {
  ok: { label: "Dentro do esperado", className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  watch: { label: "Em observação", className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  anomaly: { label: "Anomalia", className: "bg-destructive/15 text-destructive" },
  insufficient: { label: "Amostra pequena", className: "bg-muted text-muted-foreground" },
  unconfigured: { label: "Fora da calibração", className: "bg-destructive/15 text-destructive" },
};

const numberFormat = new Intl.NumberFormat("pt-BR");
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 2 });

interface MetricProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}

function Metric({ icon, label, value, hint }: MetricProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SectorRow({ row }: { row: PrizeReconciliation }) {
  const meta = STATUS_META[row.status];
  return (
    <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-[1.6fr_repeat(4,1fr)] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">{row.label}</p>
        <Badge variant="secondary" className={cn("mt-1 text-[11px]", meta.className)}>
          {meta.label}
        </Badge>
      </div>
      <p className="text-sm tabular-nums text-foreground sm:text-center">
        {numberFormat.format(row.observed)}
        <span className="ml-1 text-xs text-muted-foreground">obs.</span>
      </p>
      <p className="text-sm tabular-nums text-muted-foreground sm:text-center">
        {row.expectedCount.toFixed(1)} <span className="text-xs">esp.</span>
      </p>
      <p className="text-sm tabular-nums text-muted-foreground sm:text-center">
        {percentFormat.format(row.observedShare)} / {percentFormat.format(row.expectedShare)}
      </p>
      <p
        className={cn(
          "text-sm tabular-nums sm:text-center",
          Math.abs(row.zScore) >= 3.5 ? "text-destructive" : "text-muted-foreground",
        )}
      >
        z = {row.zScore.toFixed(2)}
      </p>
    </div>
  );
}

/**
 * Reconciliação econômica da Roleta: confronta o que foi realmente pago
 * (`lucky_wheel_spins`) com o que a calibração vigente projeta, e sinaliza
 * desvio estatístico, valores adulterados e giros duplicados.
 */
export function LuckyWheelPayoutPanel() {
  const [period, setPeriod] = useState<string>("30");
  const days = Number(period);
  const { data: prizes, isLoading: loadingPrizes } = useLuckyWheelAdminPrizes();
  const { data: spins, isLoading: loadingSpins } = useLuckyWheelSpins(days);

  const report = useMemo(() => {
    const odds: OddsPrize[] = (prizes ?? []).map((p) => ({
      id: p.id,
      label: p.label,
      prize_type: p.prize_type,
      amount: p.amount,
      weight: p.weight,
      rarity: p.rarity,
      is_active: p.is_active,
      achievement_id: null,
    }));
    return buildPayoutReport(spins ?? [], odds);
  }, [prizes, spins]);

  const isLoading = loadingPrizes || loadingSpins;
  const severity = payoutSeverity(report);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reconciliação de payout</CardTitle>
          <CardDescription>Comparando o pago real com a projeção da calibração…</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-40 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" aria-hidden />
            Reconciliação de payout
          </CardTitle>
          <CardDescription>
            Confronta os giros efetivamente pagos com a projeção estatística da calibração vigente.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {severity === "ok" ? (
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" aria-hidden />
              Saudável
            </Badge>
          ) : null}
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[170px]" aria-label="Período de análise">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            icon={<TrendingUp className="h-4 w-4" aria-hidden />}
            label="Giros"
            value={numberFormat.format(report.totals.spins)}
            hint={`${report.totals.spinsPerUser.toFixed(2)} por usuário`}
          />
          <Metric
            icon={<Users className="h-4 w-4" aria-hidden />}
            label="Participantes"
            value={numberFormat.format(report.totals.uniqueUsers)}
            hint={`${numberFormat.format(report.totals.emptySpins)} giros sem prêmio`}
          />
          <Metric
            icon={<Coins className="h-4 w-4" aria-hidden />}
            label="Moedas pagas"
            value={numberFormat.format(report.totals.coinsPaid)}
            hint={`Projeção: ${numberFormat.format(Math.round(report.projectedCoins))} (${
              report.coinsDelta >= 0 ? "+" : ""
            }${numberFormat.format(Math.round(report.coinsDelta))})`}
          />
          <Metric
            icon={<Coins className="h-4 w-4" aria-hidden />}
            label="XP pago"
            value={numberFormat.format(report.totals.xpPaid)}
            hint={`Projeção: ${numberFormat.format(Math.round(report.projectedXp))}`}
          />
        </div>

        {report.alerts.length > 0 ? (
          <div className="space-y-2">
            {report.alerts.map((alert, index) => (
              <Alert
                key={`${alert.code}-${index}`}
                variant={alert.level === "error" ? "destructive" : "default"}
              >
                {alert.level === "info" ? (
                  <Info className="h-4 w-4" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                )}
                <AlertTitle className="text-sm">
                  {alert.level === "error" ? "Ação imediata" : alert.level === "warning" ? "Atenção" : "Informação"}
                </AlertTitle>
                <AlertDescription className="text-sm">{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Distribuição por setor</h3>
            <span className="text-xs text-muted-foreground tabular-nums">
              χ² = {report.chiSquare.toFixed(2)}
            </span>
          </div>
          {report.prizes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
              Nenhum giro registrado no período.
            </p>
          ) : (
            <div className="space-y-2">
              {report.prizes.map((row) => (
                <SectorRow key={`${row.prizeId ?? "none"}-${row.label}`} row={row} />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}