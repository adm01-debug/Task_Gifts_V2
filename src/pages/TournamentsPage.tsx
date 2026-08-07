import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Coins, Crown, Play, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { TournamentBracketView } from "@/components/tournament/TournamentBracketView";
import { useHaptics } from "@/hooks/useHaptics";
import { useRBAC } from "@/hooks/useRBAC";
import {
  useJoinTournament,
  useReportMatch,
  useStartTournament,
  useTournamentBracket,
  useTournaments,
} from "@/hooks/useTournaments";
import { tournamentProgress } from "@/lib/tournamentBracket";
import type { TournamentStatus } from "@/services/tournamentService";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TournamentStatus, string> = {
  draft: "Rascunho",
  registration: "Inscrições abertas",
  running: "Em andamento",
  finished: "Encerrado",
  cancelled: "Cancelado",
};

const JOIN_ERROR: Record<string, string> = {
  registration_closed: "As inscrições deste torneio já foram encerradas.",
  registration_not_open: "As inscrições ainda não abriram.",
  full: "Todas as vagas deste torneio já foram preenchidas.",
  not_found: "Torneio não encontrado.",
  unauthenticated: "Sua sessão expirou. Entre novamente.",
};

const START_ERROR: Record<string, string> = {
  forbidden: "Apenas administradores podem sortear o chaveamento.",
  invalid_status: "O chaveamento só pode ser sorteado com as inscrições abertas.",
  insufficient_participants: "São necessários pelo menos 2 participantes.",
};

