import { useState } from "react";
import { Link } from "react-router-dom";
import { Dices } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictionMarketCard, StakeDialog } from "@/components/prediction";
import {
  useMyPredictionStakes,
  usePredictionMarkets,
} from "@/hooks/usePredictionMarkets";
import { pickGoalBetMarket } from "@/lib/goalBetShowcase";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

export interface CampaignGoalBetPanelProps {
  campaignName: string;
}

/**
 * Vitrine da Aposta de Meta dentro da campanha: mostra o mercado vinculado e
 * permite apostar sem sair da página. A economia continua 100% no servidor.
 */
export function CampaignGoalBetPanel({ campaignName }: CampaignGoalBetPanelProps) {
  const { data: markets, isLoading } = usePredictionMarkets();
  const { data: myStakes } = useMyPredictionStakes();
  const [target, setTarget] = useState<{ market: PredictionMarketRow; optionId: string } | null>(
    null,
  );

  const market = pickGoalBetMarket(markets ?? [], campaignName);

  if (isLoading) return <Skeleton className="h-56 w-full rounded-xl" />;
  // Rascunho ainda não é público: só o painel administrativo o exibe.
  if (!market || market.status === "draft") return null;

  const alreadyStaked = (myStakes ?? [])
    .filter((s) => s.market_id === market.id)
    .reduce((acc, s) => acc + s.amount, 0);

  return (
    <section className="space-y-3" aria-label="Aposta de meta da campanha">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Dices className="h-5 w-5 text-primary" aria-hidden />
          Aposta de meta
        </h2>
        <Button asChild variant="ghost" size="sm">
          <Link to="/previsoes">Ver todos os mercados</Link>
        </Button>
      </div>

      <PredictionMarketCard
        market={market}
        myStakes={myStakes ?? []}
        onStake={(m, optionId) => setTarget({ market: m, optionId })}
      />

      <StakeDialog
        market={target?.market ?? null}
        optionId={target?.optionId ?? null}
        alreadyStaked={alreadyStaked}
        open={!!target}
        onOpenChange={(open) => {
          if (!open) setTarget(null);
        }}
      />
    </section>
  );
}