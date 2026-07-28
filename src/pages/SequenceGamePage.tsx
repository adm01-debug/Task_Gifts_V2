import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Coins, ListOrdered, RefreshCw, Send, Timer, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { SequenceStepList } from "@/components/sequence";
import {
  useSequenceHistory,
  useSequenceProcedure,
  useSequenceProcedures,
  useSubmitSequence,
} from "@/hooks/useSequenceGame";
import { useHaptics } from "@/hooks/useHaptics";
import {
  moveItem,
  scoreSequence,
  shuffleSteps,
  type SequenceStep,
} from "@/lib/sequenceGame";

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export default function SequenceGamePage() {
  const { data: procedures, isLoading: loadingProcedures } = useSequenceProcedures();
  const [procedureId, setProcedureId] = useState<string | null>(null);
  const { data: procedure, isLoading: loadingProcedure } = useSequenceProcedure(procedureId);
  const { data: history } = useSequenceHistory();
  const submitMutation = useSubmitSequence();
  const haptics = useHaptics();

  const [order, setOrder] = useState<SequenceStep[]>([]);
  const [attemptSeed, setAttemptSeed] = useState(0);
  const [wrongIndexes, setWrongIndexes] = useState<number[] | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!procedureId && procedures?.length) setProcedureId(procedures[0].id);
  }, [procedures, procedureId]);

  // Reinicia o tabuleiro sempre que o procedimento ou a rodada mudam.
  useEffect(() => {
    if (!procedure?.steps?.length) {
      setOrder([]);
      return;
    }
    setOrder(shuffleSteps(procedure.steps, `${procedure.id}:${attemptSeed}`));
    setWrongIndexes(null);
    setElapsedMs(0);
    startedAtRef.current = Date.now();
  }, [procedure, attemptSeed]);

  // Cronômetro informativo; a duração final é limitada no servidor.
  useEffect(() => {
    if (!order.length || wrongIndexes !== null) return;
    const interval = window.setInterval(
      () => setElapsedMs(Date.now() - startedAtRef.current),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [order.length, wrongIndexes]);

  const revealed = wrongIndexes !== null;

  const preview = useMemo(
    () => scoreSequence(procedure?.steps ?? [], order.map((s) => s.id)),
    [procedure?.steps, order],
  );

  const handleMove = useCallback(
    (from: number, to: number) => {
      haptics.trigger("light");
      setOrder((current) => moveItem(current, from, to));
    },
    [haptics],
  );

  const handleSubmit = useCallback(async () => {
    if (!procedureId || !order.length || revealed) return;

    try {
      const result = await submitMutation.mutateAsync({
        procedureId,
        order: order.map((s) => s.id),
        durationMs: Date.now() - startedAtRef.current,
      });

      if (!result.success) {
        toast.error(
          result.reason === "invalid_order"
            ? "A ordem enviada está inconsistente. Recarregue e tente novamente."
            : "Não foi possível enviar sua resposta agora.",
        );
        return;
      }

      setWrongIndexes(preview.wrongIndexes);

      if (result.is_perfect) {
        haptics.trigger("success");
        toast.success(
          result.daily_limit_reached
            ? "Sequência perfeita! (limite diário de recompensas atingido)"
            : `Sequência perfeita! +${result.coins_awarded ?? 0} moedas e +${result.xp_awarded ?? 0} XP`,
        );
      } else {
        haptics.trigger("medium");
        toast.info(
          `${result.correct_positions ?? 0} de ${result.steps_total ?? 0} etapas na posição correta.`,
        );
      }
    } catch {
      toast.error("Falha de conexão ao enviar a sequência.");
    }
  }, [procedureId, order, revealed, submitMutation, preview.wrongIndexes, haptics]);

  const isLoading = loadingProcedures || loadingProcedure;

  return (
    <PageShell
      title="Ordene a Sequência"
      description="Coloque as etapas do procedimento na ordem correta e ganhe moedas."
      icon={<ListOrdered className="h-5 w-5" aria-hidden />}
    >
      <SEOHead
        title="Ordene a Sequência | Task Gifts"
        description="Treine os procedimentos operacionais ordenando as etapas na sequência correta."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionErrorBoundary sectionName="Tabuleiro da sequência">
          <div className="space-y-4 lg:col-span-2">
            <Card className="border-border/60 bg-card/70 backdrop-blur">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">
                  {procedure?.title ?? "Selecione um procedimento"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Timer className="h-3 w-3" aria-hidden />
                    {formatDuration(elapsedMs)}
                  </Badge>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setAttemptSeed((s) => s + 1)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Nova rodada
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {procedure?.description ? (
                  <p className="text-sm text-muted-foreground">{procedure.description}</p>
                ) : null}

                {isLoading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-xl" />
                    ))}
                  </div>
                ) : order.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum procedimento disponível no momento. Peça a um administrador para
                    cadastrar as etapas.
                  </p>
                ) : (
                  <>
                    <SequenceStepList
                      steps={order}
                      wrongIndexes={wrongIndexes ?? undefined}
                      revealed={revealed}
                      locked={submitMutation.isPending}
                      onMove={handleMove}
                    />

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        className="gap-2 sm:flex-1"
                        disabled={revealed || submitMutation.isPending}
                        onClick={() => void handleSubmit()}
                      >
                        <Send className="h-4 w-4" aria-hidden />
                        {submitMutation.isPending ? "Enviando..." : "Conferir sequência"}
                      </Button>
                      {revealed ? (
                        <Button
                          type="button"
                          variant="secondary"
                          className="sm:flex-1"
                          onClick={() => setAttemptSeed((s) => s + 1)}
                        >
                          Tentar novamente
                        </Button>
                      ) : null}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </SectionErrorBoundary>

        <div className="space-y-4">
          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Procedimentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loadingProcedures ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-lg" />
                ))
              ) : (
                (procedures ?? []).map((item) => (
                  <Button
                    key={item.id}
                    type="button"
                    variant={item.id === procedureId ? "default" : "outline"}
                    className="h-auto w-full justify-start py-2 text-left"
                    onClick={() => setProcedureId(item.id)}
                  >
                    <span className="truncate">{item.title}</span>
                  </Button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-base">Suas últimas tentativas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(history ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Você ainda não enviou nenhuma sequência.
                </p>
              ) : (
                (history ?? []).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      {attempt.is_perfect ? (
                        <Trophy className="h-4 w-4 text-amber-500" aria-hidden />
                      ) : null}
                      {attempt.correct_positions}/{attempt.steps_total} etapas
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary">
                      <Coins className="h-3.5 w-3.5" aria-hidden />
                      {attempt.coins_awarded}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}