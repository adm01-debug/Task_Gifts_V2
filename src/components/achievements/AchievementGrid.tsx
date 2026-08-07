import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Lock, CheckCircle2, Zap, Star, Share2, Award, SearchX, Layers } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const rarityConfig: Record<string, { 
  label: string; 
  color: string; 
  bgColor: string; 
  borderColor: string; 
  glow: string; 
  gradient: string 
}> = {
  common: {
    label: "Recruta",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    glow: "shadow-slate-500/10",
    gradient: "from-slate-500/20 to-transparent",
  },
  rare: {
    label: "Veterano",
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    glow: "shadow-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.3)]",
    gradient: "from-cyan-500/20 to-transparent",
  },
  epic: {
    label: "Elite",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    borderColor: "border-indigo-500/30",
    glow: "shadow-indigo-500/40 shadow-[0_0_30px_rgba(99,102,241,0.4)]",
    gradient: "from-indigo-500/20 to-transparent",
  },
  legendary: {
    label: "Lenda",
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glow: "shadow-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.5)]",
    gradient: "from-amber-500/20 to-transparent",
  },
};

interface Achievement {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  rarity: string;
  xp_reward: number;
  coin_reward: number;
}

interface AchievementGridProps {
  achievements: Achievement[];
  unlockedIds: Set<string>;
  getUnlockDate: (id: string) => string | undefined;
}

export function AchievementGrid({ achievements, unlockedIds, getUnlockDate }: AchievementGridProps) {
  if (achievements.length === 0) {
    return (
      <EmptyState 
        icon={SearchX}
        title="Nenhum registro encontrado"
        description="Continue sua jornada para desbloquear novos arquivos."
      />
    );
  }

  const rarityOrder = { legendary: 0, epic: 1, rare: 2, common: 3 };
  const sorted = [...achievements].sort((a, b) => {
    const aUnlocked = unlockedIds.has(a.id);
    const bUnlocked = unlockedIds.has(b.id);
    if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
    return (
      (rarityOrder[a.rarity as keyof typeof rarityOrder] || 4) -
      (rarityOrder[b.rarity as keyof typeof rarityOrder] || 4)
    );
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <AnimatePresence>
        {sorted.map((achievement, index) => {
          const isUnlocked = unlockedIds.has(achievement.id);
          const config = rarityConfig[achievement.rarity as keyof typeof rarityConfig] || rarityConfig.common;
          const unlockDate = getUnlockDate(achievement.id);

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative"
            >
              {/* Tactical Border Effect */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-white/5 to-primary/50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-[1px]" />
              
              <Card className={cn(
                "relative h-full overflow-hidden border border-white/5 bg-[#0A0C10] transition-all duration-500 group",
                isUnlocked ? config.glow : "opacity-40 grayscale"
              )}>
                {/* Scanner/Shimmer Effect */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12 translate-x-[-100%]"
                  animate={isUnlocked ? { x: ['100%', '-100%'] } : {}}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />

                <CardContent className="p-6 relative z-10">
                  <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                      {/* Icon Container with Tactical Frame */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-[2px]" />
                        <motion.div
                          animate={isUnlocked ? { 
                            borderColor: [
                              'rgba(255,255,255,0.1)', 
                              config.color.replace('text-', 'rgba(').replace('-400', ',0.4)'), 
                              'rgba(255,255,255,0.1)'
                            ]
                          } : {}}
                          transition={{ duration: 3, repeat: Infinity }}
                          className={cn(
                            "w-20 h-20 rounded-xl flex items-center justify-center text-4xl transition-all duration-500 border-2",
                            isUnlocked ? "bg-white/[0.03]" : "bg-black/40 border-white/5"
                          )}
                        >
                          {isUnlocked ? (
                            <span className="drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{achievement.icon}</span>
                          ) : (
                            <Lock className="w-8 h-8 text-slate-600" />
                          )}
                        </motion.div>
                      </div>
                      
                      {isUnlocked && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -45 }}
                          animate={{ scale: 1, rotate: 0 }}
                          className="absolute -top-2 -right-2 w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary),0.5)] border border-white/20"
                        >
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </motion.div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <Badge className={cn(
                          "text-[9px] font-black tracking-[0.2em] uppercase py-0.5 px-2 rounded-sm border-none shadow-sm",
                          isUnlocked ? "bg-white/10 text-white" : "bg-slate-800 text-slate-500"
                        )}>
                          ID: {achievement.id.slice(0, 8)}
                        </Badge>
                        <Badge variant="outline" className={cn(
                          "text-[9px] font-black tracking-widest uppercase py-0.5 px-2 border",
                          config.color, config.borderColor, config.bgColor
                        )}>
                          {config.label}
                        </Badge>
                      </div>
                      
                      <h4 className="text-lg font-black italic uppercase tracking-tighter text-white mb-1 group-hover:text-primary transition-colors flex items-center gap-2">
                        {achievement.name}
                        {isUnlocked && <Award className="w-4 h-4 text-primary" />}
                      </h4>
                      
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4 line-clamp-2 uppercase tracking-wide">
                        {achievement.description}
                      </p>

                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
                            <Zap className="w-3 h-3 text-primary fill-primary" />
                          </div>
                          <span className="text-[10px] font-black text-white">+{achievement.xp_reward} <span className="text-slate-500">XP</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          </div>
                          <span className="text-[10px] font-black text-white">+{achievement.coin_reward} <span className="text-slate-500">TOKENS</span></span>
                        </div>
                      </div>

                      {isUnlocked && unlockDate && (
                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500">
                            <Layers className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.15em]">
                              ARQUIVO DESBLOQUEADO: {format(new Date(unlockDate), "dd.MM.yyyy", { locale: ptBR })}
                            </span>
                          </div>
                          <button className="text-slate-500 hover:text-white transition-colors p-1 hover:bg-white/5 rounded">
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
