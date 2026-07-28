import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { AlertSeverity, WatchdogReport } from "@/lib/predictionWatchdog";

export interface PredictionWatchdogPanelProps {
  report: WatchdogReport;
}

const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  low: "Baixa",
  medium: "Média",
  high: "Alta",
  critical: "Crítica",
};

/**
 * Espelha no navegador o que a rotina de vigilância grava na Central de
 * Segurança, para que o administrador veja o problema sem esperar o cron.
 */
export function PredictionWatchdogPanel({ report }: PredictionWatchdogPanelProps) {
  if (report.alerts.length === 0) return null;

  return (
    <section className="space-y-2 rounded-xl border border-destructive/40 bg-destructive/5 p-4">
      <header className="flex items-center gap-2 text-sm font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        {report.alerts.length} mercado(s) exigem atenção ·{" "}
        {report.coinsAtRisk.toLocaleString("pt-BR")} moedas imobilizadas
      </header>
      <ul className="space-y-2">
        {report.alerts.map((alert) => (
          <li
            key={alert.dedupeKey}
            className="flex items-start gap-2 rounded-lg bg-background/60 p-3 text-sm"
          >
            <Badge
              variant={alert.severity === "low" ? "secondary" : "destructive"}
              className={cn("shrink-0", alert.severity === "medium" && "opacity-80")}
            >
              {SEVERITY_LABEL[alert.severity]}
            </Badge>
            <span className="text-muted-foreground">{alert.description}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}