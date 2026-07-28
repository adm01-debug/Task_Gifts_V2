import { useEffect, useState } from "react";
import { Coins, Gavel } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePlaceBid } from "@/hooks/useAuctions";
import type { Auction, PlaceBidResult } from "@/services/auctionService";

interface BidDialogProps {
  auction: Auction | null;
  minNextBid: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REASON_MESSAGES: Record<string, string> = {
  not_open: "Este leilão não está aberto para lances.",
  not_found: "Leilão não encontrado.",
  invalid_amount: "Informe um valor de lance válido.",
  profile_missing: "Não foi possível localizar seu saldo.",
  unauthenticated: "Faça login para participar do leilão.",
};

function describeFailure(result: PlaceBidResult): string {
  if (result.reason === "below_minimum") {
    return `O lance mínimo agora é ${result.min_required} moedas.`;
  }
  if (result.reason === "insufficient_coins") {
    return `Saldo insuficiente: faltam ${(result.required ?? 0) - (result.balance ?? 0)} moedas.`;
  }
  return REASON_MESSAGES[result.reason ?? ""] ?? "Não foi possível registrar seu lance.";
}

export function BidDialog({ auction, minNextBid, open, onOpenChange }: BidDialogProps) {
  const placeBid = usePlaceBid();
  const [amount, setAmount] = useState<string>("");
  // Chave estável por abertura do diálogo: retentativas não retêm moedas duas vezes.
  const [dedupeKey, setDedupeKey] = useState<string>(() => crypto.randomUUID());

  useEffect(() => {
    if (open) {
      setAmount(String(minNextBid));
      setDedupeKey(crypto.randomUUID());
    }
  }, [open, minNextBid]);

  const parsed = Number.parseInt(amount, 10);
  const valid = Number.isFinite(parsed) && parsed >= minNextBid;

  const handleSubmit = async () => {
    if (!auction || !valid || placeBid.isPending) return;
    try {
      const result = await placeBid.mutateAsync({
        auctionId: auction.id,
        amount: parsed,
        dedupeKey,
      });
      if (!result.success) {
        toast.error(describeFailure(result));
        return;
      }
      toast.success(
        result.replayed
          ? `Lance já registrado: ${result.amount} moedas.`
          : `Lance de ${result.amount} moedas registrado às cegas.`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Falha de comunicação. Tente novamente.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" aria-hidden />
            {auction?.title ?? "Dar lance"}
          </DialogTitle>
          <DialogDescription>
            Lance às cegas: ninguém vê o valor dos outros. As moedas ficam retidas até o
            encerramento e são devolvidas se você não vencer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="bid-amount">Seu lance (mínimo {minNextBid} moedas)</Label>
          <Input
            id="bid-amount"
            type="number"
            inputMode="numeric"
            min={minNextBid}
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="min-h-[44px]"
          />
          {!valid && amount !== "" && (
            <p className="text-xs text-destructive">
              O valor precisa ser de pelo menos {minNextBid} moedas.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="min-h-[44px]">
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!valid || placeBid.isPending}
            className="min-h-[44px]"
          >
            <Coins className="mr-2 h-4 w-4" aria-hidden />
            {placeBid.isPending ? "Enviando..." : "Confirmar lance"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
