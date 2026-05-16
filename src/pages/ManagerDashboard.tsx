import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Target, Award, AlertTriangle, BarChart3, BookOpen, Flame, Filter, Brain, Crown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
 import { PageShell } from "@/components/navigation";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import { useScrollHeader } from "@/hooks/useScrollHeader";
import { useProfiles } from "@/hooks/useProfiles";
import { useDepartments } from "@/hooks/useDepartments";
import { QuestsList } from "@/components/manager/QuestsList";
import { ChurnPredictionPanel } from "@/components/ChurnPredictionPanel";
import { TeamCompetencyDashboard } from "@/components/manager/TeamCompetencyDashboard";
import { PDIAlertsPanel } from "@/components/admin/PDIAlertsPanel";
import { ManagerConsolidatedDashboard } from "@/components/manager/ManagerConsolidatedDashboard";
import { AICopilotDashboard } from "@/components/manager/AICopilotDashboard";
import { HighPotentialsPanel } from "@/components/manager/HighPotentialsPanel";
import { SuccessionPanel } from "@/components/manager/SuccessionPanel";
import { TeamCertificationsPanel } from "@/components/TeamCertificationsPanel";
import { cn } from "@/lib/utils";
import { DesktopBackButton } from "@/components/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard, TeamMemberRow, DepartmentCard, AtRiskAlert, type TeamMember, calculateXpToNext, calculateRiskLevel, calculateTrend } from "@/components/manager/ManagerComponents";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const { data: profiles = [] } = useProfiles();
  const { data: departments = [] } = useDepartments();
  const isScrolled = useScrollHeader(10);
  
  const teamMembers: TeamMember[] = useMemo(() => {
    return profiles.map(profile => ({
      id: profile.id, name: profile.display_name || profile.email?.split("@")[0] || "Usuário",
      avatar: (profile.display_name || profile.email || "U").substring(0, 2).toUpperCase(),
      level: profile.level, xp: profile.xp, xpToNext: calculateXpToNext(profile.level),
      questsCompleted: profile.quests_completed, questsTotal: 50, streak: profile.streak,
      lastActive: formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true, locale: ptBR }),
      trend: calculateTrend(profile.streak, profile.quests_completed),
      riskLevel: calculateRiskLevel(profile.streak, profile.updated_at), department: "Geral",
    }));
  }, [profiles]);
  
  const filteredMembers = selectedDepartment === "all" ? teamMembers : teamMembers.filter(m => m.department === selectedDepartment);
  const totalMembers = teamMembers.length || 1;
  const avgCompletion = teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, m) => acc + (m.questsCompleted / Math.max(m.questsTotal, 1)) * 100, 0) / totalMembers) : 0;
  const avgStreak = teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, m) => acc + m.streak, 0) / totalMembers) : 0;
  const atRiskCount = teamMembers.filter(m => m.riskLevel === "high").length;
  const seo = useSEO();

   return (
     <PageShell title="Dashboard do Gestor">
       <SEOHead {...seo} />
       <div className="min-h-screen bg-background">
         <div className="max-w-7xl mx-auto px-4 py-4">
           <div className="flex items-center justify-between">
             <div className="flex flex-col">
               <h1 className="text-2xl font-bold text-foreground">Dashboard do Gestor</h1>
               <p className="text-sm text-muted-foreground">Acompanhe o progresso da sua equipe</p>
             </div>
             <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
               <SelectTrigger className="w-40">
                 <Filter className="w-4 h-4 mr-2" />
                 <SelectValue placeholder="Departamento" />
               </SelectTrigger>
               <SelectContent>
                 <AllSelectItem />
                 {departments.map(dept => <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>)}
               </SelectContent>
             </Select>
           </div>
         </div>
         
         <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <AtRiskAlert members={teamMembers} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Membros da Equipe" value={totalMembers.toString()} color="#6366f1" delay={0} />
            <StatCard icon={Target} label="Taxa de Conclusão" value={`${avgCompletion}%`} change="+5%" changeType="positive" color="#10b981" delay={0.1} />
            <StatCard icon={Flame} label="Streak Médio" value={`${avgStreak} dias`} change="+2" changeType="positive" color="#f59e0b" delay={0.2} />
            <StatCard icon={AlertTriangle} label="Precisam Atenção" value={atRiskCount.toString()} change={atRiskCount > 0 ? "Agir" : "OK"} changeType={atRiskCount > 0 ? "negative" : "neutral"} color="#ef4444" delay={0.3} />
          </div>
          <Tabs defaultValue="copilot" className="space-y-6">
            <TabsList className="bg-muted/50 flex-wrap">
              <TabsTrigger value="copilot" className="gap-2"><Brain className="h-4 w-4" />IA Copilot</TabsTrigger>
              <TabsTrigger value="consolidated" className="gap-2"><BarChart3 className="h-4 w-4" />Consolidado</TabsTrigger>
              <TabsTrigger value="team" className="gap-2"><Users className="h-4 w-4" />Equipe</TabsTrigger>
              <TabsTrigger value="churn" className="gap-2"><AlertTriangle className="h-4 w-4" />Predição Churn</TabsTrigger>
              <TabsTrigger value="competencies" className="gap-2"><Target className="h-4 w-4" />Competências</TabsTrigger>
              <TabsTrigger value="certifications" className="gap-2"><Award className="h-4 w-4" />Certificações</TabsTrigger>
              <TabsTrigger value="hipotentials" className="gap-2"><TrendingUp className="h-4 w-4" />High Potentials</TabsTrigger>
              <TabsTrigger value="succession" className="gap-2"><Crown className="h-4 w-4" />Sucessão</TabsTrigger>
              <TabsTrigger value="quests" className="gap-2"><Target className="h-4 w-4" />Quests</TabsTrigger>
            </TabsList>
            <TabsContent value="copilot"><SectionErrorBoundary sectionName="IA Copilot"><AICopilotDashboard /></SectionErrorBoundary></TabsContent>
            <TabsContent value="consolidated"><ManagerConsolidatedDashboard /></TabsContent>
            <TabsContent value="team" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-foreground">Membros da Equipe</h2><Badge variant="outline">{filteredMembers.length} membros</Badge></div>
                  <div className="space-y-3"><AnimatePresence mode="popLayout">{filteredMembers.map((member, index) => <TeamMemberRow key={member.id} member={member} index={index} />)}</AnimatePresence></div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-foreground">Por Departamento</h2>
                  <div className="space-y-3">{departments.map((dept, index) => <DepartmentCard key={dept.id} department={dept} members={teamMembers} index={index} />)}</div>
                  <Card className="p-4 bg-card/40 backdrop-blur-sm border-border/40">
                    <h3 className="font-semibold text-foreground mb-3">Ações Rápidas</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start gap-2" size="sm" onClick={() => navigate("/quest-builder")}><BookOpen className="w-4 h-4" />Criar Nova Trilha</Button>
                      <Button variant="outline" className="w-full justify-start gap-2" size="sm"><Award className="w-4 h-4" />Enviar Reconhecimento</Button>
                      <Button variant="outline" className="w-full justify-start gap-2" size="sm"><BarChart3 className="w-4 h-4" />Exportar Relatório</Button>
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="churn"><SectionErrorBoundary sectionName="Predição de Churn"><ChurnPredictionPanel /></SectionErrorBoundary></TabsContent>
            <TabsContent value="competencies"><div className="grid lg:grid-cols-3 gap-6"><div className="lg:col-span-2"><SectionErrorBoundary sectionName="Competências da Equipe"><TeamCompetencyDashboard /></SectionErrorBoundary></div><div><SectionErrorBoundary sectionName="Alertas de PDI"><PDIAlertsPanel /></SectionErrorBoundary></div></div></TabsContent>
            <TabsContent value="certifications"><SectionErrorBoundary sectionName="Certificações"><TeamCertificationsPanel /></SectionErrorBoundary></TabsContent>
            <TabsContent value="hipotentials"><SectionErrorBoundary sectionName="High Potentials"><HighPotentialsPanel /></SectionErrorBoundary></TabsContent>
            <TabsContent value="succession"><SectionErrorBoundary sectionName="Sucessão Inteligente"><SuccessionPanel /></SectionErrorBoundary></TabsContent>
            <TabsContent value="quests"><SectionErrorBoundary sectionName="Quests"><QuestsList /></SectionErrorBoundary></TabsContent>
          </Tabs>
         </main>
       </div>
     </PageShell>
   );
}
