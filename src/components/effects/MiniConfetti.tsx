import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MiniConfettiProps {
  isActive: boolean;
  type: "level" | "streak" | "trophy";
  originX?: number;
  originY?: number;
  onComplete?: () => void;
}

const COLORS = {
  level: ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#f59e0b"],
  streak: ["#f97316", "#fb923c", "#fdba74", "#ef4444", "#fbbf24"],
  trophy: ["#fbbf24", "#f59e0b", "#eab308", "#fcd34d", "#fef08a"],
};

const EMOJIS = {
  level: ["⚡", "✨", "🌟", "💫", "🎯"],
  streak: ["🔥", "💥", "⚡", "🌟", "💪"],
  trophy: ["🏆", "👑", "⭐", "🥇", "🎉"],
};

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  emoji?: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotation: number;
  isEmoji: boolean;
}

export function MiniConfetti({ isActive, type, originX, originY, onComplete }: MiniConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showGlow, setShowGlow] = useState(false);

  const colors = COLORS[type];
  const emojis = EMOJIS[type];

  const createParticles = useCallback(() => {
    const newParticles: Particle[] = [];
    const centerX = originX ?? (typeof window !== "undefined" ? window.innerWidth / 2 : 500);
    const centerY = originY ?? (typeof window !== "undefined" ? window.innerHeight / 3 : 200);
    
    // Create confetti particles
    for (let i = 0; i < 40; i++) {
      const angle = (Math.PI * 2 * i) / 40 + (Math.random() - 0.5) * 0.5;
      const velocity = 5 + Math.random() * 10;
      const isEmoji = i < 8; // First 8 are emojis
      
      newParticles.push({
        id: i,
        x: centerX,
        y: centerY,
        color: colors[Math.floor(Math.random() * colors.length)],
        emoji: isEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : undefined,
        size: isEmoji ? 16 + Math.random() * 8 : 6 + Math.random() * 8,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 3,
        rotation: Math.random() * 360,
        isEmoji,
      });
    }

    return newParticles;
  }, [colors, emojis, originX, originY]);

  useEffect(() => {
    if (isActive) {
      setParticles(createParticles());
      setShowGlow(true);

      const timer = setTimeout(() => {
        setShowGlow(false);
        setParticles([]);
        onComplete?.();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isActive, createParticles, onComplete]);

  if (!isActive && particles.length === 0) return null;

  const glowColor = type === "level" ? "from-success/50 to-success/20" : 
                    type === "streak" ? "from-primary/50 to-orange-500/20" : 
                    "from-warning/50 to-amber-500/20";

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* Central glow burst */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.3 }}
            className="absolute"
            style={{
              left: originX ?? "50%",
              top: originY ?? "33%",
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className={`w-24 h-24 rounded-full blur-2xl bg-gradient-radial ${glowColor}`} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Celebration text */}
      <AnimatePresence>
        {showGlow && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: (originY ?? (typeof window !== "undefined" ? window.innerHeight / 3 : 200)) - 60 }}
          >
            <div className={`text-lg font-bold px-4 py-2 rounded-full shadow-lg ${
              type === "level" ? "bg-success text-success-foreground" :
              type === "streak" ? "bg-primary text-primary-foreground" :
              "bg-warning text-warning-foreground"
            }`}>
              {type === "level" && "🎉 Primeiro Nível!"}
              {type === "streak" && "🔥 Primeira Streak!"}
              {type === "trophy" && "🏆 Primeiro Top 3!"}
            </div>
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
            x: particle.x + particle.velocityX * 35,
            y: particle.y + particle.velocityY * 35 + 150,
            rotate: particle.rotation + (particle.isEmoji ? 180 : 540),
            opacity: 0,
            scale: particle.isEmoji ? [0, 1.2, 1] : 1,
          }}
          transition={{
            duration: 1.8 + Math.random() * 0.5,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className="absolute flex items-center justify-center"
          style={{
            fontSize: particle.isEmoji ? particle.size : undefined,
            width: particle.isEmoji ? undefined : particle.size,
            height: particle.isEmoji ? undefined : particle.size,
            backgroundColor: particle.isEmoji ? "transparent" : particle.color,
            borderRadius: particle.isEmoji ? undefined : Math.random() > 0.5 ? "50%" : "2px",
            boxShadow: particle.isEmoji ? undefined : `0 0 6px ${particle.color}`,
          }}
        >
          {particle.isEmoji && particle.emoji}
        </motion.div>
      ))}

      {/* Expanding rings */}
      {showGlow && (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ring-${i}`}
              initial={{ opacity: 0.6, scale: 0 }}
              animate={{ opacity: 0, scale: 2 }}
              transition={{
                duration: 1,
                delay: i * 0.15,
                ease: "easeOut",
              }}
              className={`absolute w-16 h-16 border-2 rounded-full ${
                type === "level" ? "border-success" :
                type === "streak" ? "border-primary" :
                "border-warning"
              }`}
              style={{
                left: originX ?? "50%",
                top: originY ?? "33%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
