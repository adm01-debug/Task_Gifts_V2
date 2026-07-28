import { useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Coins, Dices, Download, Lock, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/navigation";
import { WagerBulkImportDialog } from "@/components/wager/WagerBulkImportDialog";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  useAdminWagerQuestions,
  useDeleteWagerQuestion,
  useSaveWagerQuestion,
} from "@/hooks/useWagerAdmin";
import type { AdminWagerQuestion } from "@/services/wagerAdminService";
import {
  estimateExposure,
  optionKeyAt,
  validateWagerDraft,
  wagerSaveMessage,
  WAGER_MAX_OPTIONS,
  type WagerQuestionDraft,
} from "@/lib/wagerAuthoring";
import { cn } from "@/lib/utils";
import { buildWagerScheduleCsv, wagerScheduleFileName } from "@/lib/wagerScheduleExport";

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: "Fácil",
  medium: "Média",
  hard: "Difícil",
};

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function emptyDraft(): WagerQuestionDraft {
  return {
    id: null,
    question: "",
    options: [
      { id: "A", label: "" },
      { id: "B", label: "" },
    ],
    correctOption: "A",
    explanation: "",
    difficulty: "medium",
    multiplier: 2,
    maxStake: 100,
    scheduledDate: todayISO(),
    isActive: true,
  };
}

function toDraft(question: AdminWagerQuestion): WagerQuestionDraft {
  return {
    id: question.id,
    question: question.question,
    options: question.options.map((o) => ({ ...o })),
    correctOption: question.correctOption,
    explanation: question.explanation ?? "",
    difficulty: question.difficulty,
    multiplier: question.multiplier,
    maxStake: question.maxStake,
    scheduledDate: question.scheduledDate,
    isActive: question.isActive,
  };
}

function formatDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function WagerQuestionAdminPage() {
  const { data: questions, isLoading } = useAdminWagerQuestions();
  const saveMutation = useSaveWagerQuestion();
  const deleteMutation = useDeleteWagerQuestion();

  const [draft, setDraft] = useState<WagerQuestionDraft>(emptyDraft);
  const [expectedPlayers, setExpectedPlayers] = useState(30);

  // Quantas apostas a pergunta em edição já recebeu: define a imutabilidade.
  const lockedEntries = useMemo(() => {
    if (!draft.id) return 0;
    return questions?.find((q) => q.id === draft.id)?.totalEntries ?? 0;
  }, [draft.id, questions]);
  const isLocked = lockedEntries > 0;

  const validation = useMemo(() => validateWagerDraft(draft), [draft]);
  const scheduledDates = useMemo(
    () => (questions ?? []).map((q) => q.scheduledDate),
    [questions],
  );
  const exposure = useMemo(
    () => estimateExposure(draft, expectedPlayers),
    [draft, expectedPlayers],
  );

  const issueFor = (scope: string) =>
    validation.issues.find((issue) => issue.scope === scope)?.message ?? null;

  const patch = (values: Partial<WagerQuestionDraft>) =>
    setDraft((current) => ({ ...current, ...values }));

  const updateOption = (index: number, label: string) =>
    setDraft((current) => ({
      ...current,
      options: current.options.map((option, i) => (i === index ? { ...option, label } : option)),
    }));

  const addOption = () =>
    setDraft((current) =>
      current.options.length >= WAGER_MAX_OPTIONS
        ? current
        : {
            ...current,
            options: [
              ...current.options,
              { id: optionKeyAt(current.options.length), label: "" },
            ],
          },
    );

  const removeOption = (index: number) =>
    setDraft((current) => {
      if (current.options.length <= 2) return current;
      const removed = current.options[index];
      const options = current.options.filter((_, i) => i !== index);
      return {
        ...current,
        options,
        correctOption:
          current.correctOption === removed?.id ? (options[0]?.id ?? "") : current.correctOption,
      };
    });

  const handleSave = async () => {
    if (!isLocked && !validation.valid) {
      toast.error(validation.issues[0]?.message ?? "Revise os campos destacados.");
      return;
    }
    try {
      const result = await saveMutation.mutateAsync(draft);
      if (!result.success) {
        toast.error(wagerSaveMessage(result.reason));
        return;
      }
      toast.success(
        result.locked
          ? "Pergunta já respondida: apenas explicação e ativação foram atualizadas."
          : "Pergunta salva com sucesso.",
      );
      setDraft(emptyDraft());
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao salvar a pergunta.");
    }
  };

  const handleDelete = async (question: AdminWagerQuestion) => {
    // eslint-disable-next-line no-empty
    if (question.totalEntries > 0) {
      toast.error("Perguntas com apostas registradas não podem ser excluídas.");
      return;
    }
    try {
      await deleteMutation.mutateAsync(question.id);
      if (draft.id === question.id) setDraft(emptyDraft());
      toast.success("Pergunta removida.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Falha ao remover a pergunta.");
    }
  };

  return (
    <PageShell
      title="Perguntas do Dia"
      subtitle="Agende, revise e acompanhe as perguntas com aposta"
      icon={<Dices className="h-5 w-5" />}
    >
      <SEOHead
        title="Autoria da Pergunta do Dia | Task Gifts"
        description="Painel administrativo para agendar perguntas com aposta, definir multiplicadores e acompanhar a participação."
      />

      <SectionErrorBoundary sectionName="Autoria da Pergunta do Dia">
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            disabled={(questions?.length ?? 0) === 0}
            onClick={handleExport}
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          <WagerBulkImportDialog existingDates={scheduledDates} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {draft.id ? "Editar pergunta" : "Nova pergunta"}
                {isLocked && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" /> {lockedEntries} aposta(s)
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isLocked && (
                <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  Esta pergunta já recebeu apostas liquidadas. Para preservar a integridade das
                  moedas, só a explicação e a ativação podem ser alteradas.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="wager-question">Enunciado</Label>
                <Textarea
                  id="wager-question"
                  rows={3}
                  value={draft.question}
                  disabled={isLocked}
                  onChange={(e) => patch({ question: e.target.value })}
                  placeholder="Qual é o prazo padrão para responder um orçamento?"
                />
                {issueFor("question") && (
                  <p className="text-xs text-destructive">{issueFor("question")}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Alternativas</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isLocked || draft.options.length >= WAGER_MAX_OPTIONS}
                    onClick={addOption}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Adicionar
                  </Button>
                </div>
                {draft.options.map((option, index) => {
                  const isCorrect = draft.correctOption === option.id;
                  return (
                    <div key={option.id} className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isCorrect ? "default" : "outline"}
                        size="icon"
                        className={cn("shrink-0", isCorrect && "shadow-sm")}
                        disabled={isLocked}
                        aria-label={`Marcar alternativa ${option.id} como correta`}
                        aria-pressed={isCorrect}
                        onClick={() => patch({ correctOption: option.id })}
                      >
                        {option.id}
                      </Button>
                      <Input
                        value={option.label}
                        disabled={isLocked}
                        onChange={(e) => updateOption(index, e.target.value)}
                        placeholder={`Alternativa ${option.id}`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 text-muted-foreground"
                        disabled={isLocked || draft.options.length <= 2}
                        aria-label={`Remover alternativa ${option.id}`}
                        onClick={() => removeOption(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                {draft.options.map((_, index) => issueFor(`option:${index}`)).map(
                  (message, index) =>
                    message ? (
                      <p key={`issue-${index}`} className="text-xs text-destructive">
                        {message}
                      </p>
                    ) : null,
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="wager-explanation">Explicação (exibida após a aposta)</Label>
                <Textarea
                  id="wager-explanation"
                  rows={2}
                  value={draft.explanation ?? ""}
                  onChange={(e) => patch({ explanation: e.target.value })}
                  placeholder="Contexto e referência do procedimento correto."
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wager-date">Data</Label>
                  <Input
                    id="wager-date"
                    type="date"
                    value={draft.scheduledDate}
                    disabled={isLocked}
                    onChange={(e) => patch({ scheduledDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-difficulty">Dificuldade</Label>
                  <Select
                    value={draft.difficulty}
                    disabled={isLocked}
                    onValueChange={(value) =>
                      patch({ difficulty: value as WagerQuestionDraft["difficulty"] })
                    }
                  >
                    <SelectTrigger id="wager-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Fácil</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="hard">Difícil</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-multiplier">Multiplicador (1.1x – 5x)</Label>
                  <Input
                    id="wager-multiplier"
                    type="number"
                    step="0.1"
                    min={1.1}
                    max={5}
                    value={draft.multiplier}
                    disabled={isLocked}
                    onChange={(e) => patch({ multiplier: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wager-max-stake">Teto de aposta (10 – 1000)</Label>
                  <Input
                    id="wager-max-stake"
                    type="number"
                    step="10"
                    min={10}
                    max={1000}
                    value={draft.maxStake}
                    disabled={isLocked}
                    onChange={(e) => patch({ maxStake: Math.trunc(Number(e.target.value)) })}
                  />
                </div>
              </div>
              {issueFor("schedule") && (
                <p className="text-xs text-destructive">{issueFor("schedule")}</p>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Pergunta ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Ativar substitui automaticamente outra pergunta agendada para a mesma data.
                  </p>
                </div>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(checked) => patch({ isActive: checked })}
                  aria-label="Pergunta ativa"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSave} disabled={saveMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar pergunta"}
                </Button>
                {draft.id && (
                  <Button variant="outline" onClick={() => setDraft(emptyDraft())}>
                    Cancelar edição
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Coins className="h-4 w-4" /> Simulação de exposição
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="wager-players">Participantes esperados</Label>
                  <Input
                    id="wager-players"
                    type="number"
                    min={0}
                    value={expectedPlayers}
                    onChange={(e) => setExpectedPlayers(Math.max(0, Math.trunc(Number(e.target.value))))}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Se todos apostarem o teto e acertarem, a distribuição máxima será de{" "}
                  <span className="font-semibold text-foreground">
                    {exposure.toLocaleString("pt-BR")}
                  </span>{" "}
                  moedas.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4" /> Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading && (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                )}
                {!isLoading && (questions?.length ?? 0) === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma pergunta agendada neste período.
                  </p>
                )}
                {(questions ?? []).map((question) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => setDraft(toDraft(question))}
                    className={cn(
                      "w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      draft.id === question.id && "border-primary bg-muted/40",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {formatDate(question.scheduledDate)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge variant={question.isActive ? "default" : "outline"}>
                          {question.isActive ? "Ativa" : "Inativa"}
                        </Badge>
                        <Badge variant="outline">
                          {DIFFICULTY_LABEL[question.difficulty] ?? question.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm font-medium">{question.question}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {question.totalEntries} aposta(s) · {question.correctEntries} acerto(s) ·{" "}
                      {question.totalStaked.toLocaleString("pt-BR")} moedas apostadas
                    </p>
                    {question.totalEntries === 0 && (
                      <span
                        role="button"
                        tabIndex={0}
                        className="mt-2 inline-flex items-center text-xs text-destructive hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(question);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            void handleDelete(question);
                          }
                        }}
                      >
                        <Trash2 className="mr-1 h-3 w-3" /> Excluir
                      </span>
                    )}
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionErrorBoundary>
    </PageShell>
  );
}