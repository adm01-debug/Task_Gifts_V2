import { useEffect, useRef, useState, useMemo, useCallback, memo } from "react";
import { motion, Variants } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Zap, Flame, Trophy, Target, TrendingUp, Users, Clock, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useUserRank } from "@/hooks/useUserRank";
import { SkeletonStatCard } from "@/components/ui/skeleton";
import { AnimatedFireIndicator } from "@/components/effects/AnimatedFireIndicator";
import { AnimatedTrophyIndicator } from "@/components/effects/AnimatedTrophyIndicator";
import { AnimatedLevelIndicator } from "@/components/effects/AnimatedLevelIndicator";
import { AnimatedCoinsIndicator } from "@/components/effects/AnimatedCoinsIndicator";
import { AnimatedXPParticles } from "@/components/effects/AnimatedXPParticles";
import { MiniConfetti } from "@/components/effects/MiniConfetti";
import { HelpTooltip, helpTexts } from "@/components/HelpTooltip";
import { useFirstTimeIndicator } from "@/hooks/useFirstTimeIndicator";
import { useSoundEffects } from "@/hooks/useSoundEffects";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  color: "primary" | "secondary" | "success" | "warning" | "accent";
  delay?: number;
  isLoading?: boolean;
  pulse?: "primary" | "warning" | "success";
  fireIndicator?: number;
  trophyIndicator?: number;
  levelIndicator?: number;
  coinsIndicator?: number;
  xpParticles?: { active: boolean; gained: number };
  helpText?: string;
}

const colorClasses = {
  primary: {
    bg: "from-primary/20 to-primary/5",
    icon: "text-primary",
    glow: "shadow-[0_0_30px_hsl(var(--primary)/0.2)]",
  },
  secondary: {
    bg: "from-secondary/20 to-secondary/5",
    icon: "text-secondary",
    glow: "shadow-[0_0_30px_hsl(var(--secondary)/0.2)]",
  },
  success: {
    bg: "from-success/20 to-success/5",
    icon: "text-success",
    glow: "shadow-[0_0_30px_hsl(var(--success)/0.2)]",
  },
  warning: {
    bg: "from-warning/20 to-warning/5",
    icon: "text-warning",
    glow: "shadow-[0_0_30px_hsl(var(--warning)/0.2)]",
  },
  accent: {
    bg: "from-accent/20 to-accent/5",
    icon: "text-accent",
    glow: "shadow-[0_0_30px_hsl(var(--accent)/0.2)]",
  },
};

const pulseClasses = {
  primary: "card-pulse-subtle",
  warning: "card-pulse-warning",
  success: "card-pulse-success",
};

import { Card, CardContent } from "@/components/ui/card";

