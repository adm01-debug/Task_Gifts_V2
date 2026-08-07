import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AchievementContainer } from "@/components/AchievementSystem";
import { useHapticFeedback } from "@/hooks/useHaptics";

interface AchievementNotification {
  id: string;
  title: string;
  description: string;
  icon: "trophy" | "zap" | "star" | "flame" | "award";
  xp: number;
  coins?: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

interface AchievementNotificationContextType {
  showAchievementNotification: (achievement: AchievementNotification) => void;
  triggerLevelUp: (level: number) => void;
}

const AchievementNotificationContext = createContext<AchievementNotificationContextType | null>(null);

export function useAchievementNotification() {
  const context = useContext(AchievementNotificationContext);
  if (!context) {
    throw new Error("useAchievementNotification must be used within AchievementNotificationProvider");
  }
  return context;
}

const iconFromDbIcon = (dbIcon: string): "trophy" | "zap" | "star" | "flame" | "award" => {
  const iconMap: Record<string, "trophy" | "zap" | "star" | "flame" | "award"> = {
    Trophy: "trophy",
    Zap: "zap",
    Star: "star",
    Flame: "flame",
    Award: "award",
    Heart: "award",
    Target: "trophy",
    MessageCircle: "star",
    Users: "award",
    BookOpen: "star",
    GraduationCap: "trophy",
    Calendar: "flame",
  };
  return iconMap[dbIcon] || "trophy";
};

export function AchievementNotificationProvider({ children }: { children: ReactNode }) {
  const [achievements, setAchievements] = useState<AchievementNotification[]>([]);
  const [levelUp, setLevelUp] = useState<number | null>(null);
  const haptic = useHapticFeedback();

  const showAchievementNotification = useCallback((achievement: AchievementNotification) => {
    const notificationId = `${achievement.id}-${Date.now()}`;
    setAchievements(prev => [...prev, { ...achievement, id: notificationId }]);
    // Trigger haptic feedback based on rarity
    if (achievement.rarity === "legendary" || achievement.rarity === "epic") {
      haptic.achievementUnlocked();
    } else {
      haptic.questCompleted();
    }
  }, [haptic]);

  const hideAchievement = useCallback((id: string) => {
    setAchievements(prev => prev.filter(a => a.id !== id));
  }, []);

  const triggerLevelUp = useCallback((level: number) => {
    setLevelUp(level);
    haptic.levelUp();
  }, [haptic]);

  const closeLevelUp = useCallback(() => {
    setLevelUp(null);
  }, []);

  return (
    <AchievementNotificationContext.Provider value={{ showAchievementNotification, triggerLevelUp }}>
      {children}
      <AchievementContainer
        achievements={achievements}
        onHide={hideAchievement}
        levelUp={levelUp}
        onCloseLevelUp={closeLevelUp}
      />
    </AchievementNotificationContext.Provider>
  );
}

export { iconFromDbIcon };
