import { useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, Trophy, Clock, TrendingUp, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useWeeklyChallenge } from "@/hooks/useWeeklyChallenge";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { differenceInDays, differenceInHours } from "date-fns";
import { WeeklyChallengeVictory } from "@/components/effects/WeeklyChallengeVictory";
import { useSoundEffects } from "@/hooks/useSoundEffects";

export function WeeklyChallengeCard() {
  const { user } = useAuth();
  const { challenge, isLoading, showVictory, victoryData, closeVictory } = useWeeklyChallenge();
  const { playAchievementSound } = useSoundEffects();

  // Play sound when victory modal shows
  useEffect(() => {
    if (showVictory) {
      playAchievementSound();
    }
  }, [showVictory, playAchievementSound]);

  // Memoize derived data
  const derivedData = useMemo(() => {
    if (!challenge || !user) return null;

    const isChallenger = user.id === challenge.challenger_id;
    const myXpGained = isChallenger ? challenge.challenger_xp_gained : challenge.opponent_xp_gained;
    const opponentXpGained = isChallenger ? challenge.opponent_xp_gained : challenge.challenger_xp_gained;
    const myProfile = isChallenger ? challenge.challengerProfile : challenge.opponentProfile;
    const opponentProfile = isChallenger ? challenge.opponentProfile : challenge.challengerProfile;

    const totalXp = myXpGained + opponentXpGained || 1;
    const myProgress = (myXpGained / totalXp) * 100;
    const opponentProgress = (opponentXpGained / totalXp) * 100;

    const isWinning = myXpGained > opponentXpGained;
    const isTie = myXpGained === opponentXpGained;

    return {
      isChallenger,
      myXpGained,
      opponentXpGained,
      myProfile,
      opponentProfile,
      myProgress,
      opponentProgress,
      isWinning,
      isTie,
    };
  }, [challenge, user]);

  // Memoize time calculations
  const timeLeft = useMemo(() => {
    if (!challenge) return null;

    const weekEnd = new Date(challenge.week_end);
    const now = new Date();
    const daysLeft = differenceInDays(weekEnd, now);
    const hoursLeft = differenceInHours(weekEnd, now) % 24;

    return { daysLeft, hoursLeft };
  }, [challenge?.week_end]);

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/80 border-primary/20">
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <Skeleton className="h-8 flex-1" />
            <Skeleton className="h-16 w-16 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!challenge || !derivedData || !timeLeft) {
    return (
      <Card className="bg-gradient-to-br from-card to-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-muted-foreground" />
            Desafio Semanal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Nenhum desafio disponível no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  const { myXpGained, opponentXpGained, myProfile, opponentProfile, myProgress, opponentProgress, isWinning, isTie } = derivedData;
  const { daysLeft, hoursLeft } = timeLeft;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="ultra" className="overflow-hidden relative border-white/10 bg-black/40 backdrop-blur-3xl shadow-2xl rounded-[2.5rem]">
        {/* Advanced Tactical Overlay */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-[0.03] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />
        
        {/* Animated Scanning Line */}
        <motion.div 
          className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent z-0"
          animate={{ top: ["0%", "100%", "0%"] }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />

        <CardHeader className="pb-4 relative z-10 bg-white/5 backdrop-blur-xl border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow-sm border border-primary/20">
                <Swords className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xs font-black uppercase tracking-widest leading-none mb-1">Weekly Duel</CardTitle>
                <p className="text-[10px] text-muted-foreground font-black opacity-70 uppercase tracking-tighter italic">SECTOR_DOMINATION_PROTOCOL</p>
              </div>
            </div>
            <Badge variant="outline" className="h-8 px-4 rounded-xl border-white/10 bg-black/40 text-[10px] font-black uppercase tracking-widest text-white italic shadow-glow-sm">
              <Clock className="h-3 w-3 mr-2 text-primary" />
              {daysLeft > 0 ? `${daysLeft}D ${hoursLeft}H REMAINING` : `${hoursLeft}H REMAINING`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 p-6">
          {/* VS Battle Display - Cinematographic Layout */}
          <div className="flex items-center justify-between gap-6 mb-8 mt-2">
            {/* My Profile - Elite UI */}
            <motion.div 
              className="flex flex-col items-center gap-3 flex-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative group">
                <div className={`relative p-1 rounded-full transition-all duration-500 ${isWinning ? "bg-gradient-to-tr from-emerald-500 to-primary p-[2px] shadow-glow-success" : "bg-white/5"}`}>
                  <Avatar className="h-20 w-20 border-4 border-black/40 ring-2 ring-white/5">
                    <AvatarImage src={myProfile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-primary/20 text-primary font-black text-2xl italic">
                      {myProfile?.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {isWinning && (
                  <motion.div
                    className="absolute -top-2 -right-2 z-20"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg border border-white/20">
                      <Trophy className="h-4 w-4 text-white fill-white" />
                    </div>
                  </motion.div>
                )}
              </div>
              
              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">OPERATIVE_ID</span>
                <h4 className="font-black text-xs text-white truncate max-w-[100px] italic">{myProfile?.display_name?.toUpperCase() || "YOU"}</h4>
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
                  <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary italic">+{myXpGained} XP</span>
                </div>
              </div>
            </motion.div>

            {/* VS CENTER PIECE */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 blur-2xl bg-orange-500/40 rounded-full"
                />
                <div className="relative w-14 h-14 rounded-full bg-black/60 border border-white/10 flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent" />
                  <Flame className="h-7 w-7 text-orange-500 z-10" />
                  <span className="absolute text-[10px] font-black text-white italic z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 tracking-tighter">VS</span>
                </div>
              </div>
              <div className="h-12 w-[1px] bg-gradient-to-b from-white/10 to-transparent" />
            </div>

            {/* Opponent Profile - Elite UI */}
            <motion.div 
              className="flex flex-col items-center gap-3 flex-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className="relative group">
                <div className={`relative p-1 rounded-full transition-all duration-500 ${!isWinning && !isTie ? "bg-gradient-to-tr from-orange-500 to-accent p-[2px] shadow-glow-warning" : "bg-white/5"}`}>
                  <Avatar className="h-20 w-20 border-4 border-black/40 ring-2 ring-white/5 grayscale-[0.3]">
                    <AvatarImage src={opponentProfile?.avatar_url || undefined} className="object-cover" />
                    <AvatarFallback className="bg-accent/20 text-accent font-black text-2xl italic">
                      {opponentProfile?.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {!isWinning && !isTie && (
                  <motion.div
                    className="absolute -top-2 -right-2 z-20"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg border border-white/20">
                      <Trophy className="h-4 w-4 text-white fill-white" />
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 block">TARGET_ID</span>
                <h4 className="font-black text-xs text-white truncate max-w-[100px] italic">{opponentProfile?.display_name?.toUpperCase() || "ENEMY"}</h4>
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-accent/20 border border-accent/30">
                  <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
                  <span className="text-[9px] font-black text-accent italic">+{opponentXpGained} XP</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Dynamic Progress Engine */}
          <div className="space-y-4 bg-black/40 p-5 rounded-[2rem] border border-white/5">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-muted-foreground tracking-widest uppercase">Combat Dominance</span>
                <div className="text-lg font-black text-white italic tracking-tighter">
                  {isTie ? "PROTOCOL_STALEMATE" : isWinning ? "DOMINATION_ACTIVE" : "SECTOR_RECOVERY_REQUIRED"}
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary italic tracking-tighter">
                  {Math.round(myProgress)}% <span className="text-[10px] text-muted-foreground/40 font-normal">VS</span> {Math.round(opponentProgress)}%
                </span>
              </div>
            </div>

            <div className="relative h-6 bg-black/60 rounded-2xl overflow-hidden p-1 border border-white/5 ring-4 ring-black/20">
              <motion.div
                className="absolute left-1 h-[calc(100%-8px)] bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-xl shadow-glow-primary z-10"
                initial={{ width: 0 }}
                animate={{ width: `calc(${myProgress}% - 4px)` }}
                transition={{ duration: 1.5, ease: "circOut" }}
              >
                <div className="absolute inset-0 bg-[url('/shimmer.svg')] opacity-20 animate-shimmer" />
              </motion.div>
              
              <motion.div
                className="absolute right-1 h-[calc(100%-8px)] bg-gradient-to-l from-accent via-accent/80 to-accent/60 rounded-xl shadow-glow-warning"
                initial={{ width: 0 }}
                animate={{ width: `calc(${opponentProgress}% - 4px)` }}
                transition={{ duration: 1.5, ease: "circOut" }}
              />
              
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="px-3 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10">
                  <span className="text-[9px] font-black text-white tracking-[0.3em] uppercase italic">SYNC_STATUS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rewards Projection */}
          <div className="mt-6 flex items-center justify-between px-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <span className="text-[10px] font-black text-white italic">+{challenge.xp_reward} XP_CREDITS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <span className="text-sm">🪙</span>
                </div>
                <span className="text-[10px] font-black text-white italic">+{challenge.coin_reward} TACTICAL_COINS</span>
              </div>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent mx-4 hidden sm:block" />
            <span className="text-[9px] font-black text-muted-foreground/40 tracking-tighter uppercase italic">PROJECTED_SPOILS_V4</span>
          </div>
        </CardContent>
        
        {/* Footer Status Line */}
        <div className="px-6 py-3 bg-white/5 border-t border-white/5 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-glow-primary" />
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">DUEL_ENGINE_ACTIVE_STABLE</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-3 h-1 rounded-full ${i <= 3 ? "bg-primary/40" : "bg-white/5"}`} />
            ))}
          </div>
        </div>
      </Card>

      {/* Victory Celebration Modal */}
      {victoryData && (
        <WeeklyChallengeVictory
          show={showVictory}
          onClose={closeVictory}
          opponentName={victoryData.opponentName}
          xpGained={victoryData.xpGained}
          opponentXpGained={victoryData.opponentXpGained}
          xpReward={victoryData.xpReward}
          coinReward={victoryData.coinReward}
        />
      )}
    </motion.div>
  );
}
