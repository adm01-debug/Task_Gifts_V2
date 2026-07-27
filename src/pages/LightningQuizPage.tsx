import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Coins, Flame, Timer, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useHaptics } from "@/hooks/useHaptics";
import {
  useAnswerLightningQuestion,
  useFinishLightningRound,
  useLightningHistory,
  useStartLightningRound,
} from "@/hooks/useLightningQuiz";
import {
  LIGHTNING_DAILY_ROUNDS,
  LIGHTNING_ROUND_SECONDS,
  accuracyPercent,
  secondsRemaining,
} from "@/lib/lightningQuizScoring";
import type { LightningQuestion } from "@/services/lightningQuizService";
import { cn } from "@/lib/utils";

type Phase = "idle" | "playing" | "result";

interface RoundState {
  sessionId: string;
  deadlineAt: string;
  total: number;
  index: number;
  correct: number;
  wrong: number;
  streak: number;
  question: LightningQuestion | null;
}

interface RoundSummary {
  correct: number;
  wrong: number;
  bestStreak: number;
  coins: number;
  xp: number;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export default function LightningQuizPage() {
  const startMutation = useStartLightningRound();
  const answerMutation = useAnswerLightningQuestion();
  const finishMutation = useFinishLightningRound();
  const { data: history, isLoading: loadingHistory } = useLightningHistory();
  const haptics = useHaptics();

  const [phase, setPhase] = useState<Phase>("idle");
  const [round, setRound] = useState<RoundState | null>(null);
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation: string | null } | null>(null);
  const [remaining, setRemaining] = useState(LIGHTNING_ROUND_SECONDS);

  // Evita corrida entre o encerramento manual e o disparado pelo cronômetro.
  const finishingRef = useRef(false);

