import { AlertTriangle, BarChart3, CheckCircle2, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoardChallengeStats } from "@/hooks/useBoardTrail";
import {
  buildChallengeReport,
  type ChallengeDifficulty,
  type ChallengeFlag,
} from "@/lib/boardStats";

export interface BoardChallengeReportProps {
  trailId: string;
  /** Só habilite para gestores/admins — a RPC também bloqueia no servidor. */
  enabled?: boolean;
}

const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  "sem-dados": "Sem dados",
  "muito-facil": "Fácil demais",
  equilibrado: "Equilibrado",
  dificil: "Difícil",
  critico: "Crítico",
};

const DIFFICULTY_VARIANT: Record<ChallengeDifficulty, "secondary" | "default" | "destructive" | "outline"> = {
  "sem-dados": "outline",
  "muito-facil": "secondary",
  equilibrado: "default",
  dificil: "secondary",
  critico: "destructive",
};

const FLAG_LABEL: Record<ChallengeFlag, string> = {
  "amostra-insuficiente": "Amostra pequena",
  "revisar-enunciado": "Revisar enunciado",
  "recompensa-baixa-demais": "Aumentar dificuldade ou prêmio",
  "jogadores-travados": "Jogadores travados",
};

export function BoardChallengeReport({ trailId, enabled = true }: BoardChallengeReportProps) {
  const { data, isLoading, error } = useBoardChallengeStats(trailId, enabled);
  const report = buildChallengeReport(data);

  if (!enabled) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
          Calibração dos desafios
        </CardTitle>
        <CardDescription>
          Acerto global de {report.overallAccuracy}% em {report.totalAttempts} tentativas ·{" "}
          {report.blockedPlayers} jogador(es) travado(s).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : error ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Relatório disponível apenas para gestores e administradores.
          </p>
        ) : !report.items.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Esta trilha ainda não possui casas de desafio configuradas.
          </p>
        ) : (
          report.items.map((item) => (
            <div key={`${item.challenge_id}-${item.tile_position}`} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-muted-foreground">Casa {item.tile_position} · </span>
                  {item.question}
                </p>
                <Badge variant={DIFFICULTY_VARIANT[item.difficulty]}>
                  {DIFFICULTY_LABEL[item.difficulty]}
                </Badge>
              </div>

              <Progress
                value={item.accuracyPct}
                className="mt-2"
                aria-label={`Taxa de acerto da casa ${item.tile_position}`}
              />

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" aria-hidden />
                  {item.correct_attempts}/{item.attempts} acertos ({item.accuracyPct}%)
                </span>
                <span>{item.distinct_players} jogador(es)</span>
                {item.blocked_players > 0 && (
                  <span className="inline-flex items-center gap-1 text-destructive">
                    <Lock className="h-3 w-3" aria-hidden />
                    {item.blocked_players} travado(s)
                  </span>
                )}
              </div>

              {item.flags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.flags.map((flag) => (
                    <Badge key={flag} variant="outline" className="gap-1 text-xs">
                      <AlertTriangle className="h-3 w-3" aria-hidden />
                      {FLAG_LABEL[flag]}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}