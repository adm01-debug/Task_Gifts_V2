import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profilesService, type Profile, type ProfileUpdate } from "@/services/profilesService";
import { useAuth } from "./useAuth";
import { useSoundEffects } from "./useSoundEffects";
import { useAchievementNotification } from "@/contexts/AchievementNotificationContext";

export const profileKeys = {
  all: ["profiles"] as const,
  lists: () => [...profileKeys.all, "list"] as const,
  list: (filters: string) => [...profileKeys.lists(), { filters }] as const,
  details: () => [...profileKeys.all, "detail"] as const,
  detail: (id: string) => [...profileKeys.details(), id] as const,
  leaderboard: (limit: number) => [...profileKeys.all, "leaderboard", limit] as const,
  current: () => [...profileKeys.all, "current"] as const,
};

export function useProfile(id: string) {
  return useQuery({
    queryKey: profileKeys.detail(id),
    queryFn: () => profilesService.getById(id),
    enabled: !!id,
  });
}

export function useCurrentProfile() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: profileKeys.current(),
     queryFn: () => profilesService.getById(user?.id || ""),
    enabled: !!user?.id,
  });
}

export function useProfiles() {
  return useQuery({
    queryKey: profileKeys.lists(),
    queryFn: () => profilesService.getAll(),
  });
}

export function useLeaderboard(limit = 10) {
  return useQuery({
    queryKey: profileKeys.leaderboard(limit),
    queryFn: () => profilesService.getLeaderboard(limit),
    staleTime: 30000, // 30 seconds - leaderboard can be slightly stale
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: ProfileUpdate }) =>
      profilesService.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(data.id), data);
      if (user?.id === data.id) {
        queryClient.setQueryData(profileKeys.current(), data);
      }
      queryClient.invalidateQueries({ queryKey: profileKeys.lists() });
      queryClient.invalidateQueries({ queryKey: profileKeys.leaderboard(10) });
    },
  });
}

export function useAddXp() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { playLevelUpSound, playXPSound } = useSoundEffects();
  const { triggerLevelUp } = useAchievementNotification();

  return useMutation({
    mutationFn: ({ id, xpAmount, source }: { id: string; xpAmount: number; source?: string }) =>
      profilesService.addXp(id, xpAmount, source),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(data.profile.id), data.profile);
      if (user?.id === data.profile.id) {
        queryClient.setQueryData(profileKeys.current(), data.profile);
        
        // Play XP sound
        playXPSound();
        
        // Trigger level-up celebration if leveled up
        if (data.leveledUp && data.newLevel) {
          playLevelUpSound();
          triggerLevelUp(data.newLevel);
        }
      }
      queryClient.invalidateQueries({ queryKey: profileKeys.leaderboard(10) });
    },
  });
}

export function useAddCoins() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, coinsAmount }: { id: string; coinsAmount: number }) =>
      profilesService.addCoins(id, coinsAmount),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(data.id), data);
      if (user?.id === data.id) {
        queryClient.setQueryData(profileKeys.current(), data);
      }
    },
  });
}

export function useIncrementStreak() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => profilesService.incrementStreak(id),
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.detail(data.id), data);
      if (user?.id === data.id) {
        queryClient.setQueryData(profileKeys.current(), data);
      }
    },
  });
}
