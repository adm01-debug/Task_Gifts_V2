import { CheckCircle2, Circle, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ITEM_STATUS_LABEL,
  PRIORITY_CLASS,
  PRIORITY_LABEL,
  type ActionItemStatus,
  type ActionPlanItem,
} from "@/services/actionPlansService";

export interface ActionPlanItemListProps {
  items: ActionPlanItem[];
  isLoading?: boolean;
  canEdit?: boolean;
  onChangeStatus?: (itemId: string, status: ActionItemStatus) => void;
}

/** Próximo status no ciclo pendente → em andamento → concluída. */
function nextStatus(status: ActionItemStatus): ActionItemStatus {
  if (status === "pending") return "in_progress";
  if (status === "in_progress") return "completed";
  return "pending";
}

function StatusIcon({ status }: { status: ActionItemStatus }) {
  if (status === "completed") return <CheckCircle2 className="h-4 w-4 text-success" aria-hidden />;
  if (status === "in_progress") return <CircleDashed className="h-4 w-4 text-primary" aria-hidden />;
  return <Circle className="h-4 w-4 text-muted-foreground" aria-hidden />;
}

/** Lista 5W2H das ações de um plano. */
export function ActionPlanItemList({
  items,
  isLoading = false,
  canEdit = false,
  onChangeStatus,
}: ActionPlanItemListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Este plano ainda não possui ações cadastradas.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-2">
                  <StatusIcon status={item.status} />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        item.status === "completed" && "text-muted-foreground line-through",
                      )}
                    >
                      {item.what_title}
                    </p>
                    {item.why_reason && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-medium">Por quê: </span>
                        {item.why_reason}
                      </p>
                    )}
                    {item.how_method && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        <span className="font-medium">Como: </span>
                        {item.how_method}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={cn("shrink-0", PRIORITY_CLASS[item.priority])}>
                  {PRIORITY_LABEL[item.priority]}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <span className="text-xs text-muted-foreground">
                  {item.when_start && item.when_end
                    ? `${new Date(`${item.when_start}T00:00:00`).toLocaleDateString("pt-BR")} → ${new Date(`${item.when_end}T00:00:00`).toLocaleDateString("pt-BR")}`
                    : ITEM_STATUS_LABEL[item.status]}
                </span>
                {canEdit && onChangeStatus && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] sm:min-h-[36px]"
                    onClick={() => onChangeStatus(item.id, nextStatus(item.status))}
                  >
                    {item.status === "completed"
                      ? "Reabrir"
                      : item.status === "in_progress"
                        ? "Concluir"
                        : "Iniciar"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ol>
  );
}
