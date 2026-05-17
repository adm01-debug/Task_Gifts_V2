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
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobilePageLayout } from "@/components/mobile";
import { DesktopBackButton, GlobalBreadcrumbs } from "@/components/navigation";
const rarityConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; glow: string }> = {
  common: {
    label: "Comum",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/30",
    glow: "",
  },
  rare: {
    label: "Raro",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    glow: "shadow-blue-500/20",
  },
  epic: {
    label: "Épico",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    glow: "shadow-purple-500/30",
  },
  legendary: {
    label: "Lendário",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    glow: "shadow-amber-500/40",
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
               <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 border-amber-500/20">
                 <CardContent className="p-6">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <p className="text-sm text-muted-foreground">Progresso Geral</p>
                       <p className="text-3xl font-bold">
                         {unlockedCount}{" "}
                         <span className="text-lg text-muted-foreground">/ {totalCount}</span>
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-4xl font-black text-amber-500">
                         {progressPercent.toFixed(0)}%
                       </p>
                       <p className="text-sm text-muted-foreground">completo</p>
                     </div>
                   </div>
                   <Progress value={progressPercent} className="h-3" />
 
                   {/* Stats by rarity */}
                   <div className="grid grid-cols-4 gap-2 mt-4">
                     {(["common", "rare", "epic", "legendary"] as const).map((rarity) => {
                       const config = rarityConfig[rarity];
                       const total = allAchievements?.filter((a) => a.rarity === rarity).length || 0;
                       const unlocked =
                         allAchievements?.filter((a) => a.rarity === rarity && unlockedIds.has(a.id))
                           .length || 0;
                       return (
                         <div
                           key={rarity}
                           className={`text-center p-2 rounded-lg ${config.bgColor}`}
                         >
                           <p className={`text-lg font-bold ${config.color}`}>
                             {unlocked}/{total}
                           </p>
                           <p className="text-xs text-muted-foreground">{config.label}</p>
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
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`relative overflow-hidden transition-all duration-300 ${
                  isUnlocked
                    ? `${config.borderColor} ${config.glow} shadow-lg`
                    : "border-muted/50 opacity-60"
                }`}
              >
                {/* Rarity indicator */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1 ${
                    isUnlocked ? config.bgColor.replace("/10", "") : "bg-muted"
                  }`}
                />

                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <motion.div
                      animate={isUnlocked ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className={`text-4xl p-3 rounded-xl ${
                        isUnlocked ? config.bgColor : "bg-muted/50"
                      }`}
                    >
                      {isUnlocked ? (
                        achievement.icon
                      ) : (
                        <Lock className="w-8 h-8 text-muted-foreground" />
                      )}
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold truncate">{achievement.name}</h3>
                        {isUnlocked && (
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {achievement.description}
                      </p>

                      {/* Rewards & Rarity */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-green-500">+{achievement.xp_reward} XP</span>
                        <span className="text-xs text-amber-500">
                          +{achievement.coin_reward} moedas
                        </span>
                      </div>

                      {/* Unlock date */}
                      {isUnlocked && unlockDate && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Desbloqueada em{" "}
                          {format(new Date(unlockDate), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                        </p>
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
