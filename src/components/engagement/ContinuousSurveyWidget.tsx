import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Clock, Sparkles, ArrowRight, SkipForward } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { AnswerInput } from "./AnswerInput";
import { PILLAR_LABELS } from "@/services/climateSurveyService";
import { normalizeAnswer } from "@/services/continuousEngagementService";
import {
  useActiveEngagementCycle,
  useMyEngagementQuestions,
  useSubmitEngagementAnswer,
} from "@/hooks/useContinuousEngagement";

/** Widget "Responda em 2 minutos" — pesquisa contínua de engajamento. */
export function ContinuousSurveyWidget() {
  const { data: cycle, isLoading: isCycleLoading } = useActiveEngagementCycle();
  const { data: questions, isLoading: isQuestionsLoading } = useMyEngagementQuestions(cycle?.id);
  const submit = useSubmitEngagementAnswer();
  const [value, setValue] = useState<unknown>(null);

  const pending = useMemo(() => (questions ?? []).filter((q) => !q.answered_at), [questions]);
  const total = questions?.length ?? 0;
  const answered = total - pending.length;
  const current = pending[0];

  if (isCycleLoading || isQuestionsLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-11 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!cycle) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Nenhum ciclo ativo
          </CardTitle>
          <CardDescription>
            Assim que um novo ciclo de pesquisa começar, suas perguntas aparecem aqui.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!current) {
    return (
      <Card className="glass-card border-primary/30">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CheckCircle2 className="h-12 w-12 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Ciclo concluído!</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Você respondeu todas as {total} perguntas deste ciclo. Obrigado por contribuir com o
            clima da empresa.
          </p>
          <Badge variant="secondary">{cycle.title}</Badge>
        </CardContent>
      </Card>
    );
  }

  const normalized = normalizeAnswer(current.answer_format, value, current.options.length || 5);
  const isText = current.answer_format === "text";
  const canSubmit = isText ? typeof value === "string" && value.trim().length > 0 : normalized !== null;

  const handleSubmit = async () => {
    try {
      await submit.mutateAsync({
        cycleId: cycle.id,
        questionId: current.question_id,
        rawValue: value,
        normalizedScore: normalized,
        textAnswer: isText && typeof value === "string" ? value.trim() : null,
      });
      setValue(null);
      if (pending.length === 1) {
        toast.success("Ciclo concluído! 🎉", { description: "Obrigado pela sua participação." });
      }
    } catch {
      // Erro já tratado e notificado no hook de mutação.
    }
  };

  const handleSkip = () => setValue(null);

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Responda em 2 minutos
            </CardTitle>
            <CardDescription>{cycle.title}</CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {answered}/{total}
          </Badge>
        </div>
        <Progress value={total > 0 ? (answered / total) * 100 : 0} className="mt-3 h-2" />
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.question_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Badge variant="secondary" className="text-xs">
                {PILLAR_LABELS[current.pillar]?.pt ?? current.pillar}
              </Badge>
              <h3 className="text-base font-semibold leading-snug text-foreground sm:text-lg">
                {current.question_text}
              </h3>
              {current.helper_text && (
                <p className="text-sm text-muted-foreground">{current.helper_text}</p>
              )}
            </div>

            <AnswerInput
              format={current.answer_format}
              options={current.options}
              value={value}
              onChange={setValue}
            />
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || submit.isPending}
            className="min-h-11 flex-1"
          >
            {submit.isPending ? "Enviando..." : "Enviar resposta"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={handleSkip}
            disabled={submit.isPending || value === null}
            className="min-h-11"
          >
            <SkipForward className="mr-2 h-4 w-4" />
            Limpar
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Suas respostas são tratadas de forma agregada e anônima nos relatórios.
        </p>
      </CardContent>
    </Card>
  );
}