import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PILLAR_LABELS,
  type ClimatePillar,
  type ClimateSurvey,
  type ClimateSurveyQuestion,
} from "@/services/climateSurveyService";

const QUESTION_TYPES = [
  { value: "likert_5", label: "Escala 1 a 5" },
  { value: "likert_10", label: "Escala 0 a 10" },
  { value: "nps", label: "NPS (0 a 10)" },
  { value: "text", label: "Texto livre" },
];

const TYPE_LABELS: Record<string, string> = {
  likert_5: "Escala 1-5",
  likert_10: "Escala 0-10",
  nps: "NPS",
  text: "Texto",
  yes_no: "Sim/Não",
  multiple_choice: "Múltipla escolha",
};

interface ClimateSurveyQuestionsProps {
  survey: ClimateSurvey;
  questions: ClimateSurveyQuestion[];
  canManage: boolean;
  isAdding: boolean;
  isRemoving: boolean;
  onAdd: (question: Omit<ClimateSurveyQuestion, "id" | "created_at">) => void;
  onRemove: (questionId: string) => void;
}

export function ClimateSurveyQuestions({
  survey,
  questions,
  canManage,
  isAdding,
  isRemoving,
  onAdd,
  onRemove,
}: ClimateSurveyQuestionsProps) {
  const [pillar, setPillar] = useState<ClimatePillar>("recognition");
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("likert_5");
  const [isRequired, setIsRequired] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderedQuestions = [...questions].sort((a, b) => a.order_index - b.order_index);
  const isDraft = survey.status === "draft";

  const handleAdd = () => {
    if (!questionText.trim()) {
      setError("Escreva o texto da pergunta.");
      return;
    }

    setError(null);
    onAdd({
      survey_id: survey.id,
      pillar,
      question_text: questionText.trim(),
      question_text_en: null,
      question_text_es: null,
      question_type: questionType,
      options: null,
      is_required: isRequired,
      order_index: orderedQuestions.length + 1,
    });
    setQuestionText("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">
          Perguntas <Badge variant="secondary">{orderedQuestions.length}</Badge>
        </h3>
        {!isDraft && (
          <Badge variant="outline">Perguntas travadas após a publicação</Badge>
        )}
      </div>

      {orderedQuestions.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
          Nenhuma pergunta cadastrada ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {orderedQuestions.map((question, index) => (
            <li key={question.id} className="flex items-start justify-between gap-2 rounded-lg border p-3">
              <div className="space-y-1">
                <p className="text-sm">
                  {index + 1}. {question.question_text}
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="secondary">{PILLAR_LABELS[question.pillar]?.pt ?? question.pillar}</Badge>
                  <Badge variant="outline">{TYPE_LABELS[question.question_type] ?? question.question_type}</Badge>
                  {question.is_required && <Badge variant="outline">Obrigatória</Badge>}
                </div>
              </div>
              {canManage && isDraft && (
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label={`Remover pergunta ${index + 1}`}
                  disabled={isRemoving}
                  onClick={() => onRemove(question.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && isDraft && (
        <div className="space-y-3 rounded-lg border p-4">
          <p className="text-sm font-medium">Adicionar pergunta</p>
          <div className="space-y-1">
            <Label htmlFor="climate-question-text">Pergunta</Label>
            <Input
              id="climate-question-text"
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
              placeholder="Ex.: Eu me sinto reconhecido pelo trabalho que faço"
              maxLength={200}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="climate-question-pillar">Pilar</Label>
              <Select value={pillar} onValueChange={(value) => setPillar(value as ClimatePillar)}>
                <SelectTrigger id="climate-question-pillar">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PILLAR_LABELS) as ClimatePillar[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {PILLAR_LABELS[key].pt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="climate-question-type">Formato</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger id="climate-question-type">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <p className="text-sm">Resposta obrigatória</p>
            <Switch checked={isRequired} onCheckedChange={setIsRequired} aria-label="Resposta obrigatória" />
          </div>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button onClick={handleAdd} disabled={isAdding}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {isAdding ? "Adicionando..." : "Adicionar pergunta"}
          </Button>
        </div>
      )}
    </div>
  );
}