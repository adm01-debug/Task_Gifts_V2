import { AlertTriangle, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GoalBetExposure } from "@/lib/goalBetExposure";

export interface GoalBetExposureAlertProps {
  exposure: GoalBetExposure;
  /** Versão compacta usada dentro do diálogo de aporte. */
  compact?: boolean;
  className?: string;
}

/** Alerta de exposição total do apostador frente ao saldo de moedas. */
export function GoalBetExposureAlert({
  exposure,
  compact = false,
  className,
}: GoalBetExposureAlertProps) {
  if (exposure.level === "none") return null;

  const high = exposure.level === "high";
  const attention = exposure.level === "attention";
  const Icon = high ? AlertTriangle : attention ? Wallet : ShieldCheck;

  return (
    <div
      role={high ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-xs",
        high
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : attention
            ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "border-border/60 bg-muted/40 text-muted-foreground",
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="font-medium">{exposure.message}</p>
        {!compact && (
          <p className="mt-1 opacity-80">
            {exposure.openMarkets}{" "}
            {exposure.openMarkets === 1 ? "mercado em aberto" : "mercados em aberto"} ·
            saldo livre {Math.round(exposure.balance).toLocaleString("pt-BR")} moedas
          </p>
        )}
      </div>
    </div>
  );
}
