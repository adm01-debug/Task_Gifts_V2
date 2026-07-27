import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { History } from "lucide-react";
import { useLuckyWheelHistory } from "@/hooks/useLuckyWheel";

export function LuckyWheelHistory() {
  const { data: spins, isLoading } = useLuckyWheelHistory();

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4 text-primary" aria-hidden />
          Últimos giros
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        ) : (spins ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Você ainda não girou a roleta. Seu primeiro prêmio está esperando!
          </p>
        ) : (
          (spins ?? []).map((spin) => (
            <div
              key={spin.id}
              className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/30 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{spin.prize_label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(spin.created_at).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              {spin.amount > 0 && (
                <span className="shrink-0 text-sm font-semibold text-primary">
                  +{spin.amount} {spin.prize_type === "coins" ? "moedas" : "XP"}
                </span>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}