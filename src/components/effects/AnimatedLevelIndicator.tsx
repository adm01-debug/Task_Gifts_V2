import { motion } from "framer-motion";
import { Sparkles, Star, Zap } from "lucide-react";
import { useEffect, useRef } from "react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AnimatedLevelIndicatorProps {
  level: number;
  className?: string;
  playSound?: boolean;
}

export const AnimatedLevelIndicator = ({ level, className = "", playSound = false }: AnimatedLevelIndicatorProps) => {
  const { playLevelUpSound } = useSoundEffects();
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (playSound && level > 0 && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      const timer = setTimeout(() => {
        playLevelUpSound();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [playSound, level, playLevelUpSound]);

  if (level <= 0) return null;

  // Higher levels get more particles
  const particleCount = Math.min(Math.ceil(level / 5), 8);
  const isHighLevel = level >= 10;
  const isMasterLevel = level >= 25;

  return (
    <div className={`absolute -top-2 -right-2 ${className}`}>
      {/* Radial glow effect */}
      <motion.div
        className="absolute rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, hsl(var(--success) / 0.5) 0%, hsl(45, 100%, 50%) 50%, transparent 70%)`,
          width: "70px",
          height: "70px",
          left: "-20px",
          top: "-20px",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rotating energy ring */}
      <motion.div
        className="absolute rounded-full border-2 border-dashed"
        style={{
          borderColor: "hsl(var(--success) / 0.5)",
          width: "50px",
          height: "50px",
          left: "-10px",
          top: "-10px",
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Golden particles floating around */}
      {[...Array(particleCount)].map((_, i) => {
        const angle = (i / particleCount) * 360;
        const radius = 25 + (i % 3) * 5;
        return (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              background: `linear-gradient(135deg, hsl(45, 100%, 60%), hsl(35, 100%, 50%))`,
              boxShadow: "0 0 6px hsl(45, 100%, 50%)",
            }}
            animate={{
              x: [
                Math.cos((angle * Math.PI) / 180) * radius,
                Math.cos(((angle + 60) * Math.PI) / 180) * (radius + 5),
                Math.cos(((angle + 120) * Math.PI) / 180) * radius,
                Math.cos((angle * Math.PI) / 180) * radius,
              ],
              y: [
                Math.sin((angle * Math.PI) / 180) * radius,
                Math.sin(((angle + 60) * Math.PI) / 180) * (radius + 5),
                Math.sin(((angle + 120) * Math.PI) / 180) * radius,
                Math.sin((angle * Math.PI) / 180) * radius,
              ],
              scale: [0.8, 1.2, 0.8],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        );
      })}

      {/* Main level badge */}
      <motion.div
        className="relative flex items-center justify-center w-11 h-11 rounded-full"
        style={{
          background: isMasterLevel
            ? "linear-gradient(135deg, hsl(280, 80%, 50%), hsl(320, 80%, 50%), hsl(45, 100%, 50%))"
            : isHighLevel
            ? "linear-gradient(135deg, hsl(45, 100%, 50%), hsl(35, 100%, 45%))"
            : "linear-gradient(135deg, hsl(var(--success)), hsl(142, 76%, 36%))",
        }}
        animate={{
          scale: [1, 1.08, 1],
          boxShadow: [
            `0 0 15px hsl(var(--success) / 0.5)`,
            `0 0 30px hsl(45, 100%, 50% / 0.6)`,
            `0 0 15px hsl(var(--success) / 0.5)`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Inner shine effect */}
        <motion.div
          className="absolute inset-1 rounded-full bg-gradient-to-br from-white/40 via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Level number */}
        <motion.span
          className="relative z-10 text-sm font-black text-white drop-shadow-lg"
          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {level}
        </motion.span>

        {/* Sparkle icon for high levels */}
        {isHighLevel && (
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{
              rotate: [0, 15, -15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" fill="currentColor" />
          </motion.div>
        )}

        {/* Master level crown effect */}
        {isMasterLevel && (
          <motion.div
            className="absolute -top-3 left-1/2 -translate-x-1/2"
            animate={{
              y: [0, -2, 0],
              rotate: [-3, 3, -3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <span className="text-lg drop-shadow-lg">👑</span>
          </motion.div>
        )}
      </motion.div>

      {/* Rising XP sparkles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`xp-sparkle-${i}`}
          className="absolute"
          style={{
            left: `${10 + i * 8}px`,
            bottom: "0px",
          }}
          animate={{
            y: [0, -30, -40],
            opacity: [1, 0.8, 0],
            scale: [0.5, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        >
          <Zap className="w-3 h-3 text-success" fill="currentColor" />
        </motion.div>
      ))}

      {/* Floating stars for master levels */}
      {isMasterLevel && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={`master-star-${i}`}
              className="absolute"
              style={{
                left: `${-8 + i * 12}px`,
                top: `${-5 + (i % 2) * 30}px`,
              }}
              animate={{
                y: [0, -5, 0],
                rotate: [0, 180, 360],
                opacity: [0.4, 1, 0.4],
                scale: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 2.5 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            >
              <Star
                className="w-3 h-3"
                style={{ color: i % 2 === 0 ? "hsl(45, 100%, 60%)" : "hsl(280, 80%, 60%)" }}
                fill="currentColor"
              />
            </motion.div>
          ))}
        </>
      )}

      {/* Label badge */}
      <motion.div
        className="absolute -bottom-1 -left-1 bg-success text-success-foreground text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        LVL
      </motion.div>
    </div>
  );
};
