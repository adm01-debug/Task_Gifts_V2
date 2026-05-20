import { motion } from "framer-motion";
import { Target, Clock, Zap, CheckCircle2, Circle, Flame, Star, Sparkles } from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { useAllMissions, useClaimMissionReward } from "@/hooks/useMissions";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { Skeleton, SkeletonQuestList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { MissionWithProgress } from "@/services/missionsService";

const DailyQuestsComponent = () => {
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const { data: missions = [], isLoading } = useAllMissions();
  const claimMutation = useClaimMissionReward();

  const dailyMissions = useMemo(() => 
    missions.filter(m => m.frequency === "daily"), 
    [missions]
  );

  const { completedCount, claimableCount } = useMemo(() => ({
    completedCount: dailyMissions.filter(m => m.progress?.completed_at).length,
    claimableCount: dailyMissions.filter(m => m.progress?.completed_at && !m.progress?.claimed).length,
  }), [dailyMissions]);

  const handleClaim = useCallback((mission: MissionWithProgress) => {
    if (mission.progress?.id) {
      const progressId = mission.progress.id;
      setClaimingIds(prev => new Set(prev).add(progressId));
      claimMutation.mutate(progressId, {
        onSettled: () => setClaimingIds(prev => {
          const next = new Set(prev);
          next.delete(progressId);
          return next;
        }),
      });
    }
  }, [claimMutation]);

  const hoursLeft = useMemo(() => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight.getTime() - now.getTime()) / (1000 * 60 * 60));
  }, []);

  if (isLoading) {
    return (
      <div className="bg-card/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl h-full flex flex-col relative">
        <div className="p-8 border-b border-white/5 bg-white/5 relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton variant="glow" shape="card" className="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton variant="shimmer" className="h-4 w-32" />
                <Skeleton variant="shimmer" className="h-2.5 w-24" />
              </div>
            </div>
            <Skeleton variant="subtle" shape="pill" className="h-9 w-24" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton variant="shimmer" className="h-3 w-28" />
              <Skeleton variant="shimmer" className="h-3 w-20" />
            </div>
            <Skeleton variant="shimmer" className="h-2 w-full rounded-full" />
          </div>
        </div>
        <div className="p-4 space-y-3 flex-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-transparent flex items-center gap-4">
              <Skeleton variant="glow" shape="card" className="w-10 h-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <Skeleton variant="shimmer" className="h-3.5 w-32" />
                  <Skeleton variant="shimmer" className="h-3 w-12" />
                </div>
                <Skeleton variant="shimmer" className="h-1.5 w-full rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-card/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden shadow-2xl h-full flex flex-col"
    >
      <div className="p-6 border-b border-white/5 bg-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow-sm">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-white leading-none mb-1">Combat Quests</h3>
              <p className="text-[10px] font-black text-muted-foreground opacity-70 italic tracking-tighter">DAILY_OBJECTIVES_ACTIVE</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-black text-white italic">{hoursLeft}H_REMAINING</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black text-muted-foreground tracking-widest uppercase">Sync Status: {Math.round((completedCount / (dailyMissions.length || 1)) * 100)}%</span>
            <span className="text-[10px] font-black text-primary italic">{completedCount}/{dailyMissions.length} COMPLETED</span>
          </div>
          <div className="h-2 rounded-full bg-black/40 overflow-hidden p-0.5 border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: dailyMissions.length > 0 ? `${(completedCount / dailyMissions.length) * 100}%` : "0%" }}
              className="h-full bg-gradient-to-r from-primary via-accent to-secondary rounded-full shadow-glow-primary"
            />
          </div>
        </div>

        {claimableCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                {claimableCount} Rewards Available
              </span>
            </div>
            <div className="text-[9px] font-black text-emerald-500/60 tracking-tighter italic group-hover:translate-x-1 transition-transform">PROCEED_TO_COORDINATES {" >>"}</div>
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        <div className="space-y-1">
          {dailyMissions.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center opacity-30">
              <Target className="w-12 h-12 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-widest">NO_OBJECTIVES_IN_SECTOR</p>
            </div>
          ) : (
            dailyMissions.map((mission, i) => {
              const currentValue = mission.progress?.current_value || 0;
              const isCompleted = !!mission.progress?.completed_at;
              const isClaimed = !!mission.progress?.claimed;
              const progressPercent = Math.min((currentValue / mission.target_value) * 100, 100);

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className={cn(
                    "relative p-4 rounded-2xl border transition-all duration-300 group",
                    isCompleted && !isClaimed 
                      ? "bg-emerald-500/10 border-emerald-500/30" 
                      : "bg-white/5 border-transparent hover:border-white/10 hover:bg-white/10",
                    isClaimed && "opacity-40 grayscale"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-xl bg-black/40 border border-white/5 shadow-inner transition-transform group-hover:scale-110",
                      isCompleted && !isClaimed && "animate-bounce"
                    )}>
                      {mission.icon}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className={cn(
                          "font-black text-[10px] uppercase tracking-widest truncate",
                          isClaimed ? "text-muted-foreground" : "text-white"
                        )}>
                          {mission.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-black text-primary italic">+{mission.xp_reward}XP</span>
                        </div>
                      </div>

                      {!isClaimed ? (
                        <div className="relative h-1 w-full bg-black/40 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            className={cn(
                              "h-full rounded-full",
                              isCompleted ? "bg-emerald-500 shadow-glow-success" : "bg-primary shadow-glow-primary"
                            )}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-500/60 uppercase tracking-tighter">
                          <CheckCircle2 className="w-3 h-3" /> OBJECTIVE_SECURED
                        </div>
                      )}
                    </div>

                    {isCompleted && !isClaimed && mission.progress?.id && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleClaim(mission)}
                        disabled={claimingIds.has(mission.progress.id)}
                        className="shrink-0 h-8 px-4 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-glow-success"
                      >
                        {claimingIds.has(mission.progress.id) ? "..." : "COLLECT"}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="p-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flame className="w-3 h-3 text-orange-500" />
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">ACTIVE_OPS_STREAK: 7D</span>
        </div>
        <span className="text-[9px] font-black text-primary tracking-tighter italic">V4.0_DELTA</span>
      </div>
    </motion.div>
  );
};

export const DailyQuestsLazy = memo(DailyQuestsComponent);
export const DailyQuests = DailyQuestsLazy;
