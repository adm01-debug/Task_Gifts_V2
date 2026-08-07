import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPParticle {
  id: number;
  x: number;
  y: number;
  value: string;
  size: number;
  delay: number;
}

interface AnimatedXPParticlesProps {
  isActive: boolean;
  xpGained?: number;
  onComplete?: () => void;
}

export const AnimatedXPParticles = ({ isActive, xpGained = 0, onComplete }: AnimatedXPParticlesProps) => {
  const [particles, setParticles] = useState<XPParticle[]>([]);

  const createParticles = useCallback(() => {
    const newParticles: XPParticle[] = [];
    const count = Math.min(Math.max(Math.ceil(xpGained / 10), 5), 15);

    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: i,
        x: 20 + Math.random() * 60, // Percentage position
        y: 80 + Math.random() * 20,
        value: i < 3 ? `+${Math.ceil(xpGained / 3)}` : "",
        size: 12 + Math.random() * 8,
        delay: i * 0.1,
      });
    }

    return newParticles;
  }, [xpGained]);

  useEffect(() => {
    if (isActive) {
      setParticles(createParticles());

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isActive, createParticles, onComplete]);

  if (!isActive && particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {/* Glow effect at bottom */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-success/30 to-transparent"
          />
        )}
      </AnimatePresence>

      {/* Rising particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute flex items-center gap-1"
          style={{
            left: `${particle.x}%`,
            bottom: "10%",
          }}
          initial={{
            y: 0,
            opacity: 0,
            scale: 0.5,
          }}
          animate={{
            y: -120 - Math.random() * 40,
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            delay: particle.delay,
            ease: "easeOut",
          }}
        >
          {particle.value ? (
            <span
              className="text-success font-bold drop-shadow-lg"
              style={{ fontSize: particle.size }}
            >
              {particle.value}
            </span>
          ) : (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, ease: "linear" }}
            >
              <Zap
                className="text-success drop-shadow-lg"
                style={{ width: particle.size, height: particle.size }}
                fill="currentColor"
              />
            </motion.div>
          )}
        </motion.div>
      ))}

      {/* Sparkle trail */}
      {particles.slice(0, 6).map((particle, i) => (
        <motion.div
          key={`sparkle-${particle.id}`}
          className="absolute w-1.5 h-1.5 rounded-full bg-success"
          style={{
            left: `${particle.x + (Math.random() - 0.5) * 10}%`,
            bottom: "15%",
            boxShadow: "0 0 8px hsl(var(--success))",
          }}
          initial={{
            y: 0,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            y: -80 - Math.random() * 60,
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 1,
            delay: particle.delay + 0.2,
            ease: "easeOut",
          }}
        />
      ))}

      {/* Central burst effect */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-success/50"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
