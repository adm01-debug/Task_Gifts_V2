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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="ultra" className="overflow-hidden relative border-primary/20 bg-gradient-to-br from-card/60 via-card/40 to-primary/5">
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 animate-pulse" />
        <CardHeader className="pb-2 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Swords className="h-5 w-5 text-primary" />
              </motion.div>
              Desafio Semanal
            </CardTitle>
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h restantes` : `${hoursLeft}h restantes`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="relative">
          {/* VS Battle Display */}
          <div className="flex items-center justify-between gap-2 mb-4">
            {/* My Profile */}
            <motion.div 
              className="flex flex-col items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className={`relative ${isWinning ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background rounded-full" : ""}`}>
                <Avatar className="h-14 w-14 border-2 border-primary">
                  <AvatarImage src={myProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary font-bold">
                    {myProfile?.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                {isWinning && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                )}
              </div>
              <span className="text-xs font-medium truncate max-w-[80px]">
                {myProfile?.display_name || "Você"}
              </span>
              <Badge variant={isWinning ? "default" : "secondary"} className="text-xs">
                +{myXpGained} XP
              </Badge>
            </motion.div>

            {/* VS Indicator */}
            <motion.div
              className="flex flex-col items-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="relative">
                <Flame className="h-8 w-8 text-orange-500" />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
                  VS
                </span>
              </div>
            </motion.div>

            {/* Opponent Profile */}
            <motion.div 
              className="flex flex-col items-center gap-1"
              whileHover={{ scale: 1.05 }}
            >
              <div className={`relative ${!isWinning && !isTie ? "ring-2 ring-green-500 ring-offset-2 ring-offset-background rounded-full" : ""}`}>
                <Avatar className="h-14 w-14 border-2 border-accent">
                  <AvatarImage src={opponentProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-accent/20 text-accent font-bold">
                    {opponentProfile?.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                {!isWinning && !isTie && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Trophy className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </motion.div>
                )}
              </div>
              <span className="text-xs font-medium truncate max-w-[80px]">
                {opponentProfile?.display_name || "Oponente"}
              </span>
              <Badge variant={!isWinning && !isTie ? "default" : "secondary"} className="text-xs">
                +{opponentXpGained} XP
              </Badge>
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(myProgress)}%</span>
              <span>{Math.round(opponentProgress)}%</span>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute left-0 h-full bg-gradient-to-r from-primary to-primary/80 rounded-l-full"
                initial={{ width: 0 }}
                animate={{ width: `${myProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <motion.div
                className="absolute right-0 h-full bg-gradient-to-l from-accent to-accent/80 rounded-r-full"
                initial={{ width: 0 }}
                animate={{ width: `${opponentProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-foreground drop-shadow-sm">
                  {isTie ? "EMPATE!" : isWinning ? "VENCENDO!" : "PERDENDO"}
                </span>
              </div>
            </div>
          </div>

          {/* Rewards Info */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-primary" />
              +{challenge.xp_reward} XP
            </span>
            <span className="flex items-center gap-1">
              <span className="text-yellow-500">🪙</span>
              +{challenge.coin_reward} coins
            </span>
          </div>
        </CardContent>
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
