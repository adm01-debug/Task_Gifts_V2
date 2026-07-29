import { useEffect, useState } from "react";
import { Hourglass, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  computeGoalBetCountdown,
  type GoalBetCountdown,
} from "@/lib/goalBetCountdown";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

export interface GoalBetCountdownBadgeProps {
  market: Pick<PredictionMarketRow, "status" | "locks_at">;
  className?: string;
}

/** Atualiza a cada 30s: preciso o bastante e barato para dezenas de cards. */
const TICK_MS = 30_000;

/** Selo de contagem regressiva até o fechamento das apostas. */
export function GoalBetCountdownBadge({
  market,
  className,
}: GoalBetCountdownBadgeProps) {
  const [countdown, setCountdown] = useState<GoalBetCountdown>(() =>
    computeGoalBetCountdown(market),
  );

  useEffect(() => {
    setCountdown(computeGoalBetCountdown(market));
    const id = window.setInterval(
      () => setCountdown(computeGoalBetCountdown(market)),
      TICK_MS,
    );
    return () => window.clearInterval(id);
  }, [market]);

  if (countdown.urgency === "none") return null;

  const urgent = countdown.urgency === "urgent";
  const closed = countdown.urgency === "closed";
  const Icon = closed ? Hourglass : Timer;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        urgent
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : closed
            ? "border-border/60 bg-muted/50 text-muted-foreground"
            : countdown.urgency === "soon"
              ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
              : "border-border/60 bg-muted/40 text-muted-foreground",
        className,
      )}
      title={countdown.srLabel}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span aria-hidden>{closed ? countdown.label : `Fecha em ${countdown.label}`}</span>
      <span className="sr-only">{countdown.srLabel}</span>
    </span>
  );
}