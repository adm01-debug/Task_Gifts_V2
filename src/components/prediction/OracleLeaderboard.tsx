import { useMemo } from "react";
import { Award, Info, TrendingDown, TrendingUp } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOracleAggregates } from "@/hooks/usePredictionMarkets";
import { useProfilesPublic } from "@/hooks/useProfilesPublic";
import {
  formatOracleScore,
  rankOracleAggregates,
  TIER_LABEL,
  type OracleEntry,
  type OracleTier,
} from "@/lib/predictionOracle";
import { cn } from "@/lib/utils";

const TIER_STYLE: Record<OracleTier, string> = {
  oracle: "border-primary/60 bg-primary/10 text-primary",
  analyst: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  apprentice: "border-border bg-muted text-muted-foreground",
  contrarian: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

const MEDAL = ["🥇", "🥈", "🥉"];

export interface OracleLeaderboardProps {
  limit?: number;
  className?: string;
}

interface RowProps {
  entry: OracleEntry;
  name: string;
  avatarUrl: string | null;
}

function OracleRow({ entry, name, avatarUrl }: RowProps) {
  const positive = entry.score >= 0;
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border/60 p-3">
      <span className="w-7 shrink-0 text-center text-sm font-semibold tabular-nums">
        {MEDAL[entry.rank - 1] ?? entry.rank}
      </span>

      <Avatar className="h-9 w-9 shrink-0">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="text-xs text-muted-foreground">
          {entry.markets} mercados · {Math.round(entry.hitRate * 100)}% de acerto
        </p>
      </div>

      <div className="shrink-0 text-right">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
            positive ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
          )}
        >
          {positive ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
          )}
          {formatOracleScore(entry.score)}
        </span>
        <Badge
          variant="outline"
          className={cn("mt-1 block text-[0.65rem]", TIER_STYLE[entry.tier])}
        >
          {TIER_LABEL[entry.tier]}
        </Badge>
      </div>
    </li>
  );
}

/**
 * Ranking dos melhores previsores.
 *
 * A pontuação NÃO é taxa de acerto: mede o quanto a pessoa superou o consenso
 * do mercado. Acertar o favorito óbvio rende quase nada; acertar contra a
 * maioria rende muito. É o que impede o ranking de premiar conformismo.
 */
export function OracleLeaderboard({ limit = 10, className }: OracleLeaderboardProps) {
  const { data: aggregates, isLoading } = useOracleAggregates();

  const ranking = useMemo(
    () => rankOracleAggregates(aggregates ?? []).slice(0, limit),
    [aggregates, limit],
  );

  const { data: profiles } = useProfilesPublic(ranking.map((entry) => entry.userId));

  const profileById = useMemo(() => {
    const map = new Map<string, { display_name: string | null; avatar_url: string | null }>();
    for (const profile of profiles ?? []) map.set(profile.id, profile);
    return map;
  }, [profiles]);

  return (
    <Card className={cn("border-border/60 bg-card/80 backdrop-blur", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Award className="h-4 w-4 text-primary" aria-hidden />
          Ranking Oráculo
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                type="button"
                aria-label="Como a pontuação é calculada"
                className="rounded-full text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Info className="h-3.5 w-3.5" aria-hidden />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                A pontuação mede o quanto você supera o consenso do mercado, não
                quantas vezes acerta. Apostar sempre no favorito rende quase
                nada; acertar contra a maioria vale muito.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : ranking.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
            Ainda não há mercados apurados suficientes para formar o ranking.
            Participe das previsões para aparecer aqui.
          </p>
        ) : (
          <ul className="space-y-2">
            {ranking.map((entry) => {
              const profile = profileById.get(entry.userId);
              return (
                <OracleRow
                  key={entry.userId}
                  entry={entry}
                  name={profile?.display_name ?? "Participante"}
                  avatarUrl={profile?.avatar_url ?? null}
                />
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}