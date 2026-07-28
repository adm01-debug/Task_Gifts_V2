import { Crown, Flag, Medal, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBoardLeaderboard } from "@/hooks/useBoardTrail";
import { medalForRank, trailProgressPct } from "@/lib/boardStats";
import { cn } from "@/lib/utils";

export interface BoardLeaderboardProps {
  trailId: string;
  totalTiles: number;
  currentUserId?: string | null;
}

const MEDAL_CLASS: Record<string, string> = {
  ouro: "text-amber-500",
  prata: "text-slate-400",
  bronze: "text-orange-600",
};

export function BoardLeaderboard({ trailId, totalTiles, currentUserId }: BoardLeaderboardProps) {
  const { data, isLoading } = useBoardLeaderboard(trailId);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Trophy className="h-4 w-4 text-primary" aria-hidden />
          Ranking da trilha
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </>
        ) : !data?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Ninguém jogou esta trilha ainda. Seja o primeiro do pódio.
          </p>
        ) : (
          data.map((entry) => {
            const medal = medalForRank(entry.rank);
            const isMe = currentUserId === entry.user_id;
            return (
              <div
                key={entry.user_id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2",
                  isMe ? "border-primary bg-primary/5" : "border-border bg-card",
                )}
              >
                <span className="w-6 shrink-0 text-center text-sm font-semibold text-muted-foreground">
                  {medal ? (
                    <Medal className={cn("mx-auto h-4 w-4", MEDAL_CLASS[medal])} aria-hidden />
                  ) : (
                    entry.rank
                  )}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.avatar_url || undefined} alt="" />
                  <AvatarFallback>{(entry.display_name || "?").charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {entry.display_name}
                    {isMe && <span className="ml-1 text-xs text-primary">(você)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trailProgressPct(entry.board_position, totalTiles)}% · {entry.xp} XP ·{" "}
                    {entry.coins} moedas
                  </p>
                </div>
                {entry.finished_at ? (
                  <Badge variant="secondary" className="gap-1">
                    <Flag className="h-3 w-3" aria-hidden />
                    Concluiu
                  </Badge>
                ) : entry.rank === 1 ? (
                  <Crown className="h-4 w-4 text-amber-500" aria-hidden />
                ) : null}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}