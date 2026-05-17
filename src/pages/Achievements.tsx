import { motion, AnimatePresence } from "framer-motion";
   import { Trophy, Lock, CheckCircle2, Flame, Sparkles, Star, Trophy as TrophyIcon, SearchX } from "lucide-react";
  import { useNavigate } from "react-router-dom";
  import { PageShell } from "@/components/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAllAchievements, useUserAchievements } from "@/hooks/useAchievements";
 import { Skeleton } from "@/components/ui/skeleton";
 import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BehavioralBadgesWidget } from "@/components/BehavioralBadgesWidget";
 import { PageWrapper, SectionWrapper } from "@/components/PageWrapper";
 import { cn } from "@/lib/utils";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageLayout } from "@/components/mobile";
import { DesktopBackButton, GlobalBreadcrumbs } from "@/components/navigation";
 const rarityConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; glow: string; gradient: string }> = {
  common: {
    label: "Comum",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
     glow: "shadow-gray-500/10",
     gradient: "from-gray-500/20 to-transparent",
  },
  rare: {
    label: "Raro",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
     glow: "shadow-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]",
     gradient: "from-blue-500/20 to-transparent",
  },
  epic: {
    label: "Épico",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
     glow: "shadow-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.4)]",
     gradient: "from-purple-500/20 to-transparent",
  },
  legendary: {
    label: "Lendário",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
     glow: "shadow-amber-500/50 shadow-[0_0_40px_rgba(245,158,11,0.5)]",
     gradient: "from-amber-500/20 to-transparent",
  },
};

const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  combo: { label: "Combo", icon: <Flame className="w-4 h-4" /> },
  general: { label: "Geral", icon: <Star className="w-4 h-4" /> },
  training: { label: "Treinamento", icon: <Sparkles className="w-4 h-4" /> },
};

export default function Achievements() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
       title="Conquistas" 
       subtitle="Desbloqueie troféus e badges exclusivos ao atingir seus objetivos"
       icon={<Trophy className="w-6 h-6 text-amber-500" />}
       backFallback="/"
     >
       <PageWrapper pageName="Conquistas" className="container max-w-4xl px-4 pb-24 mx-auto">
         <SEOHead title={seoConfig.title} description={seoConfig.description} keywords={seoConfig.keywords} />
         
         {isLoading ? (
           <div className="space-y-6">
             <Skeleton className="h-10 w-64" />
             <Skeleton className="h-32 w-full" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {[1, 2, 3, 4].map((i) => (
                 <Skeleton key={i} className="h-40" />
               ))}
             </div>
           </div>
         ) : (
           <div className="space-y-6 pt-6">
             {/* Progress Overview */}
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
             >
               <Card className="relative overflow-hidden border-none bg-gradient-to-br from-card to-card/50 shadow-2xl ring-1 ring-white/10">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none" />
                 <CardContent className="p-8 relative">
                   <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                     <div className="text-center md:text-left">
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 mb-1">Status da Coleção</p>
                       <h3 className="text-4xl font-black tracking-tighter italic uppercase flex items-baseline gap-2">
                         {unlockedCount} <span className="text-sm font-bold text-muted-foreground not-italic tracking-normal">/ {totalCount}</span>
                       </h3>
                       <p className="text-sm text-muted-foreground font-medium">Troféus Conquistados</p>
                     </div>
                     <div className="relative w-32 h-32 flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                         <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-muted/20" />
                         <motion.circle
                           cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.42}
                           initial={{ strokeDashoffset: 364.42 }}
                           animate={{ strokeDashoffset: 364.42 - (364.42 * progressPercent) / 100 }}
                           transition={{ duration: 1.5, ease: "easeOut" }}
                           className="text-amber-500"
                         />
                       </svg>
                       <div className="absolute inset-0 flex flex-col items-center justify-center">
                         <span className="text-2xl font-black">{progressPercent.toFixed(0)}%</span>
                       </div>
                     </div>
                     <div className="hidden md:block text-right">
                       <Badge variant="outline" className="border-amber-500/50 text-amber-500 font-black uppercase tracking-widest text-[10px] py-1 px-3">
                         Mestre Colecionador
                       </Badge>
                     </div>
                   </div>
                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                     {(["common", "rare", "epic", "legendary"] as const).map((rarity) => {
                       const config = rarityConfig[rarity];
                       const total = allAchievements?.filter((a) => a.rarity === rarity).length || 0;
                       const unlocked = allAchievements?.filter((a) => a.rarity === rarity && unlockedIds.has(a.id)).length || 0;
                       const percent = total > 0 ? (unlocked / total) * 100 : 0;
                       return (
                         <div key={rarity} className="group cursor-default">
                           <div className={cn("p-4 rounded-3xl border border-white/5 bg-white/5 transition-all hover:bg-white/10", config.glow)}>
                             <div className="flex justify-between items-center mb-2">
                               <div className={cn("w-2 h-2 rounded-full", config.color.replace('text-', 'bg-'))} />
                               <span className="text-[10px] font-black uppercase tracking-tighter opacity-50">{config.label}</span>
                             </div>
                             <p className="text-lg font-black italic">{unlocked}/{total}</p>
                             <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                               <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} className={cn("h-full", config.color.replace('text-', 'bg-'))} />
                             </div>
                           </div>
                         </div>
                       );
                     })}
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
 
             {/* Tabs by Category */}
             <Tabs defaultValue="all" className="space-y-4">
               <TabsList className="flex-wrap">
                 <TabsTrigger value="all">Todas</TabsTrigger>
                 {categories.map((cat) => (
                   <TabsTrigger key={cat} value={cat} className="flex items-center gap-1">
                     {categoryConfig[cat]?.icon}
                     {categoryConfig[cat]?.label || cat}
                   </TabsTrigger>
                 ))}
               </TabsList>
 
               <TabsContent value="all" className="space-y-4">
                 <AchievementGrid
                   achievements={allAchievements || []}
                   unlockedIds={unlockedIds}
                   getUnlockDate={getUnlockDate}
                 />
               </TabsContent>
 
               {categories.map((cat) => (
                 <TabsContent key={cat} value={cat} className="space-y-4">
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
