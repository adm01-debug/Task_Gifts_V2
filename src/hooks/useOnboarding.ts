import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { onboardingService, ONBOARDING_STEPS } from "@/services/onboardingService";
import { toast } from "sonner";

export const onboardingKeys = {
  progress: (userId: string) => ["onboarding", "progress", userId] as const,
};

export function useOnboardingProgress() {
  const { user } = useAuth();

  return useQuery({
    queryKey: onboardingKeys.progress(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return null;
      
      let progress = await onboardingService.getProgress(user.id);
      
      // Initialize if doesn't exist
      if (!progress) {
        progress = await onboardingService.initProgress(user.id);
      }
      
      // Ensure arrays are never null
      if (progress) {
        progress.completed_steps = progress.completed_steps || [];
        progress.rewards_claimed = progress.rewards_claimed || [];
      }
      
      return progress;
    },
    enabled: !!user?.id,
  });
}

export function useCompleteOnboardingStep() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return onboardingService.completeStep(user.id, stepId);
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: onboardingKeys.progress(user.id) });
      }
    },
  });
}

export function useClaimOnboardingReward() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (stepId: string) => {
      if (!user?.id) throw new Error("User not authenticated");
      return onboardingService.claimReward(user.id, stepId);
    },
    onSuccess: (success, stepId) => {
      if (success) {
        const step = ONBOARDING_STEPS.find((s) => s.id === stepId);
        if (step) {
          toast.success(`Recompensa resgatada!`, {
            description: `+${step.xpReward} XP e +${step.coinReward} moedas`,
          });
        }
      }
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: onboardingKeys.progress(user.id) });
        queryClient.invalidateQueries({ queryKey: ["profile"] });
      }
    },
  });
}

export function useSkipOnboarding() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      return onboardingService.skipOnboarding(user.id);
    },
    onSuccess: () => {
      toast.success("Onboarding pulado com sucesso!");
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: onboardingKeys.progress(user.id) });
      }
    },
  });
}

export { ONBOARDING_STEPS };
