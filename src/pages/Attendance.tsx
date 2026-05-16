import { motion } from "framer-motion";
import { Clock, Calendar, Flame, CheckCircle2, XCircle, Target, Award, Timer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUserStreak, useTodayAttendance, useRecentAttendance, useCheckIn, useCheckOut, useAttendanceSettings } from "@/hooks/useAttendance";
import { AttendanceCalendar } from "@/components/AttendanceCalendar";
import { AttendanceCharts } from "@/components/attendance/AttendanceCharts";
 import { PageShell } from "@/components/navigation";
 import { useIsMobile } from "@/hooks/use-mobile";
 import { MobilePageLayout } from "@/components/mobile";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";

const Attendance = () => {
  const seoData = useSEO();
  const [selectedMonth] = useState(new Date());
  const { data: streak } = useUserStreak();
  const { data: todayRecord } = useTodayAttendance();
  const { data: recentRecords } = useRecentAttendance(30);
  const { data: settings } = useAttendanceSettings();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();

  const monthlyStats = useMemo(() => {
    if (!recentRecords) return { punctual: 0, late: 0, absent: 0, total: 0, punctualityRate: 0 };
    const monthStart = startOfMonth(selectedMonth);
    const monthEnd = endOfMonth(selectedMonth);
    const workDays = eachDayOfInterval({ start: monthStart, end: monthEnd }).filter(day => !isWeekend(day) && day <= new Date());
    const punctual = recentRecords.filter(r => r.is_punctual).length;
    const late = recentRecords.filter(r => !r.is_punctual).length;
    const total = recentRecords.length;
    const absent = Math.max(0, workDays.length - total);
    return { punctual, late, absent, total, punctualityRate: total > 0 ? (punctual / total) * 100 : 0 };
  }, [recentRecords, selectedMonth]);

  const weeklyTrendData = useMemo(() => {
    if (!recentRecords) return [];
    const weeks: Record<string, { punctual: number; total: number }> = {};
    recentRecords.forEach(record => {
      const date = parseISO(record.check_in);
      const weekStart = format(date, "'Sem' w", { locale: ptBR });
      if (!weeks[weekStart]) weeks[weekStart] = { punctual: 0, total: 0 };
      weeks[weekStart].total++;
      if (record.is_punctual) weeks[weekStart].punctual++;
    });
    return Object.entries(weeks).map(([week, data]) => ({ week, rate: data.total > 0 ? Math.round((data.punctual / data.total) * 100) : 0, punctual: data.punctual, total: data.total })).slice(-4);
  }, [recentRecords]);

  const checkInTimesData = useMemo(() => {
    if (!recentRecords) return [];
    return recentRecords.slice(0, 7).reverse().map(record => {
      const checkInTime = parseISO(record.check_in);
      return { day: format(checkInTime, "EEE", { locale: ptBR }), time: checkInTime.getHours() * 60 + checkInTime.getMinutes(), displayTime: format(checkInTime, "HH:mm"), isPunctual: record.is_punctual };
    });
  }, [recentRecords]);

  const targetMinutes = settings ? parseInt(settings.work_start_time.split(':')[0]) * 60 + parseInt(settings.work_start_time.split(':')[1]) : 480;

   const isMobile = useIsMobile();
 
   const pageContent = (
     <main className="container mx-auto px-4 py-6 space-y-6 max-w-7xl pb-24">
       {!isMobile && (
         <div className="flex items-center justify-between mb-4">
           <div>
             <h1 className="text-3xl font-bold">Controle de Ponto</h1>
             <p className="text-muted-foreground">{format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
           </div>
         </div>
       )}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Registro de Hoje</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Entrada</p>
                  <p className="text-2xl font-bold">{todayRecord?.check_in ? format(parseISO(todayRecord.check_in), "HH:mm") : "--:--"}</p>
                  {todayRecord?.is_punctual !== undefined && <Badge variant={todayRecord.is_punctual ? "default" : "destructive"} className="mt-2">{todayRecord.is_punctual ? "Pontual" : `${todayRecord.late_minutes}min atrasado`}</Badge>}
                </div>
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Saída</p>
                  <p className="text-2xl font-bold">{todayRecord?.check_out ? format(parseISO(todayRecord.check_out), "HH:mm") : "--:--"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => checkIn.mutate()} disabled={!!todayRecord?.check_in || checkIn.isPending}><CheckCircle2 className="w-4 h-4 mr-2" />{checkIn.isPending ? "Registrando..." : "Check-in"}</Button>
                <Button variant="outline" className="flex-1" onClick={() => checkOut.mutate()} disabled={!todayRecord?.check_in || !!todayRecord?.check_out || checkOut.isPending}><XCircle className="w-4 h-4 mr-2" />{checkOut.isPending ? "Registrando..." : "Check-out"}</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader><CardTitle className="flex items-center gap-2"><Flame className="w-5 h-5 text-streak" />Streak de Pontualidade</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><motion.p className="text-4xl font-bold text-streak" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.1 }}>{streak?.current_streak || 0}</motion.p><p className="text-sm text-muted-foreground">Atual</p></div>
                <div><motion.p className="text-4xl font-bold text-primary" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>{streak?.best_streak || 0}</motion.p><p className="text-sm text-muted-foreground">Recorde</p></div>
                <div><motion.p className="text-4xl font-bold text-success" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.3 }}>{streak?.total_punctual_days || 0}</motion.p><p className="text-sm text-muted-foreground">Total Pontuais</p></div>
              </div>
              {settings && streak && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2"><span className="text-sm text-muted-foreground">Próximo Milestone</span><span className="text-sm font-medium">{streak.current_streak} / {settings.streak_milestone} dias</span></div>
                  <Progress value={(streak.current_streak / settings.streak_milestone) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-2">+{settings.xp_streak_bonus} XP bônus ao atingir {settings.streak_milestone} dias</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Taxa Pontualidade", value: `${monthlyStats.punctualityRate.toFixed(0)}%`, icon: Target, color: "success" },
            { label: "Dias Pontuais", value: monthlyStats.punctual, icon: CheckCircle2, color: "primary" },
            { label: "Dias Atrasados", value: monthlyStats.late, icon: Timer, color: "warning" },
            { label: "XP Ganho", value: `+${monthlyStats.punctual * (settings?.xp_punctual_checkin || 15)}`, icon: Award, color: "xp" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div><p className="text-sm text-muted-foreground">{stat.label}</p><p className={`text-3xl font-bold text-${stat.color}`}>{stat.value}</p></div>
                    <stat.icon className={`w-10 h-10 text-${stat.color}/20`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <AttendanceCalendar records={recentRecords || []} />
        <AttendanceCharts weeklyTrendData={weeklyTrendData} checkInTimesData={checkInTimesData} targetMinutes={targetMinutes} />

        <Card className="border-border/50 bg-card/50">
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" />Registros Recentes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Entrada</TableHead><TableHead>Saída</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {recentRecords?.slice(0, 10).map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{format(parseISO(record.check_in), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{format(parseISO(record.check_in), "HH:mm")}</TableCell>
                    <TableCell>{record.check_out ? format(parseISO(record.check_out), "HH:mm") : "-"}</TableCell>
                    <TableCell><Badge variant={record.is_punctual ? "default" : "destructive"}>{record.is_punctual ? "Pontual" : `${record.late_minutes}min atraso`}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
       </main>
   );
 
   return (
     <PageShell title="Ponto">
       <PageWrapper pageName="Ponto" className="min-h-screen bg-background">
         <SEOHead {...seoData} />
         {isMobile ? (
           <MobilePageLayout title="Controle de Ponto" icon={Clock} backPath="/" subtitle={format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}>
             {pageContent}
           </MobilePageLayout>
         ) : (
           pageContent
         )}
       </PageWrapper>
     </PageShell>
   );
};

export default Attendance;
