import { motion } from "framer-motion";
import { Target, Clock, Zap, CheckCircle2, Circle, Flame, Star, Sparkles } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAllMissions, useClaimMissionReward } from "@/hooks/useMissions";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { SkeletonQuestList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { MissionWithProgress } from "@/services/missionsService";

 const DailyQuestsComponent = () => {
 export const DailyQuestsLazy = memo(DailyQuestsComponent);
 export const DailyQuests = DailyQuestsLazy;
  const [hoveredQuest, setHoveredQuest] = useState<string | null>(null);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const { data: missions = [], isLoading } = useAllMissions();
  const { data: profile } = useCurrentProfile();
  const claimMutation = useClaimMissionReward();

  // Memoize filtered missions
  const dailyMissions = useMemo(() => 
    missions.filter(m => m.frequency === "daily"), 
    [missions]
  );

  // Memoize counts
  const { completedCount, claimableCount } = useMemo(() => ({
    completedCount: dailyMissions.filter(m => m.progress?.completed_at).length,
    claimableCount: dailyMissions.filter(m => m.progress?.completed_at && !m.progress?.claimed).length,
  }), [dailyMissions]);

  // Memoize handler
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

  // Memoize time calculation
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
      className="rounded-2xl overflow-hidden shadow-lg border border-border bg-gradient-to-b from-card to-card/95"
    >
      {/* Header */}
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
            <span className="text-muted-foreground">Reset em {hoursLeft}h</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: dailyMissions.length > 0 ? `${(completedCount / dailyMissions.length) * 100}%` : "0%" }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
          />
        </div>

        {/* Claimable rewards alert */}
        {claimableCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 rounded-lg bg-success/10 border border-success/20 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-success" />
            <span className="text-xs font-medium text-success">
              {claimableCount} recompensa{claimableCount > 1 ? "s" : ""} para coletar!
            </span>
          </motion.div>
        )}
      </div>

      <div className="divide-y divide-border">
        {dailyMissions.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Nenhuma quest diária disponível"
            description="Volte mais tarde para novas quests!"
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
                transition={{ delay: 0.3 + i * 0.1 }}
                onMouseEnter={() => setHoveredQuest(mission.id)}
                onMouseLeave={() => setHoveredQuest(null)}
                className={cn(
                  "p-4 transition-all duration-200",
                  isCompleted && !isClaimed ? "bg-success/5" : "hover:bg-muted/30",
                  isClaimed && "opacity-60"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <motion.div
                    animate={isCompleted ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className="mt-0.5"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{mission.icon}</span>
                      <h4 className={cn(
                        "font-semibold text-sm",
                        isClaimed && "line-through text-muted-foreground"
                      )}>
                        {mission.title}
                      </h4>
                    </div>
                    {mission.description && (
                      <p className="text-xs text-muted-foreground mb-2">{mission.description}</p>
                    )}

                    {/* Progress */}
                    {!isClaimed && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{currentValue}/{mission.target_value}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                            className={cn(
                              "h-full rounded-full",
                              isCompleted
                                ? "bg-gradient-to-r from-success to-emerald-400"
                                : "bg-gradient-to-r from-secondary to-primary"
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Rewards */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-xp" />
                        <span className="text-xs font-semibold text-xp">+{mission.xp_reward} XP</span>
                      </div>
                      {mission.coin_reward > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-coins coin-shine" />
                          <span className="text-xs font-semibold text-coins">+{mission.coin_reward}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Claim button for completed */}
                  {isCompleted && !isClaimed && mission.progress?.id && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleClaim(mission)}
                      disabled={claimingIds.has(mission.progress.id)}
                      className="px-3 py-1.5 rounded-lg bg-success text-success-foreground text-xs font-bold disabled:opacity-50"
                    >
                      {claimingIds.has(mission.progress.id) ? "..." : "Resgatar"}
                    </motion.button>
                  )}

                  {isClaimed && (
                    <span className="px-2 py-1 rounded-lg bg-muted text-muted-foreground text-xs">
                      Coletado ✓
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Streak Bonus */}
      {profile && profile.streak > 0 && (
        <div className="p-4 border-t border-border bg-gradient-to-r from-streak/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-streak streak-fire" />
              <div>
                <p className="font-semibold text-sm">Streak Bonus Ativo!</p>
                <p className="text-xs text-muted-foreground">+25% XP em todas as quests</p>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-streak/20 text-streak font-bold text-sm">
              {profile.streak} dias 🔥
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
