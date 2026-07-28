import { useMemo } from "react";
import { History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuctionAdminEvents } from "@/hooks/useAuctions";
import type { AuctionAdminAction, AuctionAdminEvent } from "@/services/auctionService";

const ACTION_LABEL: Record<AuctionAdminAction, string> = {
  draft_created: "Rascunho criado",
  published: "Publicado",
  settled: "Apurado",
  cancelled: "Cancelado",
  stock_reserved: "Estoque reservado",
  stock_unavailable: "Sem estoque — caução estornada",
};

const ACTION_VARIANT: Record<AuctionAdminAction, "default" | "secondary" | "destructive" | "outline"> = {
  draft_created: "outline",
  published: "default",
  settled: "secondary",
  cancelled: "destructive",
  stock_reserved: "secondary",
  stock_unavailable: "destructive",
};

function formatDetails(event: AuctionAdminEvent): string {
  const details = event.details ?? {};
  const parts: string[] = [];

  const winningBid = details.winning_bid;
  if (typeof winningBid === "number") parts.push(`lance vencedor ${winningBid} moedas`);

  const refunded = details.refunded;
  if (typeof refunded === "number") parts.push(`${refunded} caução(ões) estornada(s)`);

  const refundedAmount = details.refunded_amount;
  if (typeof refundedAmount === "number") parts.push(`${refundedAmount} moedas devolvidas`);

  const startingBid = details.starting_bid;
  if (typeof startingBid === "number") parts.push(`lance inicial ${startingBid}`);

  if (details.reward_id) parts.push("item da loja vinculado");

  return parts.join(" · ");
}

/**
 * Linha do tempo append-only das ações administrativas. Os registros são
 * gravados pelo banco dentro das próprias RPCs — não há caminho de escrita
 * pelo cliente, o que torna a trilha confiável para auditoria.
 */
export function AuctionAuditTrail() {
  const { data, isLoading } = useAuctionAdminEvents(40);

  const events = useMemo(() => data ?? [], [data]);

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" aria-hidden />
          Trilha auditável
        </CardTitle>
        <CardDescription>
          Registro imutável das últimas ações administrativas de leilão.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="space-y-2" aria-hidden>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}

        {!isLoading && events.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma ação registrada ainda. Crie ou publique um leilão para iniciar a trilha.
          </p>
        )}

        <ol className="space-y-2">
          {events.map((event) => {
            const detail = formatDetails(event);
            return (
              <li
                key={event.id}
                className="flex flex-col gap-1 rounded-lg border border-border/50 bg-background/40 p-3 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={ACTION_VARIANT[event.action]}>
                    {ACTION_LABEL[event.action] ?? event.action}
                  </Badge>
                  {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
                </div>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={event.created_at}
                >
                  {new Date(event.created_at).toLocaleString("pt-BR")}
                </time>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}