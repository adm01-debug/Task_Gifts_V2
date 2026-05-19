import { useCallback, useMemo, memo } from "react";
import { motion } from "framer-motion";
import { Trophy, Crown, Medal, TrendingUp, TrendingDown, Minus, Target, Shield, Zap } from "lucide-react";
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 bg-card/40 backdrop-blur-2xl relative ring-1 ring-white/10"
    >
      {/* Scanning Line Animation */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div 
          className="w-full h-[1px] bg-primary/30 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          style={{ position: 'absolute' }}
        />
      </div>

      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shadow-glow ring-1 ring-amber-500/40">
            <Trophy className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h3 className="font-black uppercase tracking-[0.2em] text-xs text-foreground">Tactical Ranking</h3>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-primary font-black uppercase tracking-tighter italic">ALPHA_SECTOR_01</span>
              <Badge variant="outline" className="h-4 text-[8px] border-primary/20 text-primary/70 font-black">ACTIVE</Badge>
            </div>
          </div>
        </div>
        <motion.div
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-[0.25em] shadow-[0_0_15px_rgba(16,185,129,0.1)]"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
          Realtime
        </motion.div>
      </div>

      {/* Podium */}
      {topThree.length >= 3 && (
        <div className="px-6 py-10 border-b border-white/5 bg-gradient-to-b from-primary/5 to-transparent relative z-10">
          <div className="flex items-end justify-center gap-6">
            {podiumOrder.map((index, i) => {
              const player = topThree[index];
              if (!player) return null;
              const isFirst = index === 0;
              
              return (
                <motion.div
                  key={player.rank}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
                  className="flex flex-col items-center group"
                >
                  <div className="relative mb-4">
                    <motion.div
                      whileHover={{ scale: 1.15, rotate: isFirst ? 0 : index === 1 ? -5 : 5 }}
                      className={`
                        w-16 h-16 rounded-[1.25rem] flex items-center justify-center text-xl font-black shadow-2xl transition-all duration-300
                        ${isFirst ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white ring-4 ring-amber-500/20" : 
                          index === 1 ? "bg-gradient-to-br from-slate-300 to-slate-500 text-white ring-4 ring-slate-400/20" : 
                          "bg-gradient-to-br from-orange-600 to-orange-800 text-white ring-4 ring-orange-700/20"}
                        ${player.isCurrentUser ? "ring-offset-4 ring-offset-background" : ""}
                      `}
                    >
                      {player.avatar}
                    </motion.div>
                    <motion.div 
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-4 -right-4 drop-shadow-glow"
                    >
                      {getRankIcon(player.rank)}
                    </motion.div>
                  </div>
                  <div className="text-center space-y-1 mb-4">
                    <p className={`font-black uppercase tracking-tighter text-sm truncate max-w-[90px] ${player.isCurrentUser ? 'text-primary' : ''}`}>
                      {player.isCurrentUser ? "Operative" : player.name}
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <p className="text-xs font-black italic tracking-tighter">{player.xp.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Podium base */}
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: isFirst ? 100 : index === 1 ? 70 : 50 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.8, type: "spring" }}
                    className={`
                      w-20 rounded-t-3xl relative overflow-hidden shadow-2xl
                      ${isFirst ? "bg-gradient-to-t from-amber-500/40 via-amber-500/10 to-transparent border-t-2 border-amber-500/50" : 
                        index === 1 ? "bg-gradient-to-t from-slate-400/40 via-slate-400/10 to-transparent border-t-2 border-slate-400/50" : 
                        "bg-gradient-to-t from-orange-700/40 via-orange-700/10 to-transparent border-t-2 border-orange-700/50"}
                    `}
                  >
                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30 shadow-[0_0_15px_white]" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/40 blur-xl" />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rest of players */}
      <div className="divide-y divide-white/5 bg-black/10 relative z-10">
        {restOfPlayers.map((player, i) => (
          <motion.div
            key={player.rank}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.05 }}
            whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.05)", x: 4 }}
            className={`flex items-center gap-5 p-4 transition-all duration-300 ${
              player.isCurrentUser ? "bg-primary/15 border-l-4 border-primary" : ""
            }`}
          >
            <span className="w-8 text-center font-black italic tracking-tighter text-muted-foreground group-hover:text-primary">
              #{player.rank}
            </span>
            <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-sm shadow-xl ${
              player.isCurrentUser ? "ring-2 ring-primary bg-primary/20" : ""
            }`}>
              {player.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-black uppercase tracking-tighter text-sm truncate ${player.isCurrentUser ? 'text-primary' : ''}`}>
                {player.isCurrentUser ? "You" : player.name}
              </p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="px-1.5 h-4 text-[9px] border-white/10 text-muted-foreground font-black">LVL {player.level}</Badge>
                <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Operative</span>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shadow-glow-sm" />
                <p className="font-black italic tracking-tighter text-sm text-foreground">{player.xp.toLocaleString()}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <div className="px-2 py-0.5 rounded-full bg-black/40 border border-white/5 flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-orange-500">{player.streak}D</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]" />
                </div>
                {getTrendIcon(player.trend)}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All */}
      <div className="p-4 bg-white/5 border-t border-white/5 relative z-10">
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: "rgba(var(--primary-rgb), 0.15)" }}
          whileTap={{ scale: 0.98 }}
          onClick={handleViewRanking}
          className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] text-primary transition-all duration-300 shadow-glow-sm"
        >
          Access Full Archives
        </motion.button>
      </div>
    </motion.div>
  );
});
