import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Bookmark,
  BookmarkPlus,
  RefreshCw,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useDeleteSavedFilter,
  useSaveSavedFilter,
  useSavedFilters,
  useSetDefaultSavedFilter,
} from "@/hooks/useSavedFilters";
import { logger } from "@/services/loggingService";
import type { SavedFilterPayload } from "@/services/savedFiltersService";

interface SavedFiltersBarProps {
  /** Entidade dona dos filtros (`saved_filters.entity_type`). */
  entityType: string;
  /** Rotulo humano da entidade, usado nas mensagens. */
  entityLabel: string;
  /** Valores atuais da barra de filtros da pagina. */
  currentFilters: SavedFilterPayload;
  /** Aplica um filtro salvo ao estado da pagina. */
  onApply: (filters: SavedFilterPayload) => void;
}

/**
 * Filtros salvos da pagina. Le e escreve `saved_filters`, que ja' existe em
 * producao com as 4 policies de dono e o gatilho de padrao unico.
 *
 * O filtro marcado como padrao e' aplicado sozinho na primeira renderizacao -
 * e' a regra documentada na coluna `is_default`. Depois disso a pagina nao e'
 * mais sobrescrita, para que o usuario possa navegar sem perder o ajuste manual.
 */
export function SavedFiltersBar({
  entityType,
  entityLabel,
  currentFilters,
  onApply,
}: SavedFiltersBarProps) {
  const { data: filters = [], isLoading, isError, refetch } = useSavedFilters(entityType);
  const save = useSaveSavedFilter(entityType);
  const setDefault = useSetDefaultSavedFilter(entityType);
  const remove = useDeleteSavedFilter(entityType);

  const [selectedId, setSelectedId] = useState<string>("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);

  const selected = filters.find((f) => f.id === selectedId);

  // `onApply` e' recriado pela pagina a cada render; guardar em ref evita
  // reaplicar o padrao em loop.
  const applyRef = useRef(onApply);
  const currentRef = useRef(currentFilters);

  useEffect(() => {
    applyRef.current = onApply;
    currentRef.current = currentFilters;
  }, [onApply, currentFilters]);

  // So' na primeira lista carregada o padrao e' aplicado. Depois disso a
  // pagina nao e' mais sobrescrita: marcar outro filtro como padrao, por
  // exemplo, nao muda a busca que o usuario esta vendo.
  const primeiraCarga = useRef(false);
  useEffect(() => {
    if (primeiraCarga.current || isLoading) return;
    primeiraCarga.current = true;
    const padrao = filters.find((f) => f.is_default);
    if (!padrao) return;
    setSelectedId(padrao.id);
    applyRef.current((padrao.filters ?? {}) as SavedFilterPayload);
  }, [filters, isLoading]);

  const aplicar = (id: string) => {
    const alvo = filters.find((f) => f.id === id);
    if (!alvo) return;
    setSelectedId(id);
    applyRef.current((alvo.filters ?? {}) as SavedFilterPayload);
    toast.success(`Filtro "${alvo.name}" aplicado`);
  };

  const salvar = async () => {
    const limpo = name.trim();
    if (!limpo) {
      toast.error("Dê um nome ao filtro");
      return;
    }
    try {
      const salvo = await save.mutateAsync({
        name: limpo,
        filters: currentRef.current,
        isDefault: makeDefault,
      });
      setSelectedId(salvo.id);
      setSaveOpen(false);
      setName("");
      setMakeDefault(false);
      toast.success(
        makeDefault
          ? `"${limpo}" salvo e aplicado ao abrir ${entityLabel}`
          : `"${limpo}" salvo`,
      );
    } catch (err: unknown) {
      logger.error("Falha ao salvar filtro", String(err));
      toast.error(
        String(err).includes("duplicate")
          ? "Já existe um filtro com esse nome"
          : "Não foi possível salvar o filtro",
      );
    }
  };

  const alternarPadrao = async () => {
    if (!selected) return;
    try {
      const virarPadrao = !selected.is_default;
      await setDefault.mutateAsync({ id: selected.id, isDefault: virarPadrao });
      toast.success(
        virarPadrao
          ? `"${selected.name}" passa a ser aplicado ao abrir ${entityLabel}`
          : `"${selected.name}" não é mais aplicado automaticamente`,
      );
    } catch (err: unknown) {
      logger.error("Falha ao definir filtro padrao", String(err));
      toast.error("Não foi possível alterar o filtro padrão");
    }
  };

  const excluir = async () => {
    if (!selected) return;
    const alvo = selected;
    try {
      await remove.mutateAsync(alvo.id);
      setDeleteOpen(false);
      setSelectedId("");
      toast.success(`Filtro "${alvo.name}" excluído`);
    } catch (err: unknown) {
      logger.error("Falha ao excluir filtro", String(err));
      toast.error("Não foi possível excluir o filtro");
    }
  };

  if (isLoading) return <Skeleton className="h-11 w-full" />;

  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-3"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" aria-hidden />
          <p className="text-xs text-muted-foreground">
            Não foi possível carregar seus filtros salvos. Os filtros da página continuam
            funcionando, mas nada pode ser salvo agora.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="mr-1 h-3 w-3" aria-hidden />
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card/40 p-3 md:flex-row md:items-center">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Bookmark className="h-4 w-4 text-primary" aria-hidden />
        <span className="whitespace-nowrap">Filtros salvos</span>
      </div>

      {filters.length === 0 ? (
        <p className="flex-1 text-xs text-muted-foreground">
          Nenhum filtro salvo em {entityLabel}. Ajuste os filtros e use “Salvar filtro atual”.
        </p>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full md:w-64" aria-label="Filtro salvo">
              <SelectValue placeholder="Selecione um filtro" />
            </SelectTrigger>
            <SelectContent>
              {filters.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.is_default ? `★ ${f.name}` : f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!selected}
            onClick={() => selected && aplicar(selected.id)}
          >
            Aplicar
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!selected || setDefault.isPending}
            onClick={alternarPadrao}
            title={selected?.is_default ? "Deixar de aplicar automaticamente" : "Aplicar automaticamente ao abrir"}
          >
            {selected?.is_default ? (
              <>
                <Star className="mr-1 h-3 w-3 fill-current" aria-hidden />
                Padrão
              </>
            ) : (
              <>
                <StarOff className="mr-1 h-3 w-3" aria-hidden />
                Tornar padrão
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!selected}
            onClick={() => setDeleteOpen(true)}
            title="Excluir filtro salvo"
          >
            <Trash2 className="mr-1 h-3 w-3" aria-hidden />
            Excluir
          </Button>
        </div>
      )}

      <Button type="button" variant="outline" size="sm" onClick={() => setSaveOpen(true)}>
        <BookmarkPlus className="mr-1 h-3 w-3" aria-hidden />
        Salvar filtro atual
      </Button>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Salvar filtro</DialogTitle>
            <DialogDescription>
              O filtro guarda exatamente o que está selecionado agora em {entityLabel}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="saved-filter-name">Nome</Label>
              <Input
                id="saved-filter-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Só exclusões da semana"
                maxLength={80}
              />
              <p className="text-[11px] text-muted-foreground">
                Salvar com um nome já usado atualiza aquele filtro.
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/40 p-3">
              <div>
                <Label htmlFor="saved-filter-default" className="text-sm font-medium">
                  Aplicar ao abrir {entityLabel}
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Só um filtro é aplicado automaticamente por página.
                </p>
              </div>
              <Switch
                id="saved-filter-default"
                checked={makeDefault}
                onCheckedChange={setMakeDefault}
                aria-label="Aplicar ao abrir a página"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={salvar} disabled={save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir filtro salvo?</AlertDialogTitle>
            <AlertDialogDescription>
              “{selected?.name}” será removido da sua lista. Os dados da página não são afetados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={excluir}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default SavedFiltersBar;