 import { forwardRef, useState } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import { Coins, Sparkles, Zap, Shield, Crown, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
 import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { shopService, type ShopReward } from "@/services/shopService";
 import { cn } from "@/lib/utils";

interface RewardCardProps {
  reward: ShopReward;
  userCoins: number;
  onPurchase: (reward: ShopReward) => void;
  purchasingRewardId: string | null;
}

 export const RewardCard = forwardRef<HTMLDivElement, RewardCardProps>(function RewardCard(
   { reward, userCoins, onPurchase, purchasingRewardId },
   ref
 ) {
    const [isHovered, setIsHovered] = useState(false);
   const isPurchasing = purchasingRewardId === reward.id;
   const rarityConfig = shopService.getRarityConfig(reward.rarity);
   const categoryConfig = shopService.getCategoryConfig(reward.category);
   const canAfford = userCoins >= reward.price_coins;
   const inStock = reward.stock === null || reward.stock > 0;
 
    const rarityColor = reward.rarity === "legendary" ? "#f59e0b" : reward.rarity === "epic" ? "#a855f7" : reward.rarity === "rare" ? "#3b82f6" : "#64748b";

   return (
     <motion.div
       ref={ref}
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -8 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full group"
     >
        <Card className={cn(
          "relative overflow-hidden h-full border-none transition-all duration-500 bg-[#0d0e14] shadow-2xl ring-1 ring-white/10",
          isHovered && "ring-white/20 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
        )}>
         {/* Rarity Background Glow */}
          <div 
            className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none blur-3xl"
            style={{ background: `radial-gradient(circle at center, ${rarityColor}, transparent 70%)` }} 
          />

          {/* Animated Scanline Effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
            <motion.div 
              animate={{ y: ["0%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              className="w-full h-1/2 bg-gradient-to-b from-transparent via-white/5 to-transparent"
            />
          </div>
 
          {/* Header Status */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20">
             <div className="flex flex-col gap-1">
               {reward.stock !== null && (
                 <Badge variant="secondary" className={cn(
                   "bg-black/60 backdrop-blur-md text-[8px] font-black uppercase tracking-[0.2em] border-none text-white px-2 py-0.5",
                   reward.stock === 0 && "text-red-500"
                 )}>
                   {reward.stock > 0 ? `${reward.stock} UNID.` : "ESGOTADO"}
                 </Badge>
               )}
               {reward.stock !== null && reward.stock <= 5 && reward.stock > 0 && (
                 <motion.div 
                   animate={{ opacity: [1, 0.5, 1] }}
                   transition={{ duration: 1, repeat: Infinity }}
                   className="text-[7px] font-black text-amber-500 uppercase tracking-widest"
                 >
                   Critical Stock
                 </motion.div>
               )}
             </div>
 
             <Badge className={cn(
               "px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] border-none shadow-lg",
               reward.rarity === "legendary" ? "bg-amber-500 text-black" : 
               reward.rarity === "epic" ? "bg-purple-500 text-white" : 
               reward.rarity === "rare" ? "bg-blue-500 text-white" : "bg-zinc-700 text-zinc-300"
             )}>
               {rarityConfig.label}
             </Badge>
          </div>
  
          <CardContent className="pt-20 pb-6 px-6 flex flex-col h-full relative z-10">
            {/* Reward Display */}
            <div className="flex justify-center mb-8 relative">
              <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
              
             <motion.div
                animate={isHovered ? { scale: 1.1, rotate: [0, 2, -2, 0] } : { scale: 1 }}
                transition={{ duration: 0.5 }}
                className={cn(
                  "w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl relative z-10 shadow-2xl ring-2 ring-white/20",
                  reward.rarity === "legendary" ? "bg-gradient-to-br from-amber-400 to-orange-600" : 
                  reward.rarity === "epic" ? "bg-gradient-to-br from-purple-500 to-pink-600" : 
                  reward.rarity === "rare" ? "bg-gradient-to-br from-blue-500 to-cyan-600" : "bg-zinc-800"
                )}
             >
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none rounded-[2rem]" />
                <span className="drop-shadow-lg filter group-hover:brightness-110 transition-all">
                  {categoryConfig.icon}
                </span>
                
                {reward.rarity === "legendary" && (
                  <div className="absolute -top-2 -right-2">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>
                      <Crown className="w-8 h-8 text-amber-300 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    </motion.div>
                  </div>
                )}
              </motion.div>
           </div>
 
            <div className="flex-1 space-y-3 mb-8">
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Module_{categoryConfig.label}</span>
                </div>
                <h3 className="font-black italic uppercase tracking-tighter text-2xl text-center leading-none group-hover:text-white transition-colors">
                  {reward.name}
                </h3>
              </div>
              
              <p className="text-[11px] text-zinc-400 text-center font-bold leading-tight line-clamp-3 px-2 uppercase tracking-tight">
               {reward.description}
             </p>
           </div>
 
            <div className="mt-auto space-y-3">
              <div className="relative group/price">
                <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover/price:opacity-100 transition-opacity" />
                <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-zinc-900/50 border border-white/5 group-hover:border-white/10 transition-all">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">Preço</span>
                  </div>
                  <span className="text-2xl font-black italic tracking-tighter text-white">
                    {reward.price_coins.toLocaleString()}
                  </span>
                </div>
             </div>
             
              <div className="relative">
                {!canAfford && inStock && (
                  <div className="absolute -top-8 left-0 right-0 flex justify-center">
                    <span className="text-[8px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                      Saldo Insuficiente
                    </span>
                  </div>
                )}
                <Button
                  onClick={() => onPurchase(reward)}
                  disabled={!canAfford || !inStock || isPurchasing}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl transition-all duration-300 relative overflow-hidden",
                    !inStock ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" :
                    !canAfford ? "bg-zinc-800 text-zinc-500 border border-white/5" :
                    reward.rarity === "legendary" ? "bg-white text-black hover:bg-zinc-200" :
                    reward.rarity === "epic" ? "bg-purple-600 text-white hover:bg-purple-700" :
                    "bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95"
                  )}
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   <span className="relative z-10 flex items-center justify-center gap-2">
                     {!inStock ? "Out of Stock" : !canAfford ? "Locked" : isPurchasing ? "Processing..." : "Acquire Module"}
                     {canAfford && inStock && <Zap className="w-3 h-3 fill-current" />}
                   </span>
                </Button>
              </div>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 });
