import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, Clock, Zap, Gift, CheckCircle2, 
  Star, Flame, Users, MessageSquare, BookOpen,
  Trophy, ChevronRight, RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: "social" | "learning" | "productivity" | "wellness";
  xpReward: number;
  coinReward: number;
  progress: number;
  target: number;
  timeLeft: string;
  isCompleted: boolean;
  difficulty: "easy" | "medium" | "hard";
}

const categoryColors = {
  social: "from-blue-500 to-cyan-500",
  learning: "from-purple-500 to-pink-500",
  productivity: "from-green-500 to-emerald-500",
  wellness: "from-orange-500 to-amber-500",
};

const categoryBadges = {
  social: { label: "Social", color: "bg-blue-500/20 text-blue-500" },
  learning: { label: "Aprendizado", color: "bg-purple-500/20 text-purple-500" },
  productivity: { label: "Produtividade", color: "bg-green-500/20 text-green-500" },
  wellness: { label: "Bem-estar", color: "bg-orange-500/20 text-orange-500" },
};

const difficultyStars = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const sampleChallenges: DailyChallenge[] = [
  {
    id: "1",
    title: "Networking Master",
    description: "Envie reconhecimento para 3 colegas",
    icon: <Users className="w-5 h-5" />,
    category: "social",
    xpReward: 50,
    coinReward: 10,
    progress: 2,
    target: 3,
    timeLeft: "4h restantes",
    isCompleted: false,
    difficulty: "easy",
  },
  {
    id: "2",
    title: "Estudante Dedicado",
    description: "Complete 2 módulos de treinamento",
    icon: <BookOpen className="w-5 h-5" />,
    category: "learning",
    xpReward: 100,
    coinReward: 25,
    progress: 1,
    target: 2,
    timeLeft: "4h restantes",
    isCompleted: false,
    difficulty: "medium",
  },
  {
    id: "3",
    title: "Comunicador Ativo",
    description: "Participe de 5 discussões no feed",
    icon: <MessageSquare className="w-5 h-5" />,
    category: "social",
    xpReward: 75,
    coinReward: 15,
    progress: 5,
    target: 5,
    timeLeft: "Completo!",
    isCompleted: true,
    difficulty: "medium",
  },
  {
    id: "4",
    title: "Streak de Fogo",
    description: "Mantenha seu streak por mais 1 dia",
    icon: <Flame className="w-5 h-5" />,
    category: "wellness",
    xpReward: 150,
    coinReward: 30,
    progress: 0,
    target: 1,
    timeLeft: "4h restantes",
    isCompleted: false,
    difficulty: "hard",
  },
];

interface DailyChallengeCardProps {
  challenge: DailyChallenge;
  onClaim?: (id: string) => void;
  onStart?: (id: string) => void;
}

function DailyChallengeCard({ challenge, onClaim, onStart }: DailyChallengeCardProps) {
  const progressPercent = (challenge.progress / challenge.target) * 100;
  const category = categoryBadges[challenge.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        challenge.isCompleted 
          ? "bg-green-500/5 border-green-500/30" 
          : "bg-card hover:shadow-md"
      )}
    >
      {/* Completed overlay */}
      {challenge.isCompleted && (
        <div className="absolute top-3 right-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" }}
          >
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </motion.div>
        </div>
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
          "bg-gradient-to-br",
          categoryColors[challenge.category],
          "text-white shadow-lg"
        )}>
          {challenge.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h4 className="font-semibold text-sm">{challenge.title}</h4>
              <p className="text-xs text-muted-foreground">{challenge.description}</p>
            </div>
          </div>

          {/* Category & Difficulty */}
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className={cn("text-xs", category.color)}>
              {category.label}
            </Badge>
            <div className="flex gap-0.5">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "w-3 h-3",
                    i < difficultyStars[challenge.difficulty]
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {challenge.progress}/{challenge.target}
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-3 h-3" />
                {challenge.timeLeft}
              </span>
            </div>
            <Progress 
              value={progressPercent} 
              className={cn(
                "h-2",
                challenge.isCompleted && "[&>div]:bg-green-500"
              )}
            />
          </div>

          {/* Rewards & Action */}
          <div className="flex items-center justify-between mt-3">
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1 text-blue-500">
                <Zap className="w-3 h-3" />
                +{challenge.xpReward} XP
              </span>
              <span className="flex items-center gap-1 text-yellow-500">
                🪙 +{challenge.coinReward}
              </span>
            </div>
            
            {challenge.isCompleted ? (
              <Button 
                size="sm" 
                variant="outline"
                className="h-7 text-xs border-green-500/30 text-green-500 hover:bg-green-500/10"
                onClick={() => onClaim?.(challenge.id)}
              >
                <Gift className="w-3 h-3 mr-1" />
                Resgatar
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => onStart?.(challenge.id)}
              >
                Ir
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface DailyChallengesWidgetProps {
  challenges?: DailyChallenge[];
  className?: string;
  onClaim?: (id: string) => void;
  onStart?: (id: string) => void;
  onRefresh?: () => void;
}

export function DailyChallengesWidget({
  challenges = sampleChallenges,
  className,
  onClaim,
  onStart,
  onRefresh,
}: DailyChallengesWidgetProps) {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const completedCount = challenges.filter((c) => c.isCompleted).length;
  const totalXP = challenges.reduce((sum, c) => sum + c.xpReward, 0);
  const earnedXP = challenges
    .filter((c) => c.isCompleted)
    .reduce((sum, c) => sum + c.xpReward, 0);

  const filteredChallenges = challenges.filter((c) => {
    if (filter === "active") return !c.isCompleted;
    if (filter === "completed") return c.isCompleted;
    return true;
  });

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="w-5 h-5 text-primary" />
            Desafios Diários
          </CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {/* Progress summary */}
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">
            {completedCount}/{challenges.length} completos
          </span>
          <span className="flex items-center gap-1 text-primary">
            <Trophy className="w-4 h-4" />
            {earnedXP}/{totalXP} XP
          </span>
        </div>
        <Progress 
          value={(completedCount / challenges.length) * 100} 
          className="h-2"
        />
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Filter tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant="ghost"
              size="sm"
              className={cn(
                "flex-1 h-7 text-xs",
                filter === f && "bg-background shadow-sm"
              )}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "Todos" : f === "active" ? "Ativos" : "Completos"}
            </Button>
          ))}
        </div>

        {/* Challenges list */}
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {filteredChallenges.map((challenge) => (
              <DailyChallengeCard
                key={challenge.id}
                challenge={challenge}
                onClaim={onClaim}
                onStart={onStart}
              />
            ))}
          </div>
        </AnimatePresence>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum desafio encontrado</p>
          </div>
        )}

        {/* Bonus reward hint */}
        {completedCount === challenges.length && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-center"
          >
            <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
              🎉 Todos os desafios completos!
            </p>
            <p className="text-xs text-muted-foreground">
              Bônus de +50 XP disponível
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for sidebar
export function MiniDailyChallenges({ 
  challenges = sampleChallenges 
}: { 
  challenges?: DailyChallenge[] 
}) {
  const completedCount = challenges.filter((c) => c.isCompleted).length;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 border cursor-pointer"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          Desafios
        </span>
        <Badge variant="secondary" className="text-xs">
          {completedCount}/{challenges.length}
        </Badge>
      </div>
      <Progress 
        value={(completedCount / challenges.length) * 100} 
        className="h-1.5"
      />
    </motion.div>
  );
}
