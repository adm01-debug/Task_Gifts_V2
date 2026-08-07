import { useEffect, useRef } from "react";
import { useUserRank } from "./useUserRank";
import { useAuth } from "./useAuth";
import { notificationsService } from "@/services/notificationsService";
import { useSoundEffects } from "./useSoundEffects";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

const RANK_STORAGE_KEY = "user_last_rank";

interface RankChangeData {
  previousRank: number;
  currentRank: number;
  direction: "up" | "down";
  positions: number;
}

function getStoredRank(userId: string): number | null {
  try {
    const stored = localStorage.getItem(`${RANK_STORAGE_KEY}_${userId}`);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

function storeRank(userId: string, rank: number): void {
  try {
    localStorage.setItem(`${RANK_STORAGE_KEY}_${userId}`, rank.toString());
  } catch {
    // Ignore storage errors
  }
}

function getRankChangeMessage(data: RankChangeData): {
  title: string;
  message: string;
  emoji: string;
} {
  const { currentRank, direction, positions } = data;

  if (direction === "up") {
    if (currentRank === 1) {
      return {
        title: "VOCÊ É O CAMPEÃO!",
        message: `Incrível! Você alcançou o 1º lugar no ranking! Continue assim!`,
        emoji: "🏆",
      };
    } else if (currentRank <= 3) {
      return {
        title: "Top 3 Alcançado!",
        message: `Parabéns! Você subiu ${positions} posição${positions > 1 ? "es" : ""} e agora está no #${currentRank}!`,
        emoji: "🥇",
      };
    } else if (currentRank <= 10) {
      return {
        title: "Subindo no Ranking!",
        message: `Você subiu ${positions} posição${positions > 1 ? "es" : ""} e agora está no Top 10 (#${currentRank})!`,
        emoji: "⬆️",
      };
    } else {
      return {
        title: "Ranking Atualizado",
        message: `Você subiu ${positions} posição${positions > 1 ? "es" : ""} e agora está no #${currentRank}!`,
        emoji: "📈",
      };
    }
  } else {
    if (data.previousRank === 1) {
      return {
        title: "Posição de Campeão Perdida",
        message: `Você perdeu o 1º lugar e agora está no #${currentRank}. Hora de recuperar!`,
        emoji: "👑",
      };
    } else if (data.previousRank <= 3 && currentRank > 3) {
      return {
        title: "Saiu do Top 3",
        message: `Você desceu ${positions} posição${positions > 1 ? "es" : ""} e agora está no #${currentRank}. Não desanime!`,
        emoji: "⚠️",
      };
    } else {
      return {
        title: "Ranking Atualizado",
        message: `Você desceu ${positions} posição${positions > 1 ? "es" : ""} e agora está no #${currentRank}. Continue se esforçando!`,
        emoji: "📉",
      };
    }
  }
}

export function useListenToRankChanges() {
  const { user } = useAuth();
  const { data: rankData, isLoading } = useUserRank();
  const { playAchievementSound, playLevelUpSound } = useSoundEffects();
  const hasCheckedRef = useRef(false);
  const previousRankRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset check flag when user changes
    if (user?.id) {
      hasCheckedRef.current = false;
      previousRankRef.current = getStoredRank(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || isLoading || !rankData?.rank || hasCheckedRef.current) {
      return;
    }

    const currentRank = rankData.rank;
    const storedRank = previousRankRef.current;

    // First time user - just store the rank
    if (storedRank === null) {
      storeRank(user.id, currentRank);
      hasCheckedRef.current = true;
      return;
    }

    // No change
    if (storedRank === currentRank) {
      hasCheckedRef.current = true;
      return;
    }

    // Rank changed!
    const direction: "up" | "down" = currentRank < storedRank ? "up" : "down";
    const positions = Math.abs(storedRank - currentRank);

    const changeData: RankChangeData = {
      previousRank: storedRank,
      currentRank,
      direction,
      positions,
    };

    const { title, message, emoji } = getRankChangeMessage(changeData);

    // Create notification in database
    notificationsService.create({
      user_id: user.id,
      title: `${emoji} ${title}`,
      message,
      type: direction === "up" ? "rank_up" : "rank_down",
      data: {
        previousRank: storedRank,
        currentRank,
        direction,
        positions,
      },
    }).catch((err) => logger.warn("Failed to create rank notification", err instanceof Error ? err.message : String(err)));

    // Show toast with appropriate styling
    if (direction === "up") {
      if (currentRank === 1) {
        playLevelUpSound();
        toast.success(`${emoji} ${title}`, {
          description: message,
          duration: 8000,
        });
      } else if (currentRank <= 3) {
        playAchievementSound();
        toast.success(`${emoji} ${title}`, {
          description: message,
          duration: 6000,
        });
      } else {
        toast.success(`${emoji} ${title}`, {
          description: message,
          duration: 5000,
        });
      }
    } else {
      toast.info(`${emoji} ${title}`, {
        description: message,
        duration: 5000,
      });
    }

    // Update stored rank
    storeRank(user.id, currentRank);
    hasCheckedRef.current = true;
  }, [user?.id, rankData?.rank, isLoading, playAchievementSound, playLevelUpSound]);

  return {
    currentRank: rankData?.rank || null,
    isLoading,
  };
}
