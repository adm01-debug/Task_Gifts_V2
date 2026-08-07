import { useCallback, useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { CardTile, CollectionProgressBar, PackList, SetRewardsPanel, TradeInbox } from "@/components/cards";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import {
  useCardSetRewards,
  useCardDefinitions,
  useCardPacks,
  useCardTrades,
  useClaimCardSetReward,
  useOwnedCards,
} from "@/hooks/useTradingCards";
import { SET_CLAIM_REJECTION_LABEL, type SetMilestone } from "@/lib/cardSetRewards";
import { summarizeCollection, type CardDefinition } from "@/lib/tradingCards";

export default function CardAlbumPage() {
  const { user } = useAuth();
  const { data: definitions, isLoading: loadingDefs } = useCardDefinitions();
  const { data: owned, isLoading: loadingOwned } = useOwnedCards();
  const { data: packs } = useCardPacks();
  const { data: trades } = useCardTrades();
  const { data: setRewards, isLoading: loadingRewards } = useCardSetRewards();
  const claimReward = useClaimCardSetReward();
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const handleClaim = useCallback(
    async (setCode: string, milestone: SetMilestone) => {
      const key = `${setCode}:${milestone}`;
      // Guarda local contra duplo clique; o servidor ainda é a fonte da verdade
      // (trava por transação + chave de idempotência).
      if (claimingKey) return;
      setClaimingKey(key);
      try {
        const result = await claimReward.mutateAsync({ setCode, milestone });
        if (!result.success) {
          const reason = result.reason;
          toast.error(
            reason && reason in SET_CLAIM_REJECTION_LABEL
              ? SET_CLAIM_REJECTION_LABEL[reason as keyof typeof SET_CLAIM_REJECTION_LABEL]
              : "Não foi possível resgatar agora.",
          );
          return;
        }
        if (result.replayed) {
          toast.info("Esta recompensa já havia sido resgatada.");
          return;
        }
        toast.success(`+${result.coins ?? 0} moedas e +${result.xp ?? 0} XP creditados!`);
      } catch {
        toast.error("Falha ao resgatar a recompensa. Tente novamente.");
      } finally {
        setClaimingKey(null);
      }
    },
    [claimReward, claimingKey],
  );

  const defs = useMemo(() => definitions || [], [definitions]);
  const ownedRows = useMemo(() => owned || [], [owned]);

  const quantities = useMemo(
    () => new Map(ownedRows.map((row) => [row.card_id, row.quantity] as const)),
    [ownedRows],
  );

  const cardNames = useMemo(
    () => new Map(defs.map((card) => [card.id, card.name] as const)),
    [defs],
  );

  const progress = useMemo(
    () =>
      summarizeCollection(
        defs.map<CardDefinition>((card) => ({
          id: card.id,
          code: card.code,
          name: card.name,
          rarity: card.rarity,
          set_code: card.set_code,
          is_active: card.is_active,
        })),
        ownedRows.map((row) => ({ card_id: row.card_id, quantity: row.quantity })),
      ),
    [defs, ownedRows],
  );

  const sealedCount = (packs || []).filter((p) => p.status === "sealed").length;
  const pendingTrades = (trades || []).filter((t) => t.status === "pending").length;
  const claimableCount = (setRewards || []).reduce(
    (sum, set) => sum + set.milestones.filter((m) => m.claimable).length,
    0,
  );
  const isLoading = loadingDefs || loadingOwned;

  return (
    <PageShell
      title="Álbum de Cartas"
      subtitle="Colecione, complete o álbum e troque repetidas com os colegas."
      icon={<Layers className="h-5 w-5" />}
    >
      <SEOHead
        title="Álbum de Cartas | Task Gifts"
        description="Colecione cartas por raridade, abra pacotes e troque repetidas com colegas."
      />

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <SectionErrorBoundary sectionName="Progresso do álbum">
            <CollectionProgressBar progress={progress} />
          </SectionErrorBoundary>

          <Tabs defaultValue="album">
            <TabsList>
              <TabsTrigger value="album">Álbum</TabsTrigger>
              <TabsTrigger value="packs">Pacotes{sealedCount > 0 ? ` (${sealedCount})` : ""}</TabsTrigger>
              <TabsTrigger value="rewards">
                Recompensas{claimableCount > 0 ? ` (${claimableCount})` : ""}
              </TabsTrigger>
              <TabsTrigger value="trades">Trocas{pendingTrades > 0 ? ` (${pendingTrades})` : ""}</TabsTrigger>
            </TabsList>

            <TabsContent value="album" className="mt-4">
              <SectionErrorBoundary sectionName="Cartas">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {defs.map((card) => (
                    <CardTile
                      key={card.id}
                      code={card.code}
                      name={card.name}
                      description={card.description}
                      rarity={card.rarity}
                      quantity={quantities.get(card.id) ?? 0}
                    />
                  ))}
                </div>
              </SectionErrorBoundary>
            </TabsContent>

            <TabsContent value="packs" className="mt-4">
              <SectionErrorBoundary sectionName="Pacotes">
                <PackList packs={packs || []} cardNames={cardNames} />
              </SectionErrorBoundary>
            </TabsContent>

            <TabsContent value="rewards" className="mt-4">
              <SectionErrorBoundary sectionName="Recompensas de coleção">
                <SetRewardsPanel
                  sets={setRewards || []}
                  isLoading={loadingRewards}
                  claimingKey={claimingKey}
                  onClaim={(setCode, milestone) => void handleClaim(setCode, milestone)}
                />
              </SectionErrorBoundary>
            </TabsContent>

            <TabsContent value="trades" className="mt-4">
              <SectionErrorBoundary sectionName="Trocas">
                <TradeInbox
                  trades={trades || []}
                  currentUserId={user?.id ?? ""}
                  cardNames={cardNames}
                />
              </SectionErrorBoundary>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageShell>
  );
}
