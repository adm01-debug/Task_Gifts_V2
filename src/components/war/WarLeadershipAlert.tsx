import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronUp, Crown, Target, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useWarLeadershipWatch } from "@/hooks/useWarLeadership";
import type { WarLeadEvent, WarLeadSeverity } from "@/lib/warLeadership";
import type { WarStanding } from "@/lib/departmentWar";
import { cn } from "@/lib/utils";

export interface WarLeadershipAlertProps {
  standings: WarStanding[];
  className?: string;
}

const SEVERITY_STYLE: Record<WarLeadSeverity, string> = {
  critical: "border-destructive/40 bg-destructive/10 text-destructive",
  warning: "border-warning/40 bg-warning/10 text-warning-foreground",
  positive: "border-success/40 bg-success/10 text-success",
  info: "border-border bg-muted/40 text-foreground",
};

function iconFor(event: WarLeadEvent) {
  switch (event.kind) {
    case "lead_taken":
      return Crown;
    case "lead_lost":
      return TrendingDown;
    case "overtaken":
      return AlertTriangle;
    case "overtook":
      return ChevronUp;
    default:
      return Target;
  }
}

/** Narra mudancas de lideranca do placar em tempo real. */
export function WarLeadershipAlert({ standings, className }: WarLeadershipAlertProps) {
  const { events, nextTarget } = useWarLeadershipWatch(standings);

  if (events.length === 0 && !nextTarget) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <AnimatePresence initial={false}>
        {events.slice(0, 3).map((event) => {
          const Icon = iconFor(event);
          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className={cn("border", SEVERITY_STYLE[event.severity])}>
                <CardContent className="flex items-start gap-3 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{event.title}</p>
                    <p className="text-sm opacity-80">{event.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {nextTarget && (
        <Card className="border-dashed">
          <CardContent className="flex items-center gap-3 p-4">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              Faltam <span className="font-semibold text-foreground">{nextTarget.gap} pts</span> para
              ultrapassar <span className="font-semibold text-foreground">{nextTarget.target}</span>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
