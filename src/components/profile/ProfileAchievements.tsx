import { motion } from "framer-motion";
 import { Trophy, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllAchievements, useUserAchievements } from "@/hooks/useAchievements";

const rarityColors: Record<string, string> = {
  common: "from-muted-foreground/30 to-muted-foreground/10 border-muted-foreground/30",
  rare: "from-secondary/30 to-secondary/10 border-secondary/50",
  epic: "from-accent/30 to-accent/10 border-accent/50",
  legendary: "from-gold/30 to-gold/10 border-gold/50 shadow-[0_0_20px_hsl(var(--gold)/0.3)]",
};

export function ProfileAchievements() {
  const { data: allAchievements = [], isLoading } = useAllAchievements();
  const { data: userAchievements = [] } = useUserAchievements();

  const unlockedIds = new Set(userAchievements.map((ua: { achievement_id: string }) => ua.achievement_id));

   return (
     <motion.div 
       initial={{ opacity: 0, y: 20 }} 
       animate={{ opacity: 1, y: 0 }} 
       transition={{ delay: 0.3 }}
       className="space-y-6"
     >
       <div className="flex items-center justify-between">
         <div className="flex flex-col">
           <h3 className="text-xl font-bold flex items-center gap-2">
             <Trophy className="w-6 h-6 text-amber-500 fill-amber-500/20" />
             Galeria de Conquistas
           </h3>
           <p className="text-sm text-muted-foreground">Sua coleção de feitos lendários e marcos históricos.</p>
         </div>
         <div className="flex flex-col items-end">
           <span className="text-2xl font-black italic">{userAchievements.length}/{allAchievements.length}</span>
           <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Desbloqueadas</span>
         </div>
       </div>
 
       <div className="bg-muted/20 rounded-3xl p-6 border border-white/5 shadow-inner">
         {isLoading ? (
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
             {[...Array(6)].map((_, i) => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
           </div>
         ) : allAchievements.length === 0 ? (
           <div className="text-center py-12 text-muted-foreground">
             <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
             <p className="font-bold uppercase tracking-widest text-xs opacity-50">Nenhuma conquista disponível no momento</p>
           </div>
         ) : (
           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
             {allAchievements.slice(0, 12).map((achievement, i) => {
               const isUnlocked = unlockedIds.has(achievement.id);
               const rarity = achievement.rarity as keyof typeof rarityColors;
               return (
                 <motion.div 
                   key={achievement.id} 
                   initial={{ opacity: 0, scale: 0.8 }} 
                   animate={{ opacity: 1, scale: 1 }} 
                   transition={{ delay: 0.4 + i * 0.05 }} 
                   whileHover={{ scale: 1.1, rotate: isUnlocked ? [0, -5, 5, 0] : 0 }}
                   className={`relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all shadow-lg ${
                     isUnlocked 
                       ? `bg-gradient-to-br ${rarityColors[rarity] || rarityColors.common} ring-1 ring-white/20` 
                       : 'bg-muted/30 border-dashed border-muted-foreground/20 opacity-40 grayscale'
                   }`}
                 >
                   <div className={`text-3xl mb-1 ${isUnlocked ? 'drop-shadow-glow-sm' : ''}`}>
                     {achievement.icon}
                   </div>
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-background/80 rounded-2xl p-2 text-[10px] font-bold text-center leading-tight">
                     {achievement.name}
                   </div>
                   {isUnlocked && (
                     <motion.div 
                       initial={{ scale: 0 }}
                       animate={{ scale: 1 }}
                       className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-[10px] text-white shadow-lg border border-white/20"
                     >
                       ✓
                     </motion.div>
                   )}
                 </motion.div>
               );
             })}
           </div>
         )}
       </div>
 
       <button className="w-full py-3 rounded-2xl bg-muted/40 hover:bg-muted/60 border border-white/5 transition-colors text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2">
         Ver Coleção Completa <ChevronRight className="w-4 h-4" />
       </button>
     </motion.div>
   );
}
