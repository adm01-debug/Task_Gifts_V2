import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { behavioralBadgesService, BEHAVIORAL_BADGES, BehaviorMetrics } from "@/services/behavioralBadgesService";
import { useSoundEffects } from "./useSoundEffects";
import { useAchievementNotification, iconFromDbIcon } from "@/contexts/AchievementNotificationContext";
import { useEffect, useCallback } from "react";

export function useBehavioralBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playAchievementSound } = useSoundEffects();
  const { showAchievementNotification } = useAchievementNotification();

  // Busca métricas do usuário
  const metricsQuery = useQuery({
    queryKey: ["behavioral-metrics", user?.id],
    queryFn: () => behavioralBadgesService.getUserMetrics(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });

  // Mutation para verificar e premiar badges
  const checkBadgesMutation = useMutation({
    mutationFn: () => behavioralBadgesService.checkAndAwardBadges(user!.id),
    onSuccess: async (awardedBadges) => {
      if (awardedBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["achievements"] });
        queryClient.invalidateQueries({ queryKey: ["profiles"] });
        queryClient.invalidateQueries({ queryKey: ["behavioral-metrics"] });

        // Mostrar notificação para cada badge
        for (const badgeKey of awardedBadges) {
          const badge = BEHAVIORAL_BADGES.find((b: any) => b.key === badgeKey);
          if (badge) {
            playAchievementSound();
            showAchievementNotification({
              id: badgeKey,
              title: badge.name,
              description: badge.description,
              icon: iconFromDbIcon(badge.icon),
              xp: badge.xpReward,
              coins: badge.coinReward,
              rarity: badge.rarity,
            });

            // Pequeno delay entre notificações
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
    },
  });

  // Verifica badges automaticamente ao carregar e periodicamente
  useEffect(() => {
    if (!user?.id) return;

    // Verificar imediatamente
    const initialCheck = setTimeout(() => {
      checkBadgesMutation.mutate();
    }, 3000);

    // Verificar periodicamente (a cada 10 minutos)
    const interval = setInterval(() => {
      checkBadgesMutation.mutate();
    }, 1000 * 60 * 10);

    return () => {
      clearTimeout(initialCheck);
      clearInterval(interval);
    };
  }, [user?.id]);

  // Função para forçar verificação
  const triggerCheck = useCallback(() => {
    if (user?.id) {
      checkBadgesMutation.mutate();
    }
  }, [user?.id]);

  // Calcular próximos badges possíveis
  const getNextBadges = useCallback((metrics: BehaviorMetrics) => {
    const unlockedBadges = new Set<string>();
    const nextBadges: Array<{
      badge: typeof BEHAVIORAL_BADGES[0];
      progress: number;
      remaining: string;
    }> = [];

    for (const badge of BEHAVIORAL_BADGES) {
      if (badge.condition(metrics)) {
        unlockedBadges.add(badge.key);
      }
    }

    for (const badge of BEHAVIORAL_BADGES) {
      if (unlockedBadges.has(badge.key)) continue;

      let progress = 0;
      let remaining = "";

      // Calcular progresso baseado na categoria
      switch (badge.category) {
        case "feedback":
          if (badge.key.includes("bronze")) {
            progress = Math.min(100, (metrics.feedbacksGiven / 10) * 100);
            remaining = `${10 - metrics.feedbacksGiven} feedbacks restantes`;
          } else if (badge.key.includes("silver")) {
            progress = Math.min(100, (metrics.feedbacksGiven / 50) * 100);
            remaining = `${50 - metrics.feedbacksGiven} feedbacks restantes`;
          } else if (badge.key.includes("gold")) {
            progress = Math.min(100, (metrics.feedbacksGiven / 100) * 100);
            remaining = `${100 - metrics.feedbacksGiven} feedbacks restantes`;
          }
          break;

        case "engagement":
          if (badge.key.includes("checkin")) {
            const target = badge.key.includes("master") ? 52 : badge.key.includes("dedicated") ? 12 : 4;
            progress = Math.min(100, (metrics.consecutiveCheckinsWeeks / target) * 100);
            remaining = `${target - metrics.consecutiveCheckinsWeeks} semanas restantes`;
          } else if (badge.key.includes("pulse")) {
            if (badge.key === "pulse_voice") {
              progress = Math.min(100, (metrics.pulsesResponded / 20) * 100);
              remaining = `${20 - metrics.pulsesResponded} pulses restantes`;
            } else {
              progress = Math.min(100, (metrics.consecutivePulsesWeeks / 8) * 100);
              remaining = `${8 - metrics.consecutivePulsesWeeks} semanas restantes`;
            }
          }
          break;

        case "communication": {
          const target = badge.key.includes("master") ? 100 : badge.key.includes("pro") ? 25 : 5;
          progress = Math.min(100, (metrics.oneOnOnesAttended / target) * 100);
          remaining = `${target - metrics.oneOnOnesAttended} 1-on-1s restantes`;
          break;
        }

        case "performance":
          if (badge.key === "goal_first") {
            progress = metrics.goalsCompleted > 0 ? 100 : 0;
            remaining = metrics.goalsCompleted === 0 ? "Complete 1 objetivo" : "";
          } else if (badge.key === "goal_crusher") {
            progress = Math.min(100, (metrics.goalsCompleted / 10) * 100);
            remaining = `${10 - metrics.goalsCompleted} objetivos restantes`;
          }
          break;

        case "learning": {
          const courseTarget = badge.key.includes("master") ? 25 : badge.key.includes("dedicated") ? 10 : 3;
          progress = Math.min(100, (metrics.coursesCompleted / courseTarget) * 100);
          remaining = `${courseTarget - metrics.coursesCompleted} cursos restantes`;
          break;
        }

        case "development": {
          const pdiTarget = badge.key.includes("transformed") ? 25 : badge.key.includes("dedicated") ? 10 : 3;
          progress = Math.min(100, (metrics.pdiActionsCompleted / pdiTarget) * 100);
          remaining = `${pdiTarget - metrics.pdiActionsCompleted} ações restantes`;
          break;
        }
      }

      if (progress > 0 && progress < 100) {
        nextBadges.push({ badge, progress, remaining });
      }
    }

    // Ordenar por progresso (mais próximos primeiro)
    return nextBadges.sort((a, b) => b.progress - a.progress).slice(0, 5);
  }, []);

  return {
    metrics: metricsQuery.data,
    isLoadingMetrics: metricsQuery.isLoading,
    allBadges: BEHAVIORAL_BADGES,
    badgesByCategory: behavioralBadgesService.getBadgesByCategory(),
    triggerCheck,
    isChecking: checkBadgesMutation.isPending,
    getNextBadges,
  };
}
