import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AnimatedFireIndicatorProps {
  streakDays: number;
  className?: string;
  playSound?: boolean;
}

export const AnimatedFireIndicator = ({ streakDays, className = "", playSound = false }: AnimatedFireIndicatorProps) => {
  const { playComboTierUpSound } = useSoundEffects();
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (playSound && streakDays > 0 && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      const timer = setTimeout(() => {
        playComboTierUpSound(Math.min(Math.ceil(streakDays / 3), 4));
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [playSound, streakDays, playComboTierUpSound]);

  if (streakDays <= 0) return null;

  // Milestone configurations
  const isMilestone = [7, 14, 21, 30, 50, 100].includes(streakDays);
  const milestoneLevel = streakDays >= 100 ? 5 : streakDays >= 50 ? 4 : streakDays >= 30 ? 3 : streakDays >= 14 ? 2 : streakDays >= 7 ? 1 : 0;

  // More flames for higher streaks
  const flameCount = Math.min(Math.ceil(streakDays / 3), 5);
  const intensity = Math.min(streakDays / 10, 1);
  
  // Colors based on milestone
  const flameColors = {
    base: milestoneLevel >= 3 ? 15 : milestoneLevel >= 2 ? 20 : 25, // Hue: red -> orange
    inner: milestoneLevel >= 3 ? 35 : milestoneLevel >= 2 ? 40 : 45,
    glow: milestoneLevel >= 4 ? "from-red-500/60 via-orange-500/40 to-yellow-500/20" : 
          milestoneLevel >= 2 ? "from-orange-500/50 via-yellow-500/30 to-transparent" :
          "from-primary/40 to-transparent",
  };

  return (
    <div className={`absolute -top-1 -right-1 flex items-center ${className}`}>
      {/* Milestone ring effect */}
      {isMilestone && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            width: 40,
            height: 40,
            left: -10,
            top: -10,
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 hsl(var(--primary) / 0.7)",
              "0 0 0 8px hsl(var(--primary) / 0)",
            ],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {/* Fire glow effect */}
      <motion.div
        className={`absolute inset-0 rounded-full blur-md bg-gradient-radial ${flameColors.glow}`}
        animate={{
          scale: isMilestone ? [1, 1.4, 1] : [1, 1.2, 1],
          opacity: isMilestone ? [0.8, 1, 0.8] : [0.6, 1, 0.6],
        }}
        transition={{
          duration: isMilestone ? 1 : 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main fire container */}
      <div className="relative flex items-end justify-center">
        {/* Multiple flame layers */}
        {Array.from({ length: flameCount }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${(i - flameCount / 2) * 4}px`,
              zIndex: flameCount - i,
            }}
            animate={{
              y: [0, -2, 0],
              scaleY: [1, 1.1, 1],
              rotate: [i % 2 === 0 ? -5 : 5, i % 2 === 0 ? 5 : -5, i % 2 === 0 ? -5 : 5],
            }}
            transition={{
              duration: 0.4 + i * 0.1,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1,
            }}
          >
            <svg
              width={12 + i * 2}
              height={16 + i * 2}
              viewBox="0 0 24 32"
              fill="none"
              className="drop-shadow-lg"
            >
              {/* Outer flame */}
              <motion.path
                d="M12 2C12 2 4 12 4 20C4 24.4183 7.58172 28 12 28C16.4183 28 20 24.4183 20 20C20 12 12 2 12 2Z"
                fill={`hsl(${flameColors.base + i * 10}, ${80 + intensity * 20}%, ${50 + i * 5}%)`}
                animate={{
                  d: [
                    "M12 2C12 2 4 12 4 20C4 24.4183 7.58172 28 12 28C16.4183 28 20 24.4183 20 20C20 12 12 2 12 2Z",
                    "M12 4C12 4 5 12 5 19C5 23.4183 8.08172 27 12 27C15.9183 27 19 23.4183 19 19C19 12 12 4 12 4Z",
                    "M12 2C12 2 4 12 4 20C4 24.4183 7.58172 28 12 28C16.4183 28 20 24.4183 20 20C20 12 12 2 12 2Z",
                  ],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Inner flame */}
              <motion.path
                d="M12 10C12 10 8 16 8 20C8 22.2091 9.79086 24 12 24C14.2091 24 16 22.2091 16 20C16 16 12 10 12 10Z"
                fill={`hsl(${flameColors.inner + i * 5}, 100%, ${65 + i * 3}%)`}
                animate={{
                  opacity: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Core flame */}
              <motion.ellipse
                cx="12"
                cy="21"
                rx="2"
                ry="3"
                fill="hsl(60, 100%, 80%)"
                animate={{
                  ry: [3, 4, 3],
                  opacity: [0.9, 1, 0.9],
                }}
                transition={{
                  duration: 0.25,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </svg>
          </motion.div>
        ))}

        {/* Spark particles */}
        {streakDays >= 5 && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`spark-${i}`}
                className="absolute w-1 h-1 rounded-full bg-warning"
                style={{
                  left: `${-4 + i * 8}px`,
                }}
                animate={{
                  y: [0, -20, -30],
                  x: [(i - 1) * 2, (i - 1) * 6, (i - 1) * 10],
                  opacity: [1, 0.8, 0],
                  scale: [1, 0.8, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </div>

      {/* Streak counter badge */}
      <motion.div
        className={`relative ml-1 text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg ${
          milestoneLevel >= 4 ? "bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500" :
          milestoneLevel >= 2 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
          "bg-gradient-to-r from-primary to-warning"
        }`}
        animate={isMilestone ? {
          scale: [1, 1.15, 1],
          rotate: [0, -3, 3, 0],
        } : {
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: isMilestone ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🔥 {streakDays}
        {isMilestone && (
          <motion.span
            className="absolute -top-1 -right-1 text-[8px]"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            ⭐
          </motion.span>
        )}
      </motion.div>
    </div>
  );
};
