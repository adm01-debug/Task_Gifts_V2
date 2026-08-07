import { useQuery } from "@tanstack/react-query";
import { profilesService, type Profile } from "@/services/profilesService";

export interface LeaderboardEntry extends Profile {
  rank: number;
  trend: "up" | "down" | "same";
}

export const leaderboardKeys = {
  all: ["leaderboard"] as const,
  weekly: (limit: number) => [...leaderboardKeys.all, "weekly", limit] as const,
  monthly: (limit: number) => [...leaderboardKeys.all, "monthly", limit] as const,
  allTime: (limit: number) => [...leaderboardKeys.all, "allTime", limit] as const,
};

// Transform profiles to leaderboard entries with rank
function transformToLeaderboard(profiles: Profile[]): LeaderboardEntry[] {
  return profiles.map((profile, index) => ({
    ...profile,
    rank: index + 1,
    trend: "same" as const, // In a real app, calculate based on previous rankings
  }));
}

export function useWeeklyLeaderboard(limit = 10) {
  return useQuery({
    queryKey: leaderboardKeys.weekly(limit),
    queryFn: async () => {
      const profiles = await profilesService.getLeaderboard(limit);
      return transformToLeaderboard(profiles);
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute for "live" feel
  });
}

export function useMonthlyLeaderboard(limit = 10) {
  return useQuery({
    queryKey: leaderboardKeys.monthly(limit),
    queryFn: async () => {
      const profiles = await profilesService.getLeaderboard(limit);
      return transformToLeaderboard(profiles);
    },
    staleTime: 60000, // 1 minute
  });
}

export function useAllTimeLeaderboard(limit = 10) {
  return useQuery({
    queryKey: leaderboardKeys.allTime(limit),
    queryFn: async () => {
      const profiles = await profilesService.getLeaderboard(limit);
      return transformToLeaderboard(profiles);
    },
    staleTime: 120000, // 2 minutes
  });
}

// Utility hook that provides the default leaderboard
export function useLeaderboard(limit = 10) {
  return useWeeklyLeaderboard(limit);
}
