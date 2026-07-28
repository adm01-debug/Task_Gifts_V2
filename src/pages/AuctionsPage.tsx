import { useMemo, useState } from "react";
import { Gavel } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { AuctionCard, BidDialog } from "@/components/auction";
import { useAuctions, useMyAuctionBids } from "@/hooks/useAuctions";
import { useAuth } from "@/hooks/useAuth";
import type { Auction, AuctionBid } from "@/services/auctionService";

export default function AuctionsPage() {
  const { user } = useAuth();
  const { data: auctions, isLoading } = useAuctions();
  const { data: myBids } = useMyAuctionBids();

  const [selected, setSelected] = useState<Auction | null>(null);
  const [minNextBid, setMinNextBid] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);

  const bidsByAuction = useMemo(() => {
    const map = new Map<string, AuctionBid>();
    for (const bid of myBids ?? []) map.set(bid.auction_id, bid);
    return map;
  }, [myBids]);

  const handleBid = (auction: Auction, minimum: number) => {
    setSelected(auction);
    setMinNextBid(minimum);
    setDialogOpen(true);
  };

  return (
    <>
      <SEOHead
        title="Leilão de Recompensas | Task Gifts"
        description="Dispute itens raros da loja com lances às cegas em moedas conquistadas."
      />
      <PageShell
        title="Leilão de Recompensas"
        subtitle="Lance às cegas: ninguém vê a oferta dos outros. Perdeu? As moedas voltam integralmente."
        icon={<Gavel className="h-5 w-5" />}
        backFallback="/"
      >
        <SectionErrorBoundary sectionName="Leilão de Recompensas">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`auction-skeleton-${index}`} className="h-56 rounded-xl" />
              ))}
            </div>
          ) : (auctions ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum leilão aberto no momento. Volte em breve para disputar itens raros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(auctions ?? []).map((auction) => (
                <AuctionCard
                  key={auction.id}
                  auction={auction}
                  myBid={bidsByAuction.get(auction.id)}
                  isWinner={!!user && auction.winner_id === user.id}
                  onBid={handleBid}
                />
              ))}
            </div>
          )}
        </SectionErrorBoundary>

        <BidDialog
          auction={selected}
          minNextBid={minNextBid}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </PageShell>
    </>
  );
}
