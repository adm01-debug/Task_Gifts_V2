import { AlertTriangle, Coins, Gavel, Lock, Timer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PredictionAdminOverview } from "@/lib/predictionAdmin";

export interface PredictionOverviewCardsProps {
  overview: PredictionAdminOverview;
  className?: string;
}

interface Metric {
  label: string;
  value: number | string;
  hint: string;
  icon: React.ReactNode;
  alert?: boolean;
}

/**
 * Painel de saúde operacional. Destaca em tom de alerta apenas os estados que
 * exigem intervenção humana (mercado vencido ainda aberto, travado sem apuração).
 */
export function PredictionOverviewCards({ overview, className }: PredictionOverviewCardsProps) {
  const metrics: Metric[] = [
    {
      label: "Mercados ativos",
      value: overview.open + overview.locked,
      hint: `${overview.drafts} rascunho(s) aguardando publicação`,
      icon: <Gavel className="h-4 w-4" />,
    },
    {
      label: "Travam em 24h",
      value: overview.lockingSoon,
      hint: "Divulgue antes do fechamento dos aportes",
      icon: <Timer className="h-4 w-4" />,
    },
    {
      label: "Aguardando apuração",
      value: overview.awaitingSettlement,
      hint: "Travados sem resultado definido",
      icon: <Lock className="h-4 w-4" />,
      alert: overview.awaitingSettlement > 0,
    },
    {
      label: "Moedas em risco",
      value: overview.coinsAtRisk.toLocaleString("pt-BR"),
      hint: "Total apostado ainda não liquidado",
      icon: <Coins className="h-4 w-4" />,
    },
  ];

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <Card
            key={metric.label}
            className={cn(
              "border-border/60 bg-card/60 backdrop-blur",
              metric.alert && "border-destructive/50",
            )}
          >
            <CardContent className="space-y-1 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                {metric.icon}
                <span className="text-xs font-medium uppercase tracking-wide">{metric.label}</span>
              </div>
              <p
                className={cn(
                  "text-2xl font-semibold text-foreground",
                  metric.alert && "text-destructive",
                )}
              >
                {metric.value}
              </p>
              <p className="text-xs text-muted-foreground">{metric.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {overview.expiredButOpen > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {overview.expiredButOpen} mercado(s) passaram do horário de travamento e continuam
            aceitando aportes. Trave manualmente — a rotina automática pode estar atrasada.
          </span>
        </div>
      )}
    </div>
  );
}