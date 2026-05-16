import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, Users, Target, Award, Clock, Zap,
  ArrowLeft, RefreshCw, Download, Calendar, GraduationCap,
  Trophy, Flame, Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
 import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useExecutiveMetrics, useMonthlyTrends, useDepartmentMetrics } from "@/hooks/useExecutiveMetrics";
import { useCompletionTrend, useWeeklyEngagement } from "@/hooks/useEngagementReports";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import { TrendData, DepartmentData, WeeklyEngagementData } from "@/types/charts";
import { KPICard, CHART_COLORS } from "@/components/bi/BIChartComponents";
import { BIOverviewTab } from "@/components/bi/BIOverviewTab";
import { BIDepartmentsTab } from "@/components/bi/BIDepartmentsTab";
import { BITrainingTab } from "@/components/bi/BITrainingTab";
import { BIOKRsTab } from "@/components/bi/BIOKRsTab";

export default function BIDashboard() {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { data: metrics, isLoading: loadingMetrics, refetch: refetchMetrics } = useExecutiveMetrics();
  const { data: trends, isLoading: loadingTrends, refetch: refetchTrends } = useMonthlyTrends();
  const { data: departments, isLoading: loadingDepts, refetch: refetchDepts } = useDepartmentMetrics();
  const { data: completionTrend } = useCompletionTrend(6);
  const { data: weeklyEngagement } = useWeeklyEngagement();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchMetrics(), refetchTrends(), refetchDepts()]);
    setIsRefreshing(false);
  };

  const isLoading = loadingMetrics || loadingTrends || loadingDepts;

  const trendsData = trends?.map((t: TrendData) => ({
    month: t.month, usuarios: t.totalUsers, xpTotal: Math.round((t.totalXp || 0) / 1000),
    pontualidade: t.punctualityRate, treinamento: t.trainingRate, adocao: t.adoption
  })) || [];

  const deptData = departments?.map((d: DepartmentData) => ({
    name: d.name?.substring(0, 12) || 'N/A', funcionarios: d.employeeCount || 0,
    xpTotal: Math.round((d.totalXp || 0) / 1000), nivelMedio: d.avgLevel || 0,
    pontualidade: d.punctualityRate || 0, quests: d.questsCompleted || 0, score: d.score || 0
  })) || [];

  const engagementData = weeklyEngagement?.map((w: WeeklyEngagementData) => ({
    dia: w.day?.substring(0, 3) || 'N/A', atividade: w.quests || 0
  })) || [];

  const okrData = [
    { name: 'Adoção', atual: metrics?.dau || 0, meta: 70, fill: CHART_COLORS[0] },
    { name: 'Pontualidade', atual: metrics?.punctualityRate || 0, meta: 95, fill: CHART_COLORS[1] },
    { name: 'Treinamento', atual: metrics?.trainingCompletionRate || 0, meta: 95, fill: CHART_COLORS[2] },
    { name: 'Nível 5+', atual: metrics?.level5PlusRate || 0, meta: 50, fill: CHART_COLORS[3] },
  ];

  const radarData = deptData.slice(0, 5).map(d => ({
    departamento: d.name,
    produtividade: Math.min(100, (d.xpTotal / 10) + 40),
    engajamento: Math.min(100, d.pontualidade),
    treinamento: Math.min(100, (d.quests * 5) + 30),
    colaboracao: Math.min(100, (d.score / 10) + 20),
    inovacao: Math.min(100, (d.nivelMedio * 10) + 10)
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-6 space-y-6">
        <div className="flex items-center gap-4"><Skeleton className="h-10 w-10" /><Skeleton className="h-8 w-48" /></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        <div className="grid md:grid-cols-2 gap-6"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  const seo = useSEO();

  return (
    <PageShell title="Business Intelligence">
      <SEOHead {...seo} />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  Business Intelligence
                </h1>
                <p className="text-sm text-muted-foreground">Visão executiva de métricas e KPIs</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[140px]"><Calendar className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Últimos 7 dias</SelectItem>
                    <SelectItem value="30d">Últimos 30 dias</SelectItem>
                    <SelectItem value="90d">Últimos 90 dias</SelectItem>
                    <SelectItem value="12m">Últimos 12 meses</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" />Exportar</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 space-y-6">
          {/* KPI Cards */}
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />Indicadores Principais
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SectionErrorBoundary sectionName="KPI Total Usuários"><KPICard title="Total de Usuários" value={metrics?.totalUsers || 0} subtitle="Colaboradores cadastrados" icon={<Users className="h-5 w-5 text-primary" />} trend={12} /></SectionErrorBoundary>
              <SectionErrorBoundary sectionName="KPI DAU"><KPICard title="Taxa DAU" value={`${metrics?.dau || 0}%`} subtitle="Usuários ativos hoje" icon={<Activity className="h-5 w-5 text-chart-2" />} target={70} current={metrics?.dau || 0} /></SectionErrorBoundary>
              <SectionErrorBoundary sectionName="KPI Pontualidade"><KPICard title="Pontualidade" value={`${metrics?.punctualityRate || 0}%`} subtitle="Check-ins no horário" icon={<Clock className="h-5 w-5 text-chart-3" />} target={95} current={metrics?.punctualityRate || 0} /></SectionErrorBoundary>
              <SectionErrorBoundary sectionName="KPI Treinamento"><KPICard title="Treinamentos" value={`${metrics?.trainingCompletionRate || 0}%`} subtitle="Trilhas concluídas" icon={<GraduationCap className="h-5 w-5 text-chart-4" />} target={95} current={metrics?.trainingCompletionRate || 0} /></SectionErrorBoundary>
            </div>
          </section>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SectionErrorBoundary sectionName="KPI XP Total"><KPICard title="XP Total Distribuído" value={(metrics?.totalXpEarned || 0).toLocaleString('pt-BR')} subtitle="Pontos de experiência" icon={<Zap className="h-5 w-5 text-yellow-500" />} trend={18} /></SectionErrorBoundary>
            <SectionErrorBoundary sectionName="KPI Quests"><KPICard title="Quests Concluídas" value={metrics?.totalQuestsCompleted || 0} subtitle="Missões completadas" icon={<Trophy className="h-5 w-5 text-amber-500" />} trend={25} /></SectionErrorBoundary>
            <SectionErrorBoundary sectionName="KPI Kudos"><KPICard title="Kudos Enviados" value={metrics?.totalKudos || 0} subtitle="Reconhecimentos" icon={<Award className="h-5 w-5 text-pink-500" />} trend={8} /></SectionErrorBoundary>
            <SectionErrorBoundary sectionName="KPI Nivel 5+"><KPICard title="Nível 5+" value={`${metrics?.level5Plus || 0}`} subtitle={`${metrics?.level5PlusRate || 0}% do total`} icon={<Flame className="h-5 w-5 text-orange-500" />} target={50} current={metrics?.level5PlusRate || 0} /></SectionErrorBoundary>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="departments">Departamentos</TabsTrigger>
              <TabsTrigger value="training">Treinamento</TabsTrigger>
              <TabsTrigger value="okrs">OKRs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview"><BIOverviewTab trendsData={trendsData} engagementData={engagementData} deptData={deptData} /></TabsContent>
            <TabsContent value="departments"><BIDepartmentsTab deptData={deptData} radarData={radarData} /></TabsContent>
            <TabsContent value="training"><BITrainingTab completionTrend={completionTrend} metrics={metrics} /></TabsContent>
            <TabsContent value="okrs"><BIOKRsTab okrData={okrData} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </PageShell>
  );
}
