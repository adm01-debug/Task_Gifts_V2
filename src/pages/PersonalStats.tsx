import { motion } from "framer-motion";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useUserAchievements } from "@/hooks/useAchievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
 import { AppSidebar } from "@/components/AppSidebar";
 import { PageShell } from "@/components/navigation";
import { MobilePageLayout } from "@/components/mobile";
import { useIsMobile } from "@/hooks/use-mobile";
import { WeeklyPerformanceComparison } from "@/components/WeeklyPerformanceComparison";
import { ComboHistory } from "@/components/ComboHistory";
import { AchievementRecord } from "@/types/charts";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
 import { TrendingUp, Trophy, Zap, Target, Flame, Star } from "lucide-react";
import { format, subDays, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { PersonalStatsCharts } from "@/components/stats/PersonalStatsCharts";

function useXpHistory(userId: string | undefined, days: number = 30) {
  return useQuery({
    queryKey: ["xp-history", userId, days],
    queryFn: async () => {
      if (!userId) return [];
      const startDate = subDays(new Date(), days);
      const { data, error } = await supabase.from("audit_logs").select("created_at, new_data, metadata").eq("user_id", userId).eq("action", "xp_gained").gte("created_at", startDate.toISOString()).order("created_at", { ascending: true });
      if (error) throw error;
      const dailyXp: Record<string, number> = {};
      data?.forEach((log) => { const day = format(new Date(log.created_at), "yyyy-MM-dd"); const xpGained = (log.metadata as { xp_gained?: number } | null)?.xp_gained || 0; dailyXp[day] = (dailyXp[day] || 0) + xpGained; });
      const allDays = eachDayOfInterval({ start: startDate, end: new Date() });
      return allDays.map((day) => { const dateStr = format(day, "yyyy-MM-dd"); return { date: dateStr, displayDate: format(day, "dd/MM", { locale: ptBR }), xp: dailyXp[dateStr] || 0 }; });
    },
    enabled: !!userId,
  });
}

function useAchievementHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["achievement-history", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase.from("user_achievements").select(`unlocked_at, achievements (name, icon, rarity, xp_reward)`).eq("user_id", userId).order("unlocked_at", { ascending: true });
      if (error) throw error;
      const monthly: Record<string, { count: number; achievements: AchievementRecord[] }> = {};
      data?.forEach((ua) => { const month = format(new Date(ua.unlocked_at), "yyyy-MM"); if (!monthly[month]) monthly[month] = { count: 0, achievements: [] }; monthly[month].count++; monthly[month].achievements.push(ua.achievements); });
      return Object.entries(monthly).map(([month, d]) => ({ month, displayMonth: format(new Date(month + "-01"), "MMM/yy", { locale: ptBR }), count: d.count, achievements: d.achievements }));
    },
    enabled: !!userId,
  });
}

function useQuestStats(userId: string | undefined) {
  return useQuery({
    queryKey: ["quest-stats", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data: assignments, error } = await supabase.from("quest_assignments").select(`completed_at, started_at, custom_quests (difficulty, xp_reward)`).eq("user_id", userId);
      if (error) throw error;
      const completed = assignments?.filter((a) => a.completed_at) || [];
      const inProgress = assignments?.filter((a) => !a.completed_at) || [];
      const byDifficulty = { easy: completed.filter((a) => a.custom_quests?.difficulty === "easy").length, medium: completed.filter((a) => a.custom_quests?.difficulty === "medium").length, hard: completed.filter((a) => a.custom_quests?.difficulty === "hard").length, expert: completed.filter((a) => a.custom_quests?.difficulty === "expert").length };
      return { total: assignments?.length || 0, completed: completed.length, inProgress: inProgress.length, byDifficulty, totalXpFromQuests: completed.reduce((sum, a) => sum + (a.custom_quests?.xp_reward || 0), 0) };
    },
    enabled: !!userId,
  });
}

const RARITY_COLORS = { common: "hsl(var(--muted-foreground))", rare: "hsl(217, 91%, 60%)", epic: "hsl(271, 91%, 65%)", legendary: "hsl(45, 93%, 47%)" };
const DIFFICULTY_COLORS = { easy: "hsl(142, 76%, 36%)", medium: "hsl(45, 93%, 47%)", hard: "hsl(24, 95%, 53%)", expert: "hsl(0, 84%, 60%)" };

