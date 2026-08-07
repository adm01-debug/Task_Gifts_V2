import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Trophy,
  Clock,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Target,
  Flame,
  Gift,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAutoChallenges } from "@/hooks/useAutoChallenges";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const DIFFICULTY_COLORS = {
  easy: "bg-green-500/20 text-green-500 border-green-500/30",
  medium: "bg-amber-500/20 text-amber-500 border-amber-500/30",
  hard: "bg-red-500/20 text-red-500 border-red-500/30",
};

const DIFFICULTY_LABELS = {
  easy: "Fácil",
  medium: "Médio",
  hard: "Difícil",
};

export function AutoChallengesWidget() {
  const { challenges, isLoading, stats } = useAutoChallenges();
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-amber-500/5">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 animate-pulse">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="space-y-1">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-3 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/30 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeChallenges = challenges.filter((c) => c.current < c.target);
  const completedChallenges = challenges.filter((c) => c.current >= c.target);
  const expiresAt = challenges[0]?.expires_at;

  return (
    <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-card to-amber-500/5 overflow-hidden relative">
      {/* Animated background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-amber-500/5 animate-pulse" />

      <CardHeader className="pb-3 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Zap className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Desafios da Semana
                <Sparkles className="w-4 h-4 text-amber-500" />
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {expiresAt
                  ? `Termina ${formatDistanceToNow(new Date(expiresAt), { addSuffix: true, locale: ptBR })}`
                  : "Carregando..."}
              </CardDescription>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {stats.completed}/{stats.total}
            </p>
            <p className="text-xs text-muted-foreground">completados</p>
          </div>
        </div>

        {/* XP Progress bar */}
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">XP Ganho</span>
            <span className="font-medium text-primary">
              {stats.earnedXp}/{stats.totalXpPossible} XP
            </span>
          </div>
          <Progress
            value={(stats.earnedXp / Math.max(stats.totalXpPossible, 1)) * 100}
            className="h-2"
          />
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3">
        <AnimatePresence mode="popLayout">
          {/* Active Challenges */}
          {activeChallenges.map((challenge, index) => {
            const progressPercent = (challenge.current / challenge.target) * 100;
            const isExpanded = expandedChallenge === challenge.id;

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
                layout
              >
                <div
                  className={cn(
                    "p-3 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm",
                    "hover:border-primary/30 transition-all cursor-pointer",
                    isExpanded && "border-primary/50 bg-primary/5"
                  )}
                  onClick={() => setExpandedChallenge(isExpanded ? null : challenge.id)}
                >
                  <div className="flex items-center gap-3">
                    <motion.span
                      className="text-2xl"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                    >
                      {challenge.icon}
                    </motion.span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{challenge.title}</p>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", DIFFICULTY_COLORS[challenge.difficulty])}
                        >
                          {DIFFICULTY_LABELS[challenge.difficulty]}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <Progress value={progressPercent} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {challenge.current}/{challenge.target}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs font-medium text-primary">+{challenge.xp_reward} XP</p>
                        <p className="text-[10px] text-amber-500">+{challenge.coin_reward} 🪙</p>
                      </div>
                      <ChevronRight
                        className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )}
                      />
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 mt-3 border-t border-border/50">
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="text-xs">
                              Faltam {challenge.target - challenge.current} para completar
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}

          {/* Completed Challenges */}
          {completedChallenges.map((challenge, index) => (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 rounded-xl border border-green-500/30 bg-green-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span className="text-2xl opacity-50">{challenge.icon}</span>
                  <CheckCircle2 className="w-4 h-4 text-green-500 absolute -bottom-1 -right-1" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate text-green-500">{challenge.title}</p>
                  <p className="text-xs text-green-500/70">Completado!</p>
                </div>

                <Badge variant="outline" className="border-green-500/50 text-green-500">
                  <Trophy className="w-3 h-3 mr-1" />
                  +{challenge.xp_reward} XP
                </Badge>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bonus indicator */}
        {stats.completed === stats.total && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-primary/20 border border-amber-500/30"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Gift className="w-8 h-8 text-amber-500" />
              </motion.div>
              <div>
                <p className="font-bold text-amber-500 flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  Todos os desafios completados!
                </p>
                <p className="text-sm text-muted-foreground">
                  Você ganhou um total de {stats.earnedXp} XP esta semana!
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
