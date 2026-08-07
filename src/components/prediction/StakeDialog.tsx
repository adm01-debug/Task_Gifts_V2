import { useEffect, useState } from "react";
import { Coins } from "lucide-react";
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
import { usePlacePredictionStake } from "@/hooks/usePredictionMarkets";
import { computeGoalBetExposure } from "@/lib/goalBetExposure";
import { computeGoalBetStakePreview } from "@/lib/goalBetStakePreview";
import { GoalBetExposureAlert } from "./GoalBetExposureAlert";
import {
  STAKE_REJECTION_MESSAGES,
  type PredictionMarketRow,
  type PredictionStakeRow,
} from "@/services/predictionMarketService";

export interface StakeDialogProps {
  market: PredictionMarketRow | null;
  optionId: string | null;
  /** Total já aportado pelo usuário neste mercado, para respeitar o teto. */
  alreadyStaked: number;
  /** Mercados e aportes do usuário para simular a exposição total. */
  markets?: readonly PredictionMarketRow[];
  stakes?: readonly PredictionStakeRow[];
  /** Saldo atual de moedas do usuário. */
  balance?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StakeDialog({
  market,
  optionId,
  alreadyStaked,
  markets,
  stakes,
  balance,
  open,
  onOpenChange,
}: StakeDialogProps) {
  const placeStake = usePlacePredictionStake();
  const [amount, setAmount] = useState("");
  // Chave estável por abertura: retentativas nunca debitam duas vezes.
  const [dedupeKey, setDedupeKey] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (open && market) {
      setAmount(String(market.min_stake));
      setDedupeKey(crypto.randomUUID());
    }
  }, [open, market]);

  const parsed = Number.parseInt(amount, 10);
  const preview = computeGoalBetStakePreview({
    market,
    optionId,
    amount: parsed,
    alreadyStaked,
  });
  const valid = preview.valid;

  // Exposição projetada caso este aporte seja confirmado agora.
  const exposure = computeGoalBetExposure({
    markets,
    stakes,
    balance,
    extraStake: valid ? parsed : 0,
  });

  const handleSubmit = async () => {
    if (!market || !optionId || !valid || placeStake.isPending) return;
    try {
      const result = await placeStake.mutateAsync({
        marketId: market.id,
        optionId,
        amount: parsed,
        dedupeKey,
      });
      if (!result.ok) {
        toast.error(
          STAKE_REJECTION_MESSAGES[result.reason ?? ""] ??
            "Não foi possível registrar seu aporte.",
        );
        return;
      }
      toast.success(
        result.duplicate
          ? "Aporte já registrado."
          : `Aporte de ${parsed} moedas confirmado!`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Erro inesperado ao registrar o aporte. Tente novamente.");
    }
  };

  const label = market?.options.find((o) => o.id === optionId)?.label ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" aria-hidden />
            Apostar em “{label}”
          </DialogTitle>
          <DialogDescription>
            O prêmio é dividido entre quem acertar, proporcional ao aporte. Sem
            vencedores, todos recebem as moedas de volta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="prediction-stake-amount">Moedas</Label>
          <Input
            id="prediction-stake-amount"
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/\D/g, ""))}
          />
          <p className="text-xs text-muted-foreground">
            Mínimo {market?.min_stake ?? 0} moedas
            {market && market.max_stake_per_user > 0
              ? ` · disponível neste mercado: ${Math.max(preview.remaining, 0)}`
              : ""}
          </p>
          {preview.valid ? (
            <div className="rounded-lg border border-border/60 bg-muted/40 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Multiplicador estimado</span>
                <span className="font-semibold text-foreground">
                  {preview.multiplierAfter.toFixed(2)}x
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Retorno projetado</span>
                <span className="font-semibold text-foreground">
                  {preview.projectedReturn} moedas
                </span>
              </div>
              <p className="mt-2 text-muted-foreground">
                {preview.concentrated
                  ? preview.message
                  : `Seu aporte reduz as odds desta opção em ${(preview.dilution * 100).toFixed(0)}%. Valor estimado, não garantido.`}
              </p>
            </div>
          ) : (
            amount.length > 0 && (
              <p className="text-xs text-destructive">{preview.message}</p>
            )
          )}
          {valid && exposure.level !== "none" && (
            <GoalBetExposureAlert exposure={exposure} compact />
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!valid || placeStake.isPending}>
            {placeStake.isPending ? "Confirmando..." : "Confirmar aporte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
