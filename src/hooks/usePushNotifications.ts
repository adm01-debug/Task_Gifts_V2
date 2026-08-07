import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { logger } from "@/services/loggingService";

interface PushNotificationState {
  isSupported: boolean;
  isGranted: boolean;
  isDenied: boolean;
  isDefault: boolean;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isGranted: false,
    isDenied: false,
    isDefault: true,
  });

  useEffect(() => {
    const isSupported = "Notification" in window && "serviceWorker" in navigator;
    
    if (isSupported) {
      const permission = Notification.permission;
      setState({
        isSupported: true,
        isGranted: permission === "granted",
        isDenied: permission === "denied",
        isDefault: permission === "default",
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast.error("Seu navegador não suporta notificações");
      return false;
    }

    if (state.isDenied) {
      toast.error("Notificações foram bloqueadas. Habilite nas configurações do navegador.");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const isGranted = permission === "granted";
      
      setState(prev => ({
        ...prev,
        isGranted,
        isDenied: permission === "denied",
        isDefault: permission === "default",
      }));

      if (isGranted) {
        toast.success("Notificações ativadas!");
        // Send a test notification
        showNotification("Task Gifts", {
          body: "Notificações push ativadas com sucesso!",
          icon: "/favicon.ico",
        });
      }

      return isGranted;
    } catch (err: unknown) {
      logger.apiError("requestPermission", err, "PushNotifications");
      toast.error("Erro ao solicitar permissão de notificações");
      return false;
    }
  }, [state.isSupported, state.isDenied]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!state.isGranted) return null;

    try {
      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (err: unknown) {
      logger.warn("Error showing notification", err instanceof Error ? err.message : String(err));
      return null;
    }
  }, [state.isGranted]);

  // Helper to show achievement notifications
  const notifyAchievement = useCallback((title: string, description: string) => {
    return showNotification(`🏆 ${title}`, {
      body: description,
      tag: "achievement",
    });
  }, [showNotification]);

  // Helper to show level up notifications
  const notifyLevelUp = useCallback((level: number) => {
    return showNotification(`⬆️ Nível ${level}!`, {
      body: `Parabéns! Você alcançou o nível ${level}!`,
      tag: "level-up",
    });
  }, [showNotification]);

  // Helper to show kudos notifications
  const notifyKudos = useCallback((fromName: string, message: string) => {
    return showNotification(`❤️ Kudos de ${fromName}`, {
      body: message,
      tag: "kudos",
    });
  }, [showNotification]);

  // Helper to show quest completion notifications
  const notifyQuestComplete = useCallback((questTitle: string, xp: number) => {
    return showNotification(`✅ Quest Completa!`, {
      body: `${questTitle} - +${xp} XP`,
      tag: "quest",
    });
  }, [showNotification]);

  // Helper to show duel notifications
  const notifyDuelChallenge = useCallback((challengerName: string) => {
    return showNotification(`⚔️ Desafio de Duelo!`, {
      body: `${challengerName} te desafiou para um duelo!`,
      tag: "duel-challenge",
    });
  }, [showNotification]);

  const notifyDuelResult = useCallback((won: boolean, opponentName: string, xpGained?: number) => {
    if (won) {
      return showNotification(`🏆 Vitória no Duelo!`, {
        body: `Você venceu ${opponentName}!${xpGained ? ` +${xpGained} XP` : ''}`,
        tag: "duel-result",
      });
    }
    return showNotification(`😢 Derrota no Duelo`, {
      body: `${opponentName} venceu desta vez. Continue tentando!`,
      tag: "duel-result",
    });
  }, [showNotification]);

  // Helper to show streak notifications
  const notifyStreakMilestone = useCallback((days: number) => {
    return showNotification(`🔥 Streak de ${days} dias!`, {
      body: `Incrível! Você manteve seu streak por ${days} dias consecutivos!`,
      tag: "streak",
    });
  }, [showNotification]);

  // Helper to show challenge expiring notifications
  const notifyChallengeExpiring = useCallback((challengeTitle: string, hoursLeft: number) => {
    return showNotification(`⏰ Desafio Expirando!`, {
      body: `${challengeTitle} expira em ${hoursLeft}h. Complete agora!`,
      tag: "challenge-expiring",
    });
  }, [showNotification]);

  // Helper to show combo notifications
  const notifyComboMultiplier = useCallback((multiplier: number) => {
    if (multiplier >= 3) {
      return showNotification(`🚀 Combo x${multiplier}!`, {
        body: `Seu multiplicador está em x${multiplier}! Continue assim!`,
        tag: "combo",
      });
    }
    return null;
  }, [showNotification]);

  return {
    ...state,
    requestPermission,
    showNotification,
    notifyAchievement,
    notifyLevelUp,
    notifyKudos,
    notifyQuestComplete,
    notifyDuelChallenge,
    notifyDuelResult,
    notifyStreakMilestone,
    notifyChallengeExpiring,
    notifyComboMultiplier,
  };
}
