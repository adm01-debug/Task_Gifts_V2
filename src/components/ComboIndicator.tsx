import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useTodayCombo, setTierUpCallback, COMBO_TIERS } from "@/hooks/useCombo";
import { comboService } from "@/services/comboService";
import { ComboExplosion } from "@/components/effects/ComboExplosion";

interface ComboIndicatorProps {
  variant?: "compact" | "full";
}

export function ComboIndicator({ variant = "compact" }: ComboIndicatorProps) {
  const { data: combo, isLoading } = useTodayCombo();
  const [explosionTrigger, setExplosionTrigger] = useState(false);
  const [explosionTier, setExplosionTier] = useState(0);

  // Register callback for tier-up explosions
  const handleTierUp = useCallback((tier: number) => {
    setExplosionTier(tier);
    setExplosionTrigger(true);
  }, []);

  useEffect(() => {
    setTierUpCallback(handleTierUp);
    return () => setTierUpCallback(null);
  }, [handleTierUp]);

  const handleExplosionComplete = () => {
    setExplosionTrigger(false);
  };

  if (isLoading || !combo) return null;

  const currentTier = comboService.getComboTier(combo.actions_count);
  const nextTier = comboService.getNextTier(combo.actions_count);

  const progressToNext = nextTier
    ? ((combo.actions_count - currentTier.minActions) /
        (nextTier.minActions - currentTier.minActions)) *
      100
    : 100;

  const isOnFire = combo.current_multiplier >= 2.0;

  const glowStyles = {
    1: "",
    2: "shadow-[0_0_10px_rgba(34,197,94,0.4)]",
    3: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
    4: "shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    5: "shadow-[0_0_25px_rgba(249,115,22,0.6)]",
    6: "shadow-[0_0_30px_rgba(239,68,68,0.7)]",
  };

  const tierIndex = COMBO_TIERS.findIndex(t => t.multiplier === combo.current_multiplier) + 1;
  const glowClass = glowStyles[tierIndex as keyof typeof glowStyles] || "";

  if (variant === "compact") {
    return (
      <>
        <ComboExplosion
          trigger={explosionTrigger}
          tier={explosionTier}
          onComplete={handleExplosionComplete}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: isOnFire ? [1, 1.05, 1] : 1,
            boxShadow: isOnFire ? [
              "0 0 0px rgba(249,115,22,0)",
              "0 0 20px rgba(249,115,22,0.6)",
              "0 0 0px rgba(249,115,22,0)"
            ] : undefined
          }}
          transition={{ 
            scale: { repeat: Infinity, duration: 1.5 },
            boxShadow: { repeat: Infinity, duration: 1.5 }
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${currentTier.bgColor} ${glowClass} transition-shadow duration-300`}
        >
           <div className="flex items-center gap-1.5 relative overflow-hidden">
             <AnimatePresence mode="wait">
               <motion.div
                 key={currentTier.label}
                 initial={{ scale: 0, rotate: -180 }}
                 animate={{ scale: 1, rotate: 0 }}
                 exit={{ scale: 0, rotate: 180 }}
                 className="relative z-10"
               >
                 {isOnFire ? (
                   <Flame className={`w-4 h-4 ${currentTier.color} drop-shadow-glow`} />
                 ) : (
                   <Zap className={`w-4 h-4 ${currentTier.color} drop-shadow-glow`} />
                 )}
               </motion.div>
             </AnimatePresence>
 
             <div className="flex flex-col -space-y-1">
               <span className={`text-[10px] font-black uppercase tracking-widest ${currentTier.color} opacity-70`}>Multiplier</span>
               <span className={`text-base font-black italic tracking-tighter ${currentTier.color}`}>
                 x{combo.current_multiplier.toFixed(1)}
               </span>
             </div>
           </div>
 
           {combo.actions_count > 0 && (
             <div className="h-4 w-px bg-white/10 mx-1" />
           )}
 
           {combo.actions_count > 0 && (
             <div className="flex flex-col -space-y-1">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50">Actions</span>
               <span className="text-xs font-black text-muted-foreground">
                 {combo.actions_count}
               </span>
             </div>
           )}
        </motion.div>
      </>
    );
  }

  return (
    <>
      <ComboExplosion
        trigger={explosionTrigger}
        tier={explosionTier}
        onComplete={handleExplosionComplete}
      />
      <motion.div
        animate={isOnFire ? {
          boxShadow: [
            "0 0 0px rgba(249,115,22,0)",
            "0 0 30px rgba(249,115,22,0.4)",
            "0 0 0px rgba(249,115,22,0)"
          ]
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
      >
      <Card
        variant="elevated"
        className={`overflow-hidden transition-all duration-300 ${
          isOnFire ? "border-orange-500/50" : ""
        } ${glowClass}`}
      >
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isOnFire ? { rotate: [0, -10, 10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
            >
              {isOnFire ? (
                <Flame className={`w-6 h-6 ${currentTier.color}`} />
              ) : (
                <Zap className={`w-6 h-6 ${currentTier.color}`} />
              )}
            </motion.div>
            <div>
              <h3 className="font-bold">Combo do Dia</h3>
              <p className="text-xs text-muted-foreground">
                {combo.actions_count} ações realizadas
              </p>
            </div>
          </div>

          <Badge className={`${currentTier.bgColor} ${currentTier.color} border-0`}>
            {currentTier.label}
          </Badge>
        </div>

        <div className="space-y-3">
          {/* Multiplier Display */}
          <div className="flex items-center justify-center py-3">
            <motion.div
              key={combo.current_multiplier}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ 
                scale: [1, isOnFire ? 1.1 : 1, 1],
                opacity: 1 
              }}
              transition={{ 
                scale: { repeat: isOnFire ? Infinity : 0, duration: 2 }
              }}
              className="text-center"
            >
              <motion.span 
                className={`text-4xl font-black ${currentTier.color}`}
                animate={isOnFire ? {
                  textShadow: [
                    "0 0 0px currentColor",
                    "0 0 20px currentColor",
                    "0 0 0px currentColor"
                  ]
                } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                x{combo.current_multiplier}
              </motion.span>
              <p className="text-xs text-muted-foreground mt-1">Multiplicador de XP</p>
            </motion.div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Próximo: {nextTier.label}</span>
                <span className={nextTier.color}>x{nextTier.multiplier}</span>
              </div>
              <Progress value={progressToNext} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                +{nextTier.minActions - combo.actions_count} ações para x{nextTier.multiplier}
              </p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold text-green-500">+{combo.total_bonus_xp}</p>
              <p className="text-xs text-muted-foreground">XP Bônus Hoje</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-muted/50">
              <Flame className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <p className="text-lg font-bold text-amber-500">
                x{combo.max_multiplier_reached}
              </p>
              <p className="text-xs text-muted-foreground">Máximo Hoje</p>
            </div>
          </div>

          {/* Tier Ladder */}
          <div className="flex justify-between items-center pt-2">
            {COMBO_TIERS.map((tier, index) => (
              <div
                key={tier.minActions}
                className={`flex flex-col items-center ${
                  combo.current_multiplier >= tier.multiplier
                    ? tier.color
                    : "text-muted-foreground/40"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    combo.current_multiplier >= tier.multiplier
                      ? tier.bgColor
                      : "bg-muted/30"
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-[10px] mt-1">x{tier.multiplier}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
    </motion.div>
    </>
  );
}
