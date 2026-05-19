import { toast } from "sonner";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Zap, Gift, Medal, Crown, 
  TrendingUp, Target, Flame, Coins, 
  CheckCircle2, AlertCircle, Info, XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerHaptic } from "@/hooks/useHaptics";

type ToastType = "xp" | "coins" | "achievement" | "levelUp" | "streak" | "reward" | "quest" | "success" | "error" | "warning" | "info";

interface GamifiedToastOptions {
  title: string;
  description?: string;
  type: ToastType;
  amount?: number;
  icon?: React.ReactNode;
  duration?: number;
}

const toastStyles: Record<ToastType, { 
  icon: React.ReactNode; 
  gradient: string; 
  textColor: string;
  emoji?: string;
}> = {
  xp: {
    icon: <Zap className="w-5 h-5" />,
    gradient: "from-blue-500/20 to-cyan-500/20",
    textColor: "text-blue-500",
    emoji: "⚡",
  },
  coins: {
    icon: <Coins className="w-5 h-5" />,
    gradient: "from-yellow-500/20 to-amber-500/20",
    textColor: "text-yellow-500",
    emoji: "🪙",
  },
  achievement: {
    icon: <Trophy className="w-5 h-5" />,
    gradient: "from-purple-500/20 to-pink-500/20",
    textColor: "text-purple-500",
    emoji: "🏆",
  },
  levelUp: {
    icon: <Crown className="w-5 h-5" />,
    gradient: "from-amber-500/20 to-yellow-500/20",
    textColor: "text-amber-500",
    emoji: "👑",
  },
  streak: {
    icon: <Flame className="w-5 h-5" />,
    gradient: "from-orange-500/20 to-red-500/20",
    textColor: "text-orange-500",
    emoji: "🔥",
  },
  reward: {
    icon: <Gift className="w-5 h-5" />,
    gradient: "from-pink-500/20 to-rose-500/20",
    textColor: "text-pink-500",
    emoji: "🎁",
  },
  quest: {
    icon: <Target className="w-5 h-5" />,
    gradient: "from-emerald-500/20 to-green-500/20",
    textColor: "text-emerald-500",
    emoji: "🎯",
  },
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    gradient: "from-green-500/20 to-emerald-500/20",
    textColor: "text-green-500",
  },
  error: {
    icon: <XCircle className="w-5 h-5" />,
    gradient: "from-red-500/20 to-rose-500/20",
    textColor: "text-red-500",
  },
  warning: {
    icon: <AlertCircle className="w-5 h-5" />,
    gradient: "from-yellow-500/20 to-orange-500/20",
    textColor: "text-yellow-600",
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    gradient: "from-blue-500/20 to-indigo-500/20",
    textColor: "text-blue-500",
  },
};

const ToastContent = ({ 
  title, 
  description, 
  type, 
  amount, 
  icon: customIcon 
}: GamifiedToastOptions) => {
  const style = toastStyles[type];
  
  return (
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 50, opacity: 0 }}
       className={cn(
         "flex items-center gap-4 p-5 rounded-3xl border border-white/10 shadow-2xl",
         "bg-card/60 backdrop-blur-2xl relative overflow-hidden group",
       )}
    >
       {/* Glow Backdrop */}
       <div className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", style.gradient)} />
       
       <motion.div
         initial={{ scale: 0, rotate: -180 }}
         animate={{ scale: 1, rotate: 0 }}
         transition={{ 
           type: "spring", 
           stiffness: 260, 
           damping: 20,
           delay: 0.1 
         }}
         className={cn(
           "flex items-center justify-center w-12 h-12 rounded-2xl shrink-0 shadow-lg relative z-10",
           "bg-background/40 border border-white/5",
           style.textColor
         )}
       >
         <div className="absolute inset-0 blur-lg opacity-40 bg-current" />
         <div className="relative z-10">{customIcon || style.icon}</div>
       </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
           <motion.p 
             initial={{ y: -10, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.15 }}
             className="font-black text-xs uppercase tracking-widest truncate flex items-center gap-2"
           >
             {style.emoji && <span className="text-base">{style.emoji}</span>}
             {title}
           </motion.p>
          {amount !== undefined && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 500, 
                damping: 15,
                delay: 0.2 
              }}
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                "bg-background/80",
                style.textColor
              )}
            >
              +{amount}
            </motion.span>
          )}
        </div>
        {description && (
           {description && (
             <motion.p 
               initial={{ y: 10, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.2 }}
               className="text-sm font-bold text-muted-foreground/80 mt-1 truncate"
             >
               {description}
             </motion.p>
           )}
        )}
      </div>

      {/* Sparkle effects for special toasts */}
      {["levelUp", "achievement", "reward"].includes(type) && (
        <motion.div
          className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={cn("absolute w-1 h-1 rounded-full", style.textColor)}
              style={{
                left: `${20 + i * 15}%`,
                top: "50%",
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 1,
                delay: i * 0.1,
                repeat: 2,
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export const gamifiedToast = {
  xp: (amount: number, description?: string) => {
    triggerHaptic("light");
    toast.custom(() => (
      <ToastContent
        title={`+${amount} XP Ganhos!`}
        description={description || "Continue assim!"}
        type="xp"
        amount={amount}
      />
    ), { duration: 3000 });
  },

  coins: (amount: number, description?: string) => {
    triggerHaptic("medium");
    toast.custom(() => (
      <ToastContent
        title={`+${amount} Moedas!`}
        description={description || "Moedas adicionadas à sua conta"}
        type="coins"
        amount={amount}
      />
    ), { duration: 3000 });
  },

  achievement: (title: string, description?: string) => {
    triggerHaptic("success");
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description || "Nova conquista desbloqueada!"}
        type="achievement"
      />
    ), { duration: 4000 });
  },

  levelUp: (level: number) => {
    triggerHaptic("heavy");
    toast.custom(() => (
      <ToastContent
        title={`Level ${level} Alcançado!`}
        description="Parabéns pela evolução!"
        type="levelUp"
      />
    ), { duration: 5000 });
  },

  streak: (days: number) => {
    triggerHaptic("medium");
    toast.custom(() => (
      <ToastContent
        title={`${days} Dias de Streak!`}
        description="Mantenha o ritmo!"
        type="streak"
      />
    ), { duration: 3000 });
  },

  reward: (title: string, description?: string) => {
    triggerHaptic("success");
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description || "Você ganhou uma recompensa!"}
        type="reward"
      />
    ), { duration: 4000 });
  },

  quest: (title: string, description?: string) => {
    triggerHaptic("medium");
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description || "Missão completada!"}
        type="quest"
      />
    ), { duration: 3000 });
  },

  success: (title: string, description?: string) => {
    triggerHaptic("success");
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description}
        type="success"
      />
    ), { duration: 3000 });
  },

  error: (title: string, description?: string) => {
    triggerHaptic("error");
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description}
        type="error"
      />
    ), { duration: 4000 });
  },

  warning: (title: string, description?: string) => {
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description}
        type="warning"
      />
    ), { duration: 4000 });
  },

  info: (title: string, description?: string) => {
    toast.custom(() => (
      <ToastContent
        title={title}
        description={description}
        type="info"
      />
    ), { duration: 3000 });
  },

  custom: (options: GamifiedToastOptions) => {
    toast.custom(() => <ToastContent {...options} />, { 
      duration: options.duration || 3000 
    });
  },
};
