import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronRight, Gift, Sparkles, Trophy } from "lucide-react";
import {
  useOnboardingProgress,
  useCompleteOnboardingStep,
  useClaimOnboardingReward,
  ONBOARDING_STEPS,
} from "@/hooks/useOnboarding";
import { onboardingService } from "@/services/onboardingService";
import confetti from "canvas-confetti";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const navigate = useNavigate();
  const { data: progress, isLoading } = useOnboardingProgress();
  const completeStep = useCompleteOnboardingStep();
  const claimReward = useClaimOnboardingReward();
  const [currentView, setCurrentView] = useState<"tutorial" | "checklist">("tutorial");
  const [tutorialStep, setTutorialStep] = useState(0);
  const [claimingStepIds, setClaimingStepIds] = useState<Set<string>>(new Set());
  const [completingStepIds, setCompletingStepIds] = useState<Set<string>>(new Set());

  const tutorialSlides = useMemo(() => [
    {
      icon: "🎮",
      title: "Bem-vindo ao Task Gifts!",
      description:
        "Uma plataforma gamificada para seu desenvolvimento profissional. Ganhe XP, suba de nível e conquiste recompensas!",
    },
    {
      icon: "⭐",
      title: "Ganhe XP e Suba de Nível",
      description:
        "Complete missões, faça check-in pontual e participe de treinamentos para acumular XP e evoluir seu perfil.",
    },
    {
      icon: "🪙",
      title: "Acumule Moedas",
      description:
        "Suas conquistas rendem moedas que podem ser trocadas por benefícios reais na loja de recompensas.",
    },
    {
      icon: "🏆",
      title: "Compita e Colabore",
      description:
        "Participe dos rankings, envie kudos para colegas e ajude seu departamento a alcançar o topo!",
    },
  ], []);

  const handleTutorialNext = useCallback(() => {
    if (tutorialStep < tutorialSlides.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      completeStep.mutate("welcome");
      setCurrentView("checklist");
    }
  }, [tutorialStep, tutorialSlides.length, completeStep]);

  const handleStepAction = useCallback(async (stepId: string, route?: string) => {
    setCompletingStepIds(prev => new Set(prev).add(stepId));
    try {
      await completeStep.mutateAsync(stepId);
      if (route) {
        onOpenChange(false);
        navigate(route);
      }
    } finally {
      setCompletingStepIds(prev => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
    }
  }, [completeStep, onOpenChange, navigate]);

  const handleClaimReward = useCallback(async (stepId: string) => {
    setClaimingStepIds(prev => new Set(prev).add(stepId));
    try {
      // Check if this will be the last reward to claim (all steps will be complete after this)
      const willCompleteAll = progress && 
        (progress as any).rewards_claimed.length === ONBOARDING_STEPS.length - 1 &&
        !(progress as any).rewards_claimed.includes(stepId);
      
      await claimReward.mutateAsync(stepId);
      
      // Celebrate if all rewards are now claimed
      if (willCompleteAll) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } finally {
      setClaimingStepIds(prev => {
        const next = new Set(prev);
        next.delete(stepId);
        return next;
      });
    }
  }, [progress, claimReward]);

  const completionPercentage = onboardingService.getCompletionPercentage(progress);
  const isComplete = onboardingService.isOnboardingComplete(progress);

  if (isLoading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {currentView === "tutorial" ? (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="text-center space-y-6">
                <motion.div
                  key={tutorialStep}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-7xl mb-4"
                >
                  {tutorialSlides[tutorialStep].icon}
                </motion.div>

                <motion.div
                  key={`text-${tutorialStep}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <h2 className="text-2xl font-bold mb-2">
                    {tutorialSlides[tutorialStep].title}
                  </h2>
                  <p className="text-muted-foreground">
                    {tutorialSlides[tutorialStep].description}
                  </p>
                </motion.div>

                <div className="flex justify-center gap-2">
                  {tutorialSlides.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === tutorialStep ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>

                <Button onClick={handleTutorialNext} className="w-full" size="lg">
                  {tutorialStep < tutorialSlides.length - 1 ? (
                    <>
                      Próximo
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Começar Jornada
                      <Sparkles className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col max-h-[85vh]"
            >
              <DialogHeader className="p-6 pb-4 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Primeiros Passos
                </DialogTitle>
                <div className="mt-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{completionPercentage}%</span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {ONBOARDING_STEPS.map((step, index) => {
                  const isCompleted = progress?.completed_steps.includes(step.id);
                  const isClaimed = progress?.rewards_claimed.includes(step.id);
                  const canClaim = isCompleted && !isClaimed;

                  return (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-4 rounded-lg border transition-all ${
                        isCompleted
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-card hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                            isCompleted
                              ? "bg-green-500 text-white"
                              : "bg-muted"
                          }`}
                        >
                          {isCompleted ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            step.icon
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-medium ${
                                isCompleted ? "line-through text-muted-foreground" : ""
                              }`}
                            >
                              {step.title}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {step.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              +{step.xpReward} XP
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              +{step.coinReward} 🪙
                            </Badge>
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          {canClaim ? (
                            <Button
                              size="sm"
                              onClick={() => handleClaimReward(step.id)}
                              disabled={claimingStepIds.has(step.id)}
                              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                            >
                              <Gift className="w-4 h-4 mr-1" />
                              {claimingStepIds.has(step.id) ? "..." : "Resgatar"}
                            </Button>
                          ) : isClaimed ? (
                            <Badge className="bg-green-500">
                              <Check className="w-3 h-3 mr-1" />
                              Resgatado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStepAction(step.id, step.route)}
                              disabled={completingStepIds.has(step.id)}
                            >
                              {completingStepIds.has(step.id) ? "..." : (step.route ? "Ir" : "Concluir")}
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {isComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 border-t bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30"
                >
                  <div className="text-center">
                    <Trophy className="w-8 h-8 mx-auto text-amber-500 mb-2" />
                    <h3 className="font-bold text-lg">Parabéns!</h3>
                    <p className="text-sm text-muted-foreground">
                      Você completou o onboarding. Boa jornada!
                    </p>
                    <Button
                      className="mt-3"
                      onClick={() => onOpenChange(false)}
                    >
                      Começar a Explorar
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
