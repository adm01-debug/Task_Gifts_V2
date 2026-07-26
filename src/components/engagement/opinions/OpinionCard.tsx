import { AlarmClock, MessageSquare, ThumbsUp, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { OpinionFeedEntry, SlaState } from "@/lib/opinionChannel";

const SLA_STYLES: Record<SlaState, string> = {
  overdue: "text-destructive",
  due_soon: "text-amber-500 dark:text-amber-400",
  on_track: "text-muted-foreground",
  closed: "text-muted-foreground",
};

const URGENCY_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  critical: "destructive",
  high: "default",
  normal: "secondary",
  low: "outline",
};

export interface OpinionCardProps {
  entry: OpinionFeedEntry;
  onSupport?: (entry: OpinionFeedEntry) => void;
  onOpen?: (entry: OpinionFeedEntry) => void;
  supportPending?: boolean;
  className?: string;
}

/** Cartão de manifestação. Nunca recebe identidade de autor anônimo. */
export function OpinionCard({ entry, onSupport, onOpen, supportPending, className }: OpinionCardProps) {
  return (
    <Card className={cn("glass border-border/50", className)}>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={URGENCY_VARIANT[entry.urgency] ?? "secondary"} className="text-[10px]">
            {entry.urgencyLabel}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {entry.categoryLabel}
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {entry.statusLabel}
          </Badge>
          <span className={cn("ml-auto flex items-center gap-1 text-xs", SLA_STYLES[entry.sla.state])}>
            <AlarmClock className="h-3.5 w-3.5" aria-hidden />
            {entry.sla.label}
          </span>
        </div>

        {entry.subject && <h3 className="text-sm font-semibold leading-tight">{entry.subject}</h3>}
        <p className="whitespace-pre-line text-sm text-muted-foreground">{entry.content}</p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <UserRound className="h-3.5 w-3.5" aria-hidden />
            {entry.authorName}
            {entry.departmentName ? ` · ${entry.departmentName}` : ""}
          </span>

          {onSupport && (
            <Button
              type="button"
              size="sm"
              variant={entry.viewerSupported ? "secondary" : "ghost"}
              className="min-h-11 sm:min-h-9"
              disabled={supportPending}
              onClick={() => onSupport(entry)}
              aria-pressed={entry.viewerSupported}
              aria-label={`Também penso assim (${entry.supportCount} apoios)`}
            >
              <ThumbsUp className="mr-2 h-4 w-4" aria-hidden />
              Também penso assim · {entry.supportCount}
            </Button>
          )}

          {onOpen && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-auto min-h-11 sm:min-h-9"
              onClick={() => onOpen(entry)}
            >
              <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
              Tratar · {entry.responseCount}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}