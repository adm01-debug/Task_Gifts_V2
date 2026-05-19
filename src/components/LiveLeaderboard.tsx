import { useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeaderboard } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonLeaderboard } from "@/components/ui/skeleton";

interface LeaderboardPlayer {
  rank: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streak: number;
  trend: "up" | "down" | "same";
  isCurrentUser?: boolean;
}

const podiumOrder = [1, 0, 2]; // Silver, Gold, Bronze positions

/**
 * LiveLeaderboard - Displays top players with animated podium
 * Wrapped in React.memo to prevent unnecessary re-renders from parent state changes
 */
export const LiveLeaderboard = memo(function LiveLeaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profiles = [], isLoading } = useLeaderboard(10);

  // Calculate trend based on streak and recent activity
  const calculateTrend = useCallback((streak: number, questsCompleted: number): "up" | "down" | "same" => {
    if (streak >= 3) return "up"; // Active user with streak
    if (streak === 0 && questsCompleted === 0) return "down"; // Inactive user
    return "same"; // Moderate activity
  }, []);

  // Transform profiles to leaderboard format
  const players: LeaderboardPlayer[] = useMemo(() => 
    profiles.map((profile, index) => ({
      rank: index + 1,
      name: profile.display_name || profile.email?.split("@")[0] || "Usuário",
      avatar: (profile.display_name || profile.email || "U").substring(0, 2).toUpperCase(),
      xp: profile.xp,
      level: profile.level,
      streak: profile.streak,
      trend: calculateTrend(profile.streak, profile.quests_completed),
      isCurrentUser: profile.id === user?.id,
    })),
    [profiles, user?.id, calculateTrend]
  );

  const topThree = useMemo(() => players.slice(0, 3), [players]);
  const restOfPlayers = useMemo(() => players.slice(3), [players]);

  const getRankIcon = useCallback((rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-gold" />;
      case 2:
        return <Medal className="w-5 h-5 text-silver" />;
      case 3:
        return <Medal className="w-5 h-5 text-bronze" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  }, []);

  const getTrendIcon = useCallback((trend: string) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-success" />;
      case "down":
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      default:
        return <Minus className="w-4 h-4 text-muted-foreground" />;
    }
  }, []);

  const handleViewRanking = useCallback(() => {
    navigate("/estatisticas");
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border overflow-hidden card-shimmer">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="font-bold">Leaderboard</h3>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </div>
          </div>
        </div>
        <div className="p-4">
          <SkeletonLeaderboard items={5} />
        </div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border overflow-hidden card-shimmer"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-gold" />
            </div>
            <div>
              <h3 className="font-bold">Leaderboard</h3>
              <p className="text-xs text-muted-foreground">Esta semana</p>
            </div>
          </div>
        </div>
        <div className="p-8 text-center text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhum usuário ainda</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
       className="rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-card/40 backdrop-blur-xl relative"
     >
       {/* Header */}
       <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-glow-sm">
             <Trophy className="w-5 h-5 text-amber-500" />
           </div>
           <div>
             <h3 className="font-black uppercase tracking-widest text-xs">Tactical Ranking</h3>
             <p className="text-[10px] text-muted-foreground font-black opacity-70 uppercase tracking-tighter italic">WEEKLY_DIVISION_ALPHA</p>
           </div>
         </div>
         <motion.div
           animate={{ opacity: [0.4, 1, 0.4] }}
           transition={{ duration: 2, repeat: Infinity }}
           className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em]"
         >
           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
           Live
         </motion.div>
       </div>

      {/* Podium */}
      {topThree.length >= 3 && (
        <div className="px-4 py-6 border-b border-border bg-gradient-to-b from-muted/30 to-transparent">
          <div className="flex items-end justify-center gap-4">
            {podiumOrder.map((index, i) => {
              const player = topThree[index];
              if (!player) return null;
              const isFirst = index === 0;
              
              return (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.15 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-2">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`
                        w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold
                        ${isFirst ? "rank-gold" : index === 1 ? "rank-silver" : "rank-bronze"}
                        ${player.isCurrentUser ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                      `}
                    >
                      {player.avatar}
                    </motion.div>
                    <div className="absolute -top-2 -right-2">
                      {getRankIcon(player.rank)}
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-center truncate max-w-[80px]">
                    {player.isCurrentUser ? "Você" : player.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{player.xp.toLocaleString()} XP</p>
                  
                   {/* Podium base */}
                   <motion.div
                     initial={{ height: 0 }}
                     animate={{ height: isFirst ? 80 : index === 1 ? 50 : 40 }}
                     transition={{ delay: 0.5 + i * 0.1, duration: 0.6, type: "spring" }}
                     className={`
                       w-16 mt-3 rounded-t-2xl relative overflow-hidden group
                       ${isFirst ? "bg-gradient-to-t from-amber-500/40 via-amber-500/10 to-transparent ring-1 ring-amber-500/30" : 
                         index === 1 ? "bg-gradient-to-t from-slate-400/40 via-slate-400/10 to-transparent ring-1 ring-slate-400/30" : 
                         "bg-gradient-to-t from-orange-700/40 via-orange-700/10 to-transparent ring-1 ring-orange-700/30"}
                     `}
                   >
                     <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute top-0 left-0 right-0 h-px bg-white/20 shadow-[0_0_10px_white]" />
                   </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of players */}
      <div className="divide-y divide-border">
        {restOfPlayers.map((player, i) => (
          <motion.div
            key={player.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            whileHover={{ backgroundColor: "hsl(var(--muted) / 0.3)" }}
            className={`flex items-center gap-3 p-3 transition-colors ${
              player.isCurrentUser ? "bg-primary/5" : ""
            }`}
          >
            <span className="w-6 text-center font-bold text-muted-foreground">
              #{player.rank}
            </span>
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-secondary/30 to-accent/30 flex items-center justify-center font-semibold text-sm ${
              player.isCurrentUser ? "ring-2 ring-primary" : ""
            }`}>
              {player.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">
                {player.isCurrentUser ? "Você" : player.name}
              </p>
              <p className="text-xs text-muted-foreground">Lv.{player.level}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-xp">{player.xp.toLocaleString()}</p>
              <div className="flex items-center justify-end gap-1">
                {getTrendIcon(player.trend)}
                <span className="text-xs text-muted-foreground">{player.streak}🔥</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All */}
      <div className="p-3 border-t border-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewRanking}
          className="w-full py-2 rounded-lg bg-muted/50 hover:bg-muted text-sm font-medium transition-colors"
        >
          Ver ranking completo
        </motion.button>
      </div>
    </motion.div>
  );
});
