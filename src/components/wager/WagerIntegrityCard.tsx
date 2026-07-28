import { useMemo, useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useWagerLeaderboard } from "@/hooks/useDailyWager";
import {
  analyzeWagerIntegrity,
  integritySummary,
  severityLabel,
  type WagerAnomalySeverity,
} from "@/lib/wagerIntegrity";
import { windowLabel, type WagerLeaderboardWindow } from "@/lib/wagerLeaderboard";
import { cn } from "@/lib/utils";

const WINDOWS: WagerLeaderboardWindow[] = [7, 30, 90];

const SEVERITY_STYLE: Record<WagerAnomalySeverity, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  info: "border-border bg-muted/40 text-muted-foreground",
};

function SeverityIcon({ severity }: { severity: WagerAnomalySeverity }) {
  if (severity === "critical") return <ShieldAlert className="h-4 w-4 shrink-0" />;
  if (severity === "warning") return <AlertTriangle className="h-4 w-4 shrink-0" />;
  return <Info className="h-4 w-4 shrink-0" />;
}

export interface WagerIntegrityCardProps {
  className?: string;
  limit?: number;
}

/**
 * Painel antifraude da Pergunta do Dia: cruza o ranking do período com o motor
 * estatístico e lista suspeitas para revisão humana.
 */
export function WagerIntegrityCard({ className, limit = 50 }: WagerIntegrityCardProps) {
  const [days, setDays] = useState<WagerLeaderboardWindow>(30);
  const { data, isLoading } = useWagerLeaderboard(days, limit);

  const report = useMemo(() => analyzeWagerIntegrity(data ?? []), [data]);
  const summary = useMemo(() => integritySummary(report), [report]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Integridade & Antifraude
          </CardTitle>
          <div className="flex gap-1">
            {WINDOWS.map((value) => (
              <Button
                key={value}
                type="button"
                size="sm"
                variant={value === days ? "default" : "ghost"}
                onClick={() => setDays(value)}
              >
                {windowLabel(value)}
              </Button>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Índice de saúde do jogo</span>
                <span className="font-semibold text-foreground">{report.healthScore}/100</span>
              </div>
              <Progress value={report.healthScore} />
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <p className="text-lg font-semibold text-foreground">{report.evaluated}</p>
                <p className="text-xs text-muted-foreground">Avaliados</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <p className="text-lg font-semibold text-foreground">{report.skipped}</p>
                <p className="text-xs text-muted-foreground">Amostra baixa</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-2">
                <p className="text-lg font-semibold text-foreground">
                  {report.netDistributed.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-muted-foreground">Saldo líquido</p>
              </div>
            </div>

            {report.anomalies.length === 0 ? (
              <p className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                Nenhum sinal de anomalia neste período. O motor reavalia sempre que o
                ranking é atualizado.
              </p>
            ) : (
              <ul className="space-y-2">
                {report.anomalies.map((anomaly, index) => (
                  <li
                    key={`${anomaly.code}-${anomaly.userId}-${index}`}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border p-3",
                      SEVERITY_STYLE[anomaly.severity],
                    )}
                  >
                    <SeverityIcon severity={anomaly.severity} />
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {anomaly.displayName}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {severityLabel(anomaly.severity)}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-foreground">{anomaly.title}</p>
                      <p className="text-xs text-muted-foreground">{anomaly.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}