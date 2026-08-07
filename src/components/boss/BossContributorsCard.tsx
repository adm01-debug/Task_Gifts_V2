import { motion } from "framer-motion";
import { Coins, Sparkles, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buildBossLeaderboard, formatShare, rankLabel, type LeaderboardRow } from "@/lib/bossLeaderboard";
import { useBossLeaderboard } from "@/hooks/useBossBattles";
import { useAuth } from "@/hooks/useAuth";

export interface BossContributorsCardProps {
  battleId: string;
  totalDamage: number;
  coinsPool: number;
  xpPool: number;
  minShare?: number;
  perUserCoinsCap?: number;
  /** Batalhas encerradas não precisam de polling. */
  live?: boolean;
  limit?: number;
  className?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function ContributorRow({ row }: { row: LeaderboardRow }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors",
        row.isCurrentUser && "bg-primary/10 ring-1 ring-primary/30",
      )}
    >
      <span className="w-8 shrink-0 text-center text-sm font-semibold tabular-nums text-muted-foreground">
        {rankLabel(row.rank)}
      </span>
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={row.avatarUrl ?? undefined} alt="" />
        <AvatarFallback className="text-xs">{initials(row.displayName) || "?"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {row.displayName}
          {row.isCurrentUser && <span className="ml-1 text-xs text-primary">(você)</span>}
        </p>
        <p className="text-xs text-muted-foreground">
          {row.damage.toLocaleString("pt-BR")} de dano · {row.hits} golpe{row.hits === 1 ? "" : "s"} ·{" "}
          {formatShare(row.share)}
        </p>
      </div>
      {(row.projectedCoins > 0 || row.projectedXp > 0) && (
        <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
          <Badge variant="secondary" className="gap-1 text-[11px]">
            <Coins className="h-3 w-3" />
            {row.projectedCoins.toLocaleString("pt-BR")}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Sparkles className="h-3 w-3" />
            {row.projectedXp.toLocaleString("pt-BR")} XP
          </Badge>
        </div>
      )}
    </li>
  );
}

/**
 * Ranking em tempo real dos contribuintes da batalha, com projeção de prêmio
 * calculada pelo mesmo motor usado na apuração (nada de números divergentes).
 */
export function BossContributorsCard({
  battleId,
  totalDamage,
  coinsPool,
  xpPool,
  minShare,
  perUserCoinsCap,
  live = true,
  limit = 10,
  className,
}: BossContributorsCardProps) {
  const { user } = useAuth();
  const { data, isLoading, isError } = useBossLeaderboard(battleId, Math.max(limit, 20), live);

  const board = buildBossLeaderboard(data ?? [], {
    totalDamage,
    currentUserId: user?.id ?? null,
    limit,
    rewards: { coinsPool, xpPool, minShare, perUserCoinsCap },
  });

  return (
    <Card className={className}>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4" />
          Ranking de contribuintes
        </CardTitle>
        {board.contributors > 0 && (
          <Badge variant="outline" className="text-[11px]">
            {board.contributors} participante{board.contributors === 1 ? "" : "s"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Não foi possível carregar o ranking agora. Tente novamente em instantes.
          </p>
        ) : board.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ninguém golpeou o chefão ainda. Seja o primeiro a atacar!
          </p>
        ) : (
          <motion.ul
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="divide-y divide-border/60"
          >
            {board.rows.map((row) => (
              <ContributorRow key={row.userId} row={row} />
            ))}
            {board.currentUserRow && (
              <>
                <li className="py-1 text-center text-xs text-muted-foreground">···</li>
                <ContributorRow row={board.currentUserRow} />
              </>
            )}
          </motion.ul>
        )}
        {board.rows.length > 0 && (coinsPool > 0 || xpPool > 0) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Projeção estimada caso a batalha fosse apurada agora. O valor final muda a cada golpe.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
