import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Coins, Dices, Flag, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { BoardPath } from "@/components/board/BoardPath";
import { BoardChallengeDialog } from "@/components/board/BoardChallengeDialog";
import {
  useAdvanceBoardTrail,
  useBoardPlayerState,
  useBoardTrail,
  useBoardTrails,
} from "@/hooks/useBoardTrail";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { useHaptics } from "@/hooks/useHaptics";
import { boardProgressPercent, buildMoveDedupeKey, normalizeBoard } from "@/lib/boardTrail";
import { getErrorMessage } from "@/lib/errorMessages";

export default function BoardTrailPage() {
  const { user } = useAuth();
  const { hasRole } = useRBAC();
  const haptics = useHaptics();
  const { data: trails, isLoading: loadingTrails } = useBoardTrails();
  const [trailId, setTrailId] = useState<string | null>(null);
  const { data: trail, isLoading: loadingTrail } = useBoardTrail(trailId);
  const { data: playerState } = useBoardPlayerState(trailId);
  const advance = useAdvanceBoardTrail(trailId);

  useEffect(() => {
    if (!trailId && trails?.length) setTrailId(trails[0].id);
  }, [trails, trailId]);

  const tiles = useMemo(() => normalizeBoard(trail?.tiles || []), [trail]);

  const progress = useMemo(
    () =>
      boardProgressPercent(tiles, {
        position: playerState?.position ?? 0,
        coins: playerState?.coins ?? 0,
        xp: playerState?.xp ?? 0,
        checkpoints: playerState?.checkpoints || [],
        finished: Boolean(playerState?.finished_at),
      }),
    [tiles, playerState],
  );

  const handleRoll = useCallback(async () => {
    if (!trailId || !user?.id) return;
    const dedupeKey = buildMoveDedupeKey(trailId, user.id, playerState?.moves_count ?? 0);
    try {
      const result = await advance.mutateAsync(dedupeKey);
      haptics.trigger("medium");
      if (result.replayed) {
        toast.info("Jogada já registrada — nada foi creditado novamente.");
        return;
      }
      if (result.blocked_challenge_id) {
        toast.warning(`Você tirou ${result.roll} e caiu em uma casa de desafio.`);
        return;
      }
      const parts = [`Você tirou ${result.roll}`];
      if (result.coins_delta) parts.push(`${result.coins_delta > 0 ? "+" : ""}${result.coins_delta} moedas`);
      if (result.xp_delta) parts.push(`${result.xp_delta > 0 ? "+" : ""}${result.xp_delta} XP`);
      toast.success(parts.join(" · "));
      if (result.finished) toast.success("Trilha concluída! 🏁");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    }
  }, [trailId, user?.id, playerState?.moves_count, advance, haptics]);

  const blocked = Boolean(playerState?.blocked_challenge_id);
  const finished = Boolean(playerState?.finished_at);

  return (
    <PageShell
      title="Trilha Tabuleiro"
      subtitle="Avance pelas casas, colecione bônus e chegue ao final da trilha."
      backFallback="/"
    >
      <SEOHead
        title="Trilha Tabuleiro | Task Gifts"
        description="Jogue a trilha em formato de tabuleiro e acumule moedas e XP."
      />

      <SectionErrorBoundary sectionName="Trilha Tabuleiro">
        <div className="space-y-4">
          {hasRole("admin") && (
            <Button asChild variant="outline" size="sm">
              <Link to="/tabuleiro/admin">
                <Settings className="mr-2 h-4 w-4" aria-hidden />
                Gerenciar trilhas
              </Link>
            </Button>
          )}
          {loadingTrails ? (
            <Skeleton className="h-10 w-full" />
          ) : trails?.length ? (
            <div className="flex flex-wrap gap-2">
              {trails.map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={item.id === trailId ? "default" : "outline"}
                  onClick={() => setTrailId(item.id)}
                >
                  {item.title}
                </Button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma trilha de tabuleiro ativa no momento.
              </CardContent>
            </Card>
          )}

          {trailId ? (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flag className="h-4 w-4" aria-hidden />
                  {trail?.title || "Trilha"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Coins className="h-3 w-3" aria-hidden />
                    {playerState?.coins ?? 0}
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    {playerState?.xp ?? 0} XP
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Progress value={progress} aria-label="Progresso na trilha" />
                  <p className="text-xs text-muted-foreground">
                    {progress}% concluído · {playerState?.moves_count ?? 0} jogadas
                    {trail ? ` · até ${trail.max_moves_per_day} por dia` : ""}
                  </p>
                </div>

                {loadingTrail ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <BoardPath
                    tiles={tiles}
                    currentPosition={playerState?.position ?? 0}
                    checkpoints={playerState?.checkpoints || []}
                  />
                )}

                <Button
                  className="w-full gap-2"
                  onClick={handleRoll}
                  disabled={advance.isPending || finished || blocked || tiles.length < 5}
                >
                  <Dices className="h-4 w-4" aria-hidden />
                  {finished
                    ? "Trilha concluída"
                    : blocked
                      ? "Conclua o desafio para avançar"
                      : advance.isPending
                        ? "Rolando..."
                        : "Rolar o dado"}
                </Button>

                {blocked && (
                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setChallengeOpen(true)}
                  >
                    Responder desafio
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </SectionErrorBoundary>
    </PageShell>
  );
}