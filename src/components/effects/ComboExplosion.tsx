import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  rotation: number;
  emoji?: string;
}

interface ComboExplosionProps {
  trigger: boolean;
  tier: number;
  onComplete?: () => void;
}

const TIER_COLORS = [
  ["#94a3b8", "#64748b"], // Normal - gray
  ["#3b82f6", "#60a5fa"], // Aquecendo - blue
  ["#f97316", "#fb923c"], // Em Chamas - orange
  ["#ef4444", "#f87171"], // Imparável - red
  ["#f59e0b", "#fbbf24"], // LENDÁRIO - amber/gold
];

const TIER_EMOJIS = [
  ["⭐"],
  ["⚡", "💫"],
  ["🔥", "💥", "✨"],
  ["💀", "🔥", "⚡", "💥"],
  ["👑", "🏆", "💎", "🔥", "⚡"],
];

export function ComboExplosion({ trigger, tier, onComplete }: ComboExplosionProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger && tier > 0) {
      // Generate particles
      const colors = TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)];
      const emojis = TIER_EMOJIS[Math.min(tier, TIER_EMOJIS.length - 1)];
      const particleCount = 20 + tier * 10;

      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = 100 + Math.random() * 150;
        const useEmoji = Math.random() > 0.7;

        newParticles.push({
          id: i,
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity,
          size: 4 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          emoji: useEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : undefined,
        });
      }

      setParticles(newParticles);
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [trigger, tier, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center"
        >
          {/* Center flash */}
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute w-20 h-20 rounded-full"
            style={{
              background: `radial-gradient(circle, ${TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)][0]} 0%, transparent 70%)`,
            }}
          />

          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                x: 0,
                y: 0,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: particle.x,
                y: particle.y,
                scale: 0,
                opacity: 0,
                rotate: particle.rotation,
              }}
              transition={{
                duration: 1 + Math.random() * 0.5,
                ease: "easeOut",
              }}
              className="absolute"
              style={{
                width: particle.emoji ? "auto" : particle.size,
                height: particle.emoji ? "auto" : particle.size,
              }}
            >
              {particle.emoji ? (
                <span className="text-2xl">{particle.emoji}</span>
              ) : (
                <div
                  className="rounded-full"
                  style={{
                    width: particle.size,
                    height: particle.size,
                    backgroundColor: particle.color,
                    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
                  }}
                />
              )}
            </motion.div>
          ))}

          {/* Tier text */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 0 }}
            animate={{ scale: [0.5, 1.5, 1], opacity: [0, 1, 1], y: -50 }}
            transition={{ duration: 0.6, times: [0, 0.3, 1] }}
            className="absolute text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.3, repeat: 3 }}
              className="text-4xl font-black drop-shadow-lg"
              style={{ color: TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)][0] }}
            >
              x{(1 + tier * 0.5).toFixed(1)}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg font-bold text-white drop-shadow-lg"
            >
              {tier === 1 && "AQUECENDO!"}
              {tier === 2 && "EM CHAMAS!"}
              {tier === 3 && "IMPARÁVEL!"}
              {tier === 4 && "LENDÁRIO!"}
            </motion.div>
          </motion.div>

          {/* Ring effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-16 h-16 rounded-full border-4"
            style={{
              borderColor: TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)][0],
            }}
          />

          {/* Second ring */}
          <motion.div
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="absolute w-20 h-20 rounded-full border-2"
            style={{
              borderColor: TIER_COLORS[Math.min(tier, TIER_COLORS.length - 1)][1],
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shockwave effect component
export function ComboShockwave({ trigger, color }: { trigger: boolean; color: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 800);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 rounded-lg pointer-events-none"
          style={{
            border: `3px solid ${color}`,
            boxShadow: `0 0 20px ${color}`,
          }}
        />
      )}
    </AnimatePresence>
  );
}
