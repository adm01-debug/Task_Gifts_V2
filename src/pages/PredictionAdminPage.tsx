import { useMemo, useState } from "react";
import { Plus, ShieldCheck, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  CreateMarketDialog,
  GoalBetDialog,
  PredictionAdminRow,
  PredictionOverviewCards,
  SettleMarketDialog,
  PredictionWatchdogPanel,
} from "@/components/prediction";
import {
  usePredictionAdminEvents,
  usePredictionMarkets,
} from "@/hooks/usePredictionMarkets";
import { summarizeMarkets, type PredictionStateView } from "@/lib/predictionAdmin";
import { runWatchdog, type WatchedMarket } from "@/lib/predictionWatchdog";
import type { PredictionMarketRow } from "@/services/predictionMarketService";

const EVENT_LABEL: Record<string, string> = {
  created: "Mercado criado",
  published: "Publicado",
  locked: "Travado",
  auto_locked: "Travado automaticamente",
  voided: "Anulado (reembolso integral)",
  settled: "Apurado",
};

const STATUS_FILTERS = [
  { value: "all", label: "Todos" },
  { value: "draft", label: "Rascunhos" },
  { value: "open", label: "Abertos" },
  { value: "locked", label: "Travados" },
  { value: "settled", label: "Apurados" },
  { value: "voided", label: "Anulados" },
] as const;

export default function PredictionAdminPage() {
  const { data: markets, isLoading } = usePredictionMarkets();
  const { data: events } = usePredictionAdminEvents();
  const [createOpen, setCreateOpen] = useState(false);
  const [goalBetOpen, setGoalBetOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [settleTarget, setSettleTarget] = useState<PredictionMarketRow | null>(null);

  const rows = useMemo(() => markets ?? [], [markets]);
  const overview = useMemo(() => {
    const views: PredictionStateView[] = rows.map((market) => ({
      status: market.status,
      locksAt: market.locks_at,
      optionCount: market.options?.length ?? 0,
      totalPool: market.total_pool,
    }));
    return summarizeMarkets(views, Date.now());
  }, [rows]);

  const watchdog = useMemo(() => {
    const watched: WatchedMarket[] = rows.map((market) => ({
      id: market.id,
      title: market.title,
      status: market.status,
      locksAt: market.locks_at,
      totalPool: market.total_pool,
    }));
    return runWatchdog(watched, Date.now());
  }, [rows]);

  const visibleRows = useMemo(
    () => (statusFilter === "all" ? rows : rows.filter((m) => m.status === statusFilter)),
    [rows, statusFilter],
  );

  return (
    <>
      <SEOHead
        title="Governança do Mercado de Previsões | Task Gifts"
        description="Crie, publique, trave e apure mercados de previsão com trilha auditável."
      />
      <PageShell
        title="Governança de Previsões"
        subtitle="Criação, publicação, travamento e apuração com trilha auditável completa."
        icon={<ShieldCheck className="h-5 w-5" />}
        backFallback="/previsoes"
      >
        <SectionErrorBoundary sectionName="Governança de Previsões">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={`admin-skeleton-${index}`} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => setGoalBetOpen(true)}>
                  <Target className="mr-1 h-4 w-4" /> Aposta de meta
                </Button>
                <Button size="sm" onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1 h-4 w-4" /> Novo mercado
                </Button>
              </div>
              <PredictionOverviewCards overview={overview} />
              <PredictionWatchdogPanel report={watchdog} />

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Mercados
                </h2>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="flex w-full flex-wrap justify-start">
                    {STATUS_FILTERS.map((filter) => (
                      <TabsTrigger key={filter.value} value={filter.value}>
                        {filter.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
                {visibleRows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
                    {rows.length === 0
                      ? "Nenhum mercado cadastrado. Comece criando um rascunho."
                      : "Nenhum mercado neste status."}
                  </div>
                ) : (
                  visibleRows.map((market) => (
                    <PredictionAdminRow
                      key={market.id}
                      market={market}
                      onSettle={setSettleTarget}
                    />
                  ))
                )}
              </section>

              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Trilha auditável
                </h2>
                <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card/40">
                  {(events ?? []).length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">
                      Nenhuma ação registrada ainda.
                    </p>
                  ) : (
                    (events ?? []).map((event) => (
                      <div key={event.id} className="flex items-center justify-between gap-3 p-3">
                        <span className="text-sm text-foreground">
                          {EVENT_LABEL[event.action] ?? event.action}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          )}
        </SectionErrorBoundary>
      </PageShell>

      <CreateMarketDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GoalBetDialog open={goalBetOpen} onOpenChange={setGoalBetOpen} />
      <SettleMarketDialog
        market={settleTarget}
        open={!!settleTarget}
        onOpenChange={(open) => !open && setSettleTarget(null)}
      />
    </>
  );
}