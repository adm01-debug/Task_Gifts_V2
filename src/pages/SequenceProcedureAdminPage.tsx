import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ListOrdered,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { useDepartments } from "@/hooks/useDepartments";
import {
  useAdminSequenceProcedures,
  useDeleteSequenceProcedure,
  useSaveSequenceProcedure,
  useSequenceProcedure,
} from "@/hooks/useSequenceGame";
import { moveItem } from "@/lib/sequenceGame";
import {
  summarizeChanges,
  validateProcedureDraft,
  SOP_HINT_MAX,
  SOP_LABEL_MAX,
  SOP_MIN_STEPS,
  SOP_MAX_STEPS,
  type PersistedStep,
  type ProcedureDraft,
  type StepDraft,
} from "@/lib/sequenceProcedureAuthoring";

const NO_DEPARTMENT = "__none__";

const EMPTY_DRAFT: ProcedureDraft = {
  title: "",
  description: "",
  departmentId: null,
  isActive: true,
};

function blankSteps(count: number): StepDraft[] {
  return Array.from({ length: count }, () => ({ label: "", hint: "" }));
}

/** Mensagens amigáveis para as recusas devolvidas pela RPC. */
const SAVE_REASONS: Record<string, string> = {
  unauthenticated: "Sessão expirada. Entre novamente.",
  forbidden: "Apenas administradores podem editar procedimentos.",
  not_found: "Este procedimento não existe mais.",
  invalid_title: "Título inválido.",
  invalid_description: "Descrição muito longa.",
  invalid_steps: "Etapas inválidas.",
  invalid_step_count: `O procedimento precisa de ${SOP_MIN_STEPS} a ${SOP_MAX_STEPS} etapas.`,
  invalid_label: "Há etapas sem texto ou longas demais.",
  duplicate_label: "Há etapas repetidas.",
  invalid_department: "Departamento inválido.",
};

