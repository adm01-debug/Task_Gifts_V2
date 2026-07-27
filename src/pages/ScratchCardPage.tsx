import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Gift, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { ScratchSurface } from "@/components/scratchcard";
import { useHaptics } from "@/hooks/useHaptics";
import { useRevealScratchCard, useScratchCards } from "@/hooks/useScratchCards";
import type { ScratchCard, ScratchRevealResult } from "@/services/scratchCardService";

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

const SOURCE_LABEL: Record<ScratchCard["source"], string> = {
  task: "Tarefa concluída",
  training: "Treinamento concluído",
  quest: "Missão concluída",
  campaign: "Campanha comercial",
  manual: "Concedida pela gestão",
};

function prizeText(result: ScratchRevealResult | ScratchCard): string {
  const type = "prize_type" in result ? result.prize_type : null;
  const amount = "amount" in result ? (result.amount ?? 0) : 0;
  const label = "prize_label" in result ? result.prize_label : null;
  if (!type || type === "nothing") return label || "Tente novamente";
  return label || `${amount} ${type === "coins" ? "moedas" : "XP"}`;
}

export default function ScratchCardPage() {
  const { data: cards, isLoading } = useScratchCards();
  const revealMutation = useRevealScratchCard();
  const haptics = useHaptics();
  const [revealedNow, setRevealedNow] = useState<Record<string, ScratchRevealResult>>({});

  const pending = useMemo(() => (cards || []).filter((c) => c.status === "pending"), [cards]);
  const history = useMemo(() => (cards || []).filter((c) => c.status === "revealed").slice(0, 12), [cards]);

  const handleReveal = async (cardId: string) => {
    if (revealedNow[cardId]) return;
    try {
      const result = await revealMutation.mutateAsync(cardId);
      if (!result.success) {
        toast.error(
          result.reason === "no_prizes"
            ? "Nenhum prêmio configurado no momento."
            : "Não foi possível revelar esta raspadinha.",
        );
        return;
      }
      setRevealedNow((prev) => ({ ...prev, [cardId]: result }));
      haptics.trigger("medium");
      if (result.prize_type && result.prize_type !== "nothing") {
        toast.success(`Você ganhou ${prizeText(result)}!`);
      } else {
        toast.info("Não foi dessa vez. Conclua mais entregas para ganhar novas raspadinhas.");
      }
    } catch {
      toast.error("Falha ao revelar a raspadinha. Tente novamente.");
    }
  };

  return (
    <PageShell
      title="Raspadinha Digital"
      description="Raspe as cartas conquistadas em entregas e treinamentos para revelar prêmios surpresa."
      icon={Gift}
    >
      <SEOHead
        title="Raspadinha Digital | Task Gifts"
        description="Revele prêmios surpresa em moedas e XP conquistados ao concluir tarefas e treinamentos."
      />

      <SectionErrorBoundary name="Raspadinha Digital">
        <div className="space-y-8">
          <section aria-label="Raspadinhas disponíveis" className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-lg font-semibold text-foreground">
                Disponíveis {pending.length > 0 && <span className="text-muted-foreground">({pending.length})</span>}
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-44 w-full rounded-2xl" />
                ))}
              </div>
            ) : pending.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                  <Gift className="h-8 w-8 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma raspadinha no momento. Conclua tarefas e treinamentos para ganhar novas cartas.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pending.map((card) => {
                  const result = revealedNow[card.id];
                  return (
                    <motion.div key={card.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                      <div className="space-y-2">
                        <ScratchSurface
                          className="h-44"
                          disabled={revealMutation.isPending && !result}
                          onComplete={() => void handleReveal(card.id)}
                        >
                          {result ? (
                            <div className="space-y-2">
                              <p className="text-2xl font-bold text-foreground">{prizeText(result)}</p>
                              <Badge variant="secondary">{RARITY_LABEL[result.rarity || "common"]}</Badge>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Raspe para revelar seu prêmio…</p>
                          )}
                        </ScratchSurface>
                        <p className="text-xs text-muted-foreground">{SOURCE_LABEL[card.source]}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </section>

          {history.length > 0 && (
            <section aria-label="Histórico de raspadinhas" className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Últimos prêmios</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                {history.map((card) => (
                  <Card key={card.id}>
                    <CardContent className="flex items-center gap-3 py-4">
                      {card.prize_type === "coins" ? (
                        <Coins className="h-5 w-5 text-primary" aria-hidden />
                      ) : card.prize_type === "xp" ? (
                        <Zap className="h-5 w-5 text-primary" aria-hidden />
                      ) : (
                        <Gift className="h-5 w-5 text-muted-foreground" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{prizeText(card)}</p>
                        <p className="text-xs text-muted-foreground">{SOURCE_LABEL[card.source]}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </SectionErrorBoundary>
    </PageShell>
  );
}