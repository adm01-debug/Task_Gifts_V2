import { memo, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Medal, Sparkles, TrendingUp } from "lucide-react";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { cn } from "@/lib/utils";

interface SidebarUserStatsProps {
  collapsed: boolean;
}

export const SidebarUserStats = memo(function SidebarUserStats({ 
  collapsed 
}: SidebarUserStatsProps) {
  const { data: profile } = useCurrentProfile();
  const [prevXP, setPrevXP] = useState(0);
  const [xpDiff, setXpDiff] = useState<number | null>(null);

  const displayName = profile?.display_name || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();
  const level = profile?.level || 1;
  const xp = profile?.xp || 0;
  const streak = profile?.streak || 0;
  const coins = profile?.coins || 0;

  // Detect XP changes for animation
  useEffect(() => {
    if (prevXP > 0 && xp !== prevXP) {
      setXpDiff(xp - prevXP);
      const timer = setTimeout(() => setXpDiff(null), 2000);
      return () => clearTimeout(timer);
    }
    setPrevXP(xp);
  }, [xp, prevXP]);

  // Memoized XP calculations
  const { xpInCurrentLevel, xpNeededForNext, xpProgress } = useMemo(() => {
   const xpForLevel = (lvl: number) => {
     if (lvl <= 1) return 0;
     return Math.floor(100 * Math.pow(1.5, lvl - 1));
   };
    const xpForCurrentLevel = xpForLevel(level);
    const xpForNextLevel = xpForLevel(level + 1);
    const inCurrent = xp - xpForCurrentLevel;
    const neededForNext = xpForNextLevel - xpForCurrentLevel;
    return {
      xpInCurrentLevel: Math.max(0, inCurrent),
      xpNeededForNext: neededForNext,
      xpProgress: neededForNext > 0 ? Math.min(100, (Math.max(0, inCurrent) / neededForNext) * 100) : 0,
    };
  }, [level, xp]);

  // Collapsed mode: compact avatar only
  if (collapsed) {
    return (
      <div className="p-2 border-b border-sidebar-border flex justify-center">
         <div className="relative group cursor-pointer">
           <motion.div 
             whileHover={{ scale: 1.15, rotate: 5 }}
             className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center text-sm font-black text-primary-foreground shadow-glow-sm border-2 border-white/20"
           >
             {initials}
           </motion.div>
           <motion.div 
             className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-card border-2 border-primary flex items-center justify-center shadow-lg"
             whileHover={{ scale: 1.2, y: -2 }}
           >
             <span className="text-[11px] font-black text-primary italic">{level}</span>
           </motion.div>
          
          {/* Streak indicator */}
          {streak > 0 && (
            <motion.div 
              className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Flame className="w-3 h-3 text-white" />
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Expanded mode: full user stats with animations
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 border-b border-sidebar-border"
    >
       <div className="flex items-center gap-4 mb-4">
         <div className="relative shrink-0 group">
           <motion.div 
             whileHover={{ scale: 1.1, rotate: 8 }}
             className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent flex items-center justify-center text-base font-black text-primary-foreground shadow-glow border-2 border-white/20"
           >
             {initials}
           </motion.div>
           <motion.div 
             className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-accent border-2 border-white/30 flex items-center justify-center shadow-xl z-10"
             animate={xpDiff ? { 
               scale: [1, 1.4, 1],
               boxShadow: ["0 0 0px var(--primary)", "0 0 20px var(--primary)", "0 0 0px var(--primary)"]
             } : {}}
           >
             <span className="text-[12px] font-black text-primary-foreground italic">{level}</span>
           </motion.div>
           <div className="absolute inset-0 bg-primary/20 blur-2xl opacity-0 group-hover:opacity-40 transition-opacity rounded-full" />
         </div>
         
         <div className="flex-1 min-w-0">
           <p className="font-black text-xs uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Elite Member</p>
           <p className="font-black text-lg tracking-tighter truncate italic">{displayName.toUpperCase()}</p>
           <div className="flex items-center gap-2 mt-1">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
               <motion.div
                 animate={streak > 0 ? { 
                   scale: [1, 1.3, 1],
                   filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"]
                 } : {}}
                 transition={{ duration: 1, repeat: Infinity }}
               >
                 <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500/20" />
               </motion.div>
               <span className="text-[10px] font-black text-orange-500 uppercase tracking-tighter">{streak} DAYS STREAK</span>
             </div>
           </div>
         </div>
      </div>
      
      {/* XP Bar with animation */}
      <div className="space-y-1.5 relative">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Nível {level + 1}
          </span>
          <span className="text-xp font-semibold">
            {xpInCurrentLevel.toLocaleString()} / {xpNeededForNext.toLocaleString()}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden relative">
          <motion.div
            className="h-full xp-bar rounded-full relative"
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          >
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
          </motion.div>
        </div>
        
        {/* XP gain indicator */}
        <AnimatePresence>
          {xpDiff && xpDiff > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: 0 }}
              animate={{ opacity: 1, y: -20, x: 20 }}
              exit={{ opacity: 0, y: -30 }}
              className="absolute right-0 top-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-bold shadow-lg"
            >
              <TrendingUp className="w-3 h-3" />
              +{xpDiff} XP
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Stats with hover animations */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <motion.div 
          whileHover={{ scale: 1.03, y: -2 }}
          className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl p-2.5 text-center cursor-pointer"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-blue-500" />
          </div>
          <p className="font-bold text-sm text-blue-600 dark:text-blue-400">{xp.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">XP Total</p>
        </motion.div>
        <motion.div 
          whileHover={{ scale: 1.03, y: -2 }}
          className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-2.5 text-center cursor-pointer"
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Medal className="w-4 h-4 text-amber-500" />
          </div>
          <p className="font-bold text-sm text-amber-600 dark:text-amber-400">{coins.toLocaleString()}</p>
          <p className="text-[10px] text-muted-foreground">Moedas</p>
        </motion.div>
      </div>
    </motion.div>
  );
});
