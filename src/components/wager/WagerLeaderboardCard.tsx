import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWagerLeaderboard } from "@/hooks/useDailyWager";
import {
  formatNet,
  summarizeLeaderboard,
  windowLabel,
  type WagerLeaderboardWindow,
} from "@/lib/wagerLeaderboard";
import { cn } from "@/lib/utils";

const WINDOWS: WagerLeaderboardWindow[] = [7, 30, 90];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export interface WagerLeaderboardCardProps {
  className?: string;
  limit?: number;
}

/** Ranking de apostadores com filtro de período e destaque de sequências. */
export function WagerLeaderboardCard({ className, limit = 20 }: WagerLeaderboardCardProps) {
  const [days, setDays] = useState<WagerLeaderboardWindow>(7);
  const { data, isLoading } = useWagerLeaderboard(days, limit);

  const rows = useMemo(() => data ?? [], [data]);
  const summary = useMemo(() => summarizeLeaderboard(rows), [rows]);

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="pb-3 space-y-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Trophy className="h-4 w-4 text-primary" />
          Ranking de apostadores
        </CardTitle>
        <div className="flex flex-wrap gap-2">
          {WINDOWS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={days === value ? "default" : "outline"}
              onClick={() => setDays(value)}
              className="min-h-[36px]"
            >
              {windowLabel(value)}
            </Button>
          ))}
        </div>
        {!isLoading && rows.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {summary.players} participantes · {summary.entries} apostas · {summary.accuracy}% de
            acerto · maior sequência {summary.topStreak}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {isLoading ? (
          [0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12 w-full" />)
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma aposta registrada nos últimos {windowLabel(days)}.
          </p>
        ) : (
          rows.map((row, index) => (
            <motion.div
              key={row.userId}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index, 8) * 0.03 }}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                row.rank <= 3 ? "border-primary/40 bg-primary/5" : "border-border bg-card",
              )}
            >
              <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">
                {row.rank <= 3 ? <Medal className="h-4 w-4 mx-auto text-primary" /> : row.rank}
              </span>
              <Avatar className="h-9 w-9 shrink-0">
                {row.avatarUrl && <AvatarImage src={row.avatarUrl} alt={row.displayName} />}
                <AvatarFallback>{initials(row.displayName) || "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{row.displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {row.correctCount}/{row.entries} acertos · {row.accuracy}%
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={cn(
                    "text-sm font-bold",
                    row.netCoins > 0
                      ? "text-success"
                      : row.netCoins < 0
                        ? "text-destructive"
                        : "text-muted-foreground",
                  )}
                >
                  {formatNet(row.netCoins)}
                </p>
                {row.currentStreak > 1 && (
                  <Badge variant="secondary" className="mt-1 gap-1">
                    <Flame className="h-3 w-3 text-primary" />
                    {row.currentStreak}
                  </Badge>
                )}
              </div>
            </motion.div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default WagerLeaderboardCard;