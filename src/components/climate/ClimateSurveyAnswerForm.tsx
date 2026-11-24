import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { PILLAR_LABELS, type ClimateSurvey, type ClimateSurveyQuestion } from "@/services/climateSurveyService";

const SCALES: Record<string, number[]> = {
  likert_5: [1, 2, 3, 4, 5],
  likert_10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  nps: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
};

const SCALE_HINTS: Record<string, { start: string; end: string }> = {
  likert_5: { start: "discordo totalmente", end: "concordo totalmente" },
  likert_10: { start: "muito insatisfeito", end: "muito satisfeito" },
  nps: { start: "nada provável", end: "extremamente provável" },
};

interface AnswerDraft {
  score?: number;
  textAnswer?: string;
}

interface ClimateSurveyAnswerFormProps {
  survey: ClimateSurvey;
  questions: ClimateSurveyQuestion[];
  isSubmitting: boolean;
  onSubmit: (answers: { questionId: string; score?: number; textAnswer?: string }[]) => void;
  onCancel: () => void;
}

export function ClimateSurveyAnswerForm({
  survey,
  questions,
  isSubmitting,
  onSubmit,
  onCancel,
}: ClimateSurveyAnswerFormProps) {
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({});
  const [error, setError] = useState<string | null>(null);

  const orderedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order_index - b.order_index),
    [questions],
  );

  const setScore = (questionId: string, score: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], score } }));
    setError(null);
  };

  const setText = (questionId: string, textAnswer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], textAnswer } }));
    setError(null);
  };

  const handleSubmit = () => {
    const payload = orderedQuestions
      .map((question) => {
        const answer = answers[question.id];
        if (!answer) return null;
        const textAnswer = answer.textAnswer?.trim() || undefined;
        if (answer.score === undefined && !textAnswer) return null;
        return { questionId: question.id, score: answer.score, textAnswer };
      })
      .filter((answer): answer is { questionId: string; score: number | undefined; textAnswer: string | undefined } => answer !== null);

    if (payload.length === 0) {
      setError("Responda ao menos uma pergunta antes de enviar.");
      return;
    }

    if (!survey.allow_skip) {
      const missing = orderedQuestions.filter((question) => {
        if (!question.is_required) return false;
        if (SCALES[question.question_type]) return answers[question.id]?.score === undefined;
        return !answers[question.id]?.textAnswer?.trim();
      });
      if (missing.length > 0) {
        setError(`Esta pesquisa não permite pular perguntas. Faltam ${missing.length} resposta(s).`);
        return;
      }
    }

    setError(null);
    onSubmit(payload);
  };

  return (
    <div className="space-y-5">
      {orderedQuestions.map((question, index) => {
        const scale = SCALES[question.question_type];
        const hints = SCALE_HINTS[question.question_type];
        const pillarLabel = PILLAR_LABELS[question.pillar]?.pt ?? question.pillar;
        const fieldId = `climate-q-${question.id}`;
        const labelId = `${fieldId}-label`;

        return (
          <div key={question.id} className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="text-sm font-medium" id={labelId}>
                {index + 1}. {question.question_text}
                {question.is_required && (
                  <span className="ml-1 text-destructive" aria-label="obrigatória">
                    *
                  </span>
                )}
              </p>
              <Badge variant="secondary">{pillarLabel}</Badge>
            </div>

            {scale ? (
              <div className="space-y-1">
                <RadioGroup
                  aria-labelledby={labelId}
                  value={answers[question.id]?.score?.toString() ?? ""}
                  onValueChange={(value) => setScore(question.id, Number(value))}
                  className="flex flex-wrap gap-x-4 gap-y-2"
                >
                  {scale.map((value) => (
                    <div key={value} className="flex items-center gap-1.5">
                      <RadioGroupItem value={String(value)} id={`${fieldId}-${value}`} />
                      <Label htmlFor={`${fieldId}-${value}`} className="cursor-pointer text-xs">
                        {value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {hints && (
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>
                      {scale[0]} — {hints.start}
                    </span>
                    <span>
                      {scale[scale.length - 1]} — {hints.end}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor={fieldId} className="sr-only">
                  {question.question_text}
                </Label>
                <Textarea
                  id={fieldId}
                  value={answers[question.id]?.textAnswer ?? ""}
                  onChange={(event) => setText(question.id, event.target.value)}
                  placeholder="Escreva seu comentário (opcional)"
                  rows={3}
                />
              </div>
            )}
          </div>
        );
      })}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Enviando..." : "Enviar respostas"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}