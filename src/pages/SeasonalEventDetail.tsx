import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInDays, differenceInHours, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Gift, Sparkles, Trophy, Check, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useSeasonalEventDetail, useClaimSeasonalReward } from "@/hooks/useSeasonalEvents";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { DesktopBackButton } from "@/components/navigation";
import confetti from "canvas-confetti";

export default function SeasonalEventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { event, isLoading } = useSeasonalEventDetail(eventId || "");
  const claimReward = useClaimSeasonalReward();
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());

  // Memoize handleClaim
  const handleClaim = useCallback(async (challengeId: string) => {
    setClaimingIds(prev => new Set(prev).add(challengeId));
    try {
      await claimReward.mutateAsync(challengeId);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [event?.banner_color || "#dc2626", "#ffd700", "#ffffff"],
      });
    } finally {
      setClaimingIds(prev => {
        const next = new Set(prev);
        next.delete(challengeId);
        return next;
      });
    }
  }, [claimReward, event?.banner_color]);

  // Memoize time calculations
  const timeRemaining = useMemo(() => {
    if (!event) return null;
    const endsAt = new Date(event.ends_at);
    const now = new Date();
    return {
      endsAt,
      daysRemaining: differenceInDays(endsAt, now),
      hoursRemaining: differenceInHours(endsAt, now) % 24,
    };
  }, [event?.ends_at]);

  // Memoize progress calculations
  const progressStats = useMemo(() => {
    if (!event?.challenges) return { completedChallenges: [], totalChallenges: 0, overallProgress: 0 };
    
    const challenges = event.challenges || [];
    const completedChallenges = challenges.filter((c) => c.progress?.completed_at);
    const totalChallenges = challenges.length;
    const overallProgress = totalChallenges > 0 ? (completedChallenges.length / totalChallenges) * 100 : 0;
    
    return { completedChallenges, totalChallenges, overallProgress };
  }, [event?.challenges]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 w-full mb-6" />
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!event || !timeRemaining) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Evento não encontrado</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Voltar ao início
        </Button>
      </div>
    );
  }

  const { endsAt, daysRemaining, hoursRemaining } = timeRemaining;
  const { completedChallenges, totalChallenges, overallProgress } = progressStats;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <DesktopBackButton label="Voltar" className="mb-4" />
      </motion.div>

      {/* Event Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mb-8"
      >
        <Card
          className="overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${event.banner_color}15, ${event.banner_color}30)`,
            borderColor: `${event.banner_color}40`,
          }}
        >
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <motion.div
                className="text-6xl"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                {event.icon}
              </motion.div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{event.title}</h1>
                  <Badge
                    variant="secondary"
                    className="text-sm"
                    style={{
                      backgroundColor: `${event.banner_color}20`,
                      color: event.banner_color,
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    {event.xp_multiplier}x XP
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-4">{event.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(event.starts_at), "dd MMM", { locale: ptBR })} -{" "}
                      {format(endsAt, "dd MMM yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1 font-medium"
                    style={{ color: event.banner_color }}
                  >
                    <Clock className="h-4 w-4" />
                    <span>
                      {daysRemaining > 0
                        ? `${daysRemaining}d ${hoursRemaining}h restantes`
                        : `${hoursRemaining}h restantes`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: event.banner_color }}>
                  {completedChallenges.length}/{totalChallenges}
                </div>
                <p className="text-sm text-muted-foreground">desafios</p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">{Math.round(overallProgress)}%</span>
              </div>
              <Progress
                value={overallProgress}
                className="h-3"
                style={
                  {
                    "--progress-background": event.banner_color,
                  } as React.CSSProperties
                }
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Challenges */}
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Trophy className="h-5 w-5" style={{ color: event.banner_color }} />
        Desafios do Evento
      </h2>

      <div className="space-y-4">
        <AnimatePresence>
          {event.challenges?.map((challenge, index) => {
            const progress = challenge.progress;
            const progressPercent = progress
              ? Math.min((progress.current_value / challenge.target_value) * 100, 100)
              : 0;
            const isCompleted = !!progress?.completed_at;
            const isClaimed = progress?.claimed;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "transition-all",
                    isCompleted && !isClaimed && "ring-2",
                    isClaimed && "opacity-60"
                  )}
                  style={{
                    borderColor: isCompleted ? event.banner_color : undefined,
                    boxShadow: isCompleted && !isClaimed ? `0 0 20px ${event.banner_color}40` : undefined,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="text-3xl p-2 rounded-lg"
                        style={{ backgroundColor: `${event.banner_color}15` }}
                      >
                        {challenge.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          {challenge.badge_name && (
                            <Badge variant="outline" className="text-xs">
                              {challenge.badge_icon} {challenge.badge_name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {challenge.description}
                        </p>

                        {/* Progress */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {progress?.current_value || 0} / {challenge.target_value}
                            </span>
                            <span className="text-xs font-medium">
                              {Math.round(progressPercent)}%
                            </span>
                          </div>
                          <Progress
                            value={progressPercent}
                            className="h-2"
                            style={
                              {
                                "--progress-background": isCompleted
                                  ? "#22c55e"
                                  : event.banner_color,
                              } as React.CSSProperties
                            }
                          />
                        </div>

                        {/* Rewards */}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-amber-500">
                            <Sparkles className="h-3.5 w-3.5" />
                            +{challenge.xp_reward} XP
                          </span>
                          <span className="flex items-center gap-1 text-yellow-500">
                            <Coins className="h-3.5 w-3.5" />
                            +{challenge.coin_reward}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isClaimed ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                            <Check className="h-3 w-3 mr-1" />
                            Coletado
                          </Badge>
                        ) : isCompleted ? (
                          <Button
                            size="sm"
                            onClick={() => handleClaim(challenge.id)}
                            disabled={claimingIds.has(challenge.id)}
                            style={{ backgroundColor: event.banner_color }}
                            className="text-white"
                          >
                            <Gift className="h-4 w-4 mr-1" />
                            {claimingIds.has(challenge.id) ? "..." : "Coletar"}
                          </Button>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Em progresso
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
