import { useMemo } from "react";
import { motion } from "framer-motion";
import { Heart, Crown, Medal, TrendingUp, Award } from "lucide-react";
import { useRecentKudos, useKudosBadges } from "@/hooks/useKudos";
import { useProfiles } from "@/hooks/useProfiles";
import { subMonths, isAfter } from "date-fns";
import { Skeleton, SkeletonRankingList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface RankedUser {
  userId: string;
  name: string;
  initial: string;
  kudosCount: number;
  topBadge: { icon: string; name: string } | null;
}

interface BadgeStats {
  id: string;
  name: string;
  icon: string;
  count: number;
  percentage: number;
}

export const KudosRanking = () => {
  const { data: allKudos = [], isLoading } = useRecentKudos(100);
  const { data: badges = [] } = useKudosBadges();
  const { data: profiles = [] } = useProfiles();

  // Filter kudos from the last month
  const monthlyKudos = useMemo(() => {
    const oneMonthAgo = subMonths(new Date(), 1);
    return allKudos.filter(k => isAfter(new Date(k.created_at), oneMonthAgo));
  }, [allKudos]);

  // Calculate user rankings
  const rankedUsers = useMemo(() => {
    const userKudosMap = new Map<string, { count: number; badges: Map<string, number> }>();

    monthlyKudos.forEach(kudos => {
      const existing = userKudosMap.get(kudos.to_user_id) || { count: 0, badges: new Map() };
      existing.count++;
      
      if (kudos.badge_id) {
        existing.badges.set(kudos.badge_id, (existing.badges.get(kudos.badge_id) || 0) + 1);
      }
      
      userKudosMap.set(kudos.to_user_id, existing);
    });

    const ranked: RankedUser[] = [];
    
    userKudosMap.forEach((data, odersId) => {
      const profile = profiles.find(p => p.id === odersId);
      const name = profile?.display_name || "Usuário";
      
      // Find most received badge
      let topBadgeId: string | null = null;
      let topBadgeCount = 0;
      data.badges.forEach((count, badgeId) => {
        if (count > topBadgeCount) {
          topBadgeCount = count;
          topBadgeId = badgeId;
        }
      });

      const topBadge = topBadgeId ? badges.find(b => b.id === topBadgeId) : null;

      ranked.push({
        userId: odersId,
        name,
        initial: name.charAt(0).toUpperCase(),
        kudosCount: data.count,
        topBadge: topBadge ? { icon: topBadge.icon, name: topBadge.name } : null,
      });
    });

    return ranked.sort((a, b) => b.kudosCount - a.kudosCount).slice(0, 5);
  }, [monthlyKudos, profiles, badges]);

  // Calculate badge statistics
  const badgeStats = useMemo(() => {
    const badgeCountMap = new Map<string, number>();
    
    monthlyKudos.forEach(kudos => {
      if (kudos.badge_id) {
        badgeCountMap.set(kudos.badge_id, (badgeCountMap.get(kudos.badge_id) || 0) + 1);
      }
    });

    const totalBadges = Array.from(badgeCountMap.values()).reduce((a, b) => a + b, 0);
    
    const stats: BadgeStats[] = [];
    badgeCountMap.forEach((count, badgeId) => {
      const badge = badges.find(b => b.id === badgeId);
      if (badge) {
        stats.push({
          id: badge.id,
          name: badge.name,
          icon: badge.icon,
          count,
          percentage: totalBadges > 0 ? (count / totalBadges) * 100 : 0,
        });
      }
    });

    return stats.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [monthlyKudos, badges]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0:
        return <Crown className="w-4 h-4 text-gold" />;
      case 1:
        return <Medal className="w-4 h-4 text-silver" />;
      case 2:
        return <Medal className="w-4 h-4 text-bronze" />;
      default:
        return <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>;
    }
  };

  const getRankStyles = (rank: number) => {
    switch (rank) {
      case 0:
        return "from-gold/20 to-gold/5 border-gold/30";
      case 1:
        return "from-silver/20 to-silver/5 border-silver/30";
      case 2:
        return "from-bronze/20 to-bronze/5 border-bronze/30";
      default:
        return "from-muted/20 to-muted/5 border-border";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card/80 rounded-2xl border border-border/60 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton variant="glow" shape="card" className="w-8 h-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton variant="shimmer" className="h-4 w-32" />
              <Skeleton variant="shimmer" className="h-3 w-40" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <SkeletonRankingList count={5} />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl overflow-hidden shadow-xs border-border/60 bg-card/80"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center">
            <Award className="w-4 h-4 text-pink-500" />
          </div>
          <div>
            <h3 className="font-bold">Ranking Mensal</h3>
            <p className="text-xs text-muted-foreground">Mais reconhecidos do mês</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Top Recognized Users */}
        {rankedUsers.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Nenhum reconhecimento este mês"
            description="Seja o primeiro a reconhecer um colega!"
            compact
          />
        ) : (
          <div className="space-y-2">
            {rankedUsers.map((user, index) => (
              <motion.div
                key={user.userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r
                  ${getRankStyles(index)}
                `}
              >
                {/* Rank */}
                <div className="w-6 flex items-center justify-center">
                  {getRankIcon(index)}
                </div>

                {/* Avatar */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0
                  ${index === 0 ? "bg-gradient-to-br from-gold to-warning" : 
                    index === 1 ? "bg-gradient-to-br from-silver to-muted-foreground" :
                    index === 2 ? "bg-gradient-to-br from-bronze to-orange-700" :
                    "bg-gradient-to-br from-primary to-secondary"}
                `}>
                  {user.initial}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {user.kudosCount} kudos
                    </span>
                    {user.topBadge && (
                      <span className="text-xs flex items-center gap-1 text-muted-foreground">
                        • {user.topBadge.icon} {user.topBadge.name}
                      </span>
                    )}
                  </div>
                </div>

                {/* Count Badge */}
                <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {user.kudosCount}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Badge Statistics */}
        {badgeStats.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              Badges mais usados
            </h4>
            <div className="space-y-2">
              {badgeStats.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "100%" }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg w-6 text-center">{badge.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{badge.name}</span>
                      <span className="text-xs text-muted-foreground">{badge.count}x</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${badge.percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        {monthlyKudos.length > 0 && (
          <div className="pt-4 border-t border-border text-center">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{monthlyKudos.length}</span> reconhecimentos este mês
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
