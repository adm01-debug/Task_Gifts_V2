import { CalendarDays, Sparkles, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import { PLAN_STATUS_LABEL, type ActionPlan } from "@/services/actionPlansService";

export interface ActionPlanCardProps {
  plan: ActionPlan;
  isSelected?: boolean;
  onSelect: (plan: ActionPlan) => void;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

/** Cartão resumido de um plano de ação de clima. */
export function ActionPlanCard({ plan, isSelected = false, onSelect }: ActionPlanCardProps) {
  const isNr1 = plan.source === "nr1_category";
  const isAuto = plan.source === "engagement_factor" || isNr1;

  return (
    <Card
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={() => onSelect(plan)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect(plan);
        }
      }}
      className={cn(
        "cursor-pointer transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary bg-primary/5",
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">{plan.title}</CardTitle>
          <Badge variant="outline" className="shrink-0">
            {PLAN_STATUS_LABEL[plan.status]}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
          {plan.pillar && <span>{PILLAR_LABELS[plan.pillar]?.pt ?? plan.pillar}</span>}
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" aria-hidden />
            {formatDate(plan.target_date)}
          </span>
          {isAuto && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Sparkles className="h-3 w-3" aria-hidden />
              {isNr1 ? "Tratativa NR-1" : "Gerado do diagnóstico"}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={plan.progress_percent} className="h-1.5" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{plan.progress_percent}% concluído</span>
          {plan.target_score !== null && (
            <span className="inline-flex items-center gap-1">
              <Target className="h-3 w-3" aria-hidden />
              {plan.initial_score ?? "—"} → {plan.target_score}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
