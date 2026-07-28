import { useMemo } from "react";
import { Gavel } from "lucide-react";

import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { AuctionAdminForm, AuctionAdminTable, AuctionAuditTrail } from "@/components/auction";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminAuctions } from "@/hooks/useAuctions";
import { summarizeAuctions } from "@/lib/auctionAdmin";

export default function AuctionsAdmin() {
  const { data: auctions, isLoading } = useAdminAuctions();

  const overview = useMemo(
    () =>
      summarizeAuctions(
        (auctions ?? []).map((auction) => ({
          status: auction.status,
          endsAt: auction.ends_at,
          totalBids: auction.total_bids,
        })),
        Date.now(),
        (auctions ?? []).map((auction) => auction.winning_bid),
      ),
    [auctions],
  );

  const metrics = [
    { label: "Total", value: overview.total },
    { label: "Rascunhos", value: overview.drafts },
    { label: "Abertos", value: overview.active },
    { label: "Encerrando em 24h", value: overview.endingSoon },
    { label: "Encerrados", value: overview.closed },
    { label: "Moedas pagas", value: overview.coinsAwarded },
  ];

  return (
    <>
      <SEOHead
        title="Administração de Leilões | Task Gifts"
        description="Crie, publique, apure e cancele leilões de recompensas com trilha auditável."
      />
      <PageShell
        title="Administração de Leilões"
        subtitle="Governança completa: criação em rascunho, apuração server-side e estorno garantido."
        icon={<Gavel className="h-5 w-5" />}
        backFallback="/leilao"
      >
        <SectionErrorBoundary sectionName="Administração de Leilões">
          <div className="space-y-6">
            {overview.expiredButOpen > 0 && (
              <Alert variant="destructive">
                <AlertTitle>Apuração pendente</AlertTitle>
                <AlertDescription>
                  {overview.expiredButOpen} leilão(ões) passaram do término e continuam abertos.
                  Encerre manualmente se o agendamento automático não rodar em minutos.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
              {metrics.map((metric) => (
                <Card key={metric.label} className="border-border/60 bg-card/70 backdrop-blur">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{metric.label}</p>
                    <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
              <AuctionAdminForm />

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={`auction-admin-skeleton-${index}`} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : (
                <AuctionAdminTable auctions={auctions ?? []} />
              )}
            </div>

            <AuctionAuditTrail />
          </div>
        </SectionErrorBoundary>
      </PageShell>
    </>
  );
}