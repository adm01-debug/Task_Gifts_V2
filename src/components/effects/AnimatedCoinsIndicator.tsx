import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { useSoundEffects } from "@/hooks/useSoundEffects";

interface AnimatedCoinsIndicatorProps {
  coins: number;
  className?: string;
}

export const AnimatedCoinsIndicator = ({ coins, className = "" }: AnimatedCoinsIndicatorProps) => {
  const { playCoinsSound, playRichCoinsSound } = useSoundEffects();
  const hasPlayedSound = useRef(false);

  // Play sound on first render
  useEffect(() => {
    if (coins >= 100 && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      // Small delay to let the visual appear first
      const timer = setTimeout(() => {
        if (coins >= 500) {
          playRichCoinsSound();
        } else {
          playCoinsSound();
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [coins, playCoinsSound, playRichCoinsSound]);

  if (coins < 100) return null;

  // More coins = more particles
  const intensity = Math.min(coins / 1000, 1);
  const coinCount = Math.min(Math.ceil(coins / 200), 8);
  const isRich = coins >= 500;
  const isWealthy = coins >= 1000;

  return (
    <div className={`absolute -top-2 -right-2 ${className}`}>
      {/* Golden glow effect */}
      <motion.div
        className="absolute rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, hsl(45, 100%, 50% / ${0.3 + intensity * 0.3}) 0%, transparent 70%)`,
          width: "60px",
          height: "60px",
          left: "-15px",
          top: "-15px",
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Falling coins */}
      {[...Array(coinCount)].map((_, i) => (
        <motion.div
          key={`coin-${i}`}
          className="absolute"
          style={{
            left: `${-5 + i * 6}px`,
            top: "-10px",
          }}
          animate={{
            y: [0, 30, 0],
            x: [(i % 2 === 0 ? -1 : 1) * 3, (i % 2 === 0 ? 1 : -1) * 3, (i % 2 === 0 ? -1 : 1) * 3],
            rotateY: [0, 180, 360],
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 2 + i * 0.2,
            repeat: Infinity,
            delay: i * 0.3,
            ease: "easeInOut",
          }}
        >
          <div
            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fcd34d, #f59e0b, #d97706)",
              color: "#7c2d12",
              boxShadow: "0 2px 8px rgba(245, 158, 11, 0.5)",
            }}
          >
            $
          </div>
        </motion.div>
      ))}

      {/* Main coin container */}
      <motion.div
        className="relative flex items-center justify-center w-11 h-11 rounded-full shadow-lg"
        style={{
          background: isWealthy
            ? "linear-gradient(135deg, #fef08a, #fbbf24, #f59e0b)"
            : isRich
            ? "linear-gradient(135deg, #fcd34d, #f59e0b)"
            : "linear-gradient(135deg, #fde68a, #fbbf24)",
        }}
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 15px rgba(251, 191, 36, 0.4)",
            "0 0 25px rgba(251, 191, 36, 0.6)",
            "0 0 15px rgba(251, 191, 36, 0.4)",
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Shine effect */}
        <motion.div
          className="absolute inset-1 rounded-full bg-gradient-to-br from-white/50 via-transparent to-transparent"
          animate={{
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Coin icon */}
        <motion.div
          animate={{
            rotateY: [0, 10, -10, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Coins className="w-5 h-5 text-amber-800 drop-shadow-md" />
        </motion.div>

        {/* Sparkles for wealthy users */}
        {isWealthy && (
          <>
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute w-1.5 h-1.5 rounded-full bg-yellow-200"
                style={{
                  left: `${-2 + i * 10}px`,
                  top: `${-2 + (i % 2) * 14}px`,
                }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.25,
                  ease: "easeOut",
                }}
              />
            ))}
          </>
        )}
      </motion.div>

      {/* Rising coin sparkles */}
      {isRich && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={`rising-${i}`}
              className="absolute text-xs"
              style={{
                left: `${5 + i * 10}px`,
                bottom: "0px",
              }}
              animate={{
                y: [0, -25, -35],
                opacity: [0.8, 0.6, 0],
                scale: [0.8, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
            >
              💰
            </motion.div>
          ))}
        </>
      )}

      {/* Coin count badge */}
      <motion.div
        className="absolute -bottom-1 -left-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-900 text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-lg"
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {coins >= 1000 ? `${(coins / 1000).toFixed(1)}k` : coins}
      </motion.div>

      {/* Treasure chest for wealthy */}
      {isWealthy && (
        <motion.div
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg"
          animate={{
            y: [0, -3, 0],
            rotate: [-5, 5, -5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          💎
        </motion.div>
      )}
    </div>
  );
};