export default function SequenceProcedureAdminPage() {
  const { data: procedures, isLoading } = useAdminSequenceProcedures();
  const { data: departments } = useDepartments();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: persisted, isLoading: loadingSteps } = useSequenceProcedure(selectedId);
  const saveMutation = useSaveSequenceProcedure();
  const deleteMutation = useDeleteSequenceProcedure();

  const [draft, setDraft] = useState<ProcedureDraft>(EMPTY_DRAFT);
  const [steps, setSteps] = useState<StepDraft[]>(blankSteps(SOP_MIN_STEPS));

  // Carrega o procedimento selecionado (ou zera o formulário para "novo").
  useEffect(() => {
    if (!selectedId) {
      setDraft(EMPTY_DRAFT);
      setSteps(blankSteps(SOP_MIN_STEPS));
      return;
    }
    if (!persisted) return;
    setDraft({
      title: persisted.title,
      description: persisted.description ?? "",
      departmentId: persisted.department_id,
      isActive: persisted.is_active,
    });
    setSteps(
      persisted.steps.length > 0
        ? persisted.steps.map((s) => ({ id: s.id, label: s.label, hint: s.hint ?? "" }))
        : blankSteps(SOP_MIN_STEPS),
    );
  }, [selectedId, persisted]);

  const validation = useMemo(() => validateProcedureDraft(draft, steps), [draft, steps]);
  const issueFor = (scope: string) => validation.issues.find((i) => i.scope === scope)?.message;
  const headerIssues = validation.issues.filter((i) => i.scope === "procedure");

  const persistedSteps: PersistedStep[] = useMemo(
    () =>
      selectedId
        ? (persisted?.steps ?? []).map((s) => ({
            id: s.id,
            label: s.label,
            hint: s.hint ?? null,
            position: s.position,
          }))
        : [],
    [selectedId, persisted],
  );

  const changes = useMemo(
    () => summarizeChanges(persistedSteps, validation.normalizedSteps),
    [persistedSteps, validation.normalizedSteps],
  );

  const updateStep = (index: number, patch: Partial<StepDraft>) => {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const handleSave = async () => {
    if (!validation.valid) {
      toast.error("Corrija os avisos antes de salvar.");
      return;
    }
    try {
      const result = await saveMutation.mutateAsync({
        procedureId: selectedId,
        title: draft.title.trim(),
        description: (draft.description ?? "").trim() || null,
        departmentId: draft.departmentId ?? null,
        isActive: draft.isActive,
        steps: validation.normalizedSteps.map((s) => ({
          ...(s.id ? { id: s.id } : {}),
          label: s.label,
          hint: s.hint ?? null,
        })),
      });

      if (!result.success) {
        toast.error(SAVE_REASONS[result.reason ?? ""] ?? "Não foi possível salvar.");
        return;
      }
      if (result.procedure_id) setSelectedId(result.procedure_id);
      toast.success(
        `Procedimento salvo · ${result.inserted ?? 0} novas, ${result.updated ?? 0} atualizadas, ${result.deleted ?? 0} removidas`,
      );
    } catch {
      toast.error("Não foi possível salvar o procedimento.");
    }
  };

  const handleDelete = async (procedureId: string) => {
    try {
      await deleteMutation.mutateAsync(procedureId);
      if (selectedId === procedureId) setSelectedId(null);
      toast.success("Procedimento excluído.");
    } catch {
      toast.error("Não foi possível excluir o procedimento.");
    }
  };

  return (
    <>
      <SEOHead
        title="Procedimentos da Sequência | Task Gifts"
        description="Cadastre e ordene as etapas dos procedimentos operacionais usados no jogo Ordene a Sequência."
      />
      <PageShell
        title="Procedimentos (SOPs)"
        subtitle="Defina as etapas na ordem correta — o jogador recebe sempre embaralhado."
        icon={<ListOrdered className="h-5 w-5" />}
        backFallback="/sequencia"
      >
        <SectionErrorBoundary sectionName="Procedimentos da Sequência">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="border-border/60 bg-card/70 backdrop-blur lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Procedimentos</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setSelectedId(null)}>
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                  Novo
                </Button>
              </CardHeader>
              <CardContent className="space-y-2">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))
                ) : (procedures ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhum procedimento cadastrado ainda.
                  </p>
                ) : (
                  (procedures ?? []).map((procedure) => (
                    <div
                      key={procedure.id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border/50 p-2"
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(procedure.id)}
                        className={`min-h-[44px] flex-1 rounded-md px-2 text-left text-sm transition-colors ${
                          selectedId === procedure.id ? "bg-primary/10 text-primary" : ""
                        }`}
                      >
                        <span className="font-medium">{procedure.title}</span>
                        <Badge
                          variant={procedure.is_active ? "secondary" : "outline"}
                          className="ml-2 text-[10px]"
                        >
                          {procedure.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Excluir procedimento ${procedure.title}`}
                        onClick={() => handleDelete(procedure.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" aria-hidden />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/70 backdrop-blur lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">
                  {selectedId ? "Editar procedimento" : "Novo procedimento"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-title">Título</Label>
                    <Input
                      id="sop-title"
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="Ex.: Abertura do Galpão"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="sop-department">Departamento</Label>
                    <Select
                      value={draft.departmentId ?? NO_DEPARTMENT}
                      onValueChange={(value) =>
                        setDraft((d) => ({
                          ...d,
                          departmentId: value === NO_DEPARTMENT ? null : value,
                        }))
                      }
                    >
                      <SelectTrigger id="sop-department">
                        <SelectValue placeholder="Todos os departamentos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NO_DEPARTMENT}>Todos os departamentos</SelectItem>
                        {(departments ?? []).map((department) => (
                          <SelectItem key={department.id} value={department.id}>
                            {department.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sop-description">Descrição</Label>
                  <Textarea
                    id="sop-description"
                    rows={2}
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Contextualize quando este procedimento é executado"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="sop-active"
                    checked={draft.isActive}
                    onCheckedChange={(checked) => setDraft((d) => ({ ...d, isActive: checked }))}
                  />
                  <Label htmlFor="sop-active">Disponível para os jogadores</Label>
                </div>

                {headerIssues.length > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      Ajustes necessários
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                      {headerIssues.map((issue) => (
                        <li key={issue.message}>{issue.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Etapas na ordem correta ({validation.usableSteps} válidas)</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={steps.length >= SOP_MAX_STEPS}
                      onClick={() => setSteps((prev) => [...prev, { label: "", hint: "" }])}
                    >
                      <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                      Adicionar etapa
                    </Button>
                  </div>

                  {selectedId && loadingSteps
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                      ))
                    : steps.map((step, index) => {
                        const issue = issueFor(`step:${index}`);
                        return (
                          <div
                            key={step.id ?? `step-${index}`}
                            className="space-y-2 rounded-lg border border-border/50 p-3"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="shrink-0 tabular-nums">
                                {index + 1}
                              </Badge>
                              <Input
                                value={step.label}
                                maxLength={SOP_LABEL_MAX}
                                aria-label={`Etapa ${index + 1}`}
                                placeholder="Descreva a etapa"
                                onChange={(e) => updateStep(index, { label: e.target.value })}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Mover etapa ${index + 1} para cima`}
                                disabled={index === 0}
                                onClick={() => setSteps((prev) => moveItem(prev, index, index - 1))}
                              >
                                <ArrowUp className="h-4 w-4" aria-hidden />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Mover etapa ${index + 1} para baixo`}
                                disabled={index === steps.length - 1}
                                onClick={() => setSteps((prev) => moveItem(prev, index, index + 1))}
                              >
                                <ArrowDown className="h-4 w-4" aria-hidden />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Remover etapa ${index + 1}`}
                                onClick={() =>
                                  setSteps((prev) => prev.filter((_, i) => i !== index))
                                }
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </div>
                            <Input
                              value={step.hint ?? ""}
                              maxLength={SOP_HINT_MAX}
                              aria-label={`Dica da etapa ${index + 1}`}
                              placeholder="Dica opcional"
                              onChange={(e) => updateStep(index, { hint: e.target.value })}
                            />
                            {issue && <p className="text-xs text-destructive">{issue}</p>}
                          </div>
                        );
                      })}
                </div>

                <p className="text-xs text-muted-foreground">
                  Prévia: {changes.inserted} nova(s), {changes.updated} atualizada(s),{" "}
                  {changes.removed} removida(s)
                  {changes.reordered ? " · ordem alterada" : ""}
                </p>

                <Button
                  onClick={handleSave}
                  disabled={!validation.valid || saveMutation.isPending}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" aria-hidden />
                  {saveMutation.isPending ? "Salvando..." : "Salvar procedimento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </SectionErrorBoundary>
      </PageShell>
    </>
  );
}
