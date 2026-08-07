import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
 import {
   Users, Target, Clock, Award, AlertTriangle, Download, Calendar, BarChart3, Activity,
 } from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import {
   useCompletionTrend, useDepartmentPerformance, useQuestDifficultyDistribution, useWeeklyEngagement, useTopQuests, useStrugglingAreas, useEngagementMetrics,
 } from "@/hooks/useEngagementReports";
 import { PageShell } from "@/components/navigation";
import { toast } from "sonner";
import { StatCard, ChartCard, EngagementCustomTooltip, StrugglingAreasSection } from "@/components/engagement/EngagementCharts";

export default function EngagementReports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState("6m");

  const periodMonths = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const { data: completionTrend, isLoading: loadingTrend } = useCompletionTrend(periodMonths);
  const { data: departmentPerformance, isLoading: loadingDepts } = useDepartmentPerformance();
  const { data: difficultyDistribution, isLoading: loadingDiff } = useQuestDifficultyDistribution();
  const { data: weeklyEngagement, isLoading: loadingWeekly } = useWeeklyEngagement();
  const { data: topQuests, isLoading: loadingTop } = useTopQuests(5);
  const { data: strugglingAreas, isLoading: loadingStruggle } = useStrugglingAreas();
  const { data: metrics, isLoading: loadingMetrics } = useEngagementMetrics();

   return (
     <PageShell title="Relatórios de Engajamento">
       <div className="min-h-screen bg-background">
         <div className="max-w-7xl mx-auto px-4 py-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div className="flex flex-col">
               <h1 className="text-2xl font-bold text-foreground">Relatórios de Engajamento</h1>
               <p className="text-sm text-muted-foreground">Métricas e ROI do treinamento corporativo</p>
             </div>
             <div className="flex items-center gap-3">
               <Select value={period} onValueChange={setPeriod}>
                 <SelectTrigger className="w-36"><Calendar className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="1m">Último mês</SelectItem>
                   <SelectItem value="3m">Últimos 3 meses</SelectItem>
                   <SelectItem value="6m">Últimos 6 meses</SelectItem>
                   <SelectItem value="1y">Último ano</SelectItem>
                 </SelectContent>
               </Select>
               <Button variant="outline" className="gap-2" onClick={() => toast.success("Relatório exportado com sucesso!")}><Download className="w-4 h-4" />Exportar</Button>
             </div>
           </div>
         </div>
 
         <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Clock} label="Horas de Treinamento" value={metrics?.totalTrainingHours.toLocaleString() || "0"} subValue="horas investidas" change={metrics?.totalTrainingHours ? "+18%" : undefined} changeType="positive" color="#6366f1" delay={0} loading={loadingMetrics} />
          <StatCard icon={Target} label="Taxa de Conclusão" value={`${metrics?.avgCompletionRate || 0}%`} subValue="média geral" change={metrics?.avgCompletionRate ? "+12%" : undefined} changeType="positive" color="#10b981" delay={0.1} loading={loadingMetrics} />
          <StatCard icon={Award} label="Certificações Emitidas" value={metrics?.totalCertifications.toString() || "0"} subValue="no período" change={metrics?.totalCertifications ? "+24%" : undefined} changeType="positive" color="#f59e0b" delay={0.2} loading={loadingMetrics} />
          <StatCard icon={Activity} label="Score de Engajamento" value={`${metrics?.engagementScore || 0}/100`} subValue={metrics?.engagementScore && metrics.engagementScore >= 70 ? "excelente" : "em desenvolvimento"} change={metrics?.engagementScore ? "+5pts" : undefined} changeType="positive" color="#8b5cf6" delay={0.3} loading={loadingMetrics} />
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Visão Geral</TabsTrigger>
            <TabsTrigger value="departments" className="gap-2"><Users className="h-4 w-4" />Por Departamento</TabsTrigger>
            <TabsTrigger value="difficulty" className="gap-2"><AlertTriangle className="h-4 w-4" />Áreas Críticas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <ChartCard title="Tendência de Conclusões" subtitle="Trilhas completadas vs iniciadas" delay={0.1} loading={loadingTrend}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={completionTrend || []}>
                      <defs>
                        <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                        <linearGradient id="colorStarted" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} /><stop offset="95%" stopColor="#6366f1" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<EngagementCustomTooltip />} /><Legend />
                      <Area type="monotone" dataKey="started" name="Iniciadas" stroke="#6366f1" fillOpacity={1} fill="url(#colorStarted)" />
                      <Area type="monotone" dataKey="completed" name="Completadas" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>

              <ChartCard title="Engajamento Semanal" subtitle="Distribuição por dia da semana" delay={0.2} loading={loadingWeekly}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyEngagement || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip content={<EngagementCustomTooltip />} /><Legend />
                      <Bar dataKey="hours" name="Horas" fill="#8b5cf6" radius={[4, 4, 0, 0]} /><Bar dataKey="quests" name="Quests" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>

            <ChartCard title="Quests Mais Populares" subtitle="Ranking por conclusões" delay={0.3} loading={loadingTop}>
              <div className="space-y-3">
                {(topQuests || []).length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma quest completada ainda.</p>
                ) : topQuests?.map((quest, index) => (
                  <motion.div key={quest.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.05 }} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">{index + 1}</div>
                    <div className="flex-1 min-w-0"><p className="font-medium text-foreground truncate">{quest.name}</p><p className="text-sm text-muted-foreground">Tempo médio: {quest.avgTime}</p></div>
                    <div className="text-right"><p className="font-semibold text-foreground">{quest.completions}</p><p className="text-xs text-muted-foreground">conclusões</p></div>
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">★ {quest.rating.toFixed(1)}</Badge>
                  </motion.div>
                ))}
              </div>
            </ChartCard>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ChartCard title="Performance por Departamento" subtitle="Taxa de conclusão comparativa" delay={0.1} loading={loadingDepts}>
                  <div className="h-80">
                    {(departmentPerformance || []).length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">Nenhum departamento encontrado.</div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={departmentPerformance || []} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" /><XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                          <Tooltip content={<EngagementCustomTooltip />} /><Legend />
                          <Bar dataKey="completion" name="Conclusão %" fill="#10b981" radius={[0, 4, 4, 0]} /><Bar dataKey="engagement" name="Engajamento" fill="#6366f1" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </ChartCard>
              </div>

              <ChartCard title="Distribuição por Dificuldade" delay={0.2} loading={loadingDiff}>
                <div className="h-80">
                  {(difficultyDistribution || []).every(d => d.value === 0) ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">Nenhuma quest ativa.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie data={difficultyDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ""}>
                          {(difficultyDistribution || []).map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip content={<EngagementCustomTooltip />} />
                      </RechartsPie>
                    </ResponsiveContainer>
                  )}
                </div>
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(departmentPerformance || []).map((dept, index) => (
                <motion.div key={dept.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + index * 0.05 }}>
                  <Card className="p-5 bg-card/50 backdrop-blur-sm border-border/50">
                    <div className="flex items-center justify-between mb-4"><h4 className="font-semibold text-foreground">{dept.name}</h4><Badge variant="outline" className={dept.completion >= 80 ? "border-green-500/50 text-green-500" : dept.completion >= 60 ? "border-yellow-500/50 text-yellow-500" : "border-red-500/50 text-red-500"}>{dept.completion}%</Badge></div>
                    <div className="space-y-3">
                      <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Conclusão</span><span className="font-medium">{dept.completion}%</span></div><Progress value={dept.completion} className="h-1.5" /></div>
                      <div><div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Engajamento</span><span className="font-medium">{dept.engagement}%</span></div><Progress value={dept.engagement} className="h-1.5" /></div>
                      <div className="pt-2 border-t border-border flex justify-between text-sm"><span className="text-muted-foreground">Tempo médio</span><span className="font-medium">{dept.avgTime}h</span></div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="difficulty" className="space-y-6">
            <StrugglingAreasSection strugglingAreas={strugglingAreas} loading={loadingStruggle} />
          </TabsContent>
        </Tabs>
         </main>
       </div>
     </PageShell>
   );
}
