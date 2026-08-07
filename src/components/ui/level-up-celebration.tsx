import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, Star, Sparkles, ChevronUp, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface LevelUpCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  previousLevel: number;
  newLevel: number;
  rewards?: {
    xp?: number;
    coins?: number;
    title?: string;
    badge?: string;
  };
}

export function LevelUpCelebration({
  isOpen,
  onClose,
  previousLevel,
  newLevel,
  rewards,
}: LevelUpCelebrationProps) {
  const [showRewards, setShowRewards] = useState(false);

  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ["#FFD700", "#FFA500"],
    });
    fire(0.2, {
      spread: 60,
      colors: ["#8B5CF6", "#EC4899"],
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ["#10B981", "#3B82F6"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ["#F59E0B", "#EF4444"],
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ["#6366F1", "#A855F7"],
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Fire confetti after a short delay
      const timer = setTimeout(() => {
        fireConfetti();
        setTimeout(() => setShowRewards(true), 800);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowRewards(false);
    }
  }, [isOpen, fireConfetti]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 10 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/30 via-amber-500/30 to-orange-500/30 rounded-3xl blur-xl animate-pulse" />

            {/* Main card */}
            <div className="relative bg-gradient-to-br from-background via-background to-muted rounded-3xl border-2 border-yellow-500/50 p-8 shadow-2xl overflow-hidden">
              {/* Background particles */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-yellow-400/30 rounded-full"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [0, -30, 0],
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </div>

              {/* Crown icon */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="flex justify-center mb-4"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/30"
                  >
                    <Crown className="w-10 h-10 text-white" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1"
                  >
                    <Sparkles className="w-6 h-6 text-yellow-400" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-center mb-2"
              >
                Level Up! 🎉
              </motion.h2>

              {/* Level transition */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-4 mb-6"
              >
                <div className="text-center">
                  <p className="text-muted-foreground text-sm">Anterior</p>
                  <p className="text-3xl font-bold text-muted-foreground">
                    {previousLevel}
                  </p>
                </div>
                
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <ChevronUp className="w-8 h-8 text-yellow-500 rotate-90" />
                </motion.div>

                <div className="text-center">
                  <p className="text-yellow-500 text-sm font-medium">Novo</p>
                  <motion.p
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-4xl font-bold text-yellow-500"
                  >
                    {newLevel}
                  </motion.p>
                </div>
              </motion.div>

              {/* Rewards */}
              <AnimatePresence>
                {showRewards && rewards && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="space-y-3 mb-6"
                  >
                    <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Gift className="w-4 h-4" />
                      Recompensas desbloqueadas
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                      {rewards.xp && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring" }}
                          className="px-4 py-2 bg-blue-500/20 rounded-full"
                        >
                          <span className="text-blue-500 font-semibold">
                            +{rewards.xp} XP
                          </span>
                        </motion.div>
                      )}
                      {rewards.coins && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                          className="px-4 py-2 bg-yellow-500/20 rounded-full"
                        >
                          <span className="text-yellow-500 font-semibold">
                            +{rewards.coins} 🪙
                          </span>
                        </motion.div>
                      )}
                      {rewards.title && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="px-4 py-2 bg-purple-500/20 rounded-full"
                        >
                          <span className="text-purple-500 font-semibold">
                            🏷️ {rewards.title}
                          </span>
                        </motion.div>
                      )}
                      {rewards.badge && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: "spring" }}
                          className="px-4 py-2 bg-pink-500/20 rounded-full"
                        >
                          <span className="text-pink-500 font-semibold">
                            🎖️ {rewards.badge}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Button
                  onClick={onClose}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-semibold"
                  size="lg"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Incrível!
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger level up celebration
export function useLevelUpCelebration() {
  const [celebrationState, setCelebrationState] = useState<{
    isOpen: boolean;
    previousLevel: number;
    newLevel: number;
    rewards?: LevelUpCelebrationProps["rewards"];
  }>({
    isOpen: false,
    previousLevel: 1,
    newLevel: 2,
  });

  const celebrate = useCallback((
    previousLevel: number,
    newLevel: number,
    rewards?: LevelUpCelebrationProps["rewards"]
  ) => {
    setCelebrationState({
      isOpen: true,
      previousLevel,
      newLevel,
      rewards,
    });
  }, []);

  const close = useCallback(() => {
    setCelebrationState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    ...celebrationState,
    celebrate,
    close,
  };
}
