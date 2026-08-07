import { motion } from "framer-motion";
import { Trophy, Star, Sparkles, Flame } from "lucide-react";
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
