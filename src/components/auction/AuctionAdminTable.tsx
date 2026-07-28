import { useState } from "react";
import { CheckCircle2, Loader2, Play, XCircle } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuctionCountdown } from "./AuctionCountdown";
import { useCancelAuction, useCloseAuction, usePublishAuction } from "@/hooks/useAuctions";
import { canPerform, describeAction, type AdminAction } from "@/lib/auctionAdmin";
import type { Auction } from "@/services/auctionService";

const STATUS_LABEL: Record<Auction["status"], string> = {
  draft: "Rascunho",
  active: "Aberto",
  closed: "Encerrado",
  cancelled: "Cancelado",
};

const ACTION_LABEL: Record<AdminAction, string> = {
  publish: "Publicar",
  close: "Encerrar e apurar",
  cancel: "Cancelar e estornar",
};

interface AuctionAdminTableProps {
  auctions: readonly Auction[];
}

export function AuctionAdminTable({ auctions }: AuctionAdminTableProps) {
  const [pending, setPending] = useState<{ auction: Auction; action: AdminAction } | null>(null);

  const publish = usePublishAuction();
  const close = useCloseAuction();
  const cancel = useCancelAuction();
  const isBusy = publish.isPending || close.isPending || cancel.isPending;

  const confirm = async () => {
    if (!pending) return;
    const { auction, action } = pending;
    try {
      if (action === "publish") await publish.mutateAsync(auction.id);
      if (action === "close") await close.mutateAsync(auction.id);
      if (action === "cancel") await cancel.mutateAsync(auction.id);
      toast.success(`Leilão "${auction.title}" atualizado.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "A operação não pôde ser concluída.");
    } finally {
      setPending(null);
    }
  };

  if (auctions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
        <p className="text-sm text-muted-foreground">Nenhum leilão cadastrado ainda.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {auctions.map((auction) => {
          const now = Date.now();
          const state = {
            status: auction.status,
            endsAt: auction.ends_at,
            totalBids: auction.total_bids,
          };
          const actions = (["publish", "close", "cancel"] as AdminAction[]).filter((action) =>
            canPerform(action, state, now),
          );

          return (
            <Card key={auction.id} className="border-border/60 bg-card/70 backdrop-blur">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-semibold text-foreground">{auction.title}</span>
                    <Badge variant={auction.status === "active" ? "default" : "secondary"}>
                      {STATUS_LABEL[auction.status]}
                    </Badge>
                    {auction.status === "active" && new Date(auction.ends_at).getTime() <= now && (
                      <Badge variant="destructive">Apuração pendente</Badge>
                    )}
                  </div>
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <AuctionCountdown endsAt={auction.ends_at} />
                    <span>{auction.total_bids} participante(s)</span>
                    <span>inicial {auction.starting_bid} · incremento {auction.min_increment}</span>
                    {auction.winning_bid != null && <span>vencedor pagou {auction.winning_bid}</span>}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {actions.map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant={action === "cancel" ? "destructive" : action === "close" ? "default" : "secondary"}
                      className="min-h-[44px]"
                      disabled={isBusy}
                      onClick={() => setPending({ auction, action })}
                    >
                      {action === "publish" && <Play className="mr-1 h-3.5 w-3.5" aria-hidden />}
                      {action === "close" && <CheckCircle2 className="mr-1 h-3.5 w-3.5" aria-hidden />}
                      {action === "cancel" && <XCircle className="mr-1 h-3.5 w-3.5" aria-hidden />}
                      {ACTION_LABEL[action]}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!pending} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending ? ACTION_LABEL[pending.action] : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending
                ? describeAction(pending.action, {
                    status: pending.auction.status,
                    endsAt: pending.auction.ends_at,
                    totalBids: pending.auction.total_bids,
                  })
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={isBusy}>
              {isBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}