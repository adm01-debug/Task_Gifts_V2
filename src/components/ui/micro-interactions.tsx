import { memo, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useHaptics } from "@/hooks/useHaptics";

// Tipos de microinterações
type MicroInteractionType = 
  | "tap" 
  | "like" 
  | "complete" 
  | "unlock" 
  | "error"
  | "success"
  | "coin"
  | "xp";

interface RippleProps {
  x: number;
  y: number;
  color?: string;
}

// Componente de Ripple Effect
export const Ripple = memo(function Ripple({ x, y, color = "rgba(255,255,255,0.4)" }: RippleProps) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0.5 }}
      animate={{ scale: 4, opacity: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: 20,
        height: 20,
        marginLeft: -10,
        marginTop: -10,
        borderRadius: "50%",
        backgroundColor: color,
        pointerEvents: "none",
      }}
    />
  );
});

// Hook para criar ripple effect
export const useRipple = () => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const RippleContainer = memo(function RippleContainer() {
    return (
      <AnimatePresence>
        {ripples.map((ripple) => (
          <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
        ))}
      </AnimatePresence>
    );
  });

  return { createRipple, RippleContainer };
};

// Botão com efeito de pressão
interface PressableButtonProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "error" | "ghost" | "outline";
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  haptic?: "light" | "medium" | "heavy" | "none";
}

export const PressableButton = memo(function PressableButton({
  children,
  variant = "default",
  className,
  onClick,
  disabled,
  haptic = "light",
}: PressableButtonProps) {
  const { createRipple, RippleContainer } = useRipple();
  const { vibrate } = useHaptics();

  return (
    <motion.button
      className={cn(
        "relative overflow-hidden px-4 py-2 rounded-lg font-medium transition-all active:shadow-inner",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        variant === "success" && "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover:shadow-lg",
        variant === "error" && "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg",
        variant === "ghost" && "bg-transparent hover:bg-muted text-foreground",
        variant === "outline" && "bg-transparent border-2 border-primary text-primary hover:bg-primary/5",
        className
      )}
      whileTap={{ scale: 0.96, translateY: 1 }}
      whileHover={{ scale: 1.02 }}
      disabled={disabled}
      onClick={(e) => {
        if (haptic !== "none") vibrate(haptic);
        createRipple(e);
        onClick?.(e);
      }}
    >
      <span className="relative z-10">{children}</span>
      <RippleContainer />
    </motion.button>
  );
});

// Heart Like Animation
interface HeartLikeProps {
  isLiked: boolean;
  onToggle: () => void;
  size?: number;
}

export const HeartLike = memo(function HeartLike({ 
  isLiked, 
  onToggle, 
  size = 24 
}: HeartLikeProps) {
  const { vibrate } = useHaptics();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiked) {
      vibrate("medium");
    } else {
      vibrate("light");
    }
    onToggle();
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: 0.8 }}
      className="relative p-2 rounded-full hover:bg-red-50 transition-colors"
      aria-label={isLiked ? "Remover curtida" : "Curtir"}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={isLiked ? "#ef4444" : "none"}
        stroke={isLiked ? "#ef4444" : "currentColor"}
        strokeWidth={2}
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </motion.svg>

      {/* Particles on like */}
      <AnimatePresence>
        {isLiked && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1],
                  opacity: [1, 0],
                  x: Math.cos((i * 60 * Math.PI) / 180) * 20,
                  y: Math.sin((i * 60 * Math.PI) / 180) * 20,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full bg-red-500"
                style={{ marginLeft: -3, marginTop: -3 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

// Número animado (para XP, coins, etc)
interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

export const AnimatedNumber = memo(function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  className,
  duration = 0.5,
}: AnimatedNumberProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => Math.round(latest));
  
  useState(() => {
    const controls = motionValue.set(value);
  });

  return (
    <span className={className}>
      {prefix}
      <motion.span
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        key={value}
      >
        {value.toLocaleString()}
      </motion.span>
      {suffix}
    </span>
  );
});

// Floating reward indicator
interface FloatingRewardProps {
  type: "xp" | "coins" | "badge";
  value: string | number;
  x?: number;
  y?: number;
  onComplete?: () => void;
}

export const FloatingReward = memo(function FloatingReward({
  type,
  value,
  x = 50,
  y = 50,
  onComplete,
}: FloatingRewardProps) {
  const { vibrate } = useHaptics();

  useEffect(() => {
    vibrate("success");
  }, [vibrate]);

  const colors = {
    xp: "text-amber-500",
    coins: "text-yellow-500",
    badge: "text-purple-500",
  };

  const icons = {
    xp: "⚡",
    coins: "🪙",
    badge: "🏅",
  };

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 0.5 }}
      animate={{ opacity: 0, y: -60, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      onAnimationComplete={onComplete}
      className={cn(
        "fixed pointer-events-none font-bold text-lg flex items-center gap-1 z-50",
        colors[type]
      )}
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <span>{icons[type]}</span>
      <span>+{value}</span>
    </motion.div>
  );
});

// Progress bar com animação de preenchimento
interface AnimatedProgressProps {
  value: number;
  max?: number;
  showValue?: boolean;
  color?: string;
  height?: number;
  className?: string;
}

export const AnimatedProgress = memo(function AnimatedProgress({
  value,
  max = 100,
  showValue = false,
  color = "bg-primary",
  height = 8,
  className,
}: AnimatedProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn("relative", className)}>
      <div
        className="w-full bg-muted rounded-full overflow-hidden"
        style={{ height }}
      >
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>

      {showValue && (
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{value.toLocaleString()}</span>
          <span>{max.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
});

// Shake animation for errors
interface ShakeableProps {
  children: React.ReactNode;
  shake: boolean;
  className?: string;
}

export const Shakeable = memo(function Shakeable({
  children,
  shake,
  className,
}: ShakeableProps) {
  return (
    <motion.div
      className={className}
      animate={shake ? {
        x: [0, -10, 10, -10, 10, -5, 5, 0],
      } : { x: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
});

// Bounce in effect
interface BounceInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const BounceIn = memo(function BounceIn({
  children,
  delay = 0,
  className,
}: BounceInProps) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
});

// Glow pulse effect
interface GlowPulseProps {
  children: React.ReactNode;
  color?: string;
  active?: boolean;
  className?: string;
}

export const GlowPulse = memo(function GlowPulse({
  children,
  color = "rgba(59, 130, 246, 0.5)",
  active = true,
  className,
}: GlowPulseProps) {
  return (
    <motion.div
      className={cn("relative", className)}
      animate={active ? {
        boxShadow: [
          `0 0 0 0 ${color}`,
          `0 0 20px 10px ${color}`,
          `0 0 0 0 ${color}`,
        ],
      } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
});

// Stagger children animation
interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const StaggerContainer = memo(function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
}: StaggerContainerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
});

export const StaggerItem = memo(function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
    >
      {children}
    </motion.div>
  );
});