export default function PersonalStats() {
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const { user } = useAuth();
  const seoData = useSEO();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: xpHistory, isLoading: xpLoading } = useXpHistory(user?.id, 30);
  const { data: achievementHistory } = useAchievementHistory(user?.id);
  const { data: userAchievements } = useUserAchievements();
  const { data: questStats } = useQuestStats(user?.id);

  if (profileLoading) return <PageWrapper pageName="Estatísticas" className="min-h-screen bg-background p-4"><Skeleton className="h-96 w-full" /></PageWrapper>;

  const achievementsByRarity = userAchievements?.reduce((acc, ua) => { const rarity = (ua.achievement as { rarity?: string } | null)?.rarity || "common"; acc[rarity] = (acc[rarity] || 0) + 1; return acc; }, {} as Record<string, number>) || {};
  const rarityData = Object.entries(achievementsByRarity).map(([rarity, count]) => ({ name: rarity.charAt(0).toUpperCase() + rarity.slice(1), value: count, color: RARITY_COLORS[rarity as keyof typeof RARITY_COLORS] }));
  const difficultyData = questStats ? Object.entries(questStats.byDifficulty).map(([diff, count]) => ({ name: diff.charAt(0).toUpperCase() + diff.slice(1), value: count, color: DIFFICULTY_COLORS[diff as keyof typeof DIFFICULTY_COLORS] })) : [];
  const stats = [
    { label: "XP Total", value: profile?.xp?.toLocaleString() || "0", icon: Zap, color: "from-yellow-500 to-orange-500" },
    { label: "Nível Atual", value: profile?.level || 1, icon: TrendingUp, color: "from-blue-500 to-cyan-500" },
    { label: "Conquistas", value: userAchievements?.length || 0, icon: Trophy, color: "from-purple-500 to-pink-500" },
    { label: "Quests Completas", value: questStats?.completed || 0, icon: Target, color: "from-green-500 to-emerald-500" },
    { label: "Melhor Streak", value: profile?.best_streak || 0, icon: Flame, color: "from-red-500 to-orange-500" },
    { label: "Moedas", value: profile?.coins?.toLocaleString() || "0", icon: Star, color: "from-amber-400 to-yellow-500" },
  ];

   const content = (
     <main className="flex-1 overflow-auto p-4 md:p-8 space-y-6">
       <SEOHead {...seoData} />
       
       {/* Header - Desktop only */}
       {!isMobile && (
         <div className="flex items-center gap-3 mb-6">
           <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/60">
             <TrendingUp className="h-6 w-6 text-primary-foreground" />
           </div>
           <div>
             <h2 className="text-2xl font-bold">Estatísticas Pessoais</h2>
             <p className="text-sm text-muted-foreground">Acompanhe sua evolução ao longo do tempo</p>
           </div>
         </div>
       )}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats.map((stat, index) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="relative overflow-hidden"><div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10`} /><CardContent className="p-4 relative"><div className="flex items-center gap-2 mb-2"><stat.icon className="h-4 w-4 text-muted-foreground" /><span className="text-xs text-muted-foreground">{stat.label}</span></div><div className="text-2xl font-bold">{stat.value}</div></CardContent></Card>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500" />Evolução de XP - Últimos 30 Dias</CardTitle></CardHeader>
            <CardContent>
              {xpLoading ? <Skeleton className="h-64 w-full" /> : (
                <ChartContainer config={{ xp: { label: "XP", color: "hsl(var(--primary))" } }} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={xpHistory}>
                      <defs><linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                      <XAxis dataKey="displayDate" tick={{ fontSize: 10 }} interval="preserveStartEnd" /><YAxis tick={{ fontSize: 10 }} />
                      <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => `Data: ${value}`} />} />
                      <Area type="monotone" dataKey="xp" stroke="hsl(var(--primary))" fill="url(#xpGradient)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}><ComboHistory /></motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}><WeeklyPerformanceComparison /></motion.div>

         <PersonalStatsCharts rarityData={rarityData} difficultyData={difficultyData} achievementHistory={achievementHistory} questStats={questStats} />
     </main>
   );

   return (
     <PageShell title="Estatísticas">
       <MobilePageLayout title="Estatísticas" icon={TrendingUp} backPath="/">
         <div className="flex bg-background">
           {!isMobile && (
             <AppSidebar 
               collapsed={sidebarCollapsed} 
               onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
             />
           )}
           <PageWrapper pageName="Estatísticas" className="flex-1 min-h-screen bg-background pb-24">
             <SEOHead title={seoData.title} description={seoData.description} keywords={seoData.keywords} />
             {content}
           </PageWrapper>
         </div>
       </MobilePageLayout>
     </PageShell>
   );
}
