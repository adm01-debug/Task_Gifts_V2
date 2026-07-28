import { useState } from "react";
import { AlertTriangle, BarChart3, Clock, Coins, Target, Trophy, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSequenceProcedureStats } from "@/hooks/useSequenceGame";
import { formatDuration, weakestSteps } from "@/lib/sequenceProcedureStats";

export interface SequenceProcedureStatsCardProps {
  procedureId: string | null;
  className?: string;
}

const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
] as const;

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/40 p-3">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

/** Ranking, diagnóstico por etapa e histórico do procedimento selecionado. */
export function SequenceProcedureStatsCard({
  procedureId,
  className,
}: SequenceProcedureStatsCardProps) {
  const [days, setDays] = useState<string>("30");
  const { data, isLoading, isError } = useSequenceProcedureStats(procedureId, Number(days));

  if (!procedureId) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Selecione um procedimento para ver o desempenho da equipe.
        </CardContent>
      </Card>
    );
  }

  const weak = data ? weakestSteps(data.steps) : [];

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="h-4 w-4 text-primary" aria-hidden />
          Desempenho do procedimento
        </CardTitle>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[170px]" aria-label="Período do relatório">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-5">
        {isLoading && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
        )}

        {isError && (
          <p className="text-sm text-destructive">
            Não foi possível carregar o relatório. Tente novamente em instantes.
          </p>
        )}

        {data && !isLoading && (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric icon={Target} label="Tentativas" value={String(data.summary.attempts)} />
              <Metric icon={Users} label="Participantes" value={String(data.summary.players)} />
              <Metric
                icon={Trophy}
                label="Acertos perfeitos"
                value={`${data.summary.perfectAttempts} (${data.summary.perfectRate}%)`}
              />
              <Metric
                icon={Clock}
                label="Tempo médio"
                value={formatDuration(data.summary.avgDurationMs)}
              />
            </div>

            {data.summary.attempts === 0 ? (
              <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                Ainda não há tentativas neste período.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5" aria-hidden />
                    {data.summary.coinsAwarded} moedas · {data.summary.xpAwarded} XP distribuídos
                  </span>
                  <span>Precisão média: {data.summary.avgAccuracy}%</span>
                </div>

                {weak.length > 0 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-4 w-4" aria-hidden />
                      Etapas que mais confundem
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-foreground">
                      {weak.map((step) => (
                        <li key={step.stepId} className="flex items-center justify-between gap-3">
                          <span className="truncate">
                            {step.position}. {step.label}
                          </span>
                          <span className="shrink-0 tabular-nums text-muted-foreground">
                            {step.accuracy}% de acerto
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Acerto por etapa</p>
                  {data.steps.map((step) => (
                    <div key={step.stepId} className="space-y-1">
                      <div className="flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-muted-foreground">
                          {step.position}. {step.label}
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {step.noSample ? "sem amostra" : `${step.accuracy}%`}
                        </span>
                      </div>
                      <Progress value={step.accuracy} className="h-1.5" />
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Ranking do período</p>
                  {data.leaderboard.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum participante ainda.</p>
                  ) : (
                    data.leaderboard.map((leader, index) => (
                      <div
                        key={leader.userId}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <Badge variant="outline" className="shrink-0 tabular-nums">
                            {index + 1}
                          </Badge>
                          <span className="truncate text-sm">{leader.displayName}</span>
                        </div>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {leader.perfectAttempts} perfeitas · {leader.bestAccuracy}% ·{" "}
                          {formatDuration(leader.bestDurationMs)}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Últimas tentativas</p>
                  {data.recent.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="flex items-center justify-between gap-3 text-xs text-muted-foreground"
                    >
                      <span className="truncate">{attempt.displayName}</span>
                      <span className="shrink-0 tabular-nums">
                        {attempt.correctPositions}/{attempt.stepsTotal} ·{" "}
                        {formatDuration(attempt.durationMs)}
                        {attempt.isPerfect ? " · perfeita" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SequenceProcedureStatsCard;