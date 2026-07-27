import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Coins, Info, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  emptyWarDraft,
  reviewWarDraft,
  type WarConfigDraft,
} from "@/lib/departmentWarConfig";
import {
  useCreateDepartmentWar,
  useWarDepartmentOptions,
} from "@/hooks/useDepartmentWars";
import { cn } from "@/lib/utils";

export interface DepartmentWarConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (warId: string) => void;
}

/** Metricas sugeridas — cobrem as dimensoes ja rastreadas pelo sistema. */
const METRIC_PRESETS: { metric_key: string; label: string; weight: number }[] = [
  { metric_key: "tarefa_concluida", label: "Tarefa concluída", weight: 10 },
  { metric_key: "tarefa_no_prazo", label: "Tarefa entregue no prazo", weight: 5 },
  { metric_key: "checkin_pontual", label: "Check-in pontual", weight: 3 },
  { metric_key: "trilha_concluida", label: "Trilha de aprendizagem concluída", weight: 20 },
  { metric_key: "quiz_acertado", label: "Quiz respondido corretamente", weight: 2 },
  { metric_key: "feedback_enviado", label: "Feedback enviado", weight: 4 },
];

/** Converte ISO -> valor aceito por <input type="datetime-local"> no fuso local. */
function toLocalInput(iso: string): string {
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return "";
  const local = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): string {
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? new Date(ms).toISOString() : "";
}

