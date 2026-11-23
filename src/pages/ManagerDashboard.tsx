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
import { useAllTeamMembers } from "@/hooks/useAdminUsers";
import { useQuests } from "@/hooks/useQuests";
import { exportReport } from "@/lib/exportReports";
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
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatCard, TeamMemberRow, DepartmentCard, AtRiskAlert, type TeamMember, calculateXpToNext, calculateRiskLevel, calculateTrend } from "@/components/manager/ManagerComponents";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useGiveKudos, useKudosBadges } from "@/hooks/useKudos";
import { toast } from "sonner";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [kudosOpen, setKudosOpen] = useState(false);
  const { data: profiles = [] } = useProfiles();
  const { data: departments = [] } = useDepartments();
  const { data: allTeamMembers = [] } = useAllTeamMembers();
  const { data: activeQuests = [] } = useQuests("active");
  const isScrolled = useScrollHeader(10);

  const departmentNameByUserId = useMemo(() => {
    const deptNameById = new Map(departments.map(d => [d.id, d.name]));
    return new Map(
      allTeamMembers
        .filter(tm => deptNameById.has(tm.department_id))
        .map(tm => [tm.user_id, deptNameById.get(tm.department_id) as string]),
    );
  }, [allTeamMembers, departments]);

  const questsTotal = activeQuests.length || 1;

  const teamMembers: TeamMember[] = useMemo(() => {
    return profiles.map(profile => ({
      id: profile.id, name: profile.display_name || profile.email?.split("@")[0] || "Usuário",
      avatar: (profile.display_name || profile.email || "U").substring(0, 2).toUpperCase(),
      level: profile.level, xp: profile.xp, xpToNext: calculateXpToNext(profile.level),
      questsCompleted: profile.quests_completed, questsTotal, streak: profile.streak,
      lastActive: formatDistanceToNow(new Date(profile.updated_at), { addSuffix: true, locale: ptBR }),
      trend: calculateTrend(profile.streak, profile.quests_completed),
      riskLevel: calculateRiskLevel(profile.streak, profile.updated_at), department: departmentNameByUserId.get(profile.id) ?? "Sem departamento",
    }));
  }, [profiles, departmentNameByUserId, questsTotal]);

  const filteredMembers = selectedDepartment === "all" ? teamMembers : teamMembers.filter(m => m.department === selectedDepartment);
  const totalMembers = teamMembers.length || 1;
  const avgCompletion = teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, m) => acc + (m.questsCompleted / Math.max(m.questsTotal, 1)) * 100, 0) / totalMembers) : 0;
  const avgStreak = teamMembers.length > 0 ? Math.round(teamMembers.reduce((acc, m) => acc + m.streak, 0) / totalMembers) : 0;
  const atRiskCount = teamMembers.filter(m => m.riskLevel === "high").length;
  const seo = useSEO();
  const [exportFormat, setExportFormat] = useState<"csv" | "excel" | "pdf">("csv");

  const handleExport = () => {
    if (teamMembers.length === 0) {
      toast.error("Nenhum membro disponível para exportar.");
      return;
    }
    const rows = teamMembers.map(m => ({
      Nome: m.name, Departamento: m.department, Nivel: m.level,
      XP: m.xp, Quest_Concluidas: m.questsCompleted, Quest_Total: m.questsTotal,
      Streak: m.streak, Ultima_Atividade: m.lastActive, Risco: m.riskLevel,
    }));
    exportReport(
      {
        title: "Relatório da Equipe",
        subtitle: `${teamMembers.length} membros · ${atRiskCount} em risco alto · conclusão média ${avgCompletion}%`,
        generatedAt: new Date(),
        generatedBy: user?.email ?? "Gestor",
        sections: [
          {
            title: "Resumo da Equipe",
            type: "summary",
            data: [
              { metrica: "Membros", valor: teamMembers.length },
              { metrica: "Conclusão média de quests", valor: `${avgCompletion}%` },
              { metrica: "Streak médio", valor: `${avgStreak} dias` },
              { metrica: "Membros em risco alto", valor: atRiskCount },
            ],
            columns: [
              { key: "metrica", label: "Métrica" },
              { key: "valor", label: "Valor" },
            ],
          },
          {
            title: "Membros da Equipe",
            type: "table",
            data: rows,
            columns: [
              { key: "Nome", label: "Nome" },
              { key: "Departamento", label: "Departamento" },
              { key: "Nivel", label: "Nível" },
              { key: "XP", label: "XP", format: "number" },
              { key: "Quest_Concluidas", label: "Quests Concluídas" },
              { key: "Quest_Total", label: "Quests Total" },
              { key: "Streak", label: "Streak (dias)" },
              { key: "Ultima_Atividade", label: "Última Atividade" },
              { key: "Risco", label: "Risco" },
            ],
          },
        ],
      },
      { format: exportFormat, filename: `equipe-gestor-${new Date().toISOString().slice(0, 10)}` },
    );
    toast.success("Relatório da equipe exportado!");
  };

  const { mutate: giveKudos } = useGiveKudos();
  const { data: kudosBadges = [] } = useKudosBadges();
  const [kudosTarget, setKudosTarget] = useState<string>("");
  const [kudosBadge, setKudosBadge] = useState<string>("");
  const [kudosMessage, setKudosMessage] = useState("");

  const handleSendKudos = () => {
    if (!user?.id || !kudosTarget || !kudosMessage.trim()) return;
    giveKudos({
      from_user_id: user.id,
      to_user_id: kudosTarget,
      badge_id: kudosBadge || null,
      message: kudosMessage.trim(),
      is_public: true,
    }, { onSuccess: () => { setKudosOpen(false); setKudosTarget(""); setKudosBadge(""); setKudosMessage(""); } });
  };

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
            <StatCard icon={Target} label="Taxa de Conclusão" value={`${avgCompletion}%`} color="#10b981" delay={0.1} />
            <StatCard icon={Flame} label="Streak Médio" value={`${avgStreak} dias`} color="#f59e0b" delay={0.2} />
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
                      <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full justify-start gap-2" size="sm"><Award className="w-4 h-4" />Enviar Reconhecimento</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Enviar Reconhecimento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-4 gap-2">
                              {kudosBadges.slice(0, 4).map(badge => (
                                <button key={badge.id} type="button" onClick={() => setKudosBadge(badge.id)} className={cn("p-2 rounded border text-center", kudosBadge === badge.id ? "bg-primary/10 border-primary" : "border-border")}>
                                  <span className="text-xl">{badge.icon}</span>
                                </button>
                              ))}
                            </div>
                            <Select value={kudosTarget} onValueChange={setKudosTarget}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Para quem?" />
                              </SelectTrigger>
                              <SelectContent>
                                {profiles.filter(p => p.id !== user?.id).map(p => (
                                  <SelectItem key={p.id} value={p.id}>{p.display_name || p.email?.split("@")[0] || "Usuário"}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Textarea placeholder="Mensagem de reconhecimento..." value={kudosMessage} onChange={e => setKudosMessage(e.target.value)} className="text-sm" />
                            <Button onClick={handleSendKudos} disabled={!kudosTarget || !kudosMessage.trim()} className="w-full">Enviar</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <div className="space-y-2">
                        <Select value={exportFormat} onValueChange={(v) => setExportFormat(v as "csv" | "excel" | "pdf")}>
                          <SelectTrigger className="w-full" aria-label="Formato do relatório">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="csv">CSV (planilha simples)</SelectItem>
                            <SelectItem value="excel">Excel</SelectItem>
                            <SelectItem value="pdf">PDF</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button variant="outline" className="w-full justify-start gap-2" size="sm" onClick={handleExport}><BarChart3 className="w-4 h-4" />Exportar Relatório</Button>
                      </div>
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
