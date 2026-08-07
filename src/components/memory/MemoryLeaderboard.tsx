import { Medal, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMemoryLeaderboard } from "@/hooks/useMemoryGame";
import { cn } from "@/lib/utils";

const MEDAL_TONE: Record<number, string> = {
  1: "text-amber-500",
  2: "text-slate-400",
  3: "text-orange-600",
};

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export interface MemoryLeaderboardProps {
  deckId: string | null;
  /** Janela em dias (padrão: semana corrente móvel). */
  days?: number;
}

export function MemoryLeaderboard({ deckId, days = 7 }: MemoryLeaderboardProps) {
  const { data, isLoading } = useMemoryLeaderboard(deckId, days);

  return (
    <Card className="border-border/60 bg-card/70 backdrop-blur">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">Ranking da semana</CardTitle>
        <Badge variant="secondary" className="text-[10px]">
          Últimos {days} dias
        </Badge>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))
        ) : (data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhuma partida concluída neste baralho ainda. Seja o primeiro do ranking!
          </p>
        ) : (
          (data ?? []).map((entry) => (
            <div
              key={entry.user_id}
              className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2"
            >
              <span
                className={cn(
                  "flex w-6 shrink-0 items-center justify-center text-sm font-bold",
                  MEDAL_TONE[entry.rank] ?? "text-muted-foreground",
                )}
              >
                {entry.rank <= 3 ? (
                  <Medal className="h-4 w-4" aria-hidden />
                ) : (
                  entry.rank
                )}
              </span>
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={entry.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{entry.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {entry.display_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {entry.matched_pairs}/{entry.pairs_total} pares · {entry.moves} jogadas
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary">
                <Timer className="h-3.5 w-3.5" aria-hidden />
                {formatDuration(entry.duration_ms)}
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}