import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Coins, Sparkles, Star, Zap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface LuckyDropReward {
  type: "xp" | "coins" | "badge" | "boost";
  amount?: number;
  name?: string;
  icon: React.ReactNode;
  rarity: "common" | "rare" | "epic" | "legendary";
}

const rarityColors = {
  common: "from-slate-400 to-slate-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

const rarityGlow = {
  common: "shadow-slate-400/30",
  rare: "shadow-blue-500/40",
  epic: "shadow-purple-500/50",
  legendary: "shadow-amber-500/60",
};

interface LuckyDropProps {
  isOpen: boolean;
  onClose: () => void;
  onClaim: (reward: LuckyDropReward) => void;
}

const possibleRewards: LuckyDropReward[] = [
  { type: "xp", amount: 50, icon: <Zap className="w-8 h-8" />, rarity: "common" },
  { type: "xp", amount: 100, icon: <Zap className="w-8 h-8" />, rarity: "rare" },
  { type: "xp", amount: 250, icon: <Zap className="w-8 h-8" />, rarity: "epic" },
  { type: "coins", amount: 25, icon: <Coins className="w-8 h-8" />, rarity: "common" },
  { type: "coins", amount: 75, icon: <Coins className="w-8 h-8" />, rarity: "rare" },
  { type: "coins", amount: 200, icon: <Coins className="w-8 h-8" />, rarity: "legendary" },
  { type: "boost", name: "XP Boost 2x", icon: <Star className="w-8 h-8" />, rarity: "epic" },
  { type: "badge", name: "Lucky Star", icon: <Trophy className="w-8 h-8" />, rarity: "legendary" },
];

export function LuckyDrop({ isOpen, onClose, onClaim }: LuckyDropProps) {
  const [phase, setPhase] = useState<"intro" | "opening" | "reveal">("intro");
  const [reward, setReward] = useState<LuckyDropReward | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPhase("intro");
      setReward(null);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setPhase("opening");
    
    // Weighted random selection
    const weights = { common: 50, rare: 30, epic: 15, legendary: 5 };
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    let selectedRarity: "common" | "rare" | "epic" | "legendary" = "common";
    for (const [rarity, weight] of Object.entries(weights)) {
      random -= weight;
      if (random <= 0) {
        selectedRarity = rarity as typeof selectedRarity;
        break;
      }
    }
    
    const filteredRewards = possibleRewards.filter(r => r.rarity === selectedRarity);
    const selectedReward = filteredRewards[Math.floor(Math.random() * filteredRewards.length)];
    
    setTimeout(() => {
      setReward(selectedReward);
      setPhase("reveal");
      
      if (selectedReward.rarity === "legendary" || selectedReward.rarity === "epic") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: selectedReward.rarity === "legendary" 
            ? ["#fbbf24", "#f59e0b", "#d97706"]
            : ["#a855f7", "#9333ea", "#7c3aed"],
        });
      }
    }, 1500);
  };

  const handleClaim = () => {
    if (reward) {
      onClaim(reward);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm mx-4"
          >
            {phase === "intro" && (
              <motion.div
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                className="bg-card rounded-3xl p-10 text-center border border-primary/30 shadow-[0_0_50px_rgba(0,255,255,0.15)] relative overflow-hidden backdrop-blur-2xl"
              >
                {/* HUD scanline */}
                <div className="absolute inset-0 pointer-events-none opacity-10">
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,cyan_50%,transparent_100%)] bg-[length:100%_4px] animate-scanline" />
                </div>

                <motion.div
                  animate={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary text-white mb-6 shadow-glow-primary relative z-10"
                >
                  <Gift className="w-16 h-16 animate-pulse" />
                </motion.div>
                
                <h2 className="text-3xl font-black mb-2 text-white uppercase italic tracking-widest">
                  Tactical Drop
                </h2>
                <p className="text-xs text-muted-foreground mb-8 font-black uppercase tracking-tighter opacity-70">
                  SECURE_CONTAINER_LOCATED // AUTHORIZATION_REQUIRED
                </p>
                
                <Button
                  onClick={handleOpen}
                  variant="hero"
                  className="w-full shadow-glow-primary uppercase font-black italic tracking-[0.2em] py-6"
                >
                  <Sparkles className="w-5 h-5 mr-3" />
                  INITIALIZE_EXTRACTION
                </Button>
              </motion.div>
            )}

            {phase === "opening" && (
              <motion.div className="bg-card rounded-3xl p-10 text-center border border-primary/30 shadow-glow-primary backdrop-blur-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <motion.div
                  animate={{ 
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="inline-flex p-6 rounded-3xl bg-gradient-to-br from-primary via-accent to-primary text-white mb-6 shadow-glow-primary"
                >
                  <Gift className="w-16 h-16" />
                </motion.div>
                <p className="text-sm font-black text-primary animate-pulse uppercase tracking-[0.3em] italic">DECRYPTING_CONTAINER...</p>
              </motion.div>
            )}

            {phase === "reveal" && reward && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className={`bg-card rounded-3xl p-10 text-center border-2 border-primary/40 shadow-glow-primary backdrop-blur-2xl relative overflow-hidden ${rarityGlow[reward.rarity]}`}
              >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                
                <motion.div
                  initial={{ y: -50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`inline-flex p-6 rounded-3xl bg-gradient-to-br ${rarityColors[reward.rarity]} text-white mb-6 shadow-glow-sm relative z-10 border border-white/20`}
                >
                  {reward.icon}
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="relative z-10"
                >
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg bg-gradient-to-r ${rarityColors[reward.rarity]} text-white italic shadow-lg`}>
                    RARE_ITEM_DETECTION: {reward.rarity}
                  </span>
                  
                  <h2 className="text-4xl font-black mt-6 mb-2 text-white italic uppercase tracking-tighter">
                    {reward.type === "xp" && `+${reward.amount} XP`}
                    {reward.type === "coins" && `+${reward.amount} CREDITS`}
                    {reward.type === "boost" && reward.name}
                    {reward.type === "badge" && reward.name}
                  </h2>
                  
                  <p className="text-[11px] text-muted-foreground mb-8 font-black uppercase tracking-widest opacity-80 italic">
                    {reward.rarity === "legendary" && "LEGENDARY_ASSET_ACQUIRED // CRITICAL_SUCCESS"}
                    {reward.rarity === "epic" && "EPIC_UPGRADE_DETECTED // HIGH_VALUE"}
                    {reward.rarity === "rare" && "RARE_RESOURCE_EXTRACTED // SUCCESS"}
                    {reward.rarity === "common" && "STANDARD_ISSUE_REWARD // COMPLETED"}
                  </p>
                </motion.div>
                
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="relative z-10"
                >
                  <Button
                    onClick={handleClaim}
                    variant="hero"
                    className={`w-full uppercase font-black text-xs italic tracking-widest shadow-glow-primary bg-gradient-to-r ${rarityColors[reward.rarity]}`}
                  >
                    TRANSFER_TO_INVENTORY
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook para disparar lucky drops aleatoriamente
export function useLuckyDrop(probability: number = 0.05) {
  const [isOpen, setIsOpen] = useState(false);
  
  const triggerCheck = () => {
    if (Math.random() < probability) {
      setIsOpen(true);
    }
  };
  
  const closeDrop = () => setIsOpen(false);
  
  return { isOpen, triggerCheck, closeDrop, openDrop: () => setIsOpen(true) };
}

// Componente de trigger para o dashboard
export function LuckyDropTrigger() {
  const { isOpen, closeDrop, openDrop } = useLuckyDrop();
  
  const handleClaim = (reward: LuckyDropReward) => {
    // Reward claim handled - integration with gamification system
    // XP and coins are added via the onClaim callback
  };

  return (
    <div data-tour="lucky-drop">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative overflow-hidden rounded-2xl bg-black/40 border border-primary/20 p-5 cursor-pointer shadow-lg hover:border-primary/50 transition-all duration-500 group"
        onClick={openDrop}
      >
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-[length:20px_20px] opacity-10" />
        
        <div className="flex items-center gap-5 relative z-10">
          <motion.div
            animate={{ 
              rotate: [0, -8, 8, -8, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary via-accent to-primary text-white shadow-glow-primary border border-white/20 group-hover:shadow-glow-accent transition-all duration-500"
          >
            <Gift className="w-7 h-7" />
          </motion.div>
          
          <div className="flex-1">
            <h3 className="font-black text-sm text-white uppercase italic tracking-[0.1em] flex items-center gap-2">
              Tactical Cargo
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="text-[10px] bg-primary text-primary-foreground font-black px-2 py-0.5 rounded-md italic"
              >
                UNCLAIMED
              </motion.span>
            </h3>
            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-tighter opacity-70 italic mt-0.5">
              SECURE_DROP_AVAILABLE // EXTRACT_NOW
            </p>
          </div>
          
          <motion.div
            animate={{ x: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="hidden sm:block"
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </motion.div>
        </div>
        
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        />
      </motion.div>
      
      <LuckyDrop isOpen={isOpen} onClose={closeDrop} onClaim={handleClaim} />
    </div>
  );
}
