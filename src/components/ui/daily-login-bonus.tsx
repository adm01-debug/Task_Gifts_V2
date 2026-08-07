import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Gift, Check, Lock, Sparkles, Crown, 
  Flame, Star, Calendar, ChevronLeft, ChevronRight 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DailyReward {
  day: number;
  xp: number;
  coins: number;
  special?: string;
  claimed: boolean;
  available: boolean;
  isMilestone?: boolean;
}

interface DailyLoginBonusProps {
  currentStreak?: number;
  rewards?: DailyReward[];
  onClaimReward?: (day: number) => void;
  className?: string;
}

const defaultRewards: DailyReward[] = [
  { day: 1, xp: 50, coins: 10, claimed: true, available: false },
  { day: 2, xp: 75, coins: 15, claimed: true, available: false },
  { day: 3, xp: 100, coins: 20, claimed: true, available: false },
  { day: 4, xp: 125, coins: 25, claimed: false, available: true },
  { day: 5, xp: 150, coins: 30, claimed: false, available: false },
  { day: 6, xp: 175, coins: 35, claimed: false, available: false },
  { day: 7, xp: 300, coins: 100, special: "Caixa Misteriosa", claimed: false, available: false, isMilestone: true },
];

/**
 * DailyLoginBonus - Calendar-style daily rewards with escalating bonuses
 */
export function DailyLoginBonus({
  currentStreak = 4,
  rewards = defaultRewards,
  onClaimReward,
  className,
}: DailyLoginBonusProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimingDay, setClaimingDay] = useState<number | null>(null);

  const handleClaim = (day: number) => {
    setClaimingDay(day);
    setShowConfetti(true);
    
    setTimeout(() => {
      onClaimReward?.(day);
      setClaimingDay(null);
      setTimeout(() => setShowConfetti(false), 2000);
    }, 500);
  };

  const availableReward = rewards.find(r => r.available && !r.claimed);

  return (
     <Card className={cn("overflow-hidden border border-white/5 bg-card/40 backdrop-blur-xl rounded-3xl", className)}>
       <CardHeader className="pb-4 bg-white/5">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow-sm">
               <Calendar className="w-5 h-5 text-primary" />
             </div>
             <div>
               <CardTitle className="text-xs font-black uppercase tracking-widest leading-none mb-1">Daily Protocol</CardTitle>
               <p className="text-[10px] text-muted-foreground font-black opacity-70 uppercase tracking-tighter italic">REWARDS_SEQUENCE_ALPHA</p>
             </div>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20">
             <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
             <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">{currentStreak}D STREAK</span>
           </div>
         </div>
       </CardHeader>

      <CardContent className="space-y-4">
        {/* Weekly Calendar */}
        <div className="grid grid-cols-7 gap-2">
          {rewards.map((reward, index) => {
            const isToday = reward.available && !reward.claimed;
            const isClaimed = reward.claimed;
            const isLocked = !reward.available && !reward.claimed;
            const isClaiming = claimingDay === reward.day;

            return (
              <motion.div
                key={reward.day}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative"
              >
                <motion.button
                  whileHover={isToday ? { scale: 1.1 } : {}}
                  whileTap={isToday ? { scale: 0.95 } : {}}
                  onClick={() => isToday && handleClaim(reward.day)}
                  disabled={!isToday || isClaiming}
                   className={cn(
                     "w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 border relative overflow-hidden group",
                     isClaimed && "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 shadow-inner",
                     isToday && "bg-primary/20 border-primary ring-2 ring-primary/20 animate-pulse cursor-pointer",
                     isLocked && "bg-white/5 border-white/5 text-muted-foreground/40",
                     reward.isMilestone && !isClaimed && "bg-gradient-to-br from-amber-500/20 to-orange-500/20 border-amber-500/40 shadow-glow-sm"
                   )}
                >
                  {/* Day number */}
                  <span className="text-[10px] font-medium">Dia {reward.day}</span>
                  
                  {/* Icon */}
                  <div className="relative">
                    {isClaimed ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : isLocked ? (
                      <Lock className="w-4 h-4" />
                    ) : reward.isMilestone ? (
                      <Crown className="w-5 h-5 text-amber-500" />
                    ) : (
                      <Gift className={cn("w-5 h-5", isToday && "text-primary")} />
                    )}
                    
                    {/* Claiming animation */}
                    <AnimatePresence>
                      {isClaiming && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.5, 0] }}
                          exit={{ scale: 0 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <Sparkles className="w-8 h-8 text-amber-500" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Reward preview */}
                  {!isClaimed && !isLocked && (
                    <span className="text-[8px] font-bold text-primary">
                      +{reward.xp}
                    </span>
                  )}
                </motion.button>

                {/* Today indicator */}
                {isToday && (
                  <motion.div
                    className="absolute -top-1 left-1/2 -translate-x-1/2"
                    animate={{ y: [0, -3, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <div className="px-1.5 py-0.5 rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
                      HOJE
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Current Available Reward */}
        {availableReward && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                >
                  <Gift className="w-6 h-6 text-primary-foreground" />
                </motion.div>
                <div>
                  <p className="font-semibold text-sm">Recompensa do Dia {availableReward.day}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="text-blue-500 font-medium">+{availableReward.xp} XP</span>
                    <span>•</span>
                    <span className="text-amber-500 font-medium">+{availableReward.coins} coins</span>
                    {availableReward.special && (
                      <>
                        <span>•</span>
                        <span className="text-purple-500 font-medium">{availableReward.special}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => handleClaim(availableReward.day)}
                disabled={claimingDay !== null}
                className="bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {claimingDay ? (
                  <Sparkles className="w-4 h-4 animate-spin" />
                ) : (
                  "Resgatar"
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {/* Streak Bonus Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Star className="w-3 h-3 text-amber-500" />
          <span>Complete 7 dias para ganhar <strong className="text-foreground">bônus especial!</strong></span>
        </div>

        {/* Confetti effect */}
        <AnimatePresence>
          {showConfetti && (
            <>
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    opacity: 1, 
                    x: "50%", 
                    y: "50%",
                    scale: 0
                  }}
                  animate={{ 
                    opacity: 0,
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: [0, 1, 0.5],
                    rotate: Math.random() * 360
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1, delay: i * 0.02 }}
                  className="absolute w-2 h-2 rounded-full pointer-events-none"
                  style={{
                    background: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][i % 5]
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/**
 * MiniLoginBonus - Compact version for headers/sidebars
 */
export function MiniLoginBonus({ 
  streak = 4, 
  hasReward = true,
  onClick 
}: { 
  streak?: number; 
  hasReward?: boolean;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-gradient-to-r from-orange-500/10 to-amber-500/10",
        "border border-orange-500/20 hover:border-orange-500/40",
        "transition-all duration-200"
      )}
    >
      <Flame className="w-4 h-4 text-orange-500" />
      <span className="text-sm font-bold text-orange-600 dark:text-orange-400">
        {streak}
      </span>
      
      {hasReward && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background"
        />
      )}
    </motion.button>
  );
}
