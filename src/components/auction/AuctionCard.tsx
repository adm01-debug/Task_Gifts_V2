import { motion } from "framer-motion";
import { Coins, Gavel, Trophy, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AuctionCountdown } from "./AuctionCountdown";
import type { Auction, AuctionBid } from "@/services/auctionService";

interface AuctionCardProps {
  auction: Auction;
  myBid?: AuctionBid;
  isWinner: boolean;
  onBid: (auction: Auction, minNextBid: number) => void;
}

const STATUS_LABEL: Record<Auction["status"], string> = {
  draft: "Rascunho",
  active: "Aberto",
  closed: "Encerrado",
  cancelled: "Cancelado",
};

export function AuctionCard({ auction, myBid, isWinner, onBid }: AuctionCardProps) {
  const isOpen = auction.status === "active" && new Date(auction.ends_at).getTime() > Date.now();
  const minNextBid = Math.max(
    auction.starting_bid,
    myBid ? myBid.amount + auction.min_increment : 0,
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="h-full border-border/60 bg-card/70 backdrop-blur">
        <CardContent className="flex h-full flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-bold text-foreground">{auction.title}</h3>
            <Badge variant={isOpen ? "default" : "secondary"}>
              {STATUS_LABEL[auction.status]}
            </Badge>
          </div>

          {auction.description && (
            <p className="line-clamp-3 text-sm text-muted-foreground">{auction.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <AuctionCountdown endsAt={auction.ends_at} />
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" aria-hidden />
              {auction.total_bids} participante(s)
            </span>
            <span className="inline-flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" aria-hidden />
              inicial {auction.starting_bid}
            </span>
          </div>

          {myBid && (
            <p className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              Seu lance: <strong>{myBid.amount}</strong> moedas
              {myBid.status === "refunded" && " · estornado"}
              {myBid.status === "won" && " · vencedor"}
            </p>
          )}

          {auction.status === "closed" && (
            <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Trophy className="h-4 w-4 text-primary" aria-hidden />
              {isWinner
                ? `Você venceu por ${auction.winning_bid} moedas!`
                : auction.winning_bid
                  ? `Arrematado por ${auction.winning_bid} moedas`
                  : "Encerrado sem lances"}
            </p>
          )}

          <div className="mt-auto pt-2">
            <Button
              className="min-h-[44px] w-full"
              disabled={!isOpen}
              onClick={() => onBid(auction, minNextBid)}
            >
              <Gavel className="mr-2 h-4 w-4" aria-hidden />
              {!isOpen ? "Leilão encerrado" : myBid ? "Aumentar lance" : "Dar lance às cegas"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
