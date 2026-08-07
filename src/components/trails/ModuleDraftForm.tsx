import { memo } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONTENT_TYPE_LABELS,
  MODULE_CONTENT_TYPES,
  type ModuleContentType,
  type ModuleDraft,
} from "@/lib/trailAuthoring";

export interface ModuleDraftFormProps {
  draft: ModuleDraft;
  errors: Record<string, string>;
  onChange: (draft: ModuleDraft) => void;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export const ModuleDraftForm = memo(function ModuleDraftForm({
  draft,
  errors,
  onChange,
}: ModuleDraftFormProps) {
  const patch = (updates: Partial<ModuleDraft>) => onChange({ ...draft, ...updates });

  const questions = draft.questions ?? [];
  const cards = draft.cards ?? [];
  const items = draft.items ?? [];

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="module-title">Título do módulo</Label>
        <Input
          id="module-title"
          value={draft.title}
          maxLength={150}
          onChange={(event) => patch({ title: event.target.value })}
          placeholder="Ex.: Fundamentos de atendimento"
        />
        <FieldError message={errors.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="module-description">Descrição (opcional)</Label>
        <Textarea
          id="module-description"
          value={draft.description ?? ""}
          maxLength={500}
          rows={2}
          onChange={(event) => patch({ description: event.target.value })}
        />
        <FieldError message={errors.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="module-type">Tipo de conteúdo</Label>
          <Select
            value={draft.content_type}
            onValueChange={(value) => patch({ content_type: value as ModuleContentType })}
          >
            <SelectTrigger id="module-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODULE_CONTENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {CONTENT_TYPE_LABELS[type]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="module-xp">XP</Label>
          <Input
            id="module-xp"
            type="number"
            min={0}
            max={10000}
            value={draft.xp_reward}
            onChange={(event) => patch({ xp_reward: Number(event.target.value) || 0 })}
          />
          <FieldError message={errors.xp_reward} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="module-duration">Duração (min)</Label>
          <Input
            id="module-duration"
            type="number"
            min={0}
            max={1440}
            value={draft.duration_minutes}
            onChange={(event) => patch({ duration_minutes: Number(event.target.value) || 0 })}
          />
          <FieldError message={errors.duration_minutes} />
        </div>
      </div>

      {draft.content_type === "video" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module-video">URL do vídeo</Label>
            <Input
              id="module-video"
              value={draft.video_url ?? ""}
              onChange={(event) => patch({ video_url: event.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <FieldError message={errors.video_url} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="module-transcript">Transcrição / legenda textual</Label>
            <Textarea
              id="module-transcript"
              rows={5}
              value={draft.transcript ?? ""}
              onChange={(event) => patch({ transcript: event.target.value })}
              placeholder="Cole aqui a transcrição do vídeo para garantir acessibilidade."
            />
            <p className="text-xs text-muted-foreground">
              A transcrição é exibida no player para quem não pode ouvir o áudio.
            </p>
            <FieldError message={errors.transcript} />
          </div>
        </div>
      )}

      {(draft.content_type === "text" || draft.content_type === "infographic") && (
        <div className="space-y-2">
          <Label htmlFor="module-body">Conteúdo</Label>
          <Textarea
            id="module-body"
            rows={10}
            value={draft.body ?? ""}
            onChange={(event) => patch({ body: event.target.value })}
            placeholder="Você pode usar HTML simples: <h3>, <p>, <ul>, <strong>..."
          />
          <p className="text-xs text-muted-foreground">
            O conteúdo é sanitizado antes de ser exibido aos alunos.
          </p>
          <FieldError message={errors.body} />
        </div>
      )}

      {draft.content_type === "quiz" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Perguntas</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patch({ questions: [...questions, { question: "", options: ["", ""], correct: 0 }] })
              }
            >
              <Plus className="h-4 w-4" />
              Pergunta
            </Button>
          </div>
          <FieldError message={errors.questions} />

          {questions.map((question, questionIndex) => (
            <div key={questionIndex} className="space-y-3 rounded-xl border border-border/60 p-4">
              <div className="flex items-start gap-2">
                <Input
                  aria-label={`Pergunta ${questionIndex + 1}`}
                  value={question.question}
                  onChange={(event) => {
                    const next = [...questions];
                    next[questionIndex] = { ...question, question: event.target.value };
                    patch({ questions: next });
                  }}
                  placeholder={`Pergunta ${questionIndex + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover pergunta ${questionIndex + 1}`}
                  className="min-h-11 min-w-11 shrink-0"
                  onClick={() => patch({ questions: questions.filter((_, i) => i !== questionIndex) })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <FieldError message={errors[`questions.${questionIndex}.question`]} />

              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${questionIndex}`}
                      checked={question.correct === optionIndex}
                      aria-label={`Marcar alternativa ${optionIndex + 1} como correta`}
                      onChange={() => {
                        const next = [...questions];
                        next[questionIndex] = { ...question, correct: optionIndex };
                        patch({ questions: next });
                      }}
                      className="h-4 w-4 accent-primary"
                    />
                    <Input
                      aria-label={`Alternativa ${optionIndex + 1}`}
                      value={option}
                      onChange={(event) => {
                        const options = [...question.options];
                        options[optionIndex] = event.target.value;
                        const next = [...questions];
                        next[questionIndex] = { ...question, options };
                        patch({ questions: next });
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover alternativa ${optionIndex + 1}`}
                      className="min-h-11 min-w-11 shrink-0"
                      disabled={question.options.length <= 2}
                      onClick={() => {
                        const options = question.options.filter((_, i) => i !== optionIndex);
                        const correct =
                          question.correct >= options.length ? options.length - 1 : question.correct;
                        const next = [...questions];
                        next[questionIndex] = { ...question, options, correct: Math.max(correct, 0) };
                        patch({ questions: next });
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
                <FieldError message={errors[`questions.${questionIndex}.options`]} />
                <FieldError message={errors[`questions.${questionIndex}.correct`]} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const next = [...questions];
                    next[questionIndex] = { ...question, options: [...question.options, ""] };
                    patch({ questions: next });
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Alternativa
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {draft.content_type === "flashcard" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Cards</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => patch({ cards: [...cards, { front: "", back: "" }] })}
            >
              <Plus className="h-4 w-4" />
              Card
            </Button>
          </div>
          <FieldError message={errors.cards} />
          {cards.map((card, index) => (
            <div key={index} className="grid gap-2 rounded-xl border border-border/60 p-4 sm:grid-cols-[1fr_1fr_auto]">
              <div className="space-y-1">
                <Input
                  aria-label={`Frente do card ${index + 1}`}
                  placeholder="Frente"
                  value={card.front}
                  onChange={(event) => {
                    const next = [...cards];
                    next[index] = { ...card, front: event.target.value };
                    patch({ cards: next });
                  }}
                />
                <FieldError message={errors[`cards.${index}.front`]} />
              </div>
              <div className="space-y-1">
                <Input
                  aria-label={`Verso do card ${index + 1}`}
                  placeholder="Verso"
                  value={card.back}
                  onChange={(event) => {
                    const next = [...cards];
                    next[index] = { ...card, back: event.target.value };
                    patch({ cards: next });
                  }}
                />
                <FieldError message={errors[`cards.${index}.back`]} />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Remover card ${index + 1}`}
                className="min-h-11 min-w-11"
                onClick={() => patch({ cards: cards.filter((_, i) => i !== index) })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {(draft.content_type === "checklist" || draft.content_type === "simulation") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Itens</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => patch({ items: [...items, { text: "" }] })}
            >
              <Plus className="h-4 w-4" />
              Item
            </Button>
          </div>
          <FieldError message={errors.items} />
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center gap-2">
                <Input
                  aria-label={`Item ${index + 1}`}
                  value={item.text}
                  onChange={(event) => {
                    const next = [...items];
                    next[index] = { text: event.target.value };
                    patch({ items: next });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remover item ${index + 1}`}
                  className="min-h-11 min-w-11"
                  onClick={() => patch({ items: items.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <FieldError message={errors[`items.${index}.text`]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
});