import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Activity, Award, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfiles } from "@/hooks/useProfiles";
import { useDepartments } from "@/hooks/useDepartments";
import { useAllTeamMembers } from "@/hooks/useAdminUsers";
 import { useQuery } from "@tanstack/react-query";
 import { adminService } from "@/services/adminService";
import { format, subDays, startOfDay, eachDayOfInterval, subMonths, startOfMonth, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MetricsCharts } from "./metrics/MetricsCharts";

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#06b6d4"];

 function useAttendanceStats() {
   return useQuery({
     queryKey: ["admin-attendance-stats"],
     queryFn: () => adminService.getAttendanceStats(),
     staleTime: 60000,
   });
 }
 
 function useQuizActivity() {
   return useQuery({
     queryKey: ["admin-quiz-activity"],
     queryFn: () => adminService.getQuizActivity(),
     staleTime: 60000,
   });
 }
 
 function useTrailEnrollments() {
   return useQuery({
     queryKey: ["admin-trail-enrollments"],
     queryFn: () => adminService.getTrailEnrollments(),
     staleTime: 60000,
   });
 }
 
 function useUserSignups() {
   return useQuery({
     queryKey: ["admin-user-signups"],
     queryFn: () => adminService.getUserSignups(),
     staleTime: 60000,
   });
 }

export function AdminMetricsDashboard() {
  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: departments } = useDepartments();
  const { data: teamMembers } = useAllTeamMembers();
  const { data: attendanceData } = useAttendanceStats();
  const { data: quizData } = useQuizActivity();
  const { data: enrollmentsData } = useTrailEnrollments();
  const { data: signupsData } = useUserSignups();

  const userGrowthData = useMemo(() => {
    if (!signupsData) return [];
    const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });
    let cumulative = 0;
    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = startOfMonth(subMonths(month, -1));
      const newUsers = signupsData.filter((u) => { const d = new Date(u.created_at); return d >= monthStart && d < monthEnd; }).length;
      cumulative += newUsers;
      return { month: format(month, "MMM", { locale: ptBR }), novos: newUsers, total: cumulative };
    });
  }, [signupsData]);

  const dailyActivityData = useMemo(() => {
    if (!attendanceData) return [];
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(subDays(day, -1));
      const dayAttendance = attendanceData.filter((a) => { const d = new Date(a.check_in); return d >= dayStart && d < dayEnd; });
      return { day: format(day, "dd/MM"), checkins: dayAttendance.length, usuarios: new Set(dayAttendance.map((a) => a.user_id)).size, pontuais: dayAttendance.filter((a) => a.is_punctual).length };
    });
  }, [attendanceData]);

  const departmentDistribution = useMemo(() => {
    if (!departments || !teamMembers) return [];
    return departments.map((dept) => ({ name: dept.name, value: teamMembers.filter((tm) => tm.department_id === dept.id).length, color: dept.color || COLORS[departments.indexOf(dept) % COLORS.length] })).filter((d) => d.value > 0);
  }, [departments, teamMembers]);

  const levelDistribution = useMemo(() => {
    if (!profiles) return [];
    const groups: Record<string, number> = { "1-5": 0, "6-10": 0, "11-20": 0, "21-50": 0, "51+": 0 };
    profiles.forEach((p) => { if (p.level <= 5) groups["1-5"]++; else if (p.level <= 10) groups["6-10"]++; else if (p.level <= 20) groups["11-20"]++; else if (p.level <= 50) groups["21-50"]++; else groups["51+"]++; });
    return Object.entries(groups).map(([name, value], i) => ({ name, value, color: COLORS[i] }));
  }, [profiles]);

  const quizActivityData = useMemo(() => {
    if (!quizData) return [];
    const days = eachDayOfInterval({ start: subDays(new Date(), 13), end: new Date() });
    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayEnd = startOfDay(subDays(day, -1));
      const dayQuizzes = quizData.filter((q) => { const d = new Date(q.played_at); return d >= dayStart && d < dayEnd; });
      const avg = dayQuizzes.length > 0 ? Math.round(dayQuizzes.reduce((s, q) => s + q.score, 0) / dayQuizzes.length) : 0;
      return { day: format(day, "dd/MM"), partidas: dayQuizzes.length, mediaScore: avg };
    });
  }, [quizData]);

  const summaryStats = useMemo(() => {
    const totalUsers = profiles?.length || 0;
    const avgLevel = profiles?.length ? Math.round(profiles.reduce((s, p) => s + p.level, 0) / profiles.length * 10) / 10 : 0;
    const activeToday = attendanceData ? new Set(attendanceData.filter((a) => new Date(a.check_in) >= startOfDay(new Date())).map((a) => a.user_id)).size : 0;
    const completedTrails = enrollmentsData?.filter((e) => e.completed_at).length || 0;
    return { totalUsers, avgLevel, activeToday, completedTrails, dau: totalUsers > 0 ? Math.round((activeToday / totalUsers) * 100) : 0 };
  }, [profiles, attendanceData, enrollmentsData]);

  if (profilesLoading) {
    return <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-[300px] w-full" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Usuários", value: summaryStats.totalUsers, icon: Users, color: "#6366f1" },
          { label: "DAU Hoje", value: `${summaryStats.dau}%`, icon: Activity, color: "#10b981" },
          { label: "Nível Médio", value: summaryStats.avgLevel, icon: Award, color: "#f59e0b" },
          { label: "Trilhas Concluídas", value: summaryStats.completedTrails, icon: BookOpen, color: "#8b5cf6" },
        ].map((stat, index) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className="text-2xl font-bold">{stat.value}</p></div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: `${stat.color}15` }}><stat.icon className="w-5 h-5" style={{ color: stat.color }} /></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <MetricsCharts userGrowthData={userGrowthData} dailyActivityData={dailyActivityData} departmentDistribution={departmentDistribution} levelDistribution={levelDistribution} quizActivityData={quizActivityData} />
    </div>
  );
}
