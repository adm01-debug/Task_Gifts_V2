import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Calendar, Trophy, Zap, Star, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  weeklyActivity: boolean[];
  milestones: number[];
  nextMilestone: number;
}

interface StreakTrackerProps {
  data?: StreakData;
  onMilestoneReached?: (milestone: number) => void;
  className?: string;
}

const defaultStreakData: StreakData = {
  currentStreak: 7,
  bestStreak: 14,
  lastActiveDate: new Date().toISOString(),
  weeklyActivity: [true, true, true, false, true, true, true],
  milestones: [3, 7, 14, 30, 60, 100],
  nextMilestone: 14,
};

const streakLevels = [
  { min: 0, max: 2, color: "text-muted-foreground", bg: "bg-muted", label: "Iniciante" },
  { min: 3, max: 6, color: "text-orange-500", bg: "bg-orange-500/20", label: "Aquecendo" },
  { min: 7, max: 13, color: "text-orange-600", bg: "bg-orange-600/20", label: "Em Chamas" },
  { min: 14, max: 29, color: "text-red-500", bg: "bg-red-500/20", label: "Incandescente" },
  { min: 30, max: 59, color: "text-red-600", bg: "bg-red-600/20", label: "Inferno" },
  { min: 60, max: Infinity, color: "text-purple-500", bg: "bg-purple-500/20", label: "Lendário" },
];

export function StreakTracker({ 
  data = defaultStreakData, 
  onMilestoneReached,
  className 
}: StreakTrackerProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [flameIntensity, setFlameIntensity] = useState(1);

  const currentLevel = streakLevels.find(
    (level) => data.currentStreak >= level.min && data.currentStreak <= level.max
  ) || streakLevels[0];

  const progressToNextMilestone = data.nextMilestone > 0 
    ? (data.currentStreak / data.nextMilestone) * 100 
    : 100;

  const daysOfWeek = ["D", "S", "T", "Q", "Q", "S", "S"];

  useEffect(() => {
    // Animate flame intensity based on streak
    const intensity = Math.min(1 + (data.currentStreak / 10) * 0.5, 2);
    setFlameIntensity(intensity);
  }, [data.currentStreak]);

  useEffect(() => {
    // Check for milestone
    if (data.milestones.includes(data.currentStreak)) {
      setShowCelebration(true);
      onMilestoneReached?.(data.currentStreak);
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [data.currentStreak, data.milestones, onMilestoneReached]);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Flame className={cn("w-5 h-5", currentLevel.color)} />
            Streak Tracker
          </span>
          <Badge variant="outline" className={cn(currentLevel.bg, currentLevel.color)}>
            {currentLevel.label}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main Streak Display */}
        <div className="relative flex items-center justify-center py-4">
          <AnimatePresence>
            {showCelebration && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-purple-500/20 rounded-lg animate-pulse" />
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5, repeat: 3 }}
                  className="text-4xl"
                >
                  🎉
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            animate={{ 
              scale: [1, flameIntensity, 1],
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative"
          >
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center",
              currentLevel.bg
            )}>
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Flame 
                  className={cn("w-12 h-12", currentLevel.color)} 
                  strokeWidth={1.5}
                />
              </motion.div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-background px-3 py-1 rounded-full border shadow-sm">
              <span className={cn("text-2xl font-bold", currentLevel.color)}>
                {data.currentStreak}
              </span>
              <span className="text-xs text-muted-foreground ml-1">dias</span>
            </div>
          </motion.div>
        </div>

        {/* Progress to Next Milestone */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Target className="w-4 h-4" />
              Próximo marco
            </span>
            <span className="font-medium">{data.nextMilestone} dias</span>
          </div>
          <Progress value={progressToNextMilestone} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Faltam {data.nextMilestone - data.currentStreak} dias para o próximo marco!
          </p>
        </div>

        {/* Weekly Activity */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Atividade da semana
          </p>
          <div className="flex justify-between gap-1">
            {daysOfWeek.map((day, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "flex-1 aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-colors",
                  data.weeklyActivity[index]
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="font-medium">{day}</span>
                {data.weeklyActivity[index] && (
                  <Zap className="w-3 h-3 mt-0.5" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Melhor streak</p>
              <p className="font-semibold">{data.bestStreak} dias</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Star className="w-4 h-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Marcos alcançados</p>
              <p className="font-semibold">
                {data.milestones.filter(m => m <= data.bestStreak).length}
              </p>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {data.milestones.map((milestone) => (
            <Badge
              key={milestone}
              variant={data.currentStreak >= milestone ? "default" : "outline"}
              className={cn(
                "shrink-0 transition-all",
                data.currentStreak >= milestone 
                  ? "bg-primary" 
                  : "opacity-50"
              )}
            >
              {milestone}d
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Mini version for dashboard
export function MiniStreakTracker({ 
  streak = 7, 
  className 
}: { 
  streak?: number; 
  className?: string;
}) {
  const currentLevel = streakLevels.find(
    (level) => streak >= level.min && streak <= level.max
  ) || streakLevels[0];

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-full cursor-pointer",
        currentLevel.bg,
        className
      )}
    >
      <motion.div
        animate={{ 
          y: [0, -2, 0],
        }}
        transition={{ 
          duration: 0.6, 
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <Flame className={cn("w-5 h-5", currentLevel.color)} />
      </motion.div>
      <span className={cn("font-bold", currentLevel.color)}>{streak}</span>
    </motion.div>
  );
}
