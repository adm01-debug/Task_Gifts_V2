import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  velocityX: number;
  velocityY: number;
  shape: "circle" | "square" | "star";
}

interface CelebrationEffectProps {
  isActive: boolean;
  type: "epic" | "legendary";
  onComplete?: () => void;
}

const EPIC_COLORS = ["#a855f7", "#ec4899", "#8b5cf6", "#d946ef", "#f472b6"];
const LEGENDARY_COLORS = ["#f59e0b", "#f97316", "#eab308", "#fbbf24", "#facc15"];

export function CelebrationEffect({ isActive, type, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showBurst, setShowBurst] = useState(false);

  const colors = type === "legendary" ? LEGENDARY_COLORS : EPIC_COLORS;

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const count = type === "legendary" ? 80 : 50;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const velocity = 8 + Math.random() * 12;
      
      newParticles.push({
        id: i,
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 10,
        rotation: Math.random() * 360,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 5,
        shape: ["circle", "square", "star"][Math.floor(Math.random() * 3)] as Particle["shape"],
      });
    }

    // Add extra sparkles from sides
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: count + i,
        x: Math.random() * window.innerWidth,
        y: window.innerHeight + 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 8,
        rotation: Math.random() * 360,
        velocityX: (Math.random() - 0.5) * 4,
        velocityY: -(10 + Math.random() * 10),
        shape: "star",
      });
    }

    return newParticles;
  }, [colors, type]);

  useEffect(() => {
    if (isActive) {
      setParticles(createParticles());
      setShowBurst(true);

      const timer = setTimeout(() => {
        setShowBurst(false);
        setParticles([]);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isActive, createParticles, onComplete]);

  if (!isActive && particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Central burst glow */}
      <AnimatePresence>
        {showBurst && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 2 }}
            transition={{ duration: 0.4 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className={`w-32 h-32 rounded-full blur-3xl ${
                type === "legendary"
                  ? "bg-gradient-to-r from-amber-400 to-orange-500"
                  : "bg-gradient-to-r from-purple-400 to-pink-500"
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confetti particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: particle.x,
            y: particle.y,
            rotate: 0,
            opacity: 1,
            scale: 0,
          }}
          animate={{
            x: particle.x + particle.velocityX * 40,
            y: particle.y + particle.velocityY * 40 + 200,
            rotate: particle.rotation + 720,
            opacity: 0,
            scale: 1,
          }}
          transition={{
            duration: 2 + Math.random(),
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="absolute"
          style={{
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.shape !== "star" ? particle.color : "transparent",
            borderRadius: particle.shape === "circle" ? "50%" : particle.shape === "square" ? "2px" : "0",
          }}
        >
          {particle.shape === "star" && (
            <svg
              viewBox="0 0 24 24"
              fill={particle.color}
              className="w-full h-full"
            >
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7L2 9.4h7.6L12 2z" />
            </svg>
          )}
        </motion.div>
      ))}

      {/* Animated rings for legendary */}
      {type === "legendary" && showBurst && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              initial={{ opacity: 0.8, scale: 0 }}
              animate={{ opacity: 0, scale: 3 }}
              transition={{
                duration: 1.5,
                delay: i * 0.2,
                ease: "easeOut",
              }}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-4 border-amber-400 rounded-full"
            />
          ))}
        </>
      )}

      {/* Floating sparkles */}
      {showBurst && (
        <>
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                opacity: 0,
                scale: 0,
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1.5, 0],
              }}
              transition={{
                duration: 1,
                delay: Math.random() * 0.5,
                repeat: 2,
                repeatDelay: Math.random() * 0.3,
              }}
              className={`absolute w-3 h-3 ${
                type === "legendary" ? "text-amber-400" : "text-purple-400"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L5.7 21l2.3-7L2 9.4h7.6L12 2z" />
              </svg>
            </motion.div>
          ))}
        </>
      )}
    </div>
  );
}