export default function TournamentsPage() {
  const { data: tournaments, isLoading } = useTournaments();
  const { isAdmin } = useRBAC();
  const haptics = useHaptics();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const joinMutation = useJoinTournament();
  const startMutation = useStartTournament();
  const reportMutation = useReportMatch();

  const activeId = useMemo(() => {
    if (selectedId) return selectedId;
    const running = (tournaments || []).find((t) => t.status === "running");
    return running?.id ?? tournaments?.[0]?.id ?? null;
  }, [selectedId, tournaments]);

  const { data: bracket, isLoading: loadingBracket } = useTournamentBracket(activeId ?? undefined);

  const matches = bracket?.matches || [];
  const decided = matches.filter((m) => m.status === "decided" || m.status === "bye").length;
  const progress = tournamentProgress(decided, matches.length);

  const handleJoin = async (id: string) => {
    try {
      const result = await joinMutation.mutateAsync(id);
      if (!result.success) {
        toast.error(JOIN_ERROR[result.reason ?? ""] ?? "Não foi possível concluir a inscrição.");
        return;
      }
      haptics.questCompleted();
      toast.success(result.already_joined ? "Você já está inscrito neste torneio." : "Inscrição confirmada! Boa sorte.");
    } catch {
      toast.error("Falha ao se inscrever no torneio.");
    }
  };

  const handleStart = async (id: string) => {
    try {
      const result = await startMutation.mutateAsync(id);
      if (!result.success) {
        toast.error(START_ERROR[result.reason ?? ""] ?? "Não foi possível sortear o chaveamento.");
        return;
      }
      toast.success(`Chaveamento sorteado com ${result.participants} participantes.`);
    } catch {
      toast.error("Falha ao iniciar o torneio.");
    }
  };

  const handleReport = async (matchId: string, homeScore: number, awayScore: number) => {
    try {
      const result = await reportMutation.mutateAsync({ matchId, homeScore, awayScore });
      if (!result.success) {
        toast.error("Não foi possível registrar o placar.");
        return;
      }
      if (result.already_decided) {
        toast.info("Esta partida já estava decidida.");
        return;
      }
      toast.success(result.finished ? "Torneio encerrado! Recompensas creditadas." : "Placar registrado.");
    } catch {
      toast.error("Falha ao registrar o placar.");
    }
  };

  return (
    <PageShell
      title="Torneio Mata-Mata"
      subtitle="Chaveamento eliminatório: vença suas partidas, avance de fase e dispute o título."
    >
      <SEOHead
        title="Torneio Mata-Mata | Task Gifts"
        description="Dispute torneios eliminatórios com chaveamento por seed, avanço automático e recompensas em moedas e XP."
      />

      <SectionErrorBoundary sectionName="Torneio Mata-Mata">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-[360px] w-full rounded-xl" />
          </div>
        ) : !tournaments || tournaments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <Trophy className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">
                Nenhum torneio disponível no momento. Fique de olho — novas disputas são abertas com frequência.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {tournaments.map((t) => (
                <motion.button
                  key={t.id}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedId(t.id)}
                  aria-pressed={activeId === t.id}
                  className={cn(
                    "min-h-11 rounded-xl border p-4 text-left transition-colors",
                    activeId === t.id ? "border-primary/50 bg-primary/5" : "border-border bg-card hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{t.title}</p>
                    <Badge variant={t.status === "running" ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {STATUS_LABEL[t.status]}
                    </Badge>
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {t.participants}/{t.max_participants} participantes
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Coins className="h-3.5 w-3.5" />
                    Campeão: {t.coins_champion} moedas · {t.xp_champion} XP
                  </p>
                  {t.joined && (
                    <Badge variant="outline" className="mt-2 text-[10px]">Você está inscrito</Badge>
                  )}
                </motion.button>
              ))}
            </div>

            {loadingBracket ? (
              <Skeleton className="h-[360px] w-full rounded-xl" />
            ) : bracket?.success && bracket.tournament ? (
              <Card className="border-primary/20">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Swords className="h-5 w-5 text-primary" />
                        {bracket.tournament.title}
                      </CardTitle>
                      {bracket.tournament.description && (
                        <p className="mt-1 text-sm text-muted-foreground">{bracket.tournament.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {bracket.tournament.status === "registration" && !bracket.joined && (
                        <Button
                          className="min-h-11"
                          disabled={joinMutation.isPending}
                          onClick={() => handleJoin(bracket.tournament!.id)}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          Inscrever-se
                        </Button>
                      )}
                      {isAdmin && bracket.tournament.status === "registration" && (
                        <Button
                          variant="outline"
                          className="min-h-11"
                          disabled={startMutation.isPending}
                          onClick={() => handleStart(bracket.tournament!.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Sortear chaveamento
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Participantes</p>
                      <p className="text-xl font-semibold text-foreground">
                        {(bracket.participants || []).length}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Rodadas</p>
                      <p className="text-xl font-semibold text-foreground">
                        {bracket.tournament.rounds ?? "—"}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Por vitória</p>
                      <p className="flex items-center gap-1.5 text-xl font-semibold text-foreground">
                        <Coins className="h-4 w-4 text-primary" />
                        {bracket.tournament.coins_per_win}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-card p-3">
                      <p className="text-xs text-muted-foreground">Partidas decididas</p>
                      <p className="text-xl font-semibold text-foreground">
                        {decided}/{matches.length}
                      </p>
                    </div>
                  </div>

                  {matches.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Progresso do torneio</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} aria-label="Progresso do torneio" />
                    </div>
                  )}

                  {matches.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      O chaveamento ainda não foi sorteado. Inscreva-se e aguarde o início.
                    </p>
                  ) : (
                    <TournamentBracketView
                      matches={matches}
                      participants={bracket.participants || []}
                      rounds={bracket.tournament.rounds ?? 1}
                      isAdmin={isAdmin}
                      isReporting={reportMutation.isPending}
                      onReport={handleReport}
                    />
                  )}

                  {bracket.tournament.status === "finished" && (
                    <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/5 p-4">
                      <Crown className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium text-foreground">
                        Torneio encerrado — recompensas creditadas automaticamente a todos os participantes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </SectionErrorBoundary>
    </PageShell>
  );
}
