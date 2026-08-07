import { useQuery } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getRankTier, type RankTier } from "@/components/RankingBadge";

export interface UserRankData {
  rank: number | null;
  tier: RankTier;
  totalUsers: number;
  percentile: number | null;
  xp: number;
}

export function useUserRank() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-rank", user?.id],
    queryFn: async (): Promise<UserRankData> => {
      if (!user?.id) {
        return {
          rank: null,
          tier: null,
          totalUsers: 0,
          percentile: null,
          xp: 0,
        };
      }

      // Get all profiles ordered by XP to calculate rank
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, xp")
        .order("xp", { ascending: false });

      if (error) throw error;

      const totalUsers = profiles?.length || 0;
      const userIndex = profiles?.findIndex((p) => p.id === user.id) ?? -1;
      const rank = userIndex >= 0 ? userIndex + 1 : null;
      const userProfile = profiles?.find((p) => p.id === user.id);

      const percentile =
        rank !== null && totalUsers > 0
          ? Math.round(((totalUsers - rank) / totalUsers) * 100)
          : null;

      return {
        rank,
        tier: getRankTier(rank),
        totalUsers,
        percentile,
        xp: userProfile?.xp || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refetch every 2 minutes
  });
}
