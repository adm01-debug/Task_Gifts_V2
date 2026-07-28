import { useMemo } from "react";
import { History, Timer, Trophy, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, summarizeBossHistory, type BossHistoryInput } from "@/lib/bossHistory";
import { cn } from "@/lib/utils";

export interface BossHistoryCardProps {
  battles: readonly BossHistoryInput[];
  /** Quando informado, restringe a retrospectiva a um departamento. */
  departmentId?: string | null;
  limit?: number;
  className?: string;
}

/**
 * Retrospectiva das batalhas concluídas: taxa de vitória, HP destruído,
 * abate mais rápido e pendências de apuração — tudo derivado do motor puro.
 */
export function BossHistoryCard({
  battles,
  departmentId = null,
  limit = 8,
  className,
}: BossHistoryCardProps) {
  const summary = useMemo(
    () => summarizeBossHistory(battles, { departmentId, limit }),
    [battles, departmentId, limit],
  );

  if (summary.concluded === 0) return null;

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          Hall da Fama
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <MiniStat
            label="Taxa de vitória"
            value={`${Math.round(summary.winRate * 100)}%`}
            hint={`${summary.victories}V · ${summary.defeats}D`}
          />
          <MiniStat
            label="HP destruído (méd.)"
            value={`${Math.round(summary.avgHpDestroyedPct * 100)}%`}
            hint={`${summary.totalHpDestroyed.toLocaleString("pt-BR")} no total`}
          />
          <MiniStat
            label="Abate mais rápido"
            value={formatDuration(summary.fastestKillMs)}
            hint={`média ${formatDuration(summary.avgKillMs)}`}
          />
          <MiniStat
            label="Melhor sequência"
            value={`${summary.longestVictoryStreak}`}
            hint={`atual: ${summary.currentVictoryStreak}`}
          />
        </div>

        {summary.awaitingSettlement > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {summary.awaitingSettlement} vitória(s) ainda sem apuração — as recompensas só são
              creditadas depois de apurar a batalha.
            </span>
          </div>
        )}

        <ul className="divide-y divide-border/60">
          {summary.rows.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{row.title}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Timer className="h-3 w-3" />
                  {row.killDurationMs !== null
                    ? `abatido em ${formatDuration(row.killDurationMs)}`
                    : row.concludedAt
                      ? new Date(row.concludedAt).toLocaleDateString("pt-BR")
                      : "sem data"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular-nums text-xs text-muted-foreground">
                  {Math.round(row.hpDestroyedPct * 100)}% HP
                </span>
                <Badge variant={row.victory ? "default" : "outline"} className="gap-1">
                  {row.victory && <Trophy className="h-3 w-3" />}
                  {row.victory ? (row.settled ? "Apurado" : "Vitória") : "Sobreviveu"}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface MiniStatProps {
  label: string;
  value: string;
  hint?: string;
}

function MiniStat({ label, value, hint }: MiniStatProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/60 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}