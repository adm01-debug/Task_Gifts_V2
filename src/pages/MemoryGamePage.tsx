import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Brain, Coins, Layers, RefreshCw, Timer, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { MemoryBoard, MemoryLeaderboard } from "@/components/memory";
import {
  useFinishMemorySession,
  useMemoryDecks,
  useMemoryHistory,
  useMemoryPairs,
  useStartMemorySession,
} from "@/hooks/useMemoryGame";
import { useHaptics } from "@/hooks/useHaptics";
import { useRBAC } from "@/hooks/useRBAC";
import { buildMemoryBoard, type MemoryCard } from "@/lib/memoryGame";

const FLIP_BACK_DELAY_MS = 900;

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function MemoryGamePage() {
  const { data: decks, isLoading: loadingDecks } = useMemoryDecks();
  const [deckId, setDeckId] = useState<string | null>(null);
  const { data: pairs, isLoading: loadingPairs } = useMemoryPairs(deckId);
  const { data: history } = useMemoryHistory();
  const startMutation = useStartMemorySession();
  const finishMutation = useFinishMemorySession();
  const haptics = useHaptics();
  const { hasRole } = useRBAC();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [seed, setSeed] = useState<string>("");
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deckId && decks?.length) setDeckId(decks[0].id);
  }, [decks, deckId]);

  // Cronômetro apenas informativo: a duração oficial é medida no servidor.
  useEffect(() => {
    if (!sessionId || startedAtRef.current === null) return;
    const interval = window.setInterval(() => {
      if (startedAtRef.current !== null) setElapsedMs(Date.now() - startedAtRef.current);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [sessionId]);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    },
    [],
  );

  const cards = useMemo<MemoryCard[]>(
    () => (sessionId && pairs?.length ? buildMemoryBoard(pairs, seed) : []),
    [pairs, seed, sessionId],
  );
  const pairsOnBoard = cards.length / 2;
  const finished = pairsOnBoard > 0 && matchedPairIds.length === pairsOnBoard;

  const resetLocalState = () => {
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    setFlippedIds([]);
    setMatchedPairIds([]);
    setMoves(0);
    setElapsedMs(0);
  };

  const handleStart = async () => {
    if (!deckId) return;
    try {
      const result = await startMutation.mutateAsync(deckId);
      if (!result.success || !result.session_id) {
        toast.error(
          result.reason === "deck_empty"
            ? "Este baralho ainda não tem pares cadastrados."
            : "Baralho indisponível no momento.",
        );
        return;
      }
      resetLocalState();
      setSeed(result.session_id);
      setSessionId(result.session_id);
      startedAtRef.current = Date.now();
    } catch {
      toast.error("Não foi possível iniciar a partida. Tente novamente.");
    }
  };

  const handleFinish = useCallback(
    async (totalMoves: number, matched: number) => {
      if (!sessionId) return;
      try {
        const result = await finishMutation.mutateAsync({
          sessionId,
          moves: totalMoves,
          matchedPairs: matched,
        });
        if (!result.success) {
          toast.error("Não foi possível registrar a partida.");
          return;
        }
        haptics.questCompleted();
        if (result.daily_limit_reached) {
          toast("Limite diário de partidas premiadas atingido. Jogue à vontade sem recompensa!");
          return;
        }
        toast.success(
          `Parabéns! +${result.coins_awarded ?? 0} moedas e +${result.xp_awarded ?? 0} XP`,
        );
      } catch {
        toast.error("Falha ao registrar a partida.");
      }
    },
    [finishMutation, haptics, sessionId],
  );

  const handleFlip = (card: MemoryCard) => {
    if (!sessionId || finished) return;
    if (flippedIds.length >= 2 || flippedIds.includes(card.id)) return;

    const next = [...flippedIds, card.id];
    setFlippedIds(next);
    if (next.length < 2) return;

    const nextMoves = moves + 1;
    setMoves(nextMoves);

    const [firstId, secondId] = next;
    const first = cards.find((c) => c.id === firstId);
    const second = cards.find((c) => c.id === secondId);

    if (first && second && first.pairId === second.pairId) {
      const matched = [...matchedPairIds, first.pairId];
      setMatchedPairIds(matched);
      setFlippedIds([]);
      haptics.trigger("light");
      if (matched.length === pairsOnBoard) {
        void handleFinish(nextMoves, matched.length);
      }
      return;
    }

    timeoutRef.current = window.setTimeout(() => setFlippedIds([]), FLIP_BACK_DELAY_MS);
  };

  const selectedDeck = decks?.find((d) => d.id === deckId) ?? null;

  return (
    <>
      <SEOHead
        title="Jogo da Memória | Task Gifts"
        description="Pareie termos técnicos do seu departamento, ganhe moedas e XP com bônus de precisão e velocidade."
      />
      <PageShell
        title="Jogo da Memória"
        subtitle="Encontre os pares corretos com o menor número de jogadas e no menor tempo."
        icon={<Brain className="h-5 w-5" />}
        backFallback="/"
      >
        <SectionErrorBoundary sectionName="Jogo da Memória">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">
                    {selectedDeck?.title ?? "Escolha um baralho"}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5">
                      <Timer className="h-3.5 w-3.5" aria-hidden />
                      {formatDuration(elapsedMs)}
                    </Badge>
                    <Badge variant="secondary">Jogadas: {moves}</Badge>
                    <Button
                      size="sm"
                      onClick={handleStart}
                      disabled={!deckId || startMutation.isPending}
                      className="min-h-[40px]"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" aria-hidden />
                      {sessionId ? "Nova partida" : "Começar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingDecks || (deckId && loadingPairs) ? (
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <Skeleton key={i} className="h-[92px] rounded-xl" />
                      ))}
                    </div>
                  ) : !decks?.length ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Nenhum baralho disponível. Peça a um administrador para cadastrar pares.
                    </p>
                  ) : !sessionId ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Selecione um baralho e clique em “Começar” para embaralhar as cartas.
                    </p>
                  ) : (
                    <MemoryBoard
                      cards={cards}
                      flippedIds={flippedIds}
                      matchedPairIds={matchedPairIds}
                      disabled={finished || finishMutation.isPending}
                      onFlip={handleFlip}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {hasRole("admin") && (
                <Button asChild variant="outline" className="w-full">
                  <Link to="/memoria/admin">
                    <Layers className="mr-2 h-4 w-4" aria-hidden />
                    Gerenciar baralhos
                  </Link>
                </Button>
              )}
              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Baralhos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(decks ?? []).map((deck) => (
                    <button
                      key={deck.id}
                      type="button"
                      onClick={() => {
                        setDeckId(deck.id);
                        setSessionId(null);
                        resetLocalState();
                      }}
                      className={`flex min-h-[44px] w-full flex-col items-start rounded-lg border p-3 text-left transition-colors ${
                        deck.id === deckId
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/60 hover:bg-muted/60"
                      }`}
                    >
                      <span className="text-sm font-semibold text-foreground">{deck.title}</span>
                      {deck.description && (
                        <span className="text-xs text-muted-foreground">{deck.description}</span>
                      )}
                    </button>
                  ))}
                  {!decks?.length && !loadingDecks && (
                    <p className="text-sm text-muted-foreground">Nenhum baralho ativo.</p>
                  )}
                </CardContent>
              </Card>

              <MemoryLeaderboard deckId={deckId} />

              <Card className="border-border/60 bg-card/70 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-base">Últimas partidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(history ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Você ainda não concluiu nenhuma partida.
                    </p>
                  ) : (
                    (history ?? []).map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">
                          {session.matched_pairs}/{session.pairs_total} pares ·{" "}
                          {formatDuration(session.duration_ms)}
                        </span>
                        <span className="flex items-center gap-2 font-semibold text-primary">
                          <Coins className="h-3.5 w-3.5" aria-hidden />
                          {session.coins_awarded}
                          <Zap className="h-3.5 w-3.5" aria-hidden />
                          {session.xp_awarded}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </SectionErrorBoundary>
      </PageShell>
    </>
  );
}