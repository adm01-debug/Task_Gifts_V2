import { useEffect, useMemo, useState } from "react";
import { Layers, Plus, Save, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  useAdminMemoryDecks,
  useDeleteMemoryDeck,
  useMemoryPairs,
  useSaveMemoryDeck,
} from "@/hooks/useMemoryGame";
import {
  diffPairs,
  validateDeckDraft,
  MEMORY_CARD_TEXT_MAX,
  MEMORY_MIN_PAIRS,
  type DeckDraft,
  type PairDraft,
} from "@/lib/memoryDeckAuthoring";

const EMPTY_DRAFT: DeckDraft = { title: "", description: "", departmentId: null, isActive: true };

function blankRows(count: number): PairDraft[] {
  return Array.from({ length: count }, () => ({ term: "", match: "" }));
}

export default function MemoryDeckAdminPage() {
  const { data: decks, isLoading } = useAdminMemoryDecks();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: persistedPairs, isLoading: loadingPairs } = useMemoryPairs(selectedId);
  const saveMutation = useSaveMemoryDeck();
  const deleteMutation = useDeleteMemoryDeck();

  const [draft, setDraft] = useState<DeckDraft>(EMPTY_DRAFT);
  const [rows, setRows] = useState<PairDraft[]>(blankRows(MEMORY_MIN_PAIRS));

  // Carrega o baralho selecionado no formulário sempre que a seleção muda.
  useEffect(() => {
    if (!selectedId) {
      setDraft(EMPTY_DRAFT);
      setRows(blankRows(MEMORY_MIN_PAIRS));
      return;
    }
    const deck = decks?.find((d) => d.id === selectedId);
    if (deck) {
      setDraft({
        title: deck.title,
        description: deck.description ?? "",
        departmentId: deck.department_id,
        isActive: deck.is_active,
      });
    }
  }, [selectedId, decks]);

  useEffect(() => {
    if (!selectedId || !persistedPairs) return;
    setRows(
      persistedPairs.length > 0
        ? persistedPairs.map((p) => ({ id: p.id, term: p.term, match: p.match }))
        : blankRows(MEMORY_MIN_PAIRS),
    );
  }, [selectedId, persistedPairs]);

  const validation = useMemo(() => validateDeckDraft(draft, rows), [draft, rows]);
  const issueFor = (scope: string) => validation.issues.find((i) => i.scope === scope)?.message;
  const deckIssues = validation.issues.filter((i) => i.scope === "deck");

  const updateRow = (index: number, patch: Partial<PairDraft>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    if (!validation.valid) {
      toast.error("Corrija os avisos antes de salvar.");
      return;
    }
    const existing = (persistedPairs ?? []).map((p) => ({
      id: p.id,
      term: p.term,
      match: p.match,
    }));
    const diff = diffPairs(selectedId ? existing : [], validation.normalizedPairs);

    try {
      const id = await saveMutation.mutateAsync({ deckId: selectedId, draft, diff });
      setSelectedId(id);
      toast.success(
        `Baralho salvo · ${diff.toInsert.length} novos, ${diff.toUpdate.length} editados, ${diff.toDeleteIds.length} removidos`,
      );
    } catch {
      toast.error("Não foi possível salvar o baralho.");
    }
  };

  const handleDelete = async (deckId: string) => {
    try {
      await deleteMutation.mutateAsync(deckId);
      if (selectedId === deckId) setSelectedId(null);
      toast.success("Baralho excluído.");
    } catch {
      toast.error("Não foi possível excluir o baralho.");
    }
  };

  return (
    <>
      <SEOHead
        title="Baralhos do Jogo da Memória | Task Gifts"
        description="Cadastre e edite os pares de cada baralho do Jogo da Memória por departamento."
      />
      <PageShell
        title="Baralhos da Memória"
        subtitle="Crie pares de termo e correspondência para treinar conhecimento por departamento."
        icon={<Layers className="h-5 w-5" />}
        backFallback="/memoria"
      >
        <SectionErrorBoundary sectionName="Baralhos da Memória">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="border-border/60 bg-card/70 backdrop-blur lg:col-span-1">
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="text-base">Baralhos</CardTitle>
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
                ) : (decks ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum baralho cadastrado ainda.</p>
                ) : (
                  (decks ?? []).map((deck) => (
                    <div
                      key={deck.id}
                      className={`flex items-center gap-2 rounded-lg border p-2 ${
                        deck.id === selectedId
                          ? "border-primary/50 bg-primary/10"
                          : "border-border/60"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedId(deck.id)}
                        className="flex min-h-[44px] flex-1 flex-col items-start text-left"
                      >
                        <span className="text-sm font-semibold text-foreground">{deck.title}</span>
                        <Badge
                          variant={deck.is_active ? "secondary" : "outline"}
                          className="mt-1 text-[10px]"
                        >
                          {deck.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Excluir baralho ${deck.title}`}
                        onClick={() => handleDelete(deck.id)}
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
                  {selectedId ? "Editar baralho" : "Novo baralho"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="deck-title">Título</Label>
                    <Input
                      id="deck-title"
                      value={draft.title}
                      onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                      placeholder="Ex.: Segurança do Trabalho"
                    />
                  </div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch
                      id="deck-active"
                      checked={draft.isActive}
                      onCheckedChange={(checked) =>
                        setDraft((d) => ({ ...d, isActive: checked }))
                      }
                    />
                    <Label htmlFor="deck-active">Disponível para os jogadores</Label>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="deck-description">Descrição</Label>
                  <Textarea
                    id="deck-description"
                    rows={2}
                    value={draft.description ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                    placeholder="Explique o que o jogador vai parear"
                  />
                </div>

                {deckIssues.length > 0 && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      Ajustes necessários
                    </p>
                    <ul className="mt-1 list-inside list-disc text-sm text-destructive">
                      {deckIssues.map((issue) => (
                        <li key={issue.message}>{issue.message}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Pares ({validation.usablePairs} válidos)</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRows((prev) => [...prev, { term: "", match: "" }])}
                    >
                      <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                      Adicionar par
                    </Button>
                  </div>

                  {selectedId && loadingPairs
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                      ))
                    : rows.map((row, index) => {
                        const issue = issueFor(`pair:${index}`);
                        return (
                          <div key={row.id ?? `row-${index}`} className="space-y-1">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Input
                                value={row.term}
                                maxLength={MEMORY_CARD_TEXT_MAX}
                                aria-label={`Termo do par ${index + 1}`}
                                placeholder="Termo"
                                onChange={(e) => updateRow(index, { term: e.target.value })}
                              />
                              <Input
                                value={row.match}
                                maxLength={MEMORY_CARD_TEXT_MAX}
                                aria-label={`Correspondência do par ${index + 1}`}
                                placeholder="Correspondência"
                                onChange={(e) => updateRow(index, { match: e.target.value })}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Remover par ${index + 1}`}
                                onClick={() =>
                                  setRows((prev) => prev.filter((_, i) => i !== index))
                                }
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                              </Button>
                            </div>
                            {issue && <p className="text-xs text-destructive">{issue}</p>}
                          </div>
                        );
                      })}
                </div>

                <Button
                  onClick={handleSave}
                  disabled={!validation.valid || saveMutation.isPending}
                  className="min-h-[44px] w-full sm:w-auto"
                >
                  <Save className="mr-2 h-4 w-4" aria-hidden />
                  {saveMutation.isPending ? "Salvando..." : "Salvar baralho"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </SectionErrorBoundary>
      </PageShell>
    </>
  );
}