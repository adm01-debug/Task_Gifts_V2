import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { forwardRef } from "react";

export const skeletonVariants = cva(
  "rounded-md animate-pulse",
  {
    variants: {
      variant: {
        default: "bg-muted/40",
        shimmer: "bg-gradient-to-r from-muted/30 via-muted/60 to-muted/30 bg-[length:400%_100%] animate-shimmer",
        glow: "bg-muted/30 relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent after:animate-shimmer shadow-inner shadow-primary/5",
        subtle: "bg-muted/20",
        card: "bg-card/40 border border-white/5 shadow-xs backdrop-blur-sm",
        tactic: "bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.05)]",
        elite: "bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] backdrop-blur-xl",
      },
      shape: {
        default: "rounded-md",
        circle: "rounded-full",
        square: "rounded-none",
        pill: "rounded-full",
        card: "rounded-[1.25rem]",
        module: "rounded-[2.5rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      shape: "default",
    },
  }
);

export interface SkeletonProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({ className, variant, shape, ...props }: SkeletonProps) {
  return (
    <div 
      className={cn(skeletonVariants({ variant, shape }), className)} 
      {...props} 
    />
  );
}

// Pre-built skeleton components for common patterns

interface SkeletonTextProps extends SkeletonProps {
  lines?: number;
  lastLineWidth?: string;
}

export function SkeletonText({ 
  lines = 3, 
  lastLineWidth = "60%", 
  className, 
  ...props 
}: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="shimmer"
          className="h-4"
          style={{ 
            width: i === lines - 1 ? lastLineWidth : "100%" 
          }}
          {...props}
        />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ className, ...props }: SkeletonProps) {
  return (
    <Skeleton
      variant="shimmer"
      shape="circle"
      className={cn("h-10 w-10", className)}
      {...props}
    />
  );
}

