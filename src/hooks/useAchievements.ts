import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { achievementsService } from "@/services/achievementsService";
import { useSoundEffects } from "./useSoundEffects";
import { useAchievementNotification, iconFromDbIcon } from "@/contexts/AchievementNotificationContext";

export function useAllAchievements() {
  return useQuery({
    queryKey: ["achievements", "all"],
    queryFn: () => achievementsService.getAllAchievements(),
  });
}

export function useUserAchievements() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["achievements", "user", user?.id],
    queryFn: () => achievementsService.getUserAchievements(user!.id),
    enabled: !!user?.id,
  });
}

export function useUnlockAchievement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playAchievementSound } = useSoundEffects();
  const { showAchievementNotification } = useAchievementNotification();

  return useMutation({
    mutationFn: (achievementKey: string) =>
      achievementsService.unlockAchievement(user!.id, achievementKey),
    onSuccess: (result) => {
      if (result.success && result.achievement) {
        queryClient.invalidateQueries({ queryKey: ["achievements", "user"] });
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
        
        playAchievementSound();
        
        showAchievementNotification({
          id: result.achievement.id,
          title: result.achievement.name,
          description: result.achievement.description || "",
          icon: iconFromDbIcon(result.achievement.icon),
          xp: result.achievement.xp_reward,
          coins: result.achievement.coin_reward,
          rarity: result.achievement.rarity as "common" | "rare" | "epic" | "legendary",
        });
      }
    },
  });
}

export function useCheckComboAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playAchievementSound } = useSoundEffects();
  const { showAchievementNotification } = useAchievementNotification();

  return useMutation({
    mutationFn: (multiplier: number) =>
      achievementsService.checkComboAchievements(user!.id, multiplier),
    onSuccess: (achievement) => {
      if (achievement) {
        queryClient.invalidateQueries({ queryKey: ["achievements", "user"] });
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
        
        playAchievementSound();
        
        showAchievementNotification({
          id: achievement.id,
          title: achievement.name,
          description: achievement.description || "",
          icon: iconFromDbIcon(achievement.icon),
          xp: achievement.xp_reward,
          coins: achievement.coin_reward,
          rarity: achievement.rarity as "common" | "rare" | "epic" | "legendary",
        });
      }
    },
  });
}
