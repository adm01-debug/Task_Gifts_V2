import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Check, Coins, Grid3X3, RefreshCw, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useHaptics } from "@/hooks/useHaptics";
import { useBingoCard, useBingoMarks, useSyncBingoCard } from "@/hooks/useBingo";
import {
  BINGO_CELLS,
  BINGO_TOTAL_LINES,
  bingoProgressPercent,
  completedLinePositions,
  countCompletedLines,
} from "@/lib/bingoEngine";
import { cn } from "@/lib/utils";

function formatWindow(startsAt?: string, endsAt?: string): string {
  if (!startsAt || !endsAt) return "";
  const fmt = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
  return `${fmt.format(new Date(startsAt))} — ${fmt.format(new Date(endsAt))}`;
}

export default function BingoPage() {
  const { data: card, isLoading } = useBingoCard();
  const cardId = card?.success ? card.card_id : undefined;
  const { data: marks } = useBingoMarks(cardId);
  const syncMutation = useSyncBingoCard();
  const haptics = useHaptics();
  const [autoSynced, setAutoSynced] = useState(false);

  const markedPositions = useMemo(
    () => new Set((marks || []).map((m) => m.position)),
    [marks],
  );

  const markedArray = useMemo(() => {
    const arr = new Array<boolean>(BINGO_CELLS).fill(false);
    markedPositions.forEach((pos) => {
      if (pos >= 0 && pos < BINGO_CELLS) arr[pos] = true;
    });
    return arr;
  }, [markedPositions]);

  const observedByPosition = useMemo(() => {
    const map = new Map<number, number>();
    (marks || []).forEach((m) => map.set(m.position, m.observed_value));
    return map;
  }, [marks]);

  const lines = countCompletedLines(markedArray);
  const highlighted = useMemo(() => completedLinePositions(markedArray), [markedArray]);
  const progress = bingoProgressPercent(markedArray);

  const handleSync = async (silent = false) => {
    if (!cardId) return;
    try {
      const result = await syncMutation.mutateAsync(cardId);
      if (!result.success) {
        if (!silent) toast.error("Não foi possível sincronizar a cartela agora.");
        return;
      }
      if ((result.coins_awarded ?? 0) > 0 || (result.xp_awarded ?? 0) > 0) {
        haptics.questCompleted();
        toast.success(
          result.full_house
            ? `Cartela cheia! +${result.coins_awarded} moedas e +${result.xp_awarded} XP`
            : `${result.new_lines} nova(s) linha(s)! +${result.coins_awarded} moedas e +${result.xp_awarded} XP`,
        );
      } else if (!silent) {
        toast.info("Cartela atualizada. Nenhuma nova linha ainda — siga completando desafios!");
      }
    } catch {
      if (!silent) toast.error("Falha ao sincronizar a cartela.");
    }
  };

  // Sincronização automática na primeira abertura: a marcação é sempre do servidor.
  useEffect(() => {
    if (cardId && !autoSynced) {
      setAutoSynced(true);
      void handleSync(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardId, autoSynced]);

  return (
    <PageShell
      title="Bingo de Missões"
      subtitle="Complete desafios reais do dia a dia e feche linhas para ganhar moedas e XP."
    >
      <SEOHead
        title="Bingo de Missões | Task Gifts"
        description="Cartela mensal de desafios reais: conclua tarefas, seja pontual, reconheça colegas e feche linhas para ganhar recompensas."
      />

      <SectionErrorBoundary sectionName="Bingo de Missões">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </div>
        ) : !card?.success ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Grid3X3 className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                {card?.reason === "insufficient_tasks"
                  ? "A rodada atual ainda não tem desafios suficientes configurados."
                  : "Nenhuma rodada de bingo ativa no momento."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Grid3X3 className="h-5 w-5 text-primary" />
                      {card.board?.title}
                    </CardTitle>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarClock className="h-4 w-4" />
                      {formatWindow(card.board?.starts_at, card.board?.ends_at)}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleSync(false)}
                    disabled={syncMutation.isPending}
                    className="min-h-11"
                  >
                    <RefreshCw className={cn("mr-2 h-4 w-4", syncMutation.isPending && "animate-spin")} />
                    Sincronizar progresso
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Linhas fechadas</p>
                    <p className="text-xl font-semibold text-foreground">
                      {lines}/{BINGO_TOTAL_LINES}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Casas marcadas</p>
                    <p className="text-xl font-semibold text-foreground">
                      {markedPositions.size}/{BINGO_CELLS}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">Moedas ganhas</p>
                    <p className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
                      <Coins className="h-4 w-4 text-primary" />
                      {card.coins_awarded ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg border bg-card p-3">
                    <p className="text-xs text-muted-foreground">XP ganho</p>
                    <p className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {card.xp_awarded ?? 0}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progresso da cartela</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} aria-label="Progresso da cartela" />
                </div>

                <p className="text-xs text-muted-foreground">
                  Cada linha fechada vale {card.board?.coins_per_line} moedas e {card.board?.xp_per_line} XP.
                  Cartela cheia: +{card.board?.coins_full_house} moedas e +{card.board?.xp_full_house} XP.
                </p>
              </CardContent>
            </Card>

            <div
              className="grid grid-cols-5 gap-1.5 sm:gap-2"
              role="grid"
              aria-label="Cartela de bingo 5 por 5"
            >
              {(card.cells || []).map((cell) => {
                const isMarked = markedPositions.has(cell.position);
                const isHighlighted = highlighted.has(cell.position);
                const observed = observedByPosition.get(cell.position) ?? 0;
                return (
                  <motion.div
                    key={cell.position}
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2, delay: cell.position * 0.01 }}
                    role="gridcell"
                    aria-label={`${cell.label}. ${isMarked ? "Conquistado" : `Progresso ${observed} de ${cell.target}`}`}
                    className={cn(
                      "flex min-h-[86px] flex-col justify-between rounded-lg border p-2 text-left transition-colors sm:min-h-[104px]",
                      isMarked ? "border-primary/50 bg-primary/10" : "border-border bg-card",
                      isHighlighted && "ring-2 ring-primary",
                    )}
                  >
                    <p className="text-[11px] font-medium leading-tight text-foreground sm:text-xs">
                      {cell.label}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      {cell.free ? (
                        <Badge variant="secondary" className="text-[10px]">Livre</Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {Math.min(observed, cell.target)}/{cell.target}
                        </span>
                      )}
                      {isMarked && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {lines >= BINGO_TOTAL_LINES && (
              <Card className="border-primary/40 bg-primary/5">
                <CardContent className="flex items-center gap-3 py-4">
                  <Trophy className="h-6 w-6 text-primary" />
                  <p className="text-sm font-medium text-foreground">
                    Cartela cheia conquistada! Todas as recompensas já foram creditadas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </SectionErrorBoundary>
    </PageShell>
  );
}
