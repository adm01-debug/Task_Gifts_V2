import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Star, Sparkles, Coins, TrendingUp } from "lucide-react";
import confetti from "canvas-confetti";

interface WeeklyChallengeVictoryProps {
  show: boolean;
  onClose: () => void;
  opponentName: string;
  xpGained: number;
  opponentXpGained: number;
  xpReward: number;
  coinReward: number;
}

export function WeeklyChallengeVictory({
  show,
  onClose,
  opponentName,
  xpGained,
  opponentXpGained,
  xpReward,
  coinReward,
}: WeeklyChallengeVictoryProps) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!show) {
      setStage(0);
      return;
    }

    // Stage 1: Initial burst
    const timer1 = setTimeout(() => setStage(1), 300);
    // Stage 2: Trophy reveal
    const timer2 = setTimeout(() => setStage(2), 800);
    // Stage 3: Stats reveal
    const timer3 = setTimeout(() => setStage(3), 1500);
    // Stage 4: Rewards reveal
    const timer4 = setTimeout(() => setStage(4), 2200);

    // Fire confetti bursts
    const fireConfetti = () => {
      // Golden confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#FFD700", "#FFA500", "#FFDF00", "#F0E68C"],
      });

      // Side bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4"],
        });
      }, 300);

      // Star shower
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.3 },
          shapes: ["star"],
          colors: ["#FFD700", "#FFFFFF", "#FFA500"],
        });
      }, 600);

      // Final celebration
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 180,
          origin: { y: 0.5 },
          colors: ["#FFD700", "#FFA500", "#FF6B6B", "#4ECDC4", "#A78BFA"],
        });
      }, 1200);
    };

    fireConfetti();

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full mx-4 bg-gradient-to-br from-yellow-900/90 via-amber-900/90 to-orange-900/90 rounded-3xl border-2 border-yellow-500/50 p-8 overflow-hidden"
          >
            {/* Animated background sparkles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                  initial={{
                    x: Math.random() * 400,
                    y: Math.random() * 500,
                    opacity: 0,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/20 to-transparent pointer-events-none" />

            <div className="relative z-10 text-center space-y-6">
              {/* Victory Text */}
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={stage >= 1 ? { y: 0, opacity: 1 } : {}}
                transition={{ type: "spring", damping: 10 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/30 rounded-full border border-yellow-400/50"
                >
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                  <span className="text-yellow-300 font-bold text-lg">VITÓRIA!</span>
                  <Sparkles className="w-5 h-5 text-yellow-400" />
                </motion.div>
              </motion.div>

              {/* Trophy */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={stage >= 2 ? { scale: 1, rotate: 0 } : {}}
                transition={{ type: "spring", damping: 10, stiffness: 100 }}
                className="relative"
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(255,215,0,0.3)",
                      "0 0 60px rgba(255,215,0,0.6)",
                      "0 0 20px rgba(255,215,0,0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500"
                >
                  <Trophy className="w-16 h-16 text-yellow-900" />
                </motion.div>
                
                {/* Orbiting stars */}
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                      delay: i * 1,
                    }}
                    style={{ transformOrigin: "0 0" }}
                  >
                    <Star
                      className="w-4 h-4 text-yellow-400 fill-yellow-400"
                      style={{
                        transform: `translate(${50 + i * 10}px, -50%)`,
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>

              {/* Victory message */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={stage >= 2 ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">
                  Você Venceu o Desafio!
                </h2>
                <p className="text-yellow-200/80">
                  Parabéns! Você superou <span className="font-semibold text-yellow-300">{opponentName}</span>
                </p>
              </motion.div>

              {/* Stats comparison */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={stage >= 3 ? { scale: 1, opacity: 1 } : {}}
                className="bg-black/30 rounded-2xl p-4 border border-yellow-500/20"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                    <p className="text-xs text-yellow-200/60 mb-1">Você</p>
                    <p className="text-2xl font-bold text-green-400">+{xpGained}</p>
                    <p className="text-xs text-yellow-200/60">XP</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <TrendingUp className="w-6 h-6 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">
                      +{xpGained - opponentXpGained}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-yellow-200/60 mb-1">{opponentName}</p>
                    <p className="text-2xl font-bold text-red-400">+{opponentXpGained}</p>
                    <p className="text-xs text-yellow-200/60">XP</p>
                  </div>
                </div>
              </motion.div>

              {/* Rewards */}
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={stage >= 4 ? { y: 0, opacity: 1 } : {}}
                className="space-y-3"
              >
                <p className="text-sm text-yellow-200/80">Recompensas Conquistadas</p>
                <div className="flex items-center justify-center gap-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                    className="flex items-center gap-2 bg-primary/20 px-4 py-2 rounded-xl border border-primary/30"
                  >
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <span className="font-bold text-primary">+{xpReward} XP</span>
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                    className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-xl border border-yellow-500/30"
                  >
                    <Coins className="w-5 h-5 text-yellow-500" />
                    <span className="font-bold text-yellow-500">+{coinReward}</span>
                  </motion.div>
                </div>
              </motion.div>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={stage >= 4 ? { opacity: 1 } : {}}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-yellow-900 font-bold rounded-xl shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-shadow"
              >
                Continuar Conquistando! 🚀
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