const StatCard = ({ icon: Icon, label, value, change, changeType = "neutral", color, delay = 0, isLoading, pulse, fireIndicator, trophyIndicator, levelIndicator, coinsIndicator, xpParticles, helpText }: StatCardProps) => {
  const colors = colorClasses[color];

  if (isLoading) {
    return <SkeletonStatCard />;
  }

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative"
    >
      <Card
        variant="ultra"
        className={cn(
          "p-0 overflow-hidden group border-border/40",
          pulse && pulseClasses[pulse]
        )}
      >
        <CardContent className="p-5 relative z-10">
      {/* XP Particles effect */}
      {xpParticles && (
        <AnimatedXPParticles 
          isActive={xpParticles.active} 
          xpGained={xpParticles.gained}
        />
      )}

      {/* Level indicator for XP card */}
      {levelIndicator !== undefined && levelIndicator > 0 && (
        <AnimatedLevelIndicator level={levelIndicator} playSound={true} />
      )}

      {/* Fire indicator for streak */}
      {fireIndicator !== undefined && fireIndicator > 0 && (
        <AnimatedFireIndicator streakDays={fireIndicator} playSound={true} />
      )}

      {/* Trophy indicator for top 3 ranking */}
      {trophyIndicator !== undefined && trophyIndicator >= 1 && trophyIndicator <= 3 && (
        <AnimatedTrophyIndicator rank={trophyIndicator} playSound={true} />
      )}

      {/* Coins indicator for quests card */}
      {coinsIndicator !== undefined && coinsIndicator >= 100 && (
        <AnimatedCoinsIndicator coins={coinsIndicator} />
      )}

      {/* Advanced Glass Backdrop */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br opacity-[0.08] dark:opacity-[0.15] group-hover:opacity-[0.12] dark:group-hover:opacity-[0.2] transition-opacity duration-500",
        colors.bg
      )} />
      
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />

          <div className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-5">
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: delay + 0.2, type: "spring", stiffness: 260, damping: 20 }}
                  className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg ring-1 ring-white/10",
                    colors.bg
                  )}
                >
                  <Icon className={cn("w-6 h-6", colors.icon)} />
                </motion.div>
                <div className={cn("absolute -inset-2 rounded-2xl blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-500", colors.bg)} />
              </div>
              
              {change && (
                <motion.div 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: delay + 0.3 }}
                  className={cn(
                    "flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border border-border/50 backdrop-blur-md",
                    changeType === "positive" && "bg-success/10 text-success border-success/20",
                    changeType === "negative" && "bg-destructive/10 text-destructive border-destructive/20",
                    changeType === "neutral" && "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {changeType === "positive" && <TrendingUp className="w-3 h-3" />}
                  {change}
                </motion.div>
              )}
            </div>

            <div className="mt-auto space-y-2">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
                {helpText && <HelpTooltip content={helpText} side="right" />}
              </div>
              <div className="flex items-end justify-between gap-2">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: delay + 0.25, type: "spring", stiffness: 300 }}
                  className="text-4xl font-black tracking-tighter leading-none"
                >
                  {value}
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-1.5 rounded-xl bg-muted/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const StatsGrid = () => {
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: rankData, isLoading: rankLoading } = useUserRank();
  const { checkAndTrigger, celebrationType, clearCelebration } = useFirstTimeIndicator();
  const { playXPSound } = useSoundEffects();

  const isLoading = profileLoading || rankLoading;

  // Track XP changes for real-time particles
  const previousXP = useRef<number | null>(null);
  const [xpParticlesState, setXpParticlesState] = useState({ active: false, gained: 0 });

  // Detect XP changes
  useEffect(() => {
    if (!isLoading && profile?.xp !== undefined) {
      if (previousXP.current !== null && profile.xp > previousXP.current) {
        const gained = profile.xp - previousXP.current;
        setXpParticlesState({ active: true, gained });
        playXPSound();
        
        // Reset after animation
        const timer = setTimeout(() => {
          setXpParticlesState({ active: false, gained: 0 });
        }, 2000);
        
        previousXP.current = profile.xp;
        return () => clearTimeout(timer);
      }
      previousXP.current = profile.xp;
    }
  }, [profile?.xp, isLoading, playXPSound]);

  // Check for first-time indicators when data loads
  useEffect(() => {
    if (!isLoading && profile) {
      if (profile.level && profile.level > 0) {
        checkAndTrigger("level", profile.level);
      }
      if (profile.streak && profile.streak > 0) {
        checkAndTrigger("streak", profile.streak);
      }
    }
  }, [profile, isLoading, checkAndTrigger]);

  useEffect(() => {
    if (!isLoading && rankData?.rank && rankData.rank >= 1 && rankData.rank <= 3) {
      checkAndTrigger("trophy", rankData.rank);
    }
  }, [rankData, isLoading, checkAndTrigger]);

  const stats: StatCardProps[] = useMemo(() => [
    {
      icon: Zap,
      label: "XP Total",
      value: profile?.xp?.toLocaleString() || "0",
      change: profile?.xp ? `Nível ${profile.level}` : undefined,
      changeType: "positive" as const,
      color: "success" as const,
      isLoading,
      levelIndicator: profile?.level || 0,
      xpParticles: xpParticlesState,
      helpText: helpTexts.xp,
    },
    {
      icon: Flame,
      label: "Streak Atual",
      value: `${profile?.streak || 0} dias`,
      change: profile?.best_streak ? `Melhor: ${profile.best_streak}` : undefined,
      changeType: "neutral" as const,
      color: "primary" as const,
      isLoading,
      pulse: profile?.streak && profile.streak >= 3 ? "primary" as const : undefined,
      fireIndicator: profile?.streak || 0,
      helpText: helpTexts.streak,
    },
    {
      icon: Trophy,
      label: "Ranking",
      value: rankData?.rank ? `#${rankData.rank}` : "-",
      change: rankData?.tier || undefined,
      changeType: "positive" as const,
      color: "warning" as const,
      isLoading,
      pulse: rankData?.rank && rankData.rank <= 10 ? "warning" as const : undefined,
      trophyIndicator: rankData?.rank || undefined,
      helpText: helpTexts.ranking,
    },
    {
      icon: Target,
      label: "Quests Completas",
      value: profile?.quests_completed?.toString() || "0",
      change: profile?.coins ? `${profile.coins} coins` : undefined,
      changeType: "positive" as const,
      color: "secondary" as const,
      isLoading,
      coinsIndicator: profile?.coins || 0,
      helpText: helpTexts.quests,
    },
  ], [profile, rankData, isLoading, xpParticlesState]);

  return (
    <>
      {/* Celebration confetti for first-time indicators */}
      <MiniConfetti
        isActive={celebrationType !== null}
        type={celebrationType || "level"}
        onComplete={clearCelebration}
      />

      <motion.div 
        data-tour="stats-grid"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={i * 0.1} />
        ))}
      </motion.div>
    </>
  );
};

// Quick Actions variants
const quickActionsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.4,
    },
  },
};

const quickActionItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 15,
    scale: 0.9,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

// Additional component for quick actions
export const QuickActions = memo(function QuickActions() {
  const navigate = useNavigate();

  const goToQuestBuilder = useCallback(() => navigate("/quest-builder"), [navigate]);
  const goToDuels = useCallback(() => navigate("/duelos"), [navigate]);
  const goToTrails = useCallback(() => navigate("/trails"), [navigate]);
  
  const actions = useMemo(() => [
    { icon: Target, label: "Nova Quest", color: "primary", onClick: goToQuestBuilder },
    { icon: Users, label: "Desafio", color: "secondary", onClick: goToDuels },
    { icon: Clock, label: "Evento", color: "accent", onClick: goToTrails },
  ], [goToQuestBuilder, goToDuels, goToTrails]);

  return (
    <motion.div
      data-tour="quick-actions"
      variants={quickActionsContainerVariants}
      initial="hidden"
      animate="visible"
      className="flex gap-2"
    >
      {actions.map((action, index) => (
        <motion.button
          key={action.label}
          variants={quickActionItemVariants}
          whileHover={{ 
            scale: 1.05, 
            y: -2,
            transition: { duration: 0.2 } 
          }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl border border-border",
            "bg-gradient-to-r hover:border-primary/30 transition-all duration-200",
            action.color === "primary" && "from-primary/10 to-transparent",
            action.color === "secondary" && "from-secondary/10 to-transparent",
            action.color === "accent" && "from-accent/10 to-transparent"
          )}
        >
          <motion.div
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ delay: 0.5 + index * 0.1, type: "spring", stiffness: 200 }}
          >
            <action.icon className={cn(
              "w-4 h-4",
              action.color === "primary" && "text-primary",
              action.color === "secondary" && "text-secondary",
              action.color === "accent" && "text-accent"
            )} />
          </motion.div>
          <span className="text-sm font-medium">{action.label}</span>
          <motion.div
            initial={{ x: -5, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 + index * 0.1 }}
          >
            <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
          </motion.div>
        </motion.button>
      ))}
    </motion.div>
  );
});
