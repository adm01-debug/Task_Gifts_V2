import { motion } from "framer-motion";
import { Crown, Medal, Award, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

 export type RankTier = "master" | "champion" | "top3" | "top10" | "top50" | "rising" | null;

interface RankingBadgeProps {
  rank: number | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animate?: boolean;
  className?: string;
}

const rankConfig: Record<
  Exclude<RankTier, null>,
  {
    icon: React.ElementType;
    label: string;
    description: string;
    gradient: string;
    iconColor: string;
    glowColor: string;
    borderColor: string;
  }
> = {
  champion: {
    icon: Crown,
    label: "Campeão",
    description: "1º lugar no ranking!",
    gradient: "from-yellow-400 via-amber-500 to-yellow-600",
    iconColor: "text-yellow-900",
    glowColor: "shadow-yellow-500/50",
    borderColor: "border-yellow-400",
  },
  top3: {
    icon: Medal,
    label: "Top 3",
    description: "Entre os 3 melhores!",
    gradient: "from-slate-300 via-gray-400 to-slate-500",
    iconColor: "text-slate-900",
    glowColor: "shadow-slate-400/50",
    borderColor: "border-slate-300",
  },
  top10: {
    icon: Award,
    label: "Top 10",
    description: "Entre os 10 melhores!",
    gradient: "from-orange-400 via-amber-600 to-orange-700",
    iconColor: "text-orange-900",
    glowColor: "shadow-orange-500/50",
    borderColor: "border-orange-400",
  },
  top50: {
    icon: Star,
    label: "Top 50",
    description: "Entre os 50 melhores!",
    gradient: "from-blue-400 via-indigo-500 to-blue-600",
    iconColor: "text-blue-900",
    glowColor: "shadow-blue-500/50",
    borderColor: "border-blue-400",
  },
   rising: {
     icon: Sparkles,
     label: "Em Ascensão",
     description: "Continue evoluindo!",
     gradient: "from-emerald-400 via-teal-500 to-emerald-600",
     iconColor: "text-emerald-900",
     glowColor: "shadow-emerald-500/50",
     borderColor: "border-emerald-400",
   },
   master: {
     icon: Crown,
     label: "Mestre Supremo",
     description: "Poder absoluto no ranking!",
     gradient: "from-purple-600 via-pink-600 to-red-600",
     iconColor: "text-white",
     glowColor: "shadow-purple-500/50",
     borderColor: "border-purple-400",
   },
};

export function getRankTier(rank: number | null): RankTier {
  if (rank === null || rank <= 0) return null;
  if (rank === 1) return "champion";
  if (rank <= 3) return "top3";
  if (rank <= 10) return "top10";
  if (rank <= 50) return "top50";
  return "rising";
}

const sizeClasses = {
  sm: {
    container: "w-6 h-6",
    icon: "w-3 h-3",
    label: "text-[10px]",
  },
  md: {
    container: "w-10 h-10",
    icon: "w-5 h-5",
    label: "text-xs",
  },
  lg: {
    container: "w-14 h-14",
    icon: "w-7 h-7",
    label: "text-sm",
  },
};

export function RankingBadge({
  rank,
  size = "md",
  showLabel = false,
  animate = true,
  className,
}: RankingBadgeProps) {
  const sizes = sizeClasses[size];
  const tier = getRankTier(rank);

  // Fallback visual para rank null mantendo o layout e animação consistentes
  if (rank === null) {
    return (
      <div className={cn("flex flex-col items-center gap-1 opacity-70", className)}>
        <div className={cn("relative rounded-full bg-muted/20 p-0.5", sizes.container)}>
          <Skeleton variant="tactic" shape="circle" className="w-full h-full" />
        </div>
        {showLabel && <Skeleton variant="shimmer" className={cn("h-3 w-16 mt-1", sizes.label)} />}
      </div>
    );
  }

  // Fallback visual para rank 0 ou null mantendo o layout
  const config = tier ? rankConfig[tier] : {
    icon: Star,
    label: "Iniciante",
    description: "Comece sua jornada!",
    gradient: "from-slate-500 via-slate-600 to-slate-700",
    iconColor: "text-slate-100",
    glowColor: "shadow-slate-500/20",
    borderColor: "border-slate-500/30",
  };
  const Icon = config.icon;

  const badge = (
    <motion.div
      initial={animate ? { scale: 0, rotate: -180 } : false}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
      }}
      className={cn("relative inline-flex flex-col items-center gap-1", className)}
    >
      <motion.div
        whileHover={animate ? { scale: 1.1, rotate: 5 } : undefined}
        className={cn(
          "relative rounded-full bg-gradient-to-br p-0.5",
          config.gradient,
          animate && `shadow-lg ${config.glowColor}`
        )}
      >
        {/* Glow effect for champion */}
        {tier === "champion" && animate && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 blur-md opacity-50"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}

        <div
          className={cn(
            "relative flex items-center justify-center rounded-full bg-background",
            sizes.container
          )}
        >
          <div
            className={cn(
              "absolute inset-0.5 rounded-full bg-gradient-to-br opacity-20",
              config.gradient
            )}
          />
          <Icon className={cn(sizes.icon, config.iconColor, "relative z-10")} />
        </div>

        {/* Rank number badge */}
        {rank <= 10 && (
          <motion.div
            initial={animate ? { scale: 0 } : false}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className={cn(
              "absolute -bottom-1 -right-1 flex items-center justify-center rounded-full bg-gradient-to-br text-[8px] font-bold text-white shadow-md",
              config.gradient,
              size === "sm" ? "w-3 h-3" : size === "md" ? "w-4 h-4" : "w-5 h-5"
            )}
          >
            {rank}
          </motion.div>
        )}
      </motion.div>

      {showLabel && (
        <motion.span
          initial={animate ? { opacity: 0, y: 5 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={cn(
            "font-semibold bg-gradient-to-r bg-clip-text text-transparent",
            config.gradient,
            sizes.label
          )}
        >
          {config.label}
        </motion.span>
      )}
    </motion.div>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{badge}</TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-card border border-border shadow-lg"
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center",
              config.gradient
            )}
          >
            <Icon className={cn("w-4 h-4", config.iconColor)} />
          </div>
          <div>
            <p className="font-semibold">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            <p className="text-xs font-medium text-primary">Posição {rank > 0 ? `#${rank}` : "Não Ranqueado"}</p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

// Compact inline badge for lists
export function RankingBadgeInline({
  rank,
  className,
}: {
  rank: number | null;
  className?: string;
}) {
  const tier = getRankTier(rank);

  if (rank === null) {
    return <Skeleton variant="shimmer" shape="pill" className={cn("h-6 w-16", className)} />;
  }

  if (!tier || rank <= 0) {
    return (
      <div className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground", className)}>
        <Star className="w-3 h-3" />
        <span>#{rank || "-"}</span>
      </div>
    );
  }

  const config = rankConfig[tier];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        `bg-gradient-to-r ${config.gradient} text-white`,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      <span>#{rank}</span>
    </div>
  );
}
