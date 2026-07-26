import { useCallback, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  GripVertical,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ModuleDraftForm } from "./ModuleDraftForm";
import ModuleViewer from "@/components/lms/ModuleViewer";
import {
  CONTENT_TYPE_LABELS,
  diffOrder,
  draftToContent,
  duplicateTitle,
  emptyDraft,
  moduleToDraft,
  reorderModules,
  validateModuleDraft,
  type ModuleContentType,
  type ModuleDraft,
} from "@/lib/trailAuthoring";
import {
  useCreateModule,
  useDeleteModule,
  useReorderModules,
  useUpdateModule,
} from "@/hooks/useTrails";
import type { TrailModule } from "@/services/trailsService";
import { toast } from "sonner";

export interface TrailModuleEditorProps {
  trailId: string;
  modules: TrailModule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditingState =
  | { mode: "closed" }
  | { mode: "create"; draft: ModuleDraft }
  | { mode: "edit"; moduleId: string; draft: ModuleDraft };

/** Builds a throwaway TrailModule so the real player can render the preview. */
function draftToPreviewModule(draft: ModuleDraft, trailId: string): TrailModule {
  return {
    id: "preview",
    trail_id: trailId,
    title: draft.title || "Prévia do módulo",
    description: draft.description ?? null,
    content_type: draft.content_type,
    content: draftToContent(draft),
    video_url: draft.video_url?.trim() || null,
    xp_reward: draft.xp_reward,
    duration_minutes: draft.duration_minutes,
    order_index: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function TrailModuleEditor({
  trailId,
  modules,
  open,
  onOpenChange,
}: TrailModuleEditorProps) {
  const [editing, setEditing] = useState<EditingState>({ mode: "closed" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewDraft, setPreviewDraft] = useState<ModuleDraft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TrailModule | null>(null);

  const createModule = useCreateModule();
  const updateModule = useUpdateModule();
  const deleteModule = useDeleteModule();
  const reorder = useReorderModules();

  const orderedModules = useMemo(
    () => [...modules].sort((a, b) => a.order_index - b.order_index),
    [modules]
  );

  const isSaving = createModule.isPending || updateModule.isPending;

  const applyReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      const next = reorderModules(orderedModules, fromIndex, toIndex);
      const changes = diffOrder(orderedModules, next);
      if (changes.length === 0) return;
      reorder.mutate(changes);
    },
    [orderedModules, reorder]
  );

  const handleDragStart = (event: React.DragEvent<HTMLLIElement>, index: number) => {
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event: React.DragEvent<HTMLLIElement>, index: number) => {
    event.preventDefault();
    const from = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isNaN(from)) return;
    applyReorder(from, index);
  };

  const handleSave = async () => {
    if (editing.mode === "closed") return;

    const result = validateModuleDraft(editing.draft);
    setErrors(result.errors);
    if (!result.valid) {
      toast.error("Revise os campos destacados antes de salvar");
      return;
    }

    const draft = editing.draft;
    const payload = {
      title: draft.title.trim(),
      description: draft.description?.trim() || null,
      content_type: draft.content_type,
      content: draftToContent(draft),
      video_url: draft.content_type === "video" ? draft.video_url?.trim() || null : null,
      xp_reward: draft.xp_reward,
      duration_minutes: draft.duration_minutes,
    };

    try {
      if (editing.mode === "create") {
        await createModule.mutateAsync({
          ...payload,
          trail_id: trailId,
          order_index: orderedModules.length,
        });
        toast.success("Módulo criado com sucesso!");
      } else {
        await updateModule.mutateAsync({ id: editing.moduleId, updates: payload });
        toast.success("Módulo atualizado!");
      }
      setEditing({ mode: "closed" });
      setErrors({});
    } catch {
      // Toast already surfaced by the mutation hooks.
    }
  };

  const handleDuplicate = async (module: TrailModule) => {
    try {
      await createModule.mutateAsync({
        trail_id: trailId,
        title: duplicateTitle(module.title),
        description: module.description,
        content_type: module.content_type,
        content: module.content,
        video_url: module.video_url,
        xp_reward: module.xp_reward,
        duration_minutes: module.duration_minutes,
        order_index: orderedModules.length,
      });
      toast.success("Módulo duplicado");
    } catch {
      toast.error("Não foi possível duplicar o módulo");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Editor de módulos</DialogTitle>
            <DialogDescription>
              Crie, edite, duplique e reordene os módulos desta trilha. Arraste pelo punho ou use
              as setas para mudar a ordem.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {orderedModules.length} módulo(s) nesta trilha
            </p>
            <Button
              size="sm"
              onClick={() => {
                setErrors({});
                setEditing({ mode: "create", draft: emptyDraft("text") });
              }}
            >
              <Plus className="h-4 w-4" />
              Novo módulo
            </Button>
          </div>

          <ScrollArea className="max-h-[55vh] pr-3">
            {orderedModules.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
                Nenhum módulo ainda. Comece criando o primeiro conteúdo da trilha.
              </p>
            ) : (
              <ul className="space-y-2">
                {orderedModules.map((module, index) => (
                  <li
                    key={module.id}
                    draggable
                    onDragStart={(event) => handleDragStart(event, index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, index)}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/50 p-3"
                  >
                    <GripVertical
                      className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{module.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {CONTENT_TYPE_LABELS[module.content_type as ModuleContentType] ??
                            module.content_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {module.xp_reward} XP · {module.duration_minutes} min
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Mover ${module.title} para cima`}
                        disabled={index === 0 || reorder.isPending}
                        onClick={() => applyReorder(index, index - 1)}
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Mover ${module.title} para baixo`}
                        disabled={index === orderedModules.length - 1 || reorder.isPending}
                        onClick={() => applyReorder(index, index + 1)}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Duplicar ${module.title}`}
                        onClick={() => handleDuplicate(module)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Editar ${module.title}`}
                        onClick={() => {
                          setErrors({});
                          setEditing({
                            mode: "edit",
                            moduleId: module.id,
                            draft: moduleToDraft(module),
                          });
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="min-h-11 min-w-11"
                        aria-label={`Excluir ${module.title}`}
                        onClick={() => setPendingDelete(module)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create / edit form */}
      <Dialog
        open={editing.mode !== "closed"}
        onOpenChange={(next) => {
          if (!next) {
            setEditing({ mode: "closed" });
            setErrors({});
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing.mode === "edit" ? "Editar módulo" : "Novo módulo"}
            </DialogTitle>
            <DialogDescription>
              Preencha o conteúdo e visualize a prévia exatamente como o aluno verá.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-3">
            {editing.mode !== "closed" && (
              <ModuleDraftForm
                draft={editing.draft}
                errors={errors}
                onChange={(draft) => setEditing({ ...editing, draft })}
              />
            )}
          </ScrollArea>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (editing.mode === "closed") return;
                setPreviewDraft(editing.draft);
              }}
            >
              <Eye className="h-4 w-4" />
              Pré-visualizar
            </Button>
            <Button type="button" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
              {isSaving ? "Salvando..." : "Salvar módulo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewDraft && (
        <ModuleViewer
          module={draftToPreviewModule(previewDraft, trailId)}
          onComplete={() => setPreviewDraft(null)}
          onClose={() => setPreviewDraft(null)}
        />
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(next) => !next && setPendingDelete(null)}
        title="Excluir módulo"
        description={`O módulo "${pendingDelete?.title ?? ""}" e o progresso registrado nele serão removidos permanentemente.`}
        confirmText="Excluir"
        variant="destructive"
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteModule.mutateAsync(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}

export default TrailModuleEditor;