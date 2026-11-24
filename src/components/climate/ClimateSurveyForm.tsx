import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import type { ClimateSurvey } from "@/services/climateSurveyService";

const SURVEY_TYPES = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensal" },
  { value: "quarterly", label: "Trimestral" },
  { value: "annual", label: "Anual" },
  { value: "custom", label: "Personalizada" },
];

// Inicio e fim do periodo: o encerramento vale ate o fim do dia escolhido, senao a
// pesquisa aparece como "Fora do periodo" no proprio ultimo dia.
const toIsoStart = (value: string) => new Date(`${value}T00:00:00`).toISOString();
const toIsoEnd = (value: string) => new Date(`${value}T23:59:59.999`).toISOString();

const toInputDate = (date: Date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

export type NewClimateSurvey = Omit<ClimateSurvey, "id" | "created_at" | "updated_at">;

interface ClimateSurveyFormProps {
  creatorId: string;
  isSubmitting: boolean;
  onSubmit: (survey: NewClimateSurvey) => void;
  onCancel: () => void;
}

export function ClimateSurveyForm({ creatorId, isSubmitting, onSubmit, onCancel }: ClimateSurveyFormProps) {
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [surveyType, setSurveyType] = useState("monthly");
  const [startsAt, setStartsAt] = useState(toInputDate(today));
  const [endsAt, setEndsAt] = useState(toInputDate(nextWeek));
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [allowSkip, setAllowSkip] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!title.trim()) {
      setError("Informe um título para a pesquisa.");
      return;
    }
    if (!startsAt || !endsAt) {
      setError("Informe o período da pesquisa.");
      return;
    }
    if (endsAt <= startsAt) {
      setError("A data de encerramento precisa ser posterior à data de início.");
      return;
    }

    setError(null);
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      survey_type: surveyType,
      status: "draft",
      starts_at: toIsoStart(startsAt),
      ends_at: toIsoEnd(endsAt),
      is_anonymous: isAnonymous,
      is_recurring: false,
      recurrence_pattern: null,
      send_reminders: true,
      reminder_frequency: "daily",
      allow_skip: allowSkip,
      department_id: null,
      created_by: creatorId,
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="climate-title">Título</Label>
        <Input
          id="climate-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Pesquisa de clima do trimestre"
          maxLength={120}
        />
      </div>

      <div className="space-y-1">
        <Label htmlFor="climate-description">Descrição</Label>
        <Textarea
          id="climate-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Explique o objetivo da pesquisa para quem vai responder"
          rows={3}
          maxLength={500}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="climate-type">Periodicidade</Label>
          <Select value={surveyType} onValueChange={setSurveyType}>
            <SelectTrigger id="climate-type">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {SURVEY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="climate-start">Início</Label>
          <Input
            id="climate-start"
            type="date"
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="climate-end">Encerramento</Label>
          <Input
            id="climate-end"
            type="date"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Respostas anônimas</p>
          <p className="text-xs text-muted-foreground">
            Resultados só aparecem a partir de 5 respondentes por pilar.
          </p>
        </div>
        <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} aria-label="Respostas anônimas" />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Permitir pular perguntas</p>
          <p className="text-xs text-muted-foreground">
            Quando desligado, perguntas obrigatórias precisam ser respondidas.
          </p>
        </div>
        <Switch checked={allowSkip} onCheckedChange={setAllowSkip} aria-label="Permitir pular perguntas" />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Criando..." : "Criar pesquisa"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}