import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { shopService, type ShopReward } from "@/services/shopService";

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
   const isPurchasing = purchasingRewardId === reward.id;
   const rarityConfig = shopService.getRarityConfig(reward.rarity);
   const categoryConfig = shopService.getCategoryConfig(reward.category);
   const canAfford = userCoins >= reward.price_coins;
   const inStock = reward.stock === null || reward.stock > 0;
 
   return (
     <motion.div
       ref={ref}
       initial={{ opacity: 0, y: 20 }}
       animate={{ opacity: 1, y: 0 }}
       whileHover={{ scale: 1.02, y: -4 }}
       className="h-full"
     >
       <Card className={`relative overflow-hidden h-full border-none transition-all duration-500 bg-gradient-to-br from-card to-card/40 shadow-2xl ring-1 ring-white/5 group`}>
         {/* Rarity Background Glow */}
         {reward.rarity !== "common" && (
           <div className={`absolute inset-0 opacity-10 blur-3xl transition-opacity group-hover:opacity-20 pointer-events-none`} style={{ backgroundColor: rarityConfig.borderColor.replace('border-', '') }} />
         )}
 
         {/* Badges */}
         <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
           <Badge className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-none shadow-lg ${
             reward.rarity === "legendary" ? "bg-amber-500 text-white" : 
             reward.rarity === "epic" ? "bg-purple-500 text-white" : 
             reward.rarity === "rare" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
           }`}>
             {rarityConfig.label}
           </Badge>
           {reward.stock !== null && reward.stock <= 5 && reward.stock > 0 && (
             <Badge variant="destructive" className="px-2 py-0.5 text-[9px] font-black uppercase animate-pulse">
               Raridade: Últimas Unidades
             </Badge>
           )}
         </div>
 
         {reward.stock !== null && (
           <div className="absolute top-3 left-3 z-10">
             <Badge variant="secondary" className="bg-black/40 backdrop-blur-md text-[9px] font-bold uppercase tracking-tighter border-none text-white">
               {reward.stock > 0 ? `${reward.stock} EM ESTOQUE` : "ESGOTADO"}
             </Badge>
           </div>
         )}
 
         <CardContent className="pt-16 pb-6 px-6 flex flex-col h-full relative">
           {/* Visual Icon Container */}
           <div className="flex justify-center mb-6 relative">
             <motion.div
               animate={reward.rarity === "legendary" ? { 
                 scale: [1, 1.05, 1],
                 rotate: [0, 5, -5, 0]
               } : {}}
               transition={{ duration: 4, repeat: Infinity }}
               className={`w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-2xl relative z-10 ring-1 ring-white/20 transition-transform group-hover:scale-110 duration-500 ${
                 reward.rarity === "legendary" ? "bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 shadow-amber-500/20" : 
                 reward.rarity === "epic" ? "bg-gradient-to-br from-purple-400 to-pink-500 shadow-purple-500/20" : 
                 reward.rarity === "rare" ? "bg-gradient-to-br from-blue-400 to-cyan-500 shadow-blue-500/20" : "bg-muted/50"
               }`}
             >
                {categoryConfig.icon}
              </motion.div>
             {/* Shadow Glow behind icon */}
             <div className={`absolute inset-0 blur-2xl opacity-40 scale-150 rounded-full pointer-events-none ${
               reward.rarity === "legendary" ? "bg-amber-500/20" : 
               reward.rarity === "epic" ? "bg-purple-500/20" : 
               reward.rarity === "rare" ? "bg-blue-500/20" : ""
             }`} />
           </div>
 
           <div className="flex-1 space-y-2 mb-6">
             <h3 className="font-black italic uppercase tracking-tighter text-xl text-center group-hover:text-primary transition-colors line-clamp-1">{reward.name}</h3>
             <p className="text-xs text-muted-foreground text-center font-medium leading-relaxed line-clamp-2 px-2">
               {reward.description}
             </p>
             <div className="flex justify-center pt-2">
               <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-white/10 bg-white/5 opacity-60">
                 {categoryConfig.label}
               </Badge>
             </div>
           </div>
 
           <div className="mt-auto space-y-4">
             <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/5 group-hover:bg-white/10 transition-colors">
               <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-glow-sm">
                 <Coins className="w-3 h-3 text-white fill-white" />
               </div>
               <span className="text-2xl font-black italic tracking-tighter">{reward.price_coins.toLocaleString()}</span>
             </div>
             
             <Button
               onClick={() => onPurchase(reward)}
               disabled={!canAfford || !inStock || isPurchasing}
               className={`w-full h-12 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all duration-300 ${
                 !inStock || !canAfford ? "bg-muted text-muted-foreground grayscale" :
                 reward.rarity === "legendary" ? "bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 text-white hover:scale-[1.05] active:scale-95 shadow-amber-500/20" : 
                 reward.rarity === "epic" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:scale-[1.05] active:scale-95 shadow-purple-500/20" : 
                 "bg-primary text-primary-foreground hover:scale-[1.05] active:scale-95"
               }`}
             >
               {!inStock ? "FORA DE ESTOQUE" : !canAfford ? "COINS INSUFICIENTES" : isPurchasing ? "SINCRONIZANDO..." : "RESGATAR AGORA"}
             </Button>
           </div>
         </CardContent>
       </Card>
     </motion.div>
   );
 });
