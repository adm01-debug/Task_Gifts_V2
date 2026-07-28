import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, Coins, Dices, Sparkles, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useDailyWager, useSubmitWager, useWagerHistory } from "@/hooks/useDailyWager";
import { useHaptics } from "@/hooks/useHaptics";
import {
  clampStake,
  maxAllowedStake,
  previewWager,
  stakePresets,
  wagerReasonMessage,
} from "@/lib/dailyWager";
import { cn } from "@/lib/utils";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

export default function DailyWagerPage() {
  const { data, isLoading } = useDailyWager();
  const { data: history } = useWagerHistory();
  const submitMutation = useSubmitWager();
  const haptics = useHaptics();

  const question = data?.question ?? null;
  const entry = data?.entry ?? null;
  const balance = data?.balance ?? 0;

  const [optionId, setOptionId] = useState<string | null>(null);
  const [stake, setStake] = useState<number>(0);

  const maxStake = maxAllowedStake(question, balance);
  const presets = useMemo(() => stakePresets(question, balance), [question, balance]);
  const preview = useMemo(() => previewWager(stake, question, balance), [stake, question, balance]);

  // Aposta inicial sugerida: 25% do teto (ou o mínimo possível).
  useEffect(() => {
    if (!question || entry) return;
    setStake((current) => (current > 0 ? clampStake(current, question, balance) : (presets[0] ?? 0)));
  }, [question, entry, balance, presets]);

  const alreadyPlayed = !!entry;
  const canSubmit =
    !!question && !alreadyPlayed && !!optionId && preview.stake > 0 && !submitMutation.isPending;

  async function handleSubmit() {
    if (!question || !optionId) return;
    try {
      const result = await submitMutation.mutateAsync({
        questionId: question.id,
        optionId,
        stake: preview.stake,
      });
      if (!result.success) {
        toast.error(wagerReasonMessage(result.reason));
        return;
      }
      if (result.is_correct) {
        haptics.success();
        toast.success(`Acertou! +${result.coins_delta ?? 0} moedas e +${result.xp_awarded ?? 0} XP`);
      } else {
        haptics.error();
        toast.error(`Não foi dessa vez. ${Math.abs(result.coins_delta ?? 0)} moedas perdidas.`);
      }
    } catch {
      toast.error("Erro ao registrar a aposta. Tente novamente.");
    }
  }

  return (
    <PageShell
      title="Pergunta do Dia"
      description="Aposte suas moedas no que você sabe. Acertou, multiplica. Errou, perde a aposta."
      icon={Dices}
    >
      <SEOHead
        title="Pergunta do Dia com Aposta | Task Gifts"
        description="Responda a pergunta diária apostando moedas e multiplique seus ganhos."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-2/3" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : !question ? (
            <Card>
              <CardContent className="py-12 text-center space-y-2">
                <Sparkles className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="font-medium text-foreground">Nenhuma pergunta publicada hoje</p>
                <p className="text-sm text-muted-foreground">
                  Volte amanhã — uma nova pergunta é liberada todos os dias.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-primary/20">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    <CalendarDays className="h-3 w-3 mr-1" />
                    {formatDate(question.scheduledDate)}
                  </Badge>
                  <Badge variant="outline">
                    {DIFFICULTY_LABEL[question.difficulty] ?? "Média"}
                  </Badge>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {question.multiplier.toFixed(2)}x
                  </Badge>
                </div>
                <CardTitle className="text-xl leading-snug">{question.question}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid gap-3">
                  {question.options.map((option, index) => {
                    const isChosen = alreadyPlayed
                      ? entry?.chosenOption === option.id
                      : optionId === option.id;
                    const isCorrect =
                      question.correctOption !== null && question.correctOption === option.id;
                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        disabled={alreadyPlayed || submitMutation.isPending}
                        onClick={() => setOptionId(option.id)}
                        className={cn(
                          "w-full min-h-[44px] rounded-lg border px-4 py-3 text-left transition-colors",
                          "flex items-center justify-between gap-3",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isChosen ? "border-primary bg-primary/10" : "border-border bg-card",
                          isCorrect && "border-success bg-success/10",
                          alreadyPlayed && !isChosen && !isCorrect && "opacity-60",
                        )}
                      >
                        <span className="text-sm text-foreground">{option.label}</span>
                        {question.correctOption !== null &&
                          (isCorrect ? (
                            <Check className="h-4 w-4 text-success shrink-0" />
                          ) : isChosen ? (
                            <X className="h-4 w-4 text-destructive shrink-0" />
                          ) : null)}
                      </motion.button>
                    );
                  })}
                </div>

                {alreadyPlayed && entry ? (
                  <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                    <p
                      className={cn(
                        "font-semibold",
                        entry.isCorrect ? "text-success" : "text-destructive",
                      )}
                    >
                      {entry.isCorrect
                        ? `Você acertou e ganhou ${entry.coinsDelta} moedas!`
                        : `Você errou e perdeu ${Math.abs(entry.coinsDelta)} moedas.`}
                    </p>
                    {question.explanation && (
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Nova pergunta amanhã. Aposta de hoje: {entry.stakeCoins} moedas ·{" "}
                      {entry.multiplier.toFixed(2)}x
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">Sua aposta:</span>
                      <Input
                        type="number"
                        min={1}
                        max={Math.max(1, maxStake)}
                        value={preview.stake || ""}
                        onChange={(event) =>
                          setStake(clampStake(Number(event.target.value), question, balance))
                        }
                        disabled={maxStake <= 0}
                        className="w-28"
                        aria-label="Moedas apostadas"
                      />
                      {presets.map((value) => (
                        <Button
                          key={value}
                          type="button"
                          size="sm"
                          variant={preview.stake === value ? "default" : "outline"}
                          onClick={() => setStake(value)}
                        >
                          {value}
                        </Button>
                      ))}
                    </div>

                    {maxStake <= 0 ? (
                      <p className="text-sm text-destructive">
                        Você precisa de moedas para apostar na pergunta de hoje.
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                          <p className="text-xs text-muted-foreground">Se acertar</p>
                          <p className="text-lg font-bold text-success">+{preview.gain} moedas</p>
                        </div>
                        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                          <p className="text-xs text-muted-foreground">Se errar</p>
                          <p className="text-lg font-bold text-destructive">
                            -{preview.loss} moedas
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full min-h-[44px]"
                      disabled={!canSubmit}
                      onClick={handleSubmit}
                    >
                      {submitMutation.isPending ? "Registrando..." : "Confirmar aposta"}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Uma aposta por dia. O resultado é apurado no servidor no momento do envio.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Coins className="h-4 w-4 text-primary" />
                Saldo disponível
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{balance}</p>
              <p className="text-xs text-muted-foreground">
                Limite por aposta: {question ? question.maxStake : 0} moedas
              </p>
            </CardContent>
          </Card>

          <SectionErrorBoundary section="Histórico de apostas">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Suas últimas apostas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!history?.length ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma aposta registrada ainda.
                  </p>
                ) : (
                  history.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-start justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-foreground line-clamp-2">
                          {row.wager_questions?.question ?? "Pergunta removida"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Aposta: {row.stake_coins} moedas
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold shrink-0",
                          row.is_correct ? "text-success" : "text-destructive",
                        )}
                      >
                        {row.coins_delta > 0 ? `+${row.coins_delta}` : row.coins_delta}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </SectionErrorBoundary>
        </div>
      </div>
    </PageShell>
  );
}