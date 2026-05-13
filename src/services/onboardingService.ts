import { supabase } from "@/integrations/supabase/client";
import { logger } from "./loggingService";

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  coinReward: number;
  action?: string;
  route?: string;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Task Gifts!",
    description: "Conheça a plataforma de gamificação corporativa",
    icon: "🎉",
    xpReward: 10,
    coinReward: 5,
  },
  {
    id: "profile",
    title: "Complete seu Perfil",
    description: "Adicione sua foto e informações pessoais",
    icon: "👤",
    xpReward: 25,
    coinReward: 10,
    route: "/perfil",
  },
  {
    id: "explore_dashboard",
    title: "Explore o Dashboard",
    description: "Conheça suas estatísticas e progresso",
    icon: "📊",
    xpReward: 15,
    coinReward: 5,
    route: "/",
  },
  {
    id: "first_checkin",
    title: "Faça seu Primeiro Check-in",
    description: "Registre sua presença e ganhe XP",
    icon: "⏰",
    xpReward: 30,
    coinReward: 15,
    route: "/ponto",
  },
  {
    id: "send_kudos",
    title: "Envie seu Primeiro Kudos",
    description: "Reconheça um colega de trabalho",
    icon: "💖",
    xpReward: 20,
    coinReward: 10,
  },
  {
    id: "start_trail",
    title: "Inicie uma Trilha de Aprendizado",
    description: "Comece seu desenvolvimento profissional",
    icon: "📚",
    xpReward: 25,
    coinReward: 15,
    route: "/trilhas",
  },
  {
    id: "visit_shop",
    title: "Visite a Loja de Recompensas",
    description: "Descubra como trocar suas moedas",
    icon: "🛒",
    xpReward: 15,
    coinReward: 5,
    route: "/loja",
  },
  {
    id: "set_goal",
    title: "Defina uma Meta",
    description: "Crie seu primeiro objetivo ou OKR",
    icon: "🎯",
    xpReward: 25,
    coinReward: 15,
    route: "/goals",
  },
  {
    id: "join_league",
    title: "Entre em uma Liga",
    description: "Participe da competição semanal",
    icon: "🏆",
    xpReward: 30,
    coinReward: 20,
    route: "/leagues",
  },
  {
    id: "answer_survey",
    title: "Responda uma Pesquisa",
    description: "Participe das pesquisas de clima",
    icon: "📋",
    xpReward: 20,
    coinReward: 10,
    route: "/surveys",
  },
  {
    id: "check_mood",
    title: "Registre seu Humor",
    description: "Compartilhe como você está se sentindo",
    icon: "😊",
    xpReward: 15,
    coinReward: 10,
  },
];

export interface OnboardingProgress {
  id: string;
  user_id: string;
  current_step: number;
  completed_steps: string[];
  rewards_claimed: string[];
  started_at: string;
  completed_at: string | null;
}

export const onboardingService = {
  async getProgress(userId: string): Promise<OnboardingProgress | null> {
    const { data, error } = await supabase
      .from("onboarding_progress")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      logger.apiError('getProgress', error, 'onboardingService');
      return null;
    }

    return data as unknown as OnboardingProgress;
  },

  async initProgress(userId: string): Promise<OnboardingProgress | null> {
    const { data, error } = await supabase
      .from("onboarding_progress")
      .insert({ user_id: userId, current_step: 0, completed_steps: [], rewards_claimed: [] })
      .select()
      .single();

    if (error) {
      logger.apiError('initProgress', error, 'onboardingService');
      return null;
    }

    return data as unknown as OnboardingProgress;
  },

  async completeStep(userId: string, stepId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    if (!progress) return false;

    const completedSteps = progress.completed_steps.includes(stepId)
      ? progress.completed_steps
      : [...progress.completed_steps, stepId];

    const allCompleted = completedSteps.length === ONBOARDING_STEPS.length;

    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        completed_steps: completedSteps,
        current_step: Math.min(completedSteps.length, ONBOARDING_STEPS.length - 1),
        completed_at: allCompleted ? new Date().toISOString() : null,
      })
      .eq("user_id", userId);

    if (error) {
      logger.apiError('completeStep', error, 'onboardingService');
      return false;
    }

    return true;
  },

  async claimReward(userId: string, stepId: string): Promise<boolean> {
    const progress = await this.getProgress(userId);
    if (!progress) return false;

    if (progress.rewards_claimed.includes(stepId)) return false;
    if (!progress.completed_steps.includes(stepId)) return false;

    const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
    if (!step) return false;

    // Update claimed rewards
    const { error: progressError } = await supabase
      .from("onboarding_progress")
      .update({
        rewards_claimed: [...progress.rewards_claimed, stepId],
      })
      .eq("user_id", userId);

    if (progressError) {
      logger.apiError('claimReward', progressError, 'onboardingService');
      return false;
    }

    // Award XP and coins to user
    const { data: profile } = await supabase
      .from("profiles")
      .select("xp, coins")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          xp: profile.xp + step.xpReward,
          coins: profile.coins + step.coinReward,
        })
        .eq("id", userId);
    }

    return true;
  },

  async skipOnboarding(userId: string): Promise<boolean> {
    const { error } = await supabase
      .from("onboarding_progress")
      .update({
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      logger.apiError('skipOnboarding', error, 'onboardingService');
      return false;
    }
    return true;
  },

  isOnboardingComplete(progress: OnboardingProgress | null): boolean {
    if (!progress) return false;
    return progress.completed_at !== null;
  },

  getCompletionPercentage(progress: OnboardingProgress | null): number {
    if (!progress) return 0;
    return Math.round((progress.completed_steps.length / ONBOARDING_STEPS.length) * 100);
  },
};
