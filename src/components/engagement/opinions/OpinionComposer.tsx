import { useMemo, useState } from "react";
import { Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABELS,
  OPINION_CATEGORIES,
  OPINION_CONTENT_MAX,
  OPINION_SUBJECT_MAX,
  OPINION_URGENCIES,
  SLA_HOURS_BY_URGENCY,
  URGENCY_LABELS,
  validateOpinionDraft,
  type OpinionCategory,
  type OpinionUrgency,
} from "@/lib/opinionChannel";
import { useCreateOpinion } from "@/hooks/useOpinions";

export interface OpinionComposerProps {
  className?: string;
}

/** Formulário de envio de manifestação, anônima por padrão. */
export function OpinionComposer({ className }: OpinionComposerProps) {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<OpinionCategory>("suggestion");
  const [urgency, setUrgency] = useState<OpinionUrgency>("normal");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const create = useCreateOpinion();

  const validation = useMemo(
    () => validateOpinionDraft({ subject, content, category, urgency, isAnonymous }),
    [subject, content, category, urgency, isAnonymous],
  );

  const slaHours = SLA_HOURS_BY_URGENCY[urgency];
  const slaLabel = slaHours >= 48 ? `${Math.round(slaHours / 24)} dias` : `${slaHours} horas`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validation.valid) return;
    create.mutate(
      { subject, content, category, urgency, isAnonymous },
      {
        onSuccess: () => {
          setSubject("");
          setContent("");
          setCategory("suggestion");
          setUrgency("normal");
        },
      },
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Enviar manifestação</CardTitle>
        <CardDescription>
          Sugestões, reclamações, elogios ou dúvidas chegam direto ao RH. Prazo de tratativa desta
          urgência: {slaLabel}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="opinion-category">Categoria</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as OpinionCategory)}>
                <SelectTrigger id="opinion-category" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPINION_CATEGORIES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {CATEGORY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opinion-urgency">Urgência</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as OpinionUrgency)}>
                <SelectTrigger id="opinion-urgency" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPINION_URGENCIES.map((key) => (
                    <SelectItem key={key} value={key}>
                      {URGENCY_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="opinion-subject">Assunto (opcional)</Label>
            <Input
              id="opinion-subject"
              value={subject}
              maxLength={OPINION_SUBJECT_MAX}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Resuma em poucas palavras"
              className="min-h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="opinion-content">Sua manifestação</Label>
            <Textarea
              id="opinion-content"
              value={content}
              maxLength={OPINION_CONTENT_MAX}
              rows={5}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva a situação, o impacto e, se quiser, a sua sugestão."
              aria-describedby="opinion-content-hint"
            />
            <p id="opinion-content-hint" className="text-xs text-muted-foreground">
              {content.length}/{OPINION_CONTENT_MAX} caracteres
            </p>
          </div>

          <div className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-card/40 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
              <div>
                <Label htmlFor="opinion-anonymous" className="text-sm font-medium">
                  Enviar anonimamente
                </Label>
                <p className="text-xs text-muted-foreground">
                  {isAnonymous
                    ? "Seu nome não é exibido em nenhuma tela, nem para o RH."
                    : "Seu nome ficará visível para quem tratar a manifestação."}
                </p>
              </div>
            </div>
            <Switch
              id="opinion-anonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
              aria-label="Enviar anonimamente"
            />
          </div>

          {validation.errors.length > 0 && content.length > 0 && (
            <p className="text-xs text-destructive">{validation.errors.join(" ")}</p>
          )}

          <Button
            type="submit"
            className="min-h-11 w-full sm:w-auto"
            disabled={!validation.valid || create.isPending}
          >
            <Send className="mr-2 h-4 w-4" aria-hidden />
            {create.isPending ? "Enviando…" : "Enviar manifestação"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}