import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { LevelUpCelebration } from "@/components/ui/level-up-celebration";
import { gamifiedToast } from "@/components/ui/gamified-toast";

interface GamificationContextType {
  // Level up celebration
  celebrateLevelUp: (previousLevel: number, newLevel: number, rewards?: {
    xp?: number;
    coins?: number;
    title?: string;
    badge?: string;
  }) => void;
  
  // Gamified toasts
  toast: typeof gamifiedToast;
  
  // Reward user
  rewardXP: (amount: number, description?: string) => void;
  rewardCoins: (amount: number, description?: string) => void;
  unlockAchievement: (title: string, description?: string) => void;
  completeQuest: (title: string, description?: string) => void;
  updateStreak: (days: number) => void;
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error("useGamification must be used within GamificationProvider");
  }
  return context;
}

// Safe hook that doesn't throw if not in provider
export function useGamificationSafe() {
  return useContext(GamificationContext);
}

interface GamificationProviderProps {
  children: ReactNode;
}

export function GamificationProvider({ children }: GamificationProviderProps) {
  const [levelUpState, setLevelUpState] = useState<{
    isOpen: boolean;
    previousLevel: number;
    newLevel: number;
    rewards?: {
      xp?: number;
      coins?: number;
      title?: string;
      badge?: string;
    };
  }>({
    isOpen: false,
    previousLevel: 1,
    newLevel: 2,
  });

  const celebrateLevelUp = useCallback((
    previousLevel: number,
    newLevel: number,
    rewards?: {
      xp?: number;
      coins?: number;
      title?: string;
      badge?: string;
    }
  ) => {
    setLevelUpState({
      isOpen: true,
      previousLevel,
      newLevel,
      rewards,
    });
  }, []);

  const closeLevelUp = useCallback(() => {
    setLevelUpState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const rewardXP = useCallback((amount: number, description?: string) => {
    gamifiedToast.xp(amount, description);
  }, []);

  const rewardCoins = useCallback((amount: number, description?: string) => {
    gamifiedToast.coins(amount, description);
  }, []);

  const unlockAchievement = useCallback((title: string, description?: string) => {
    gamifiedToast.achievement(title, description);
  }, []);

  const completeQuest = useCallback((title: string, description?: string) => {
    gamifiedToast.quest(title, description);
  }, []);

  const updateStreak = useCallback((days: number) => {
    gamifiedToast.streak(days);
  }, []);

  const value: GamificationContextType = {
    celebrateLevelUp,
    toast: gamifiedToast,
    rewardXP,
    rewardCoins,
    unlockAchievement,
    completeQuest,
    updateStreak,
  };

  // Expose methods for service layer usage
  useEffect(() => {
    (window as any).__GAMIFICATION_CONTEXT__ = {
      rewardXP,
      rewardCoins,
      unlockAchievement,
      completeQuest,
      updateStreak,
      celebrateLevelUp
    };
  }, [rewardXP, rewardCoins, unlockAchievement, completeQuest, updateStreak, celebrateLevelUp]);

  return (
    <GamificationContext.Provider value={value}>
      {children}
      
      {/* Level Up Celebration Modal */}
      <LevelUpCelebration
        isOpen={levelUpState.isOpen}
        onClose={closeLevelUp}
        previousLevel={levelUpState.previousLevel}
        newLevel={levelUpState.newLevel}
        rewards={levelUpState.rewards}
      />
    </GamificationContext.Provider>
  );
}
