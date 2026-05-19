import { motion } from "framer-motion";
import { Trophy, ChevronRight, Award, Shield, Sparkles, Target, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAllAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const rarityConfig: Record<string, { colors: string; glow: string; label: string; icon: any }> = {
  common: { 
    colors: "from-slate-400/20 to-slate-500/10 border-slate-500/20", 
    glow: "", 
    label: "Comum",
    icon: Target
  },
  rare: { 
    colors: "from-blue-500/20 to-indigo-500/10 border-blue-500/30", 
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]", 
    label: "Raro",
    icon: Zap
  },
  epic: { 
    colors: "from-purple-500/20 to-fuchsia-500/10 border-purple-500/30", 
    glow: "shadow-[0_0_20px_rgba(168,85,247,0.3)]", 
    label: "Épico",
    icon: Shield
  },
  legendary: { 
    colors: "from-amber-400/20 via-yellow-500/10 to-orange-500/20 border-amber-500/40", 
    glow: "shadow-[0_0_25px_rgba(245,158,11,0.4)] animate-pulse", 
    label: "Lendário",
    icon: Award
  },
};

export function ProfileAchievements() {
  const { data: allAchievements = [], isLoading } = useAllAchievements();
  const { data: userAchievements = [] } = useUserAchievements();

  const unlockedIds = new Set(userAchievements.map((ua: { achievement_id: string }) => ua.achievement_id));

  return (
    <TooltipProvider>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h3 className="text-xl font-black italic flex items-center gap-2 uppercase tracking-tight">
              <Trophy className="w-6 h-6 text-amber-500 drop-shadow-glow-sm" />
              Arsenal de Conquistas
            </h3>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70">Sua coleção de feitos táticos de elite.</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black italic text-primary">{userAchievements.length}</span>
              <span className="text-sm font-bold text-muted-foreground">/ {allAchievements.length}</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Operações Concluídas</span>
          </div>
        </div>
  
        <div className="bg-card/30 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors duration-700" />
          
          {isLoading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-white/5 border border-white/5 p-4 flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent animate-pulse" />
                  <Skeleton variant="glow" shape="card" className="w-12 h-12 rounded-xl mb-1" />
                  <Skeleton variant="shimmer" className="h-1.5 w-8 rounded-full opacity-40" />
                </div>
              ))}
            </div>
          ) : allAchievements.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted/20 flex items-center justify-center mx-auto mb-6 opacity-20">
                <Shield className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="font-black italic uppercase tracking-tighter text-muted-foreground/50">Nenhuma inteligência de conquista disponível</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-6">
              {allAchievements.slice(0, 18).map((achievement, i) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                const rarity = achievement.rarity || 'common';
                const config = rarityConfig[rarity] || rarityConfig.common;
                const RarityIcon = config.icon;

                return (
                  <Tooltip key={achievement.id}>
                    <TooltipTrigger asChild>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }} 
                        animate={{ opacity: 1, scale: 1 }} 
                        transition={{ delay: i * 0.05 }} 
                        whileHover={{ 
                          scale: 1.1, 
                          rotate: isUnlocked ? [0, -3, 3, 0] : 0,
                          y: -5
                        }}
                        className={cn(
                          "relative aspect-square rounded-2xl border-2 flex flex-col items-center justify-center transition-all duration-500 cursor-help",
                          isUnlocked 
                            ? cn("bg-gradient-to-br ring-1 ring-white/10", config.colors, config.glow) 
                            : 'bg-muted/10 border-dashed border-white/5 opacity-30 grayscale'
                        )}
                      >
                        {/* Rarity Tag (only for elite items) */}
                        {isUnlocked && (rarity === 'epic' || rarity === 'legendary') && (
                          <div className={cn(
                            "absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter z-10 whitespace-nowrap",
                            rarity === 'legendary' ? "bg-amber-500 text-amber-950" : "bg-purple-500 text-purple-950"
                          )}>
                            {config.label}
                          </div>
                        )}

                        <div className={cn(
                          "text-3xl mb-1 relative z-10 transition-transform duration-500 group-hover:scale-110",
                          isUnlocked ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''
                        )}>
                          {achievement.icon}
                        </div>
                        
                        {isUnlocked && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-lg flex items-center justify-center text-[10px] text-white shadow-lg border border-white/20 z-20"
                          >
                            <Sparkles className="w-3 h-3" />
                          </motion.div>
                        )}

                        {/* Scanline Effect */}
                        {isUnlocked && (
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/5 to-transparent h-1/2 w-full animate-scanline pointer-events-none opacity-20" />
                        )}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-black/90 border-white/10 backdrop-blur-xl p-3 max-w-[200px] rounded-xl">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black italic uppercase text-primary">{achievement.name}</span>
                          <span className={cn(
                            "text-[8px] px-1.5 py-0.5 rounded font-black uppercase",
                            rarity === 'legendary' ? "bg-amber-500/20 text-amber-500" : 
                            rarity === 'epic' ? "bg-purple-500/20 text-purple-500" : "bg-muted text-muted-foreground"
                          )}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-medium leading-tight">
                          {achievement.description || "Descrição de missão confidencial."}
                        </p>
                        {achievement.xp_reward && (
                          <div className="pt-1 flex items-center gap-1">
                            <Zap className="w-3 h-3 text-success" />
                            <span className="text-[10px] font-black text-success">+{achievement.xp_reward} XP</span>
                          </div>
                        )}
                        {!isUnlocked && (
                          <div className="pt-2 flex items-center gap-1.5 text-[8px] font-black uppercase text-amber-500/60">
                            <Shield className="w-3 h-3" />
                            Bloqueado: Nível de Acesso Requerido
                          </div>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          )}
        </div>
  
        <motion.button 
          whileHover={{ scale: 1.02, x: 5 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all duration-300 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 text-muted-foreground hover:text-primary group"
        >
          Acessar Arsenal Completo 
          <ChevronRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>
      </motion.div>
    </TooltipProvider>
  );
}
