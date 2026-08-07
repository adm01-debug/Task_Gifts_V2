import { ArrowLeftRight, Check, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRespondCardTrade } from "@/hooks/useTradingCards";
import type { CardTradeRow } from "@/services/tradingCardsService";

const STATUS_LABEL: Record<CardTradeRow["status"], string> = {
  pending: "Aguardando",
  accepted: "Aceita",
  declined: "Recusada",
  cancelled: "Cancelada",
  expired: "Expirada",
};

const REASON_LABEL: Record<string, string> = {
  stale_inventory: "Uma das cartas deixou de ser repetida. A troca não pôde ser concluída.",
  expired: "Esta proposta expirou.",
  not_pending: "Esta proposta já foi respondida.",
  forbidden: "Você não pode responder a esta proposta.",
  not_found: "Proposta não encontrada.",
};

export interface TradeInboxProps {
  trades: CardTradeRow[];
  currentUserId: string;
  cardNames: Map<string, string>;
}

/** Caixa de propostas. A transferência é atômica e revalidada no servidor ao aceitar. */
export function TradeInbox({ trades, currentUserId, cardNames }: TradeInboxProps) {
  const respond = useRespondCardTrade();

  const handle = async (tradeId: string, action: "accept" | "decline" | "cancel") => {
    try {
      const result = await respond.mutateAsync({ tradeId, action });
      if (!result.success) {
        toast.error(REASON_LABEL[result.reason ?? ""] ?? "Não foi possível concluir a ação.");
        return;
      }
      toast.success(action === "accept" ? "Troca concluída!" : "Proposta atualizada.");
    } catch {
      toast.error("Falha ao responder à proposta.");
    }
  };

  if (trades.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhuma proposta de troca. Só é possível oferecer cartas repetidas.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => {
        const incoming = trade.responder_id === currentUserId;
        const pending = trade.status === "pending";
        return (
          <div
            key={trade.id}
            className="flex flex-col gap-3 rounded-xl border border-border bg-card/60 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0 space-y-1">
              <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                <span className="font-semibold">{cardNames.get(trade.offered_card_id) ?? "Carta"}</span>
                <ArrowLeftRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-semibold">{cardNames.get(trade.requested_card_id) ?? "Carta"}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={pending ? "default" : "secondary"}>{STATUS_LABEL[trade.status]}</Badge>
                <span className="text-xs text-muted-foreground">
                  {incoming ? "Proposta recebida" : "Proposta enviada"}
                </span>
              </div>
              {trade.message && <p className="text-xs text-muted-foreground">“{trade.message}”</p>}
            </div>

            {pending && (
              <div className="flex shrink-0 gap-2">
                {incoming ? (
                  <>
                    <Button
                      size="sm"
                      className="min-h-[44px]"
                      disabled={respond.isPending}
                      onClick={() => void handle(trade.id, "accept")}
                    >
                      <Check className="mr-1 h-4 w-4" aria-hidden="true" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="min-h-[44px]"
                      disabled={respond.isPending}
                      onClick={() => void handle(trade.id, "decline")}
                    >
                      <X className="mr-1 h-4 w-4" aria-hidden="true" />
                      Recusar
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px]"
                    disabled={respond.isPending}
                    onClick={() => void handle(trade.id, "cancel")}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
