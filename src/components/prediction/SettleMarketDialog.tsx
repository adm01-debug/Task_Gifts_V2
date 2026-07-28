import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useSettlePredictionMarket } from "@/hooks/usePredictionMarkets";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

export interface SettleMarketDialogProps {
  market: PredictionMarketRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Apuração: escolher o vencedor ou reembolsar todos (sem vencedor). */
export function SettleMarketDialog({ market, open, onOpenChange }: SettleMarketDialogProps) {
  const [winner, setWinner] = useState<string>("__refund__");
  const settle = useSettlePredictionMarket();

  if (!market) return null;

  const handleSettle = async () => {
    try {
      const result = await settle.mutateAsync({
        marketId: market.id,
        winningOptionId: winner === "__refund__" ? null : winner,
      });
      if (!result.ok) {
        toast.error(
          result.already_settled
            ? "Este mercado já havia sido apurado."
            : "Não foi possível apurar o mercado.",
        );
        return;
      }
      toast.success(
        result.refunded
          ? "Mercado anulado: todas as moedas foram devolvidas."
          : `Apurado: ${result.paid ?? 0} moedas pagas e ${result.rake ?? 0} retidas pela casa.`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Erro inesperado ao apurar o mercado.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apurar “{market.title}”</DialogTitle>
          <DialogDescription>
            Pote de {market.total_pool.toLocaleString("pt-BR")} moedas. A apuração é definitiva e
            credita os acertadores imediatamente.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={winner} onValueChange={setWinner} className="space-y-2">
          {(market.options ?? []).map((option) => (
            <div key={option.id} className="flex items-center gap-2 rounded-lg border border-border/60 p-3">
              <RadioGroupItem value={option.id} id={`winner-${option.id}`} />
              <Label htmlFor={`winner-${option.id}`} className="flex-1 cursor-pointer">
                {option.label}
                <span className="ml-2 text-xs text-muted-foreground">
                  {option.pool.toLocaleString("pt-BR")} moedas
                </span>
              </Label>
            </div>
          ))}
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-border/60 p-3">
            <RadioGroupItem value="__refund__" id="winner-refund" />
            <Label htmlFor="winner-refund" className="flex-1 cursor-pointer">
              Sem vencedor — devolver tudo
            </Label>
          </div>
        </RadioGroup>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={settle.isPending} onClick={() => void handleSettle()}>
            {settle.isPending ? "Apurando..." : "Confirmar apuração"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}