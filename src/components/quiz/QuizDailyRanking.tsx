import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Crown, Flame, Gamepad2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useDailyQuizRanking } from "@/hooks/useQuizScores";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonList } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { memo, useCallback, useMemo } from "react";

interface RankingEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  rank: number;
  games_played: number;
  best_score: number;
  total_score: number;
}

interface RankingItemProps {
  entry: RankingEntry;
  index: number;
  isCurrentUser: boolean;
  getRankIcon: (rank: number) => React.ReactNode;
  getRankStyle: (rank: number) => string;
}

const RankingItem = memo(({ entry, index, isCurrentUser, getRankIcon, getRankStyle }: RankingItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`
        relative flex items-center gap-3 p-3 rounded-lg border transition-all
        ${getRankStyle(entry.rank)}
        ${isCurrentUser ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
      `}
    >
      <div className="flex items-center justify-center w-8">
        {getRankIcon(entry.rank)}
      </div>

      <Avatar className="w-10 h-10 border-2 border-background">
        <AvatarImage src={entry.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/20 text-primary font-semibold">
          {entry.display_name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">
            {entry.display_name}
          </span>
          {isCurrentUser && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              Você
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Gamepad2 className="w-3 h-3" />
            {entry.games_played} {entry.games_played === 1 ? 'jogo' : 'jogos'}
          </span>
          <span className="flex items-center gap-1">
            <Star className="w-3 h-3" />
            Melhor: {entry.best_score}
          </span>
        </div>
      </div>

      <div className="text-right">
        <motion.div
          className="text-lg font-bold text-primary flex items-center gap-1"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {entry.total_score}
          <Flame className="w-4 h-4 text-orange-500" />
        </motion.div>
        <span className="text-xs text-muted-foreground">pontos</span>
      </div>

      {entry.rank <= 3 && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 10px ${entry.rank === 1 ? 'rgba(234, 179, 8, 0.3)' : entry.rank === 2 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
              `0 0 20px ${entry.rank === 1 ? 'rgba(234, 179, 8, 0.1)' : entry.rank === 2 ? 'rgba(156, 163, 175, 0.1)' : 'rgba(217, 119, 6, 0.1)'}`,
              `0 0 10px ${entry.rank === 1 ? 'rgba(234, 179, 8, 0.3)' : entry.rank === 2 ? 'rgba(156, 163, 175, 0.3)' : 'rgba(217, 119, 6, 0.3)'}`,
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
});

RankingItem.displayName = "RankingItem";
export function QuizDailyRanking() {
  const { data: ranking, isLoading } = useDailyQuizRanking();
  const { user } = useAuth();

  const getRankIcon = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  }, []);

  const getRankStyle = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-slate-400/20 border-gray-400/50";
      case 3:
        return "bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50";
      default:
        return "bg-card/50 border-border/50";
    }
  }, []);

  const rankingToDisplay = useMemo(() => ranking?.slice(0, 10) || [], [ranking]);
  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Ranking do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SkeletonList count={3} />
        </CardContent>
      </Card>
    );
  }

  if (!ranking || ranking.length === 0) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-primary" />
            Ranking do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={Gamepad2}
            title="Nenhuma pontuação ainda hoje"
            description="Seja o primeiro a jogar!"
            compact
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
      <CardHeader className="pb-3 bg-gradient-to-r from-primary/10 to-transparent">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Trophy className="w-5 h-5 text-primary" />
          Ranking do Dia
          <Badge variant="secondary" className="ml-auto text-xs">
            {ranking.length} jogadores
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-4">
        <AnimatePresence mode="popLayout">
          {rankingToDisplay.map((entry, index) => (
            <RankingItem
              key={entry.user_id}
              entry={entry}
              index={index}
              isCurrentUser={user?.id === entry.user_id}
              getRankIcon={getRankIcon}
              getRankStyle={getRankStyle}
            />
          ))}
        </AnimatePresence>

        {ranking.length > 10 && (
          <p className="text-center text-xs text-muted-foreground pt-2">
            +{ranking.length - 10} outros jogadores
          </p>
        )}
      </CardContent>
    </Card>
  );
}
