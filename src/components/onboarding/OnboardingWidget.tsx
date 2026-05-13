import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, Sparkles, X } from "lucide-react";
import { useOnboardingProgress, useSkipOnboarding, ONBOARDING_STEPS } from "@/hooks/useOnboarding";
import { onboardingService } from "@/services/onboardingService";
import { OnboardingModal } from "./OnboardingModal";

export function OnboardingWidget() {
  const { data: progress, isLoading } = useOnboardingProgress();
  const skipOnboarding = useSkipOnboarding();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) return null;

  const isComplete = onboardingService.isOnboardingComplete(progress || null);
  if (isComplete) return null;

  const completionPercentage = onboardingService.getCompletionPercentage(progress || null);
  const completedCount = progress?.completed_steps.length || 0;
  const totalSteps = ONBOARDING_STEPS.length;

  // Find next uncompleted step
  const nextStep = ONBOARDING_STEPS.find(
    (step) => !progress?.completed_steps.includes(step.id)
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border-violet-500/20 relative overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => skipOnboarding.mutate()}
            disabled={skipOnboarding.isPending}
            title="Pular onboarding"
          >
            <X className="w-4 h-4" />
          </Button>

          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Complete seu Onboarding</h3>
                <p className="text-sm text-muted-foreground">
                  {completedCount}/{totalSteps} passos concluídos
                </p>
              </div>
            </div>

            <Progress value={completionPercentage} className="h-2 mb-3" />

            {nextStep && (
              <div className="flex items-center justify-between p-2 rounded-lg bg-background/50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{nextStep.icon}</span>
                  <span className="text-sm font-medium">{nextStep.title}</span>
                </div>
                <Button size="sm" onClick={() => setModalOpen(true)}>
                  Continuar
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <OnboardingModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