  const finishRound = useCallback(
    async (sessionId: string) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      try {
        const result = await finishMutation.mutateAsync(sessionId);
        if (result.success) {
          setSummary({
            correct: result.correct_count ?? 0,
            wrong: result.wrong_count ?? 0,
            bestStreak: result.best_streak ?? 0,
            coins: result.coins_awarded ?? 0,
            xp: result.xp_awarded ?? 0,
          });
          setPhase("result");
          if ((result.coins_awarded ?? 0) > 0) haptics.trigger("medium");
        } else {
          toast.error("Não foi possível encerrar a rodada.");
          setPhase("idle");
        }
      } catch {
        toast.error("Falha ao encerrar a rodada. Tente novamente.");
        setPhase("idle");
      } finally {
        finishingRef.current = false;
      }
    },
    [finishMutation, haptics],
  );

  // Cronômetro server-authoritative: a UI apenas espelha o prazo persistido.
  useEffect(() => {
    if (phase !== "playing" || !round) return;

    const tick = () => {
      const left = secondsRemaining(round.deadlineAt);
      setRemaining(left);
      if (left <= 0) void finishRound(round.sessionId);
    };

    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [phase, round, finishRound]);

  const handleStart = async () => {
    setSummary(null);
    setFeedback(null);
    try {
      const result = await startMutation.mutateAsync();
      if (!result.success) {
        toast.error(
          result.reason === "daily_limit"
            ? `Você já usou suas ${LIGHTNING_DAILY_ROUNDS} rodadas de hoje. Volte amanhã!`
            : "Nenhuma afirmação disponível no momento.",
        );
        return;
      }
      if (!result.session_id || !result.deadline_at) return;

      setRound({
        sessionId: result.session_id,
        deadlineAt: result.deadline_at,
        total: result.total ?? 0,
        index: result.index ?? 0,
        correct: result.correct_count ?? 0,
        wrong: result.wrong_count ?? 0,
        streak: result.current_streak ?? 0,
        question: result.question ?? null,
      });
      setPhase("playing");
    } catch {
      toast.error("Falha ao iniciar a rodada. Tente novamente.");
    }
  };

  const handleAnswer = async (answer: boolean) => {
    if (!round?.question || answerMutation.isPending) return;
    const sessionId = round.sessionId;

    try {
      const result = await answerMutation.mutateAsync({ sessionId, index: round.index, answer });

      if (!result.success) {
        if (result.reason === "expired" || result.reason === "completed") {
          await finishRound(sessionId);
          return;
        }
        if (result.reason === "out_of_order" && typeof result.index === "number") {
          setRound((prev) => (prev ? { ...prev, index: result.index as number } : prev));
          return;
        }
        toast.error("Não foi possível registrar a resposta.");
        return;
      }

      haptics.trigger(result.is_correct ? "light" : "heavy");
      setFeedback({ correct: !!result.is_correct, explanation: result.explanation ?? null });

      setRound((prev) =>
        prev
          ? {
              ...prev,
              index: result.index ?? prev.index,
              total: result.total ?? prev.total,
              correct: result.correct_count ?? prev.correct,
              wrong: result.wrong_count ?? prev.wrong,
              streak: result.current_streak ?? 0,
              question: result.question ?? null,
            }
          : prev,
      );

      if (result.completed) await finishRound(sessionId);
    } catch {
      toast.error("Falha ao enviar a resposta.");
    }
  };

  const progress = useMemo(() => {
    if (!round || round.total <= 0) return 0;
    return Math.min(100, Math.round((round.index / round.total) * 100));
  }, [round]);

  const timerPercent = Math.min(100, Math.round((remaining / LIGHTNING_ROUND_SECONDS) * 100));

  return (
    <PageShell
      title="Verdadeiro ou Falso Relâmpago"
      subtitle="60 segundos, 10 afirmações. Responda rápido, acerte em sequência e leve moedas e XP."
      icon={<Zap className="h-5 w-5" aria-hidden />}
    >
      <SEOHead
        title="Verdadeiro ou Falso Relâmpago | Task Gifts"
        description="Desafio relâmpago de 60 segundos com afirmações sobre cultura, segurança e processos."
      />

      <SectionErrorBoundary sectionName="Verdadeiro ou Falso Relâmpago">
        <div className="space-y-6">
          {phase === "idle" && (
            <Card className="border-border/60 bg-card/70 backdrop-blur">
              <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Zap className="h-8 w-8 text-primary" aria-hidden />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Pronto para o relâmpago?</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {LIGHTNING_ROUND_SECONDS} segundos para responder até 10 afirmações.
                    Você tem {LIGHTNING_DAILY_ROUNDS} rodadas por dia.
                  </p>
                </div>
                <Button size="lg" onClick={handleStart} disabled={startMutation.isPending}>
                  {startMutation.isPending ? "Preparando..." : "Iniciar rodada"}
                </Button>
              </CardContent>
            </Card>
          )}

          {phase === "playing" && round && (
            <Card className="border-border/60 bg-card/70 backdrop-blur">
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline" className="gap-1">
                    <Timer className="h-3.5 w-3.5" aria-hidden />
                    <span aria-live="polite">{remaining}s</span>
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Check className="h-3.5 w-3.5 text-primary" aria-hidden />
                    {round.correct} acertos
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Flame className="h-3.5 w-3.5 text-primary" aria-hidden />
                    Sequência {round.streak}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Progress value={timerPercent} aria-label="Tempo restante" />
                  <Progress value={progress} aria-label="Progresso das afirmações" className="h-1" />
                </div>

                {round.question ? (
                  <motion.div
                    key={round.question.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{round.question.category}</Badge>
                      <Badge variant="outline">
                        {DIFFICULTY_LABEL[round.question.difficulty] ?? round.question.difficulty}
                      </Badge>
                    </div>
                    <p className="text-balance text-lg font-medium leading-relaxed text-foreground">
                      {round.question.statement}
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Button
                        size="lg"
                        className="h-14"
                        onClick={() => handleAnswer(true)}
                        disabled={answerMutation.isPending}
                      >
                        <Check className="mr-2 h-5 w-5" aria-hidden /> Verdadeiro
                      </Button>
                      <Button
                        size="lg"
                        variant="secondary"
                        className="h-14"
                        onClick={() => handleAnswer(false)}
                        disabled={answerMutation.isPending}
                      >
                        <X className="mr-2 h-5 w-5" aria-hidden /> Falso
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <p className="text-sm text-muted-foreground">Encerrando rodada...</p>
                )}

                {feedback && (
                  <div
                    role="status"
                    aria-live="polite"
                    className={cn(
                      "rounded-lg border p-3 text-sm",
                      feedback.correct
                        ? "border-primary/40 bg-primary/10 text-foreground"
                        : "border-destructive/40 bg-destructive/10 text-foreground",
                    )}
                  >
                    <strong>{feedback.correct ? "Acertou!" : "Errou."}</strong>
                    {feedback.explanation ? ` ${feedback.explanation}` : ""}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {phase === "result" && summary && (
            <Card className="border-border/60 bg-card/70 backdrop-blur">
              <CardContent className="space-y-5 p-8 text-center">
                <h2 className="text-xl font-semibold text-foreground">Rodada encerrada</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Stat label="Acertos" value={String(summary.correct)} />
                  <Stat label="Erros" value={String(summary.wrong)} />
                  <Stat label="Melhor sequência" value={String(summary.bestStreak)} />
                  <Stat
                    label="Precisão"
                    value={`${accuracyPercent(summary.correct, summary.correct + summary.wrong)}%`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Badge className="gap-1 text-sm">
                    <Coins className="h-4 w-4" aria-hidden /> +{summary.coins} moedas
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-sm">
                    <Zap className="h-4 w-4" aria-hidden /> +{summary.xp} XP
                  </Badge>
                </div>
                <Button onClick={handleStart} disabled={startMutation.isPending}>
                  Jogar outra rodada
                </Button>
              </CardContent>
            </Card>
          )}

          <section aria-label="Histórico de rodadas" className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Últimas rodadas</h2>
            {loadingHistory ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (history?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma rodada concluída ainda. Comece agora e apareça aqui.
              </p>
            ) : (
              <ul className="space-y-2">
                {(history || []).map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-card/50 p-3 text-sm"
                  >
                    <span className="text-muted-foreground">
                      {new Date(row.started_at).toLocaleString("pt-BR")}
                    </span>
                    <span className="font-medium text-foreground">
                      {row.correct_count} acertos · sequência {row.best_streak}
                    </span>
                    <span className="text-muted-foreground">
                      +{row.coins_awarded} moedas · +{row.xp_awarded} XP
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </SectionErrorBoundary>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}