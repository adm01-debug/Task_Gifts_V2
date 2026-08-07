import { motion } from "framer-motion";
import { Trophy, Crown, Star } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AnimatedTrophyIndicatorProps {
  rank: number;
  className?: string;
  playSound?: boolean;
}

const rankColors = {
  1: {
    primary: "hsl(45, 100%, 50%)", // Gold
    secondary: "hsl(45, 100%, 70%)",
    glow: "hsl(45, 100%, 50%)",
    bg: "from-yellow-400 to-amber-500",
    label: "👑",
  },
  2: {
    primary: "hsl(0, 0%, 75%)", // Silver
    secondary: "hsl(0, 0%, 90%)",
    glow: "hsl(0, 0%, 80%)",
    bg: "from-gray-300 to-gray-400",
    label: "🥈",
  },
  3: {
    primary: "hsl(25, 60%, 50%)", // Bronze
    secondary: "hsl(25, 60%, 70%)",
    glow: "hsl(25, 60%, 55%)",
    bg: "from-amber-600 to-amber-700",
    label: "🥉",
  },
};

export const AnimatedTrophyIndicator = ({ rank, className = "", playSound = false }: AnimatedTrophyIndicatorProps) => {
  const { playLegendaryCelebrationSound, playEpicCelebrationSound, playAchievementSound } = useSoundEffects();
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (playSound && rank >= 1 && rank <= 3 && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      const timer = setTimeout(() => {
        if (rank === 1) {
          playLegendaryCelebrationSound();
        } else if (rank === 2) {
          playEpicCelebrationSound();
        } else {
          playAchievementSound();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [playSound, rank, playLegendaryCelebrationSound, playEpicCelebrationSound, playAchievementSound]);

  if (rank < 1 || rank > 3) return null;

  const colors = rankColors[rank as 1 | 2 | 3];

  return (
    <div className={`absolute -top-2 -right-2 ${className}`}>
      {/* Pulsing glow background */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          width: "60px",
          height: "60px",
          left: "-15px",
          top: "-15px",
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rotating shine rays */}
      <motion.div
        className="absolute inset-0"
        style={{
          width: "50px",
          height: "50px",
          left: "-10px",
          top: "-10px",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 h-6 w-0.5 origin-bottom"
            style={{
              background: `linear-gradient(to top, ${colors.secondary}, transparent)`,
              transform: `rotate(${i * 45}deg) translateY(-100%)`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scaleY: [0.8, 1, 0.8],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Main trophy container */}
      <motion.div
        className={`relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br ${colors.bg} shadow-lg`}
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            `0 0 10px ${colors.glow}`,
            `0 0 25px ${colors.glow}`,
            `0 0 10px ${colors.glow}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Crown for #1 */}
        {rank === 1 && (
          <motion.div
            className="absolute -top-3"
            animate={{
              y: [0, -2, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Crown className="w-5 h-5 text-yellow-300 drop-shadow-lg" fill="currentColor" />
          </motion.div>
        )}

        {/* Trophy icon with shine effect */}
        <motion.div
          className="relative"
          animate={{
            rotateY: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Trophy
            className="w-5 h-5 drop-shadow-md"
            style={{ color: rank === 1 ? "#fef08a" : rank === 2 ? "#e5e5e5" : "#fcd34d" }}
            fill="currentColor"
          />
          
          {/* Shine overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/60 to-transparent rounded-full"
            animate={{
              x: [-20, 20],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </motion.div>

      {/* Floating stars for rank 1 */}
      {rank === 1 && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute"
              style={{
                left: `${-5 + i * 15}px`,
                top: `${-10 + (i % 2) * 25}px`,
              }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.5, 1, 0.5],
                scale: [0.8, 1, 0.8],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                delay: i * 0.3,
                ease: "easeInOut",
              }}
            >
              <Star className="w-3 h-3 text-yellow-300" fill="currentColor" />
            </motion.div>
          ))}
        </>
      )}

      {/* Sparkle particles */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: colors.secondary,
            left: `${5 + i * 8}px`,
            top: `${5 + (i % 2) * 20}px`,
          }}
          animate={{
            scale: [0, 1, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.4,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Rank badge */}
      <motion.div
        className="absolute -bottom-1 -right-1 bg-background border-2 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
        style={{ borderColor: colors.primary }}
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {colors.label}
      </motion.div>
    </div>
  );
};