export function SkeletonCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-xl border border-border bg-card space-y-4", className)} {...props}>
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton variant="shimmer" className="h-4 w-32" />
          <Skeleton variant="shimmer" className="h-3 w-24" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function SkeletonStatCard({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-2xl border border-border bg-card", className)} {...props}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton variant="glow" shape="card" className="h-10 w-10" />
        <Skeleton variant="shimmer" shape="pill" className="h-5 w-16" />
      </div>
      <Skeleton variant="shimmer" className="h-4 w-20 mb-2" />
      <Skeleton variant="shimmer" className="h-8 w-28" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className, ...props }: SkeletonProps & { rows?: number; cols?: number }) {
  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", className)} {...props}>
      {/* Header */}
      <div className="flex gap-4 p-4 bg-muted/30 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} variant="shimmer" className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex gap-4 p-4 border-b border-border last:border-b-0"
        >
          {Array.from({ length: cols }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="shimmer" 
              className="h-4 flex-1" 
              style={{ 
                animationDelay: `${(rowIndex * cols + colIndex) * 50}ms` 
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <SkeletonAvatar className="h-8 w-8" />
          <div className="flex-1 space-y-1.5">
            <Skeleton variant="shimmer" className="h-4 w-3/4" />
            <Skeleton variant="shimmer" className="h-3 w-1/2" />
          </div>
          <Skeleton variant="shimmer" shape="pill" className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

// Pre-computed heights for consistent rendering
const CHART_BAR_HEIGHTS = [65, 42, 88, 35, 72, 55, 80];

export function SkeletonChart({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-xl border border-border bg-card", className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="shimmer" className="h-5 w-32" />
        <Skeleton variant="shimmer" shape="pill" className="h-8 w-24" />
      </div>
      <div className="flex items-end gap-2 h-40">
        {CHART_BAR_HEIGHTS.map((height, i) => (
          <Skeleton 
            key={i}
            variant="glow"
            className="flex-1 rounded-t-md"
            style={{ 
              height: `${height}%`,
              animationDelay: `${i * 100}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SkeletonLeaderboard({ items = 5, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div 
          key={i} 
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/5 backdrop-blur-sm"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <Skeleton 
            variant="subtle" 
            className="h-4 w-6" 
          />
          <Skeleton 
            variant="tactic" 
            shape="circle" 
            className="h-12 w-12" 
          />
          <div className="flex-1 space-y-2">
            <Skeleton variant="shimmer" className="h-4 w-32" />
            <Skeleton variant="subtle" className="h-3 w-20" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton variant="glow" className="h-5 w-20 ml-auto" />
            <Skeleton variant="subtle" className="h-3 w-14 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMission({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-xl border border-border bg-card", className)} {...props}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <Skeleton variant="glow" shape="card" className="h-12 w-12 shrink-0" />
        
        {/* Content */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="shimmer" className="h-5 w-40" />
            <Skeleton variant="shimmer" shape="pill" className="h-5 w-16" />
          </div>
          <Skeleton variant="shimmer" className="h-4 w-3/4" />
          
          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Skeleton variant="shimmer" className="h-3 w-16" />
              <Skeleton variant="shimmer" className="h-3 w-12" />
            </div>
            <Skeleton variant="shimmer" className="h-2 w-full" />
          </div>
        </div>
        
        {/* Rewards */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex gap-2">
            <Skeleton variant="shimmer" shape="pill" className="h-6 w-14" />
            <Skeleton variant="shimmer" shape="pill" className="h-6 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonMissionList({ items = 3, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <SkeletonMission />
        </div>
      ))}
    </div>
  );
}

export function SkeletonQuest({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 border-b border-border last:border-b-0", className)} {...props}>
      <div className="flex items-start gap-3">
        {/* Status */}
        <Skeleton variant="shimmer" shape="circle" className="h-5 w-5 mt-0.5 shrink-0" />
        
        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton variant="glow" className="h-6 w-6" />
            <Skeleton variant="shimmer" className="h-4 w-32" />
          </div>
          <Skeleton variant="shimmer" className="h-3 w-2/3" />
          
          {/* Progress */}
          <div className="space-y-1">
            <div className="flex justify-between">
              <Skeleton variant="shimmer" className="h-3 w-14" />
              <Skeleton variant="shimmer" className="h-3 w-10" />
            </div>
            <Skeleton variant="shimmer" className="h-1.5 w-full" />
          </div>
          
          {/* Rewards */}
          <div className="flex gap-3">
            <Skeleton variant="shimmer" className="h-4 w-16" />
            <Skeleton variant="shimmer" className="h-4 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonQuestList({ items = 3, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("divide-y divide-border", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 80}ms` }}>
          <SkeletonQuest />
        </div>
      ))}
    </div>
  );
}

export function SkeletonDuel({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4", className)} {...props}>
      {/* Title */}
      <div className="flex items-center justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Skeleton variant="shimmer" className="h-4 w-24" />
            <Skeleton variant="glow" shape="pill" className="h-4 w-14" />
          </div>
          <Skeleton variant="shimmer" className="h-3 w-36" />
        </div>
        <Skeleton variant="shimmer" className="h-4 w-4" />
      </div>
      
      {/* VS Battle */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton variant="glow" shape="circle" className="h-8 w-8" />
            <div className="space-y-1">
              <Skeleton variant="shimmer" className="h-4 w-16" />
              <Skeleton variant="shimmer" className="h-3 w-12" />
            </div>
          </div>
          <Skeleton variant="shimmer" className="h-5 w-8" />
          <div className="flex items-center gap-2">
            <div className="space-y-1 text-right">
              <Skeleton variant="shimmer" className="h-4 w-16 ml-auto" />
              <Skeleton variant="shimmer" className="h-3 w-12 ml-auto" />
            </div>
            <Skeleton variant="glow" shape="circle" className="h-8 w-8" />
          </div>
        </div>
        
        {/* Progress Bar */}
        <Skeleton variant="shimmer" className="h-3 w-full" />
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-3 w-20" />
        <Skeleton variant="glow" className="h-4 w-16" />
      </div>
    </div>
  );
}

export function SkeletonDuelList({ items = 2, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("divide-y divide-border", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 120}ms` }}>
          <SkeletonDuel />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Kudos item
export function SkeletonKudos({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-start gap-3 p-3", className)} {...props}>
      {/* Overlapping avatars */}
      <div className="flex -space-x-2">
        <Skeleton variant="shimmer" shape="circle" className="w-8 h-8 border-2 border-card" />
        <Skeleton variant="shimmer" shape="circle" className="w-8 h-8 border-2 border-card" />
      </div>
      {/* Content */}
      <div className="flex-1 space-y-2">
        <Skeleton variant="shimmer" className="h-3 w-32" />
        <Skeleton variant="default" className="h-4 w-full" />
        <Skeleton variant="default" className="h-3 w-20" />
      </div>
      {/* Badge */}
      <Skeleton variant="glow" shape="square" className="w-8 h-8 rounded-lg" />
    </div>
  );
}

// List of kudos skeletons
export function SkeletonKudosList({ count = 5, className, ...props }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("divide-y divide-border", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 75}ms` }}>
          <SkeletonKudos />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Ranking item
export function SkeletonRankingItem({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl border border-border", className)} {...props}>
      {/* Rank */}
      <Skeleton variant="glow" shape="circle" className="w-6 h-6" />
      {/* Avatar */}
      <Skeleton variant="shimmer" shape="circle" className="w-10 h-10" />
      {/* Info */}
      <div className="flex-1 space-y-1.5">
        <Skeleton variant="shimmer" className="h-4 w-28" />
        <Skeleton variant="default" className="h-3 w-20" />
      </div>
      {/* Count badge */}
      <Skeleton variant="glow" shape="pill" className="w-10 h-6" />
    </div>
  );
}

// List of ranking skeletons
export function SkeletonRankingList({ count = 5, className, ...props }: SkeletonProps & { count?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <SkeletonRankingItem />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Social Feed activity
export function SkeletonActivity({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-start gap-3 py-3 px-2", className)} {...props}>
      {/* Avatar with icon */}
      <div className="relative">
        <Skeleton variant="shimmer" shape="circle" className="w-10 h-10" />
        <Skeleton variant="glow" shape="circle" className="absolute -bottom-1 -right-1 w-5 h-5" />
      </div>
      {/* Content */}
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton variant="shimmer" className="h-4 w-24" />
          <Skeleton variant="default" className="h-3 w-40" />
        </div>
        <Skeleton variant="default" className="h-3 w-20" />
        {/* Reactions */}
        <div className="flex items-center gap-2 mt-2">
          <Skeleton variant="subtle" shape="pill" className="w-12 h-6" />
          <Skeleton variant="subtle" shape="pill" className="w-12 h-6" />
          <Skeleton variant="subtle" shape="pill" className="w-16 h-6" />
        </div>
      </div>
      {/* XP Badge */}
      <Skeleton variant="glow" shape="pill" className="w-16 h-6" />
    </div>
  );
}

// List of activity skeletons
export const SkeletonActivityList = forwardRef<HTMLDivElement, SkeletonProps & { count?: number }>(
  function SkeletonActivityList({ count = 5, className, ...props }, ref) {
    return (
      <div ref={ref} className={cn("space-y-1", className)} {...props}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ animationDelay: `${i * 75}ms` }}>
            <SkeletonActivity />
          </div>
        ))}
      </div>
    );
  }
);

// Skeleton for Widget header
export function SkeletonWidgetHeader({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 border-b border-border", className)} {...props}>
      <div className="flex items-center gap-2">
        <Skeleton variant="glow" className="w-8 h-8 rounded-lg" />
        <div className="space-y-1">
          <Skeleton variant="shimmer" className="h-4 w-24" />
          <Skeleton variant="shimmer" className="h-3 w-16" />
        </div>
      </div>
      <Skeleton variant="shimmer" shape="pill" className="h-6 w-16" />
    </div>
  );
}

// Complete Widget Skeleton
export function SkeletonWidget({ 
  className,
  headerTitle = true,
  items = 3,
  ...props 
}: SkeletonProps & { headerTitle?: boolean; items?: number }) {
  return (
    <div className={cn("bg-card rounded-2xl border border-border overflow-hidden", className)} {...props}>
      {headerTitle && <SkeletonWidgetHeader />}
      <div className="p-4 space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-3" style={{ animationDelay: `${i * 100}ms` }}>
            <Skeleton variant="shimmer" shape="circle" className="w-10 h-10" />
            <div className="flex-1 space-y-1.5">
              <Skeleton variant="shimmer" className="h-4 w-3/4" />
              <Skeleton variant="shimmer" className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Skeleton for Certification card
export function SkeletonCertification({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-4 rounded-xl border border-border bg-card/50", className)} {...props}>
      <div className="flex items-start gap-4">
        <Skeleton variant="glow" className="w-12 h-12 rounded-lg shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="shimmer" className="h-5 w-32" />
            <Skeleton variant="shimmer" shape="pill" className="h-5 w-16" />
          </div>
          <Skeleton variant="shimmer" className="h-4 w-full" />
          <div className="flex items-center gap-3">
            <Skeleton variant="shimmer" shape="pill" className="h-5 w-20" />
            <Skeleton variant="shimmer" className="h-4 w-24" />
            <Skeleton variant="shimmer" className="h-4 w-28" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonCertificationList({ items = 3, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("space-y-3", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 100}ms` }}>
          <SkeletonCertification />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Notification item
export function SkeletonNotification({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-start gap-3 p-3", className)} {...props}>
      <Skeleton variant="shimmer" shape="circle" className="w-8 h-8 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <Skeleton variant="shimmer" className="h-4 w-3/4" />
        <Skeleton variant="shimmer" className="h-3 w-full" />
        <Skeleton variant="shimmer" className="h-3 w-16" />
      </div>
    </div>
  );
}

export function SkeletonNotificationList({ items = 5, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("divide-y divide-border", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 50}ms` }}>
          <SkeletonNotification />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Shop/Reward item
export function SkeletonReward({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("p-3 rounded-xl border border-border", className)} {...props}>
      <div className="flex justify-between items-start mb-2">
        <Skeleton variant="shimmer" shape="pill" className="h-4 w-14" />
        <Skeleton variant="glow" className="h-4 w-4" />
      </div>
      <Skeleton variant="shimmer" className="h-10 w-10 mx-auto mb-2" />
      <Skeleton variant="shimmer" className="h-4 w-full mb-1" />
      <Skeleton variant="shimmer" className="h-3 w-3/4 mx-auto mb-3" />
      <Skeleton variant="shimmer" className="h-7 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonRewardGrid({ items = 4, className, ...props }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 p-4", className)} {...props}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 75}ms` }}>
          <SkeletonReward />
        </div>
      ))}
    </div>
  );
}

// Skeleton for Profile header
export function SkeletonProfileHeader({ className, ...props }: SkeletonProps) {
  return (
    <div className={cn("flex items-center gap-4 p-4", className)} {...props}>
      <Skeleton variant="glow" shape="circle" className="w-16 h-16" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="shimmer" className="h-6 w-40" />
        <Skeleton variant="shimmer" className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton variant="shimmer" shape="pill" className="h-5 w-16" />
          <Skeleton variant="shimmer" shape="pill" className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
