import { motion, AnimatePresence } from "framer-motion";
import { useCelebrations } from "@/hooks/useCelebrations";
import { Cake, Award, PartyPopper, X } from "lucide-react";
import { useState } from "react";

const CELEBRATION_ICONS: Record<string, React.ReactNode> = {
  birthday: <Cake className="h-5 w-5" />,
  anniversary: <Award className="h-5 w-5" />,
  promotion: <PartyPopper className="h-5 w-5" />,
  achievement: <Award className="h-5 w-5" />,
};

const CELEBRATION_COLORS: Record<string, string> = {
  birthday: "from-pink-500 to-rose-500",
  anniversary: "from-amber-500 to-orange-500",
  promotion: "from-green-500 to-emerald-500",
  achievement: "from-purple-500 to-violet-500",
};

export function CelebrationsBanner() {
  const { todayCelebrations } = useCelebrations();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visibleCelebrations = todayCelebrations.filter(c => !dismissedIds.has(c.id));

  if (visibleCelebrations.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {visibleCelebrations.map((celebration, index) => (
          <motion.div
            key={celebration.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${
              CELEBRATION_COLORS[celebration.celebration_type] || "from-primary to-primary/80"
            } text-white p-4`}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
            </div>
            
            <div className="relative flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                {CELEBRATION_ICONS[celebration.celebration_type] || <PartyPopper className="h-5 w-5" />}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-lg">{celebration.title}</h3>
                {celebration.description && (
                  <p className="text-sm text-white/80">{celebration.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1 text-xs text-white/70">
                  <span>+{celebration.xp_reward} XP</span>
                  <span>•</span>
                  <span>+{celebration.coin_reward} Coins</span>
                </div>
              </div>

              <button
                onClick={() => setDismissedIds(prev => new Set([...prev, celebration.id]))}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  initial={{
                    x: Math.random() * 100 + "%",
                    y: "100%",
                    opacity: 0,
                  }}
                  animate={{
                    y: "-20%",
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
