import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Dices, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { BoardTileRow } from "@/components/board/BoardTileRow";
import { BoardStuckPlayersPanel } from "@/components/board/BoardStuckPlayersPanel";
import {
  useAdminBoardTrails,
  useBoardTrail,
  useDeleteBoardTrail,
  useSaveBoardTrail,
} from "@/hooks/useBoardTrail";
import { useDepartments } from "@/hooks/useDepartments";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import {
  BOARD_MAX_MOVES_PER_DAY,
  createStarterTiles,
  draftsToTiles,
  simulateBoardEconomics,
  tilesToDrafts,
  validateTrailDraft,
  type TileDraft,
  type TrailDraft,
} from "@/lib/boardTrailAuthoring";
import { BOARD_MAX_TILES } from "@/lib/boardTrail";
import { getErrorMessage } from "@/lib/errorMessages";

const NEW_TRAIL = "__new__";
const NO_DEPARTMENT = "__none__";

const EMPTY_TRAIL: TrailDraft = {
  title: "",
  description: "",
  departmentId: null,
  status: "draft",
  maxMovesPerDay: 3,
};

export default function BoardTrailAdminPage() {
  const { data: trails, isLoading } = useAdminBoardTrails();
  const { data: departments } = useDepartments();
  const { data: questions } = useQuizQuestions({ is_active: true });
  const [selectedId, setSelectedId] = useState<string>(NEW_TRAIL);
  const { data: persisted, isLoading: loadingTrail } = useBoardTrail(
    selectedId === NEW_TRAIL ? null : selectedId,
  );
  const saveMutation = useSaveBoardTrail();
  const deleteMutation = useDeleteBoardTrail();

  const [draft, setDraft] = useState<TrailDraft>(EMPTY_TRAIL);
  const [tiles, setTiles] = useState<TileDraft[]>(createStarterTiles());

  // Recarrega o formulário sempre que a seleção muda.
  useEffect(() => {
    if (selectedId === NEW_TRAIL) {
      setDraft(EMPTY_TRAIL);
      setTiles(createStarterTiles());
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId === NEW_TRAIL || !persisted) return;
    setDraft({
      title: persisted.title,
      description: persisted.description ?? "",
      departmentId: persisted.department_id,
      status: persisted.status,
      maxMovesPerDay: persisted.max_moves_per_day,
    });
    setTiles(persisted.tiles.length ? tilesToDrafts(persisted.tiles) : createStarterTiles());
  }, [selectedId, persisted]);

  const validation = useMemo(() => validateTrailDraft(draft, tiles), [draft, tiles]);
  const economics = useMemo(
    () =>
      validation.valid
        ? simulateBoardEconomics(draftsToTiles(validation.normalizedTiles), 300)
        : null,
    [validation],
  );

  const challenges = useMemo(
    () =>
      (questions ?? []).slice(0, 100).map((question) => ({
        id: question.id,
        label:
          question.question.length > 60
            ? `${question.question.slice(0, 57)}…`
            : question.question,
      })),
    [questions],
  );

  const trailIssues = validation.issues.filter((issue) => issue.scope === "trail");

  const updateTile = (index: number, patch: Partial<TileDraft>) => {
    setTiles((prev) => prev.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)));
  };

  const moveTile = (index: number, direction: -1 | 1) => {
    setTiles((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addTile = () => {
    setTiles((prev) => {
      if (prev.length >= BOARD_MAX_TILES) return prev;
      const newTile: TileDraft = {
        position: prev.length,
        type: "neutral",
        label: "Nova casa",
        coins: null,
        xp: null,
        moveBy: null,
        challengeId: null,
      };
      // Insere antes da Chegada para preservar a invariante do tabuleiro.
      const finishIndex = prev.findIndex((tile) => tile.type === "finish");
      if (finishIndex < 0) return [...prev, newTile];
      return [...prev.slice(0, finishIndex), newTile, ...prev.slice(finishIndex)];
    });
  };

  const handleSave = async () => {
    if (!validation.valid) {
      toast.error("Corrija os erros do tabuleiro antes de salvar.");
      return;
    }
    try {
      const trailId = await saveMutation.mutateAsync({
        trailId: selectedId === NEW_TRAIL ? null : selectedId,
        title: draft.title,
        description: draft.description || null,
        departmentId: draft.departmentId,
        status: draft.status,
        maxMovesPerDay: draft.maxMovesPerDay,
        tiles: validation.normalizedTiles.map((tile) => ({
          tile_type: tile.type,
          label: tile.label,
          coins: tile.coins,
          xp: tile.xp,
          move_by: tile.moveBy,
          challenge_id: tile.challengeId,
        })),
      });
      setSelectedId(trailId);
      toast.success("Trilha salva com sucesso.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (selectedId === NEW_TRAIL) return;
    try {
      await deleteMutation.mutateAsync(selectedId);
      setSelectedId(NEW_TRAIL);
      toast.success("Trilha excluída.");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <PageShell
      title="Trilhas de Tabuleiro"
      subtitle="Monte o tabuleiro, valide as regras e simule o custo antes de publicar."
      backFallback="/admin"
      icon={<Dices className="h-5 w-5" />}
    >
      <SEOHead
        title="Admin — Trilhas de Tabuleiro"
        description="Autoria de trilhas do jogo de tabuleiro com validação e simulação de economia."
      />

      <SectionErrorBoundary sectionName="Autoria de trilhas">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-base">Trilha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedId} onValueChange={setSelectedId}>
                  <SelectTrigger aria-label="Selecionar trilha">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NEW_TRAIL}>+ Nova trilha</SelectItem>
                    {(trails ?? []).map((trail) => (
                      <SelectItem key={trail.id} value={trail.id}>
                        {trail.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="space-y-1">
                <Label htmlFor="trail-title">Título</Label>
                <Input
                  id="trail-title"
                  value={draft.title}
                  onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Ex.: Trilha de Onboarding"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="trail-description">Descrição</Label>
                <Textarea
                  id="trail-description"
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, description: event.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <Label>Departamento</Label>
                <Select
                  value={draft.departmentId ?? NO_DEPARTMENT}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      departmentId: value === NO_DEPARTMENT ? null : value,
                    }))
                  }
                >
                  <SelectTrigger aria-label="Departamento">
                    <SelectValue placeholder="Todos" />
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) =>
                      setDraft((prev) => ({ ...prev, status: value as TrailDraft["status"] }))
                    }
                  >
                    <SelectTrigger aria-label="Status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="archived">Arquivada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="trail-moves">Jogadas/dia</Label>
                  <Input
                    id="trail-moves"
                    type="number"
                    min={1}
                    max={BOARD_MAX_MOVES_PER_DAY}
                    value={draft.maxMovesPerDay}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        maxMovesPerDay: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              {trailIssues.length > 0 && (
                <ul className="space-y-1 text-xs">
                  {trailIssues.map((issue, index) => (
                    <li
                      key={`${issue.severity}-${index}`}
                      className={
                        issue.severity === "error" ? "text-destructive" : "text-muted-foreground"
                      }
                    >
                      {issue.message}
                    </li>
                  ))}
                </ul>
              )}

              {economics && (
                <div className="space-y-1 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
                  <p className="font-medium text-foreground">
                    Simulação de {economics.runs} partidas
                  </p>
                  <p className="text-muted-foreground">
                    Conclusão: {economics.completedRuns}/{economics.runs} · média de{" "}
                    {economics.avgMoves} jogadas
                  </p>
                  <p className="text-muted-foreground">
                    Custo médio: {economics.avgCoins} moedas e {economics.avgXp} XP por jogador
                    (pico de {economics.maxCoins} moedas)
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={handleSave}
                  disabled={!validation.valid || saveMutation.isPending}
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {saveMutation.isPending ? "Salvando..." : "Salvar trilha"}
                </Button>
                {selectedId !== NEW_TRAIL && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    aria-label="Excluir trilha"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">Tabuleiro</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={validation.valid ? "secondary" : "destructive"}>
                  {validation.valid ? "Válido" : `${validation.errors.length} erro(s)`}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addTile}
                  disabled={tiles.length >= BOARD_MAX_TILES}
                >
                  <Plus className="mr-1 h-4 w-4" /> Casa
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {loadingTrail && selectedId !== NEW_TRAIL ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-32 w-full" />
                  ))}
                </div>
              ) : (
                tiles.map((tile, index) => (
                  <BoardTileRow
                    key={tile.id ?? `draft-${index}`}
                    index={index}
                    tile={tile}
                    issues={validation.issues.filter((issue) => issue.scope === `tile:${index}`)}
                    challenges={challenges}
                    canMoveUp={index > 0}
                    canMoveDown={index < tiles.length - 1}
                    canRemove={tiles.length > 1}
                    onChange={(patch) => updateTile(index, patch)}
                    onMove={(direction) => moveTile(index, direction)}
                    onRemove={() => setTiles((prev) => prev.filter((_, i) => i !== index))}
                  />
                ))
              )}

              {!validation.valid && (
                <p className="flex items-center gap-2 text-xs text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Corrija os erros destacados para liberar a publicação.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Desbloqueio de jogadores">
        <div className="mt-4">
          <BoardStuckPlayersPanel
            trailId={selectedId === NEW_TRAIL ? null : selectedId}
            trailTitle={selectedId === NEW_TRAIL ? null : (persisted?.title ?? draft.title)}
          />
        </div>
      </SectionErrorBoundary>
    </PageShell>
  );
}