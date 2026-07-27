import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dices, Coins, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { LuckyWheel, LuckyWheelHistory } from "@/components/luckywheel";
import { useLuckyWheelPrizes, useLuckyWheelStatus, useSpinLuckyWheel } from "@/hooks/useLuckyWheel";
import type { LuckyWheelSpinResult } from "@/services/luckyWheelService";
import { useHaptics } from "@/hooks/useHaptics";

const RARITY_LABEL: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
};

export default function LuckyWheelPage() {
  const { data: prizes, isLoading: loadingPrizes } = useLuckyWheelPrizes();
  const { data: status, isLoading: loadingStatus } = useLuckyWheelStatus();
  const spinMutation = useSpinLuckyWheel();
  const haptics = useHaptics();

  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [result, setResult] = useState<LuckyWheelSpinResult | null>(null);
  const [revealed, setRevealed] = useState(false);

  const canSpin = !!status?.can_spin && !spinMutation.isPending && targetIndex === null;

  const handleSpin = async () => {
    if (!canSpin || !prizes?.length) return;
    setRevealed(false);
    setResult(null);

    try {
      const spin = await spinMutation.mutateAsync();

      if (!spin.success) {
        toast.error(
          spin.reason === "already_spun"
            ? "Você já usou seu giro de hoje. Volte amanhã!"
            : "Nenhum prêmio disponível na roleta no momento.",
        );
        return;
      }

      const index = prizes.findIndex((p) => p.id === spin.prize_id);
      setResult(spin);
      // Se o prêmio não estiver na lista local (cache antigo), revela sem animar.
      if (index < 0) {
        setRevealed(true);
        return;
      }
      haptics.trigger("medium");
      setTargetIndex(index);
    } catch {
      toast.error("Não foi possível girar a roleta. Tente novamente.");
    }
  };

  const handleSpinEnd = () => {
    setRevealed(true);
    setTargetIndex(null);
    if (result?.prize_type === "nothing") {
      toast("Quase lá! Amanhã tem outra chance.");
    } else {
      haptics.questCompleted();
      toast.success(`🎉 Você ganhou: ${result?.prize_label}`);
    }
  };

  return (
    <>
      <SEOHead
        title="Roleta da Sorte | Task Gifts"
        description="Gire a roleta uma vez por dia e ganhe moedas, XP e conquistas exclusivas."
      />
      <PageShell
        title="Roleta da Sorte"
        subtitle="Um giro grátis por dia. Moedas, XP e prêmios lendários esperando por você."
        icon={<Dices className="h-5 w-5" />}
        backFallback="/"
      >
        <SectionErrorBoundary sectionName="Roleta da Sorte">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden border-border/60 bg-card/70 backdrop-blur">
                <CardContent className="flex flex-col items-center gap-6 py-8">
                  {loadingPrizes ? (
                    <Skeleton className="h-[320px] w-[320px] rounded-full" />
                  ) : (
                    <LuckyWheel
                      prizes={prizes ?? []}
                      targetIndex={targetIndex}
                      spinning={spinMutation.isPending}
                      onSpinEnd={handleSpinEnd}
                    />
                  )}

                  {loadingStatus ? (
                    <Skeleton className="h-12 w-56" />
                  ) : status?.can_spin || targetIndex !== null ? (
                    <Button
                      size="lg"
                      className="min-h-[52px] min-w-[220px] text-base font-bold"
                      onClick={handleSpin}
                      disabled={!canSpin}
                    >
                      {spinMutation.isPending || targetIndex !== null ? "Girando..." : "Girar agora"}
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        Giro de hoje já utilizado
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        Volte amanhã para uma nova chance!
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    {revealed && result?.success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md rounded-xl border border-primary/30 bg-primary/5 p-4 text-center"
                        role="status"
                        aria-live="polite"
                      >
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Prêmio do dia · {RARITY_LABEL[result.rarity ?? "common"]}
                        </p>
                        <p className="mt-1 text-xl font-bold text-foreground">{result.prize_label}</p>
                        {(result.amount ?? 0) > 0 && (
                          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-primary">
                            {result.prize_type === "coins" ? (
                              <Coins className="h-4 w-4" aria-hidden />
                            ) : (
                              <Zap className="h-4 w-4" aria-hidden />
                            )}
                            +{result.amount} {result.prize_type === "coins" ? "moedas" : "XP"} creditados
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!!status?.total_spins && (
                    <p className="text-xs text-muted-foreground">
                      Total de giros: {status.total_spins}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <LuckyWheelHistory />
            </div>
          </div>
        </SectionErrorBoundary>
      </PageShell>
    </>
  );
}