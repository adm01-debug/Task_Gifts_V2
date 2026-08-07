import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Users, Trophy, Target, Flame, Crown,
  ChevronRight, Star, Zap, Calendar, Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  contribution: number;
  rank: number;
}

interface TeamChallenge {
  id: string;
  title: string;
  description: string;
  type: "collaborative" | "competitive";
  icon: React.ElementType;
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  coinReward: number;
  deadline: Date;
  teamMembers: TeamMember[];
  myContribution: number;
  teamName: string;
  teamRank?: number;
  totalTeams?: number;
}

interface TeamChallengesProps {
  challenges?: TeamChallenge[];
  className?: string;
}

const defaultChallenges: TeamChallenge[] = [
  {
    id: "1",
    title: "Maratona de XP",
    description: "Juntos, acumulem 50.000 XP esta semana",
    type: "collaborative",
    icon: Zap,
    target: 50000,
    current: 32500,
    unit: "XP",
    xpReward: 1000,
    coinReward: 500,
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    teamName: "Alpha Squad",
    myContribution: 4200,
    teamMembers: [
      { id: "1", name: "Ana Silva", contribution: 8500, rank: 1 },
      { id: "2", name: "Carlos Lima", contribution: 7200, rank: 2 },
      { id: "3", name: "Maria Santos", contribution: 6800, rank: 3 },
      { id: "4", name: "João Costa", contribution: 5800, rank: 4 },
      { id: "5", name: "Você", contribution: 4200, rank: 5 },
    ],
  },
  {
    id: "2",
    title: "Desafio de Pontualidade",
    description: "Equipe com mais dias pontuais vence!",
    type: "competitive",
    icon: Calendar,
    target: 100,
    current: 78,
    unit: "dias",
    xpReward: 800,
    coinReward: 400,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    teamName: "Alpha Squad",
    teamRank: 2,
    totalTeams: 8,
    myContribution: 5,
    teamMembers: [
      { id: "1", name: "Ana Silva", contribution: 20, rank: 1 },
      { id: "2", name: "Carlos Lima", contribution: 18, rank: 2 },
      { id: "3", name: "Maria Santos", contribution: 18, rank: 3 },
      { id: "4", name: "João Costa", contribution: 17, rank: 4 },
      { id: "5", name: "Você", contribution: 5, rank: 5 },
    ],
  },
];

/**
 * TeamChallenges - Collaborative and competitive team challenges
 */
export function TeamChallenges({
  challenges = defaultChallenges,
  className,
}: TeamChallengesProps) {
  const [expandedChallenge, setExpandedChallenge] = useState<string | null>(null);

  const getDaysRemaining = (deadline: Date) => {
    const diff = deadline.getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-5 h-5 text-primary" />
          Desafios em Equipe
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {challenges.map((challenge, index) => {
          const percentage = Math.min((challenge.current / challenge.target) * 100, 100);
          const daysRemaining = getDaysRemaining(challenge.deadline);
          const isExpanded = expandedChallenge === challenge.id;
          const isCompleted = challenge.current >= challenge.target;

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "rounded-xl border overflow-hidden transition-all duration-200",
                isCompleted 
                  ? "bg-green-500/5 border-green-500/20" 
                  : "bg-card border-border"
              )}
            >
              {/* Header */}
              <button
                onClick={() => setExpandedChallenge(isExpanded ? null : challenge.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                    challenge.type === "collaborative"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-500"
                      : "bg-gradient-to-br from-orange-500 to-red-500"
                  )}>
                    <challenge.icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm">{challenge.title}</h4>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-full text-[10px] font-medium",
                        challenge.type === "collaborative"
                          ? "bg-blue-500/10 text-blue-600"
                          : "bg-orange-500/10 text-orange-600"
                      )}>
                        {challenge.type === "collaborative" ? "Colaborativo" : "Competitivo"}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {challenge.current.toLocaleString()} / {challenge.target.toLocaleString()} {challenge.unit}
                        </span>
                        <span className={cn(
                          "font-medium",
                          isCompleted ? "text-green-600" : "text-primary"
                        )}>
                          {Math.round(percentage)}%
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{challenge.teamName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{daysRemaining} dias restantes</span>
                      </div>
                      {challenge.teamRank && (
                        <div className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span>#{challenge.teamRank} de {challenge.totalTeams}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Expand indicator */}
                  <ChevronRight className={cn(
                    "w-5 h-5 text-muted-foreground transition-transform shrink-0",
                    isExpanded && "rotate-90"
                  )} />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      {/* Description */}
                      <p className="text-sm text-muted-foreground">
                        {challenge.description}
                      </p>

                      {/* Team Leaderboard */}
                      <div>
                        <h5 className="text-xs font-semibold text-muted-foreground mb-2">
                          Ranking da Equipe
                        </h5>
                        <div className="space-y-2">
                          {challenge.teamMembers.slice(0, 5).map((member, i) => (
                            <motion.div
                              key={member.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={cn(
                                "flex items-center gap-2 p-2 rounded-lg",
                                member.name === "Você" && "bg-primary/5 border border-primary/20"
                              )}
                            >
                              {/* Rank */}
                              <div className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                i === 0 && "bg-amber-500 text-white",
                                i === 1 && "bg-gray-400 text-white",
                                i === 2 && "bg-amber-700 text-white",
                                i > 2 && "bg-muted text-muted-foreground"
                              )}>
                                {member.rank}
                              </div>

                              {/* Avatar */}
                              <Avatar className="w-7 h-7">
                                <AvatarImage src={member.avatar} />
                                <AvatarFallback className="text-[10px]">
                                  {member.name.split(" ").map(n => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>

                              {/* Name */}
                              <span className={cn(
                                "flex-1 text-sm",
                                member.name === "Você" && "font-semibold text-primary"
                              )}>
                                {member.name}
                              </span>

                              {/* Contribution */}
                              <span className="text-xs font-medium text-muted-foreground">
                                {member.contribution.toLocaleString()} {challenge.unit}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Zap className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold">+{challenge.xpReward} XP</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 text-amber-500" />
                            <span className="font-semibold">+{challenge.coinReward} coins</span>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/**
 * MiniTeamChallenge - Compact version for headers
 */
export function MiniTeamChallenge({
  challengeName = "Maratona de XP",
  progress = 65,
  teamRank,
}: {
  challengeName?: string;
  progress?: number;
  teamRank?: number;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20">
      <Users className="w-4 h-4 text-blue-500" />
      <div className="flex items-center gap-1.5 text-xs">
        <span className="font-medium text-blue-600 dark:text-blue-400">{progress}%</span>
        {teamRank && (
          <>
            <span className="text-muted-foreground">•</span>
            <Trophy className="w-3 h-3 text-amber-500" />
            <span className="text-amber-600">#{teamRank}</span>
          </>
        )}
      </div>
    </div>
  );
}
