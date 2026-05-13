import { motion } from "framer-motion";
import {
  TrendingUp, Users, DollarSign, Target, Award, Clock, BookOpen,
  BarChart3, Activity, Smile, RefreshCw, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Legend
} from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useExecutiveMetrics, useMonthlyTrends, useDepartmentMetrics } from "@/hooks/useExecutiveMetrics";
import { DesktopBackButton } from "@/components/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { MetricCard } from "@/components/executive/ExecutiveMetricCard";

interface ExecutiveMetricsData {
  totalUsers: number; activeUsersToday: number; activeUsersWeek: number; level5Plus: number;
  totalXpEarned: number; totalQuestsCompleted: number; totalKudos: number;
  punctualCheckins: number; totalCheckins: number; completedTrails: number;
  totalEnrollments: number; avgTrainingHours: number;
  dau: number; wau: number; punctualityRate: number; trainingCompletionRate: number; level5PlusRate: number;
}

const calculateFinancialMetrics = (metrics: ExecutiveMetricsData | undefined) => {
  const engagementScore = metrics ? (metrics.totalXpEarned / 100) + (metrics.totalQuestsCompleted * 5) + (metrics.totalKudos * 2) : 0;
  const baseROI = metrics ? Math.min(300, 100 + engagementScore) : 0;
  const trainingSavings = metrics ? Math.round((metrics.trainingCompletionRate || 0) * 500) : 0;
  const retentionSavings = metrics ? Math.round((metrics.punctualityRate || 0) * 300) : 0;
  return {
    roiGamification: { value: Math.round(baseROI), target: 200, trend: metrics ? Math.round((baseROI - 100) / 10) : 0 },
    costPerHire: { value: null as number | null, target: 1200, trend: null as number | null },
    turnoverCostSaved: { value: trainingSavings + retentionSavings, target: 50000, trend: null as number | null },
  };
};

const calculatePeopleMetrics = (metrics: ExecutiveMetricsData | undefined) => ({
  enps: { value: null as number | null, target: 50, promoters: null as number | null, passives: null as number | null, detractors: null as number | null },
  turnover: { value: null as number | null, target: 10, previousYear: null as number | null },
  gameAdoption: { value: metrics?.wau || 0, target: 90 },
  level5Plus: { value: metrics?.level5PlusRate || 0, target: 20 },
  dau: { value: metrics?.dau || 0, target: 70 },
  wau: { value: metrics?.wau || 0, target: 90 },
  totalUsers: metrics?.totalUsers || 0,
  activeUsersToday: metrics?.activeUsersToday || 0,
  activeUsersWeek: metrics?.activeUsersWeek || 0,
  totalKudos: metrics?.totalKudos || 0,
});

const calculateOperationalMetrics = (metrics: ExecutiveMetricsData | undefined) => ({
  punctualCheckin: { value: metrics?.punctualityRate || 0, target: 95 },
  absenteeism: { value: null as number | null, target: 3 },
  trainingCompletion: { value: metrics?.trainingCompletionRate || 0, target: 95 },
  avgTrainingHours: { value: metrics?.avgTrainingHours || 0, target: 20 },
  certifications: { value: metrics?.completedTrails || 0, target: 30 },
  totalQuestsCompleted: metrics?.totalQuestsCompleted || 0,
  totalXpEarned: metrics?.totalXpEarned || 0,
});

