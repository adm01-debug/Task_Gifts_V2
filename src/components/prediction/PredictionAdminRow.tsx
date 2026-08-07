import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTransitionPredictionMarket } from "@/hooks/usePredictionMarkets";
import { ADMIN_REJECTION_MESSAGES } from "@/services/predictionMarketService";
import type { PredictionMarketRow } from "@/services/predictionMarketService";
import {
  canPerform,
  describeAction,
  type PredictionAdminAction,
  type PredictionStateView,
} from "@/lib/predictionAdmin";

export interface PredictionAdminRowProps {
  market: PredictionMarketRow;
  onSettle: (market: PredictionMarketRow) => void;
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Rascunho",
  open: "Aberto",
  locked: "Travado",
  settled: "Apurado",
  voided: "Anulado",
};

const ACTION_LABEL: Record<PredictionAdminAction, string> = {
  publish: "Publicar",
  lock: "Travar",
  settle: "Apurar",
  void: "Anular",
};

export function PredictionAdminRow({ market, onSettle }: PredictionAdminRowProps) {
  const transition = useTransitionPredictionMarket();

  const view: PredictionStateView = {
    status: market.status,
    locksAt: market.locks_at,
    optionCount: market.options?.length ?? 0,
    totalPool: market.total_pool,
  };
  const now = Date.now();

  const run = async (action: "publish" | "lock" | "void") => {
    if (action === "void" && !window.confirm(describeAction("void", view))) return;
    try {
      const result = await transition.mutateAsync({ marketId: market.id, action });
      if (!result.ok) {
        toast.error(
          ADMIN_REJECTION_MESSAGES[result.reason ?? ""] ?? "Ação recusada pelo servidor.",
        );
        return;
      }
      toast.success("Ação aplicada e registrada na trilha auditável.");
    } catch {
      toast.error("Erro inesperado ao executar a ação.");
    }
  };

  const actions: PredictionAdminAction[] = ["publish", "lock", "settle", "void"];

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={market.status === "open" ? "default" : "secondary"}>
              {STATUS_LABEL[market.status] ?? market.status}
            </Badge>
            <p className="truncate font-medium text-foreground">{market.title}</p>
          </div>
          <p className="text-xs text-muted-foreground">
            {(market.options ?? []).length} opções · pote {market.total_pool.toLocaleString("pt-BR")}{" "}
            moedas · taxa {(market.rake_bps / 100).toFixed(1)}% · trava em{" "}
            {new Date(market.locks_at).toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {actions
            .filter((action) => canPerform(action, view, now))
            .map((action) => (
              <Button
                key={action}
                size="sm"
                variant={action === "void" ? "destructive" : "outline"}
                title={describeAction(action, view)}
                disabled={transition.isPending}
                onClick={() =>
                  action === "settle" ? onSettle(market) : void run(action)
                }
              >
                {ACTION_LABEL[action]}
              </Button>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}