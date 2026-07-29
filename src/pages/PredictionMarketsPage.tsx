import { useMemo, useState } from "react";
import { LineChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  GoalBetHistoryPanel,
  GoalBetExposureAlert,
  GoalBetFilterBar,
  GoalBetSearchInput,
  MyGoalBetPosition,
  OracleLeaderboard,
  PredictionMarketCard,
  StakeDialog,
} from "@/components/prediction";
import {
  useMyPredictionStakes,
  usePredictionMarkets,
} from "@/hooks/usePredictionMarkets";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { computeGoalBetExposure } from "@/lib/goalBetExposure";
import {
  countMarketsByFilter,
  filterMarkets,
} from "@/lib/goalBetFilter";
import { useGoalBetFilter } from "@/hooks/useGoalBetFilter";
import { sortMarketsByUrgency } from "@/lib/goalBetOrdering";
import { searchMarkets } from "@/lib/goalBetSearch";
import { computeGoalBetPosition } from "@/lib/goalBetPosition";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

export default function PredictionMarketsPage() {
  const { data: markets, isLoading } = usePredictionMarkets();
  const { data: stakes } = useMyPredictionStakes();
  const { data: profile } = useCurrentProfile();

  const [selected, setSelected] = useState<PredictionMarketRow | null>(null);
  const [optionId, setOptionId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useGoalBetFilter();
  const [query, setQuery] = useState("");

  const myStakes = useMemo(() => stakes ?? [], [stakes]);
  /** Mercados prontos para render: abertos e mais urgentes primeiro. */
  const orderedMarkets = useMemo(() => sortMarketsByUrgency(markets), [markets]);
  const filterCounts = useMemo(
    () => countMarketsByFilter(orderedMarkets, myStakes),
    [orderedMarkets, myStakes],
  );
  const visibleMarkets = useMemo(
    () => searchMarkets(filterMarkets(orderedMarkets, myStakes, filter), query),
    [orderedMarkets, myStakes, filter, query],
  );
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

  /** Carteira consolidada: soma das posições do usuário em todos os mercados. */
  const portfolio = useMemo(() => {
    return (markets ?? []).reduce(
      (acc, market) => {
        const position = computeGoalBetPosition(market, myStakes);
        if (position.entries.length === 0) return acc;
        return {
          markets: acc.markets + 1,
          staked: acc.staked + position.totalStaked,
          projected: acc.projected + position.projectedReturn,
        };
      },
      { markets: 0, staked: 0, projected: 0 },
    );
  }, [markets, myStakes]);

  /** Exposição em mercados ainda em aberto frente ao saldo de moedas. */
  const exposure = useMemo(
    () =>
      computeGoalBetExposure({
        markets: markets ?? [],
        stakes: myStakes,
        balance: profile?.coins ?? 0,
      }),
    [markets, myStakes, profile?.coins],
  );

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
          <GoalBetExposureAlert exposure={exposure} className="mb-4" />
          {portfolio.markets > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-card/60 p-4 text-sm backdrop-blur-sm">
              <span className="font-semibold">
                Minha carteira · {portfolio.markets}{" "}
                {portfolio.markets === 1 ? "mercado" : "mercados"}
              </span>
              <span className="text-muted-foreground">
                Apostado:{" "}
                <strong className="text-foreground">
                  {portfolio.staked.toLocaleString("pt-BR")}
                </strong>{" "}
                · Potencial:{" "}
                <strong className="text-primary">
                  {portfolio.projected.toLocaleString("pt-BR")}
                </strong>{" "}
                moedas
              </span>
            </div>
          )}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={`prediction-skeleton-${index}`} className="h-64 rounded-xl" />
              ))}
            </div>
          ) : orderedMarkets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum mercado aberto no momento. Volte em breve para palpitar.
              </p>
            </div>
          ) : (
            <>
              <GoalBetFilterBar
                value={filter}
                counts={filterCounts}
                onChange={setFilter}
                className="mb-3"
              />
              <GoalBetSearchInput
                value={query}
                onChange={setQuery}
                resultCount={visibleMarkets.length}
                className="mb-4"
              />
              {visibleMarkets.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-10 text-center">
                  <p className="text-sm text-muted-foreground">
                    {query.trim()
                      ? "Nenhum mercado corresponde à busca. Tente outro termo."
                      : "Nenhum mercado nesse filtro. Tente “Todos”."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {visibleMarkets.map((market) => (
                    <div key={market.id} className="space-y-2">
                      <PredictionMarketCard
                        market={market}
                        myStakes={myStakes}
                        onStake={handleStake}
                      />
                      <MyGoalBetPosition market={market} stakes={myStakes} />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </SectionErrorBoundary>

        {/* Isolado do bloco de mercados: uma falha no ranking não pode
            impedir alguém de apostar. */}
        <SectionErrorBoundary sectionName="Ranking Oráculo">
          <OracleLeaderboard className="mt-6" />
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Meu histórico de apostas">
          <GoalBetHistoryPanel markets={markets ?? []} stakes={myStakes} className="mt-6" />
        </SectionErrorBoundary>

        <StakeDialog
          market={selected}
          optionId={optionId}
          alreadyStaked={alreadyStaked}
          markets={markets ?? []}
          stakes={myStakes}
          balance={profile?.coins ?? 0}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      </PageShell>
    </>
  );
}
