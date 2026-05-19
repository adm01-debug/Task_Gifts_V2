import { useBehavioralBadges } from "@/hooks/useBehavioralBadges";
import { useUserAchievements } from "@/hooks/useAchievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Award, 
  MessageSquare, 
  CalendarCheck, 
  Heart, 
  Users, 
  Target, 
  BookOpen, 
  TrendingUp, 
  Share2, 
  Lightbulb,
  RefreshCw,
  Trophy,
  Sparkles,
  Lock,
  Zap,
  Star,
  Activity,
  GraduationCap,
  Sunrise,
  Moon,
  Crown,
  HandHeart,
  ShieldCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquare,
  CalendarCheck,
  Heart,
  Activity,
  Users,
  Target,
  Award,
  BookOpen,
  GraduationCap,
  Trophy,
  TrendingUp,
  Sparkles,
  Share2,
  Star,
  Sunrise,
  Moon,
  Lightbulb,
  Crown,
  HandHeart,
};

const categoryLabels: Record<string, string> = {
  feedback: "Feedback",
  engagement: "Engajamento",
  communication: "Comunicação",
  performance: "Performance",
  learning: "Aprendizado",
  development: "Desenvolvimento",
  social: "Social",
  lifestyle: "Estilo de Vida",
  mentorship: "Mentoria",
};

const rarityColors: Record<string, string> = {
  common: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  rare: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  epic: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  legendary: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export function BehavioralBadgesWidget() {
  const { 
    metrics, 
    isLoadingMetrics, 
    badgesByCategory, 
    triggerCheck, 
    isChecking,
    getNextBadges 
  } = useBehavioralBadges();
  
  const { data: userAchievements, isLoading: isLoadingAchievements } = useUserAchievements();

  const unlockedKeys = new Set(
    userAchievements?.map(ua => ua.achievement?.key).filter(Boolean) || []
  );

  const nextBadges = metrics ? getNextBadges(metrics) : [];

  if (isLoadingMetrics || isLoadingAchievements) {
    return (
      <Card className="border border-white/5 bg-[#0A0C10] shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const categories = Object.keys(badgesByCategory);

  return (
    <Card className="border border-white/5 bg-[#0A0C10] shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-32 -mt-32 pointer-events-none transition-all group-hover:bg-primary/10" />
      
      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Protocolos Ativos</p>
            <CardTitle className="flex items-center gap-2 text-xl font-black italic uppercase tracking-tighter text-white">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Badges de Conduta
            </CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={triggerCheck}
            disabled={isChecking}
            className="hover:bg-white/5 text-slate-400 hover:text-white transition-all rounded-xl"
          >
            <RefreshCw className={cn("h-4 w-4", isChecking && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="relative z-10">
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid grid-cols-2 w-full bg-white/[0.03] border border-white/5 p-1 rounded-xl h-11">
            <TabsTrigger 
              value="progress" 
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]"
            >
              Objetivos Imediatos
            </TabsTrigger>
            <TabsTrigger 
              value="all"
              className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase tracking-widest text-[10px]"
            >
              Arquivos de Conduta
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="space-y-4 mt-0 focus-visible:outline-none">
            {nextBadges.length === 0 ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto border border-primary/20">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-widest text-white italic">Protocolo Completo</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Todos os badges de conduta foram sincronizados.</p>
                </div>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {nextBadges.map(({ badge, progress, remaining }, index) => {
                  const IconComponent = iconMap[badge.icon] || Award;
                  return (
                    <motion.div
                      key={badge.key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all group/item"
                    >
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          "p-3 rounded-lg border flex items-center justify-center transition-transform group-hover/item:scale-110",
                          rarityColors[badge.rarity]
                        )}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <h5 className="font-black text-white italic uppercase tracking-tighter truncate text-sm">
                                {badge.name}
                              </h5>
                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide line-clamp-1">
                                {badge.description}
                              </p>
                            </div>
                            <Badge variant="outline" className={cn(
                              "text-[8px] font-black uppercase tracking-[0.15em] py-0 px-2 border",
                              rarityColors[badge.rarity]
                            )}>
                              {badge.rarity}
                            </Badge>
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-end mb-1">
                              <span className="text-[9px] font-black text-primary uppercase tracking-widest">Progresso: {Math.round(progress)}%</span>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{remaining} restantes</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>

                          <div className="flex gap-4 pt-1">
                            <div className="flex items-center gap-1.5">
                              <Zap className="h-3 w-3 text-primary" />
                              <span className="text-[9px] font-black text-white">+{badge.xpReward} XP</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Star className="h-3 w-3 text-amber-500" />
                              <span className="text-[9px] font-black text-white">+{badge.coinReward} TOKENS</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-8 mt-0 focus-visible:outline-none">
            {categories.map(category => {
              const badges = badgesByCategory[category];
              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      {categoryLabels[category] || category}
                    </h4>
                    <Badge variant="secondary" className="bg-white/5 text-white text-[9px] font-black px-2 py-0.5 border border-white/5">
                      {badges.filter(b => unlockedKeys.has(b.key)).length}/{badges.length}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {badges.map(badge => {
                      const isUnlocked = unlockedKeys.has(badge.key);
                      const IconComponent = iconMap[badge.icon] || Award;
                      
                      return (
                        <motion.div
                          key={badge.key}
                          whileHover={{ y: isUnlocked ? -4 : 0 }}
                          className={cn(
                            "p-4 rounded-xl border text-center relative transition-all duration-300",
                            isUnlocked 
                              ? cn(rarityColors[badge.rarity], "bg-white/[0.03]") 
                              : "bg-black/40 border-white/5 opacity-40"
                          )}
                        >
                          {!isUnlocked && (
                            <div className="absolute top-2 right-2">
                              <Lock className="h-3 w-3 text-slate-600" />
                            </div>
                          )}
                          <div className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 border",
                            isUnlocked ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5"
                          )}>
                            <IconComponent className={cn("h-6 w-6", !isUnlocked && 'opacity-30')} />
                          </div>
                          <p className="text-[10px] font-black uppercase tracking-tighter italic text-white truncate px-1">
                            {badge.name}
                          </p>
                          {isUnlocked && (
                            <div className="flex items-center justify-center gap-1 mt-2">
                              <Zap className="h-2.5 w-2.5 text-primary" />
                              <span className="text-[8px] font-black text-primary">+{badge.xpReward} XP</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

