import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { 
  Zap, Clock, Star, Rocket, Shield, 
  TrendingUp, Sparkles, Timer, X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface PowerUp {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  multiplier: number;
  duration: number; // minutes
  color: string;
  gradient: string;
  cost: number;
  isActive?: boolean;
  remainingTime?: number; // seconds
}

interface PowerUpsProps {
  availablePowerUps?: PowerUp[];
  activePowerUp?: PowerUp | null;
  userCoins?: number;
  onActivate?: (powerUp: PowerUp) => void;
  className?: string;
}

const defaultPowerUps: PowerUp[] = [
  {
    id: "double-xp",
    name: "XP Duplo",
    description: "Dobra todo XP ganho",
    icon: Zap,
    multiplier: 2,
    duration: 30,
    color: "text-blue-500",
    gradient: "from-blue-500 to-indigo-500",
    cost: 100,
  },
  {
    id: "triple-xp",
    name: "XP Triplo",
    description: "Triplica todo XP ganho",
    icon: Rocket,
    multiplier: 3,
    duration: 15,
    color: "text-purple-500",
    gradient: "from-purple-500 to-pink-500",
    cost: 200,
  },
  {
    id: "streak-shield",
    name: "Escudo de Streak",
    description: "Protege sua sequência por 24h",
    icon: Shield,
    multiplier: 1,
    duration: 1440,
    color: "text-green-500",
    gradient: "from-green-500 to-emerald-500",
    cost: 150,
  },
  {
    id: "coin-boost",
    name: "Bônus de Moedas",
    description: "+50% em todas as moedas",
    icon: Star,
    multiplier: 1.5,
    duration: 60,
    color: "text-amber-500",
    gradient: "from-amber-500 to-orange-500",
    cost: 120,
  },
];

/**
 * PowerUps - Power-up shop and management
 */
export function PowerUps({
  availablePowerUps = defaultPowerUps,
  activePowerUp = null,
  userCoins = 500,
  onActivate,
  className,
}: PowerUpsProps) {
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUp | null>(null);

  const handleActivate = (powerUp: PowerUp) => {
    if (userCoins >= powerUp.cost) {
      onActivate?.(powerUp);
      setSelectedPowerUp(null);
    }
  };

  return (
     <Card variant="ultra" className={cn("overflow-hidden relative group", className)}>
       {/* Scanner lines effect */}
       <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
         <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,255,255,0.2)_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline" />
       </div>
       
       <CardHeader className="pb-4 relative z-10">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow-primary transition-all duration-500">
               <Rocket className="w-6 h-6 text-primary animate-pulse" />
             </div>
             <div>
               <CardTitle className="text-sm font-black uppercase tracking-widest leading-none mb-1 text-white">
                 Tactical Armory
               </CardTitle>
               <div className="flex items-center gap-2">
                 <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                 <p className="text-[10px] text-muted-foreground font-black opacity-70 uppercase tracking-tighter italic">SYS_READY_FOR_DEPLOYMENT</p>
               </div>
             </div>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 shadow-inner">
             <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
             <span className="text-xs font-black text-white italic tracking-wider">
               {userCoins.toLocaleString()}
             </span>
           </div>
         </div>
       </CardHeader>

      <CardContent className="space-y-4 relative z-10">
        {/* Active Power-Up */}
        <AnimatePresence>
          {activePowerUp && (
            <ActivePowerUpBanner powerUp={activePowerUp} />
          )}
        </AnimatePresence>

        {/* Available Power-Ups Grid */}
        <div className="grid grid-cols-2 gap-3">
          {availablePowerUps.map((powerUp, index) => {
            const canAfford = userCoins >= powerUp.cost;
            const isSelected = selectedPowerUp?.id === powerUp.id;

            return (
              <motion.button
                key={powerUp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedPowerUp(isSelected ? null : powerUp)}
                 disabled={!canAfford || !!activePowerUp}
                 className={cn(
                   "relative p-4 rounded-2xl border transition-all duration-500 text-left overflow-hidden group/btn",
                   isSelected && "border-primary bg-primary/20 ring-1 ring-primary/40 shadow-glow-sm",
                   !isSelected && "border-white/10 bg-black/20 hover:border-primary/50 hover:bg-black/40",
                   !canAfford && "opacity-40 grayscale cursor-not-allowed",
                   activePowerUp && "opacity-40 cursor-not-allowed"
                 )}
               >
                 {/* Holographic background effect */}
                 <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-5 bg-gradient-to-br from-primary via-transparent to-primary transition-opacity duration-500" />

                 {/* Icon Container */}
                 <div className={cn(
                   "w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover/btn:scale-110 relative",
                   `bg-gradient-to-br ${powerUp.gradient} shadow-lg shadow-${powerUp.color.split('-')[1]}-500/20`
                 )}>
                   <powerUp.icon className="w-6 h-6 text-white" />
                   {/* Glow effect */}
                   <div className="absolute inset-0 rounded-xl bg-white/20 animate-pulse opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                 </div>

                 {/* Info */}
                 <h4 className="font-black text-sm text-white uppercase tracking-tighter mb-1 italic group-hover/btn:text-primary transition-colors">
                   {powerUp.name}
                 </h4>
                 <p className="text-[10px] text-muted-foreground font-medium leading-tight line-clamp-2 mb-3 h-8">
                   {powerUp.description}
                 </p>

                 {/* Duration & Cost */}
                 <div className="flex items-center justify-between mt-auto">
                   <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase tracking-widest italic">
                     <Clock className="w-3 h-3 text-primary" />
                     <span>{powerUp.duration}M</span>
                   </div>
                   <div className={cn(
                     "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black italic shadow-inner",
                     canAfford 
                       ? "bg-amber-500/20 text-amber-500 border border-amber-500/30" 
                       : "bg-destructive/20 text-destructive border border-destructive/30"
                   )}>
                     <Star className="w-3 h-3 fill-current" />
                     <span>{powerUp.cost}</span>
                   </div>
                 </div>

                 {/* Multiplier badge */}
                 {powerUp.multiplier > 1 && (
                   <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white italic tracking-tighter shadow-glow-sm animate-pulse">
                     MOD_{powerUp.multiplier}X
                   </div>
                 )}
               </motion.button>
            );
          })}
        </div>

        {/* Selected Power-Up Confirmation */}
        <AnimatePresence>
          {selectedPowerUp && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
               <div className="p-4 rounded-2xl bg-black/40 border border-primary/40 shadow-glow-primary relative overflow-hidden">
                 {/* HUD grid background */}
                 <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:20px_20px] opacity-10" />
                 
                 <div className="flex items-center justify-between mb-4 relative z-10">
                   <div className="flex items-center gap-3">
                     <div className={cn(
                       "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                       `bg-gradient-to-br ${selectedPowerUp.gradient}`
                     )}>
                       <selectedPowerUp.icon className="w-6 h-6 text-white" />
                     </div>
                     <div>
                       <p className="font-black text-sm text-white uppercase italic tracking-wider leading-tight">
                         {selectedPowerUp.name}
                       </p>
                       <p className="text-[10px] text-primary font-black uppercase tracking-tighter italic opacity-80">
                         DEPLOYMENT_READY // DUR: {selectedPowerUp.duration}M
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex gap-3 relative z-10">
                   <Button
                     size="sm"
                     variant="glass"
                     className="flex-1 border-white/10 hover:bg-white/5 uppercase font-black text-[10px] italic tracking-widest"
                     onClick={() => setSelectedPowerUp(null)}
                   >
                     ABORT_MISSION
                   </Button>
                   <Button
                     size="sm"
                     variant="hero"
                     className="flex-1 uppercase font-black text-[10px] italic tracking-widest shadow-glow-primary"
                     onClick={() => handleActivate(selectedPowerUp)}
                   >
                     <Sparkles className="w-3 h-3 mr-1" />
                     INITIATE_DEPLOY ({selectedPowerUp.cost})
                   </Button>
                 </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

/**
 * ActivePowerUpBanner - Shows currently active power-up
 */
export function ActivePowerUpBanner({ 
  powerUp 
}: { 
  powerUp: PowerUp & { remainingTime?: number };
}) {
  const remainingMinutes = powerUp.remainingTime 
    ? Math.ceil(powerUp.remainingTime / 60) 
    : powerUp.duration;
  const progress = powerUp.remainingTime 
    ? (powerUp.remainingTime / (powerUp.duration * 60)) * 100 
    : 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "relative p-4 rounded-xl overflow-hidden",
        `bg-gradient-to-r ${powerUp.gradient}`
      )}
    >
      {/* Animated background */}
      <motion.div
        className="absolute inset-0 bg-white/10"
        animate={{ x: ["-100%", "100%"] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative flex items-center gap-3">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center"
        >
          <powerUp.icon className="w-6 h-6 text-white" />
        </motion.div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-white">{powerUp.name} Ativo!</h4>
            {powerUp.multiplier > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold text-white">
                {powerUp.multiplier}x ATIVO
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-white/80 text-xs">
            <Timer className="w-3 h-3" />
            <span>{remainingMinutes} min restantes</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <motion.div
              className="h-full bg-white/60 rounded-full"
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * MiniPowerUpIndicator - Compact indicator for active power-up
 */
export function MiniPowerUpIndicator({
  powerUp,
  remainingMinutes,
}: {
  powerUp: PowerUp;
  remainingMinutes: number;
}) {
  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        `bg-gradient-to-r ${powerUp.gradient}`
      )}
    >
      <powerUp.icon className="w-4 h-4 text-white" />
      <span className="text-xs font-bold text-white">
        {powerUp.multiplier}x
      </span>
      <span className="text-[10px] text-white/80">
        {remainingMinutes}m
      </span>
    </motion.div>
  );
}
