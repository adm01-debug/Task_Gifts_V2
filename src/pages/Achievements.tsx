import { motion } from "framer-motion";
import { Trophy, Star, Sparkles, Flame, SearchX } from "lucide-react";
import { PageShell } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAllAchievements, useUserAchievements } from "@/hooks/useAchievements";
import { Skeleton } from "@/components/ui/skeleton";
import { BehavioralBadgesWidget } from "@/components/BehavioralBadgesWidget";
import { PageWrapper } from "@/components/PageWrapper";
import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { AchievementGrid } from "@/components/achievements/AchievementGrid";

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

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  combo: { label: "Performance", icon: <Flame className="w-4 h-4" /> },
  general: { label: "Missões", icon: <Star className="w-4 h-4" /> },
  training: { label: "Habilidades", icon: <Sparkles className="w-4 h-4" /> },
};

export default function Achievements() {
  const seoConfig = useSEO();
  const { data: allAchievements, isLoading: loadingAll } = useAllAchievements();
  const { data: userAchievements, isLoading: loadingUser } = useUserAchievements();

  const isLoading = loadingAll || loadingUser;

  const unlockedIds = new Set(userAchievements?.map((ua) => ua.achievement_id) || []);
  const unlockedCount = unlockedIds.size;
  const totalCount = allAchievements?.length || 0;
  const progressPercent = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  const categories = [...new Set(allAchievements?.map((a) => a.category) || [])];

  const getUnlockDate = (achievementId: string) => {
    const ua = userAchievements?.find((u) => u.achievement_id === achievementId);
    return ua?.unlocked_at;
  };

  return (
    <PageShell 
      title="Terminal de Conquistas" 
      subtitle="Gerencie seus registros táticos e troféus de elite"
      icon={<Trophy className="w-6 h-6 text-primary" />}
      backFallback="/"
    >
      <PageWrapper pageName="Conquistas" className="container max-w-5xl px-4 pb-24 mx-auto">
        <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
        
        {isLoading ? (
          <div className="space-y-6 pt-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-40 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8 pt-6">
            {/* Tactical Progress Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden border border-white/5 bg-[#0A0C10] shadow-2xl">
                {/* Background decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full -ml-20 -mb-20 pointer-events-none" />
                
                <CardContent className="p-8 relative">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-10">
                    <div className="text-center lg:text-left space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Sincronização de Dados</p>
                        <h3 className="text-5xl font-black tracking-tighter italic uppercase text-white flex items-baseline gap-3">
                          {unlockedCount} <span className="text-xl font-bold text-slate-500 not-italic tracking-normal">/ {totalCount}</span>
                        </h3>
                      </div>
                      <p className="text-sm text-slate-400 font-medium uppercase tracking-widest">Registros de Elite Desbloqueados</p>
                      
                      <div className="flex flex-wrap gap-2 pt-2 justify-center lg:justify-start">
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-black uppercase tracking-widest text-[9px] py-1 px-3">
                          Operador Nível {Math.floor(progressPercent / 10)}
                        </Badge>
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-white font-black uppercase tracking-widest text-[9px] py-1 px-3">
                          Taxa de Conclusão: {progressPercent.toFixed(1)}%
                        </Badge>
                      </div>
                    </div>

                    {/* Tactical Circular Progress */}
                    <div className="relative w-48 h-48 flex items-center justify-center">
                      <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                      <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                        <circle cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-white/5" />
                        <motion.circle
                          cx="96" cy="96" r="86" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={540.35}
                          initial={{ strokeDashoffset: 540.35 }}
                          animate={{ strokeDashoffset: 540.35 - (540.35 * progressPercent) / 100 }}
                          transition={{ duration: 2, ease: "circOut" }}
                          className="text-primary"
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-white italic tracking-tighter">{progressPercent.toFixed(0)}%</span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 mt-1">Concluído</span>
                      </div>
                    </div>

                    {/* Rarity breakdown */}
                    <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
                      {(["common", "rare", "epic", "legendary"] as const).map((rarity) => {
                        const config = rarityConfig[rarity];
                        const total = allAchievements?.filter((a) => a.rarity === rarity).length || 0;
                        const unlocked = allAchievements?.filter((a) => a.rarity === rarity && unlockedIds.has(a.id)).length || 0;
                        const percent = total > 0 ? (unlocked / total) * 100 : 0;
                        return (
                          <div key={rarity} className="min-w-[120px] p-4 rounded-xl border border-white/5 bg-white/[0.02] space-y-3">
                            <div className="flex justify-between items-center">
                              <span className={cn("text-[9px] font-black uppercase tracking-widest", config.color)}>{config.label}</span>
                              <span className="text-[10px] font-black text-white">{unlocked}/{total}</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${percent}%` }} 
                                className={cn("h-full", config.color.replace('text-', 'bg-'))} 
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Behavioral Badges Widget */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <BehavioralBadgesWidget />
            </motion.div>

            {/* Tactical Tabs Navigation */}
            <Tabs defaultValue="all" className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 overflow-x-auto no-scrollbar">
                <TabsList className="bg-transparent h-auto p-0 flex gap-6">
                  <TabsTrigger 
                    value="all" 
                    className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-xs font-black uppercase tracking-[0.2em]"
                  >
                    Todos Arquivos
                  </TabsTrigger>
                  {categories.map((cat) => (
                    <TabsTrigger 
                      key={cat} 
                      value={cat} 
                      className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-0 pb-4 h-auto text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2"
                    >
                      {categoryConfig[cat]?.icon}
                      {categoryConfig[cat]?.label || cat}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="all" className="mt-0 focus-visible:outline-none">
                <AchievementGrid
                  achievements={allAchievements || []}
                  unlockedIds={unlockedIds}
                  getUnlockDate={getUnlockDate}
                />
              </TabsContent>

              {categories.map((cat) => (
                <TabsContent key={cat} value={cat} className="mt-0 focus-visible:outline-none">
                  <AchievementGrid
                    achievements={allAchievements?.filter((a) => a.category === cat) || []}
                    unlockedIds={unlockedIds}
                    getUnlockDate={getUnlockDate}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </PageWrapper>
    </PageShell>
  );
}


interface AchievementGridProps {
  achievements: Array<{
    id: string;
    name: string;
    description: string | null;
    icon: string;
    rarity: string;
    xp_reward: number;
    coin_reward: number;
  }>;
  unlockedIds: Set<string>;
  getUnlockDate: (id: string) => string | undefined;
}

 function AchievementGrid({ achievements, unlockedIds, getUnlockDate }: AchievementGridProps) {
   if (achievements.length === 0) {
     return (
       <EmptyState 
         icon={SearchX}
         title="Nenhuma conquista nesta categoria"
         description="Continue jogando para descobrir novas conquistas!"
       />
     );
   }
 
  // Sort: unlocked first, then by rarity
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <AnimatePresence>
         {sorted.map((achievement, index) => {
           const isUnlocked = unlockedIds.has(achievement.id);
           const config = rarityConfig[achievement.rarity as keyof typeof rarityConfig] || rarityConfig.common;
           const unlockDate = getUnlockDate(achievement.id);
 
           return (
             <motion.div
               key={achievement.id}
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: index * 0.05 }}
               whileHover={{ y: -5, scale: 1.02 }}
             >
               <Card className={cn(
                 "relative h-full overflow-hidden border-none bg-gradient-to-br from-card to-card/40 transition-all duration-500 group ring-1 ring-white/5",
                 isUnlocked ? config.glow : "opacity-40 grayscale"
               )}>
                 <div className={cn(
                   "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none",
                   config.gradient
                 )} />
                 
                 <CardContent className="p-6 relative">
                   <div className="flex items-start gap-5">
                     <div className="relative">
                       <motion.div
                         animate={isUnlocked ? { 
                           boxShadow: ["0 0 20px transparent", `0 0 40px ${config.glow.split(' ')[0].replace('shadow-', '')}60`, "0 0 20px transparent"]
                         } : {}}
                         transition={{ duration: 4, repeat: Infinity }}
                         className={cn(
                           "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all duration-500 transform group-hover:rotate-12 group-hover:scale-110",
                           isUnlocked ? config.bgColor : "bg-muted/40 ring-1 ring-white/5"
                         )}
                       >
                         {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-muted-foreground" />}
                       </motion.div>
                       
                       {isUnlocked && (
                         <motion.div 
                           initial={{ scale: 0 }}
                           animate={{ scale: 1 }}
                           className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shadow-lg border-2 border-card"
                         >
                           <CheckCircle2 className="w-3 h-3 text-white" />
                         </motion.div>
                       )}
                     </div>
 
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between gap-2 mb-1">
                         <h4 className="font-black italic uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                           {achievement.name}
                         </h4>
                         <Badge variant="outline" className={cn("text-[9px] font-black tracking-widest uppercase py-0 px-2 border-none", config.color, config.bgColor)}>
                           {config.label}
                         </Badge>
                       </div>
                       
                       <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-4 line-clamp-2">
                         {achievement.description}
                       </p>
 
                       <div className="flex items-center gap-3">
                         <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/10">
                           <Zap className="w-3 h-3 text-primary fill-primary" />
                           <span className="text-[10px] font-black">+{achievement.xp_reward} XP</span>
                         </div>
                         <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/10">
                           <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                           <span className="text-[10px] font-black">+{achievement.coin_reward} TOKENS</span>
                         </div>
                       </div>
 
                       {isUnlocked && unlockDate && (
                         <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                           <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest">
                             CONQUISTADA EM {format(new Date(unlockDate), "dd MMM yyyy", { locale: ptBR }).toUpperCase()}
                           </span>
                           <button className="text-muted-foreground hover:text-primary transition-colors">
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
