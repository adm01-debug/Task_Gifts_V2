import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfDay, endOfDay, eachHourOfInterval, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Activity, Radio, RefreshCw, BarChart3 } from "lucide-react";
import { AnalyticsChartTabs } from "@/components/analytics/AnalyticsChartTabs";
import { AnalyticsStatsCards } from "@/components/analytics/AnalyticsStatsCards";
import { ActivityByTypeCard } from "@/components/analytics/ActivityByTypeCard";
import { MostActiveUsersCard } from "@/components/analytics/MostActiveUsersCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useRecentAuditLogs, AuditAction } from "@/hooks/useAudit";
import { useProfiles } from "@/hooks/useProfiles";
import { PageShell } from "@/components/navigation";
import { supabase } from "@/integrations/supabase/client";

const actionCategories: Record<string, AuditAction[]> = {
  auth: ["user_signup", "user_login"],
  quests: ["quest_created", "quest_updated", "quest_deleted", "quest_assigned", "quest_completed"],
  kudos: ["kudos_given", "kudos_received"],
  progression: ["xp_gained", "level_up", "coins_earned", "coins_spent", "streak_updated"],
  achievements: ["achievement_unlocked"],
  team: ["department_created", "department_updated", "team_member_added", "team_member_removed"],
  roles: ["role_assigned", "role_removed"],
};

const categoryColors: Record<string, string> = {
  auth: "#6366f1", quests: "#10b981", kudos: "#f59e0b", progression: "#8b5cf6",
  achievements: "#ec4899", team: "#06b6d4", roles: "#f97316",
};

const categoryLabels: Record<string, string> = {
  auth: "Autenticação", quests: "Quests", kudos: "Kudos", progression: "Progressão",
  achievements: "Conquistas", team: "Equipes", roles: "Cargos",
};

export default function RealTimeAnalytics() {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const { data: auditLogs = [], refetch } = useRecentAuditLogs(1000);
  const { data: profiles = [] } = useProfiles();

  useEffect(() => {
    if (!isLive) return;
    const channel = supabase.channel("audit-realtime").on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => { refetch(); setLastUpdate(new Date()); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isLive, refetch]);

  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => { refetch(); setLastUpdate(new Date()); }, 30000);
    return () => clearInterval(interval);
  }, [isLive, refetch]);

  const hourlyData = useMemo(() => {
    const now = new Date();
    const hours = eachHourOfInterval({ start: subDays(now, 1), end: now });
    return hours.map((hour) => {
      const hourEnd = new Date(hour.getTime() + 3600000);
      const logsInHour = auditLogs.filter((l) => { const d = new Date(l.created_at); return d >= hour && d < hourEnd; });
      const cc: Record<string, number> = {};
      Object.keys(actionCategories).forEach((cat) => { cc[cat] = logsInHour.filter((l) => actionCategories[cat].includes(l.action)).length; });
      return { time: format(hour, "HH:mm"), hour: format(hour, "HH'h'"), total: logsInHour.length, ...cc };
    });
  }, [auditLogs]);

  const dailyData = useMemo(() => {
    const now = new Date();
    const days = eachDayOfInterval({ start: subDays(now, 6), end: now });
    return days.map((day) => {
      const logsInDay = auditLogs.filter((l) => { const d = new Date(l.created_at); return d >= startOfDay(day) && d <= endOfDay(day); });
      const cc: Record<string, number> = {};
      Object.keys(actionCategories).forEach((cat) => { cc[cat] = logsInDay.filter((l) => actionCategories[cat].includes(l.action)).length; });
      return { day: format(day, "EEE", { locale: ptBR }), date: format(day, "dd/MM"), total: logsInDay.length, ...cc };
    });
  }, [auditLogs]);

  const activityByType = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(actionCategories).forEach((cat) => { counts[cat] = auditLogs.filter((l) => actionCategories[cat].includes(l.action)).length; });
    return Object.entries(counts).map(([category, count]) => ({ category, label: categoryLabels[category], count, color: categoryColors[category] })).sort((a, b) => b.count - a.count);
  }, [auditLogs]);

  const mostActiveUsers = useMemo(() => {
    const uc: Record<string, number> = {};
    auditLogs.forEach((l) => { uc[l.user_id] = (uc[l.user_id] || 0) + 1; });
    return Object.entries(uc).map(([userId, count]) => ({ userId, count, profile: profiles.find((p) => p.id === userId) })).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [auditLogs, profiles]);

  const stats = useMemo(() => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const today = startOfDay(now);
    const logsLastHour = auditLogs.filter((l) => new Date(l.created_at) >= oneHourAgo);
    const logsToday = auditLogs.filter((l) => new Date(l.created_at) >= today);
    return {
      totalLogs: auditLogs.length, logsLastHour: logsLastHour.length, logsToday: logsToday.length,
      uniqueUsersToday: new Set(logsToday.map((l) => l.user_id)).size,
      questsCompletedToday: logsToday.filter((l) => l.action === "quest_completed").length,
    };
  }, [auditLogs]);

  const seo = useSEO();

   return (
     <PageShell title="Analytics em Tempo Real" backFallback="/admin">
       <PageWrapper pageName="Analytics em Tempo Real">
         <SEOHead {...seo} />
         <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6 lg:p-8 pb-24">
           <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-primary/10">
                 <BarChart3 className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <div className="flex items-center gap-2">
                   <h1 className="text-3xl font-bold">Analytics em Tempo Real</h1>
                   {isLive && <Badge variant="outline" className="bg-success/10 text-success border-success/30 animate-pulse"><Radio className="w-3 h-3 mr-1" />AO VIVO</Badge>}
                 </div>
                 <p className="text-muted-foreground">Monitoramento de atividade do sistema</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               <p className="text-xs text-muted-foreground">Atualizado: {format(lastUpdate, "HH:mm:ss")}</p>
               <Button variant="outline" size="sm" onClick={() => { refetch(); setLastUpdate(new Date()); }} className="gap-2"><RefreshCw className="w-4 h-4" />Atualizar</Button>
               <Button variant={isLive ? "default" : "outline"} size="sm" onClick={() => setIsLive(!isLive)} className="gap-2"><Radio className="w-4 h-4" />{isLive ? "Ao Vivo" : "Pausado"}</Button>
             </div>
           </header>

           <AnalyticsStatsCards stats={stats} />
           <AnalyticsChartTabs hourlyData={hourlyData} dailyData={dailyData} categoryColors={categoryColors} categoryLabels={categoryLabels} />
 
           <div className="grid lg:grid-cols-2 gap-6">
             <ActivityByTypeCard activityByType={activityByType} />
             <MostActiveUsersCard users={mostActiveUsers} />
           </div>
         </div>
       </PageWrapper>
     </PageShell>
   );
 }