const ExecutiveDashboard = () => {
  const queryClient = useQueryClient();
  const { data: metrics, isLoading: metricsLoading } = useExecutiveMetrics();
  const { data: trends, isLoading: trendsLoading } = useMonthlyTrends();
  const { data: departments, isLoading: departmentsLoading } = useDepartmentMetrics();

  const financialMetrics = calculateFinancialMetrics(metrics);
  const peopleMetrics = calculatePeopleMetrics(metrics);
  const operationalMetrics = calculateOperationalMetrics(metrics);

  const handleRefresh = () => { queryClient.invalidateQueries({ queryKey: ['executive'] }); };

  const chartTrendData = trends?.map(t => ({ month: t.month, adoption: t.adoption, punctuality: t.punctualityRate, training: t.trainingRate, xp: Math.round(t.totalXp / 100), users: t.totalUsers })) || [];
  const departmentChartData = departments?.map(d => ({ name: d.name, score: d.score || Math.round(d.avgLevel * 10 + d.punctualityRate * 0.5), employees: d.employeeCount })) || [];

  const seo = useSEO();

  return (
    <PageWrapper pageName="Dashboard Executivo">
      <SEOHead {...seo} />
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <DesktopBackButton />
                <div>
                  <h1 className="text-2xl font-bold">Dashboard Executivo</h1>
                  <p className="text-sm text-muted-foreground">Visão C-Level • {format(new Date(), "MMMM yyyy", { locale: ptBR })}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} disabled={metricsLoading}>
                  {metricsLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}Atualizar
                </Button>
                <Badge variant="outline" className="text-xs">{format(new Date(), "dd/MM HH:mm")}</Badge>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-border/50 bg-primary/5"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total Colaboradores</p><p className="text-2xl font-bold">{metricsLoading ? '-' : peopleMetrics.totalUsers}</p></CardContent></Card>
            <Card className="border-border/50 bg-success/5"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Ativos Hoje</p><p className="text-2xl font-bold text-success">{metricsLoading ? '-' : peopleMetrics.activeUsersToday}</p></CardContent></Card>
            <Card className="border-border/50 bg-xp/5"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Total XP Ganho</p><p className="text-2xl font-bold text-xp">{metricsLoading ? '-' : operationalMetrics.totalXpEarned.toLocaleString('pt-BR')}</p></CardContent></Card>
            <Card className="border-border/50 bg-accent/5"><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Kudos Dados</p><p className="text-2xl font-bold">{metricsLoading ? '-' : peopleMetrics.totalKudos}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="financial" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="financial" className="gap-2"><DollarSign className="w-4 h-4" /><span className="hidden sm:inline">Financeiro</span></TabsTrigger>
              <TabsTrigger value="people" className="gap-2"><Users className="w-4 h-4" /><span className="hidden sm:inline">Pessoas</span></TabsTrigger>
              <TabsTrigger value="operational" className="gap-2"><Activity className="w-4 h-4" /><span className="hidden sm:inline">Operacional</span></TabsTrigger>
              <TabsTrigger value="learning" className="gap-2"><BookOpen className="w-4 h-4" /><span className="hidden sm:inline">Aprendizado</span></TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard title="ROI Gamificação" value={financialMetrics.roiGamification.value} target={financialMetrics.roiGamification.target} unit="%" trend={financialMetrics.roiGamification.trend} icon={TrendingUp} description="Retorno sobre investimento" loading={metricsLoading} />
                <MetricCard title="Custo por Contratação" value={financialMetrics.costPerHire.value} target={financialMetrics.costPerHire.target} prefix="R$ " trend={financialMetrics.costPerHire.trend} icon={DollarSign} inverse loading={metricsLoading} />
                <MetricCard title="Custo Turnover Evitado" value={financialMetrics.turnoverCostSaved.value} target={financialMetrics.turnoverCostSaved.target} prefix="R$ " trend={financialMetrics.turnoverCostSaved.trend} icon={Award} description="Economia anual estimada" loading={metricsLoading} />
              </div>
              <Card className="border-border/50 bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Evolução do Engajamento</CardTitle><CardDescription>Últimos 6 meses - dados reais</CardDescription></CardHeader>
                <CardContent>{trendsLoading ? <div className="h-[300px] space-y-4 p-4"><div className="flex items-end justify-between h-full gap-2">{[...Array(6)].map((_, i) => <div key={i} className="flex-1 flex flex-col justify-end gap-2"><Skeleton className="w-full" style={{ height: `${Math.random() * 60 + 40}%` }} /><Skeleton className="h-4 w-full" /></div>)}</div></div> : <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartTrendData}><defs><linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} /><Legend /><Area type="monotone" dataKey="xp" name="XP (x100)" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#xpGradient)" /><Line type="monotone" dataKey="users" name="Usuários" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} /></AreaChart></ResponsiveContainer></div>}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="people" className="space-y-6">
              <Card className="border-border/50 bg-gradient-to-br from-primary/5 to-accent/5"><CardContent className="pt-6"><div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><div className="space-y-4"><div className="flex items-center gap-3"><div className="p-3 rounded-xl bg-primary/10"><Smile className="w-8 h-8 text-primary" /></div><div><p className="text-sm text-muted-foreground">Employee Net Promoter Score</p>{peopleMetrics.enps.value !== null ? <p className="text-5xl font-bold text-primary">+{peopleMetrics.enps.value}</p> : <p className="text-xl text-muted-foreground">Requer integração eNPS Survey</p>}</div></div><Badge className="bg-muted text-muted-foreground border-muted">Meta: {peopleMetrics.enps.target}</Badge></div><div className="h-[200px] flex items-center justify-center"><div className="text-center text-muted-foreground"><p className="text-sm">Dados eNPS não disponíveis</p><p className="text-xs mt-1">Integrar sistema de pesquisa de satisfação</p></div></div></div></CardContent></Card>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard title="Taxa de Turnover" value={peopleMetrics.turnover.value} target={peopleMetrics.turnover.target} unit="%" icon={Users} description={`Ano anterior: ${peopleMetrics.turnover.previousYear}%`} inverse />
                <MetricCard title="Adesão Semanal (WAU)" value={peopleMetrics.wau.value} target={peopleMetrics.wau.target} unit="%" icon={Target} loading={metricsLoading} />
                <MetricCard title="Ativos Hoje (DAU)" value={peopleMetrics.dau.value} target={peopleMetrics.dau.target} unit="%" icon={Activity} loading={metricsLoading} />
                <MetricCard title="Nível 5+ (Especialistas)" value={peopleMetrics.level5Plus.value} target={peopleMetrics.level5Plus.target} unit="%" icon={Award} loading={metricsLoading} />
              </div>
            </TabsContent>

            <TabsContent value="operational" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard title="Check-in Pontual" value={operationalMetrics.punctualCheckin.value} target={operationalMetrics.punctualCheckin.target} unit="%" icon={Clock} loading={metricsLoading} />
                <MetricCard title="Taxa de Absenteísmo" value={operationalMetrics.absenteeism.value} target={operationalMetrics.absenteeism.target} unit="%" icon={Users} inverse />
                <MetricCard title="Conclusão Treinamentos" value={operationalMetrics.trainingCompletion.value} target={operationalMetrics.trainingCompletion.target} unit="%" icon={BookOpen} loading={metricsLoading} />
              </div>
              <Card className="border-border/50 bg-card/50"><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" />Performance por Departamento</CardTitle><CardDescription>Score de engajamento - dados reais</CardDescription></CardHeader>
                 <CardContent>{departmentsLoading ? <div className="h-[300px] space-y-4 p-4">{[...Array(5)].map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="h-4 w-20" /><Skeleton className="h-6 flex-1" style={{ width: `${Math.random() * 40 + 40}%` }} /></div>)}</div> : departmentChartData.length > 0 ? <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={departmentChartData} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} /><Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} formatter={(value: number, _name: string, props: any) => [`${value} pts (${props?.payload?.employees || 0} colaboradores)`, 'Score']} /><Bar dataKey="score" radius={[0, 4, 4, 0]}>{departmentChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.score >= 70 ? 'hsl(var(--success))' : entry.score >= 50 ? 'hsl(var(--primary))' : 'hsl(var(--warning))'} />)}</Bar></BarChart></ResponsiveContainer></div> : <div className="h-[200px] flex items-center justify-center text-muted-foreground">Nenhum departamento cadastrado</div>}</CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="learning" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <MetricCard title="Horas Treinamento/Colaborador" value={operationalMetrics.avgTrainingHours.value} target={operationalMetrics.avgTrainingHours.target} unit="h" icon={Clock} description="Média anual por pessoa" loading={metricsLoading} />
                <MetricCard title="Trilhas Concluídas" value={operationalMetrics.certifications.value} target={operationalMetrics.certifications.target} icon={Award} loading={metricsLoading} />
                <MetricCard title="Quests Completadas" value={operationalMetrics.totalQuestsCompleted} target={100} icon={Target} loading={metricsLoading} />
              </div>
              <Card className="border-primary/20 bg-primary/5"><CardHeader><CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Resumo OKRs Q4 2025</CardTitle></CardHeader>
                <CardContent><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-3"><h4 className="font-semibold text-sm">Objetivos Atingidos</h4><div className="space-y-2">{[{ label: 'ROI Gamificação > 200%', done: financialMetrics.roiGamification.value >= 200 },{ label: 'eNPS > 50', done: (peopleMetrics.enps.value ?? 0) >= 50 },{ label: 'Turnover < 10%', done: (peopleMetrics.turnover.value ?? 100) < 10 },{ label: 'Adesão Game > 80%', done: peopleMetrics.gameAdoption.value >= 80 }].map((okr, i) => <div key={i} className="flex items-center gap-2 text-sm"><div className={`w-5 h-5 rounded-full flex items-center justify-center ${okr.done ? 'bg-success/20 text-success' : 'bg-muted'}`}>{okr.done && '✓'}</div><span className={okr.done ? 'text-foreground' : 'text-muted-foreground'}>{okr.label}</span></div>)}</div></div><div className="space-y-3"><h4 className="font-semibold text-sm">Em Progresso</h4><div className="space-y-2">{[{ label: 'Check-in pontual > 95%', progress: operationalMetrics.punctualCheckin.value },{ label: 'Conclusão treinamentos > 95%', progress: operationalMetrics.trainingCompletion.value },{ label: 'Horas capacitação > 20h', progress: Math.min(100, (operationalMetrics.avgTrainingHours.value / 20) * 100) }].map((okr, i) => <div key={i} className="space-y-1"><div className="flex items-center justify-between text-sm"><span>{okr.label}</span><span className={okr.progress >= 95 ? 'text-success' : 'text-warning'}>{okr.progress.toFixed(0)}%</span></div><Progress value={okr.progress} className="h-1.5" /></div>)}</div></div></div></CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </PageWrapper>
  );
};

export default ExecutiveDashboard;
