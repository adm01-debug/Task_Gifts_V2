import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  GOAL_BET_FILTERS,
  GOAL_BET_FILTER_LABELS,
  type GoalBetFilter,
} from "@/lib/goalBetFilter";

export interface GoalBetFilterBarProps {
  value: GoalBetFilter;
  counts: Record<GoalBetFilter, number>;
  onChange: (filter: GoalBetFilter) => void;
  className?: string;
}

/** Barra de filtros rápidos da vitrine de mercados. */
export function GoalBetFilterBar({
  value,
  counts,
  onChange,
  className,
}: GoalBetFilterBarProps) {
  return (
    <div
      role="group"
      aria-label="Filtrar mercados"
      className={cn("flex flex-wrap gap-2", className)}
    >
      {GOAL_BET_FILTERS.map((filter) => {
        const active = filter === value;
        return (
          <Button
            key={filter}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            aria-pressed={active}
            className="h-9 rounded-full px-4"
            onClick={() => onChange(filter)}
          >
            {GOAL_BET_FILTER_LABELS[filter]}
            <span
              className={cn(
                "ml-2 rounded-full px-1.5 text-xs",
                active
                  ? "bg-primary-foreground/20"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {counts[filter]}
            </span>
          </Button>
        );
      })}
    </div>
  );
}