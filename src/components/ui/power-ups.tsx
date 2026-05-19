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
     <Card className={cn("overflow-hidden border border-white/5 bg-card/40 backdrop-blur-xl rounded-3xl", className)}>
       <CardHeader className="pb-4 bg-white/5">
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center shadow-glow-sm">
               <Rocket className="w-5 h-5 text-primary" />
             </div>
             <div>
               <CardTitle className="text-xs font-black uppercase tracking-widest leading-none mb-1">Combat Support</CardTitle>
               <p className="text-[10px] text-muted-foreground font-black opacity-70 uppercase tracking-tighter italic">ARMORY_AVAILABLE</p>
             </div>
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5">
             <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
             <span className="text-xs font-black text-white italic">
               {userCoins.toLocaleString()}
             </span>
           </div>
         </div>
       </CardHeader>

      <CardContent className="space-y-4">
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
                   "relative p-4 rounded-2xl border transition-all duration-300 text-left overflow-hidden group",
                   isSelected && "border-primary bg-primary/10 ring-1 ring-primary/20 shadow-glow-sm",
                   !isSelected && "border-white/5 bg-white/5 hover:border-primary/40 hover:bg-white/10",
                   !canAfford && "opacity-40 grayscale cursor-not-allowed",
                   activePowerUp && "opacity-40 cursor-not-allowed"
                 )}
              >
                {/* Icon */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
                  `bg-gradient-to-br ${powerUp.gradient}`
                )}>
                  <powerUp.icon className="w-5 h-5 text-white" />
                </div>

                {/* Info */}
                <h4 className="font-semibold text-sm">{powerUp.name}</h4>
                <p className="text-[10px] text-muted-foreground line-clamp-2 mb-2">
                  {powerUp.description}
                </p>

                {/* Duration & Cost */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{powerUp.duration}min</span>
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                    canAfford 
                      ? "bg-amber-500/10 text-amber-600" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    <Star className="w-2.5 h-2.5" />
                    <span>{powerUp.cost}</span>
                  </div>
                </div>

                {/* Multiplier badge */}
                {powerUp.multiplier > 1 && (
                  <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary to-accent text-[10px] font-bold text-primary-foreground">
                    {powerUp.multiplier}x
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      `bg-gradient-to-br ${selectedPowerUp.gradient}`
                    )}>
                      <selectedPowerUp.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{selectedPowerUp.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Duração: {selectedPowerUp.duration} minutos
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedPowerUp(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-primary to-accent"
                    onClick={() => handleActivate(selectedPowerUp)}
                  >
                    <Sparkles className="w-4 h-4 mr-1" />
                    Ativar ({selectedPowerUp.cost})
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
