import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { PredictionMarketCard, StakeDialog } from "@/components/prediction";
import {
  useMyPredictionStakes,
  usePredictionMarkets,
} from "@/hooks/usePredictionMarkets";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

export default function PredictionMarketsPage() {
  const { data: markets, isLoading } = usePredictionMarkets();
  const { data: stakes } = useMyPredictionStakes();

  const [selected, setSelected] = useState<PredictionMarketRow | null>(null);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const myStakes = useMemo(() => stakes ?? [], [stakes]);
  const alreadyStaked = useMemo(() => {
    if (!selected) return 0;
    return myStakes
      .filter((s) => s.market_id === selected.id)
      .reduce((acc, s) => acc + s.amount, 0);
  }, [myStakes, selected]);

  const handleStake = (market: PredictionMarketRow, option: string) => {
    setSelected(market);
    setOptionId(option);
    setDialogOpen(true);
  };

  return (
    <>
      <SEOHead
        title="Mercado de Previsões | Task Gifts"
        description="Aposte moedas em previsões da operação e divida o pote com quem acertar."
      />
      <PageShell
        title="Mercado de Previsões"
        subtitle="Aposte moedas no que vai acontecer. Quem acerta divide o pote proporcionalmente."
        icon={<LineChart className="h-5 w-5" />}
        backFallback="/"
      >
        <SectionErrorBoundary sectionName="Mercado de Previsões">
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`prediction-skeleton-${index}`} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : (markets ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum mercado aberto no momento. Volte em breve para palpitar.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(markets ?? []).map((market) => (
                <PredictionMarketCard
                  key={market.id}
                  market={market}
                  myStakes={myStakes}
                  onStake={handleStake}
                />
              ))}
            </div>
          )}
        </SectionErrorBoundary>

        <StakeDialog
          market={selected}
          optionId={optionId}
          alreadyStaked={alreadyStaked}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </PageShell>
    </>
  );
}