export function DepartmentWarConfigDialog({
  open,
  onOpenChange,
  onCreated,
}: DepartmentWarConfigDialogProps) {
  const [draft, setDraft] = useState<WarConfigDraft>(() => emptyWarDraft());
  const { data: options, isLoading: loadingOptions } = useWarDepartmentOptions(open);
  const createMutation = useCreateDepartmentWar();

  // Reabrir o diálogo sempre parte de um rascunho limpo.
  useEffect(() => {
    if (open) setDraft(emptyWarDraft());
  }, [open]);

  const review = useMemo(() => reviewWarDraft(draft), [draft]);
  const errors = review.issues.filter((issue) => issue.level === "error");
  const warnings = review.issues.filter((issue) => issue.level === "warning");

  const patch = (changes: Partial<WarConfigDraft>) =>
    setDraft((current) => ({ ...current, ...changes }));

  const toggleDepartment = (id: string, name: string, checked: boolean) => {
    setDraft((current) => ({
      ...current,
      departments: checked
        ? [...current.departments, { department_id: id, name, headcount: 0 }]
        : current.departments.filter((dept) => dept.department_id !== id),
    }));
  };

  const toggleMetric = (preset: (typeof METRIC_PRESETS)[number], checked: boolean) => {
    setDraft((current) => ({
      ...current,
      metrics: checked
        ? [...current.metrics, { ...preset }]
        : current.metrics.filter((metric) => metric.metric_key !== preset.metric_key),
    }));
  };

  const setMetricWeight = (metricKey: string, weight: number) => {
    setDraft((current) => ({
      ...current,
      metrics: current.metrics.map((metric) =>
        metric.metric_key === metricKey ? { ...metric, weight } : metric,
      ),
    }));
  };

  const setShare = (index: number, value: number) => {
    setDraft((current) => ({
      ...current,
      placement_shares: current.placement_shares.map((share, i) =>
        i === index ? value : share,
      ),
    }));
  };

  const handleSubmit = async () => {
    if (!review.valid) return;
    try {
      const result = await createMutation.mutateAsync(draft);
      if (!result.success) {
        toast.error(result.reason ?? "Não foi possível criar a guerra.");
        return;
      }
      toast.success("Guerra criada como rascunho. Revise e inicie quando quiser.");
      onCreated?.(result.war_id as string);
      onOpenChange(false);
    } catch {
      toast.error("Falha inesperada ao criar a guerra.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nova Guerra de Departamentos</DialogTitle>
          <DialogDescription>
            Configure a disputa. O custo máximo é projetado em tempo real antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Identificação */}
            <section className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="war-title">Título</Label>
                <Input
                  id="war-title"
                  value={draft.title}
                  maxLength={120}
                  placeholder="Ex.: Guerra de Outubro"
                  onChange={(e) => patch({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="war-description">Descrição</Label>
                <Textarea
                  id="war-description"
                  value={draft.description}
                  maxLength={1000}
                  rows={2}
                  placeholder="Como as áreas pontuam e o que está em jogo."
                  onChange={(e) => patch({ description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="war-start">Início</Label>
                  <Input
                    id="war-start"
                    type="datetime-local"
                    value={toLocalInput(draft.starts_at)}
                    onChange={(e) => patch({ starts_at: fromLocalInput(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="war-end">Término</Label>
                  <Input
                    id="war-end"
                    type="datetime-local"
                    value={toLocalInput(draft.ends_at)}
                    onChange={(e) => patch({ ends_at: fromLocalInput(e.target.value) })}
                  />
                </div>
              </div>
            </section>

            {/* Departamentos */}
            <section className="space-y-2">
              <Label>Departamentos na disputa</Label>
              {loadingOptions ? (
                <p className="text-sm text-muted-foreground">Carregando departamentos…</p>
              ) : !options || options.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum departamento cadastrado.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {options.map((option) => {
                    const checked = draft.departments.some(
                      (dept) => dept.department_id === option.id,
                    );
                    return (
                      <label
                        key={option.id}
                        className="flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) =>
                            toggleDepartment(option.id, option.name, value === true)
                          }
                        />
                        <span>{option.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                O efetivo real de cada área é sincronizado automaticamente pelo sistema.
              </p>
            </section>

            {/* Métricas */}
            <section className="space-y-2">
              <Label>Métricas que pontuam</Label>
              <div className="space-y-2">
                {METRIC_PRESETS.map((preset) => {
                  const selected = draft.metrics.find(
                    (metric) => metric.metric_key === preset.metric_key,
                  );
                  return (
                    <div
                      key={preset.metric_key}
                      className="flex min-h-[44px] items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
                    >
                      <Checkbox
                        checked={!!selected}
                        onCheckedChange={(value) => toggleMetric(preset, value === true)}
                      />
                      <span className="flex-1 text-sm">{preset.label}</span>
                      {selected ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={1000}
                            className="h-9 w-20"
                            value={selected.weight}
                            onChange={(e) =>
                              setMetricWeight(preset.metric_key, Number(e.target.value))
                            }
                          />
                          <span className="text-xs text-muted-foreground">pts</span>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Equilíbrio */}
            <section className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Fator de equilíbrio entre áreas</Label>
                  <Badge variant="secondary">{draft.fairness_alpha.toFixed(2)}</Badge>
                </div>
                <Slider
                  value={[draft.fairness_alpha]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([value]) => patch({ fairness_alpha: value })}
                />
                <p className="text-xs text-muted-foreground">
                  0 favorece áreas grandes · 0,5 equilibra · 1 favorece áreas pequenas.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Bônus por adesão</Label>
                  <Badge variant="secondary">
                    +{Math.round(draft.participation_bonus * 100)}%
                  </Badge>
                </div>
                <Slider
                  value={[draft.participation_bonus]}
                  min={0}
                  max={1}
                  step={0.05}
                  onValueChange={([value]) => patch({ participation_bonus: value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="war-cap">Teto de pontos por pessoa (0 = sem teto)</Label>
                <Input
                  id="war-cap"
                  type="number"
                  min={0}
                  value={draft.per_user_cap}
                  onChange={(e) => patch({ per_user_cap: Number(e.target.value) })}
                />
              </div>
            </section>

            {/* Premiação */}
            <section className="space-y-3">
              <Label>Premiação</Label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="war-coins" className="text-xs text-muted-foreground">
                    Moedas totais
                  </Label>
                  <Input
                    id="war-coins"
                    type="number"
                    min={0}
                    value={draft.coins_pool}
                    onChange={(e) => patch({ coins_pool: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="war-xp" className="text-xs text-muted-foreground">
                    XP total
                  </Label>
                  <Input
                    id="war-xp"
                    type="number"
                    min={0}
                    value={draft.xp_pool}
                    onChange={(e) => patch({ xp_pool: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="war-member-cap" className="text-xs text-muted-foreground">
                    Teto por colaborador
                  </Label>
                  <Input
                    id="war-member-cap"
                    type="number"
                    min={0}
                    value={draft.per_member_coins_cap}
                    onChange={(e) => patch({ per_member_coins_cap: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  Fatia do prêmio por colocação
                </Label>
                {draft.placement_shares.map((share, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="w-16 text-sm text-muted-foreground">{index + 1}º lugar</span>
                    <Slider
                      className="flex-1"
                      value={[share]}
                      min={0}
                      max={1}
                      step={0.05}
                      onValueChange={([value]) => setShare(index, value)}
                    />
                    <span className="w-12 text-right text-sm">
                      {Math.round(share * 100)}%
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${index + 1}º lugar`}
                      onClick={() =>
                        patch({
                          placement_shares: draft.placement_shares.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {draft.placement_shares.length < 10 ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      patch({ placement_shares: [...draft.placement_shares, 0.1] })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar colocação
                  </Button>
                ) : null}
              </div>
            </section>

            {/* Projeção de custo */}
            <section className="rounded-lg border border-primary/30 bg-primary/5 p-4">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Coins className="h-4 w-4 text-primary" /> Custo máximo projetado
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Moedas</p>
                  <p className="font-semibold">
                    {review.projection.coins_worst_case.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">XP</p>
                  <p className="font-semibold">
                    {review.projection.xp_worst_case.toLocaleString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Colaboradores</p>
                  <p className="font-semibold">{review.projection.reached_members}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Máx. por pessoa</p>
                  <p className="font-semibold">
                    {review.projection.max_coins_per_member.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </section>

            {/* Pareceres */}
            {review.issues.length > 0 ? (
              <section className="space-y-2">
                {[...errors, ...warnings].map((issue, index) => (
                  <p
                    key={`${issue.field}-${index}`}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                      issue.level === "error"
                        ? "border-destructive/40 bg-destructive/10 text-destructive"
                        : "border-border/60 bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {issue.level === "error" ? (
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <span>{issue.message}</span>
                  </p>
                ))}
              </section>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!review.valid || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Criar rascunho
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
