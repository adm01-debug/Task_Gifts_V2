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
        <Card className="bg-gradient-to-br from-violet-500/10 via-background to-purple-500/5 border-violet-500/20 relative overflow-hidden shadow-xl ring-1 ring-violet-500/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-[60px] rounded-full -mr-16 -mt-16" />
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

          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 ring-2 ring-white/10">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight">PROGRESSO DE RECRUTA</h3>
                  <p className="text-xs font-bold text-muted-foreground/70 uppercase tracking-widest">
                    {completedCount} DE {totalSteps} OBJETIVOS COMPLETOS
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-violet-500 leading-none">{Math.round(completionPercentage)}%</span>
              </div>
            </div>

            <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden mb-5">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-shimmer" />
            </div>

            {nextStep && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-violet-500/5 border border-violet-500/10 group hover:bg-violet-500/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center text-xl shadow-sm border border-border/50">
                    {nextStep.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-violet-500/70 uppercase tracking-tighter">PRÓXIMA MISSÃO</span>
                    <span className="text-sm font-bold tracking-tight">{nextStep.title}</span>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => setModalOpen(true)}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-black px-5 rounded-lg h-9"
                >
                  DETALHES
                  <ChevronRight className="w-4 h-4 ml-1.5" />
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
