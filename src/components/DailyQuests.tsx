import { motion } from "framer-motion";
import { Target, Clock, Zap, CheckCircle2, Circle, Flame, Star, Sparkles } from "lucide-react";
import { useState, useMemo, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { useAllMissions, useClaimMissionReward } from "@/hooks/useMissions";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { SkeletonQuestList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { MissionWithProgress } from "@/services/missionsService";

const DailyQuestsComponent = () => {
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const { data: missions = [], isLoading } = useAllMissions();
  const { data: profile } = useCurrentProfile();
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border overflow-hidden card-shimmer"
      >
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Quests Diárias</h3>
                <p className="text-xs text-muted-foreground">Carregando...</p>
              </div>
            </div>
          </div>
        </div>
        <SkeletonQuestList items={3} />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-2xl overflow-hidden shadow-lg border border-border bg-gradient-to-b from-card to-card/95 h-full"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold">Quests Diárias</h3>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{dailyMissions.length} completas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{hoursLeft}h</span>
          </div>
        </div>

        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: dailyMissions.length > 0 ? `${(completedCount / dailyMissions.length) * 100}%` : "0%" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>

        {claimableCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">
              {claimableCount} recompensa{claimableCount > 1 ? "s" : ""}!
            </span>
          </motion.div>
        )}
      </div>

      <div className="divide-y divide-border overflow-y-auto max-h-[300px]">
        {dailyMissions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma quest"
            description="Volte mais tarde!"
            compact
          />
        ) : (
          dailyMissions.map((mission, i) => {
            const currentValue = mission.progress?.current_value || 0;
            const isCompleted = !!mission.progress?.completed_at;
            const isClaimed = !!mission.progress?.claimed;
            const progressPercent = Math.min((currentValue / mission.target_value) * 100, 100);

            return (
              <motion.div
                key={mission.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={cn(
                  "p-3 transition-all duration-200",
                  isCompleted && !isClaimed ? "bg-success/5" : "hover:bg-muted/30",
                  isClaimed && "opacity-60"
                )}
              >
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-base">{mission.icon}</span>
                      <h4 className={cn(
                        "font-semibold text-xs truncate",
                        isClaimed && "line-through text-muted-foreground"
                      )}>
                        {mission.title}
                      </h4>
                    </div>

                    {!isClaimed && (
                      <div className="mt-1">
                        <div className="h-1 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5 }}
                            className={cn(
                              "h-full rounded-full",
                              isCompleted ? "bg-success" : "bg-primary"
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {isCompleted && !isClaimed && mission.progress?.id && (
                    <button
                      onClick={() => handleClaim(mission)}
                      disabled={claimingIds.has(mission.progress.id)}
                      className="px-2 py-1 rounded bg-success text-success-foreground text-[10px] font-bold"
                    >
                      {claimingIds.has(mission.progress.id) ? "..." : "Coletar"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};

export const DailyQuestsLazy = memo(DailyQuestsComponent);
export const DailyQuests = DailyQuestsLazy;
