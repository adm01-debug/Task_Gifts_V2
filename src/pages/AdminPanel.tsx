import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Building2, HelpCircle, ShoppingBag, BookOpen, Settings, Shield, LayoutDashboard, Key, Award, ChevronRight, Search, Activity, BarChart3, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent } from "@/components/ui/tabs";
 import { ProtectedRoute } from "@/components/rbac/ProtectedRoute";
import { PageWrapper } from "@/components/PageWrapper";
import { SEOHead } from "@/components/SEOHead";
import { useSEO } from "@/hooks/useSEO";
import { UsersManager } from "@/components/admin/UsersManager";
import { DepartmentsManager } from "@/components/admin/DepartmentsManager";
import { OrganizationSettings } from "@/components/admin/OrganizationSettings";
import { AdminChangeHistory } from "@/components/admin/AdminChangeHistory";
import { AdminMetricsDashboard } from "@/components/admin/AdminMetricsDashboard";
import { AdminAlertsPanel } from "@/components/admin/AdminAlertsPanel";
import { LeaguesManager } from "@/components/admin/LeaguesManager";
import { GoalsManager } from "@/components/admin/GoalsManager";
import { SurveyCreator } from "@/components/admin/SurveyCreator";
import { FeedbackCycleManager } from "@/components/admin/FeedbackCycleManager";
import { AnnouncementPublisher } from "@/components/admin/AnnouncementPublisher";
import { CelebrationManager } from "@/components/admin/CelebrationManager";
import { MoodAnalytics } from "@/components/admin/MoodAnalytics";
import { PositionsManager } from "@/components/admin/PositionsManager";
import { PenaltyRulesManager } from "@/components/admin/PenaltyRulesManager";
import { NineBoxMatrix } from "@/components/admin/NineBoxMatrix";
import { DevelopmentPlanManager } from "@/components/admin/DevelopmentPlanManager";
import { ENPSDashboard } from "@/components/admin/ENPSDashboard";
import { PDIAlertsPanel } from "@/components/admin/PDIAlertsPanel";
import { IpWhitelistManager } from "@/components/admin/IpWhitelistManager";
import { RBACDashboard } from "@/components/rbac";
import { PasswordResetApprovalPanel } from "@/components/admin/PasswordResetApprovalPanel";
import { useProfiles } from "@/hooks/useProfiles";
import { useDepartments } from "@/hooks/useDepartments";
import { useAdminRewards } from "@/hooks/useShop";
import { useQuizQuestions } from "@/hooks/useQuizQuestions";
import { usePublishedTrails } from "@/hooks/useTrails";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
 import { PageShell } from "@/components/navigation";
import { AdminTabsList } from "@/components/admin/AdminTabsList";

interface QuickLinkProps {
  icon: React.ElementType;
  title: string;
  description: string;
  href: string;
  badge?: string;
  color: string;
}

const QuickLink = ({ icon: Icon, title, description, href, badge, color }: QuickLinkProps) => {
  const navigate = useNavigate();
  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}>
      <Card className="cursor-pointer border-border/50 hover:border-primary/40 transition-all duration-300 group" onClick={() => navigate(href)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl transition-transform group-hover:scale-110" style={{ backgroundColor: `${color}15` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{title}</h3>
                {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground truncate">{description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function AdminPanelContent() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: profiles } = useProfiles();
  const { data: departments } = useDepartments();
  const { data: rewards } = useAdminRewards();
  const { data: questions } = useQuizQuestions();
  const { data: trails } = usePublishedTrails();

  const stats = { users: profiles?.length || 0, departments: departments?.length || 0, rewards: rewards?.length || 0, questions: questions?.length || 0, trails: trails?.length || 0 };

  const quickLinks: QuickLinkProps[] = [
    { icon: HelpCircle, title: "Perguntas do Quiz", description: "Gerenciar perguntas e gerar com IA", href: "/quiz/admin", badge: `${stats.questions}`, color: "#6366f1" },
    { icon: ShoppingBag, title: "Loja de Recompensas", description: "Produtos, promoções e pedidos", href: "/loja/admin", badge: `${stats.rewards}`, color: "#10b981" },
    { icon: BookOpen, title: "Trilhas de Aprendizado", description: "Criar e gerenciar trilhas", href: "/trails", badge: `${stats.trails}`, color: "#f59e0b" },
    { icon: LayoutDashboard, title: "Dashboard Gestor", description: "Visão geral da equipe", href: "/manager", color: "#8b5cf6" },
    { icon: Award, title: "Dashboard Executivo", description: "Métricas e KPIs C-Level", href: "/executivo", color: "#ec4899" },
    { icon: Shield, title: "Logs de Auditoria", description: "Histórico de ações do sistema", href: "/audit", color: "#64748b" },
    { icon: Activity, title: "Observabilidade de Webhooks", description: "Métricas de entrega, latência P95/P99 (24h)", href: "/admin/webhooks", color: "#0ea5e9" },
    { icon: BarChart3, title: "Telemetria", description: "Queries lentas e métricas de performance", href: "/admin/telemetria", color: "#14b8a6" },
    { icon: Lock, title: "Permissões & Papéis", description: "Gerenciar roles e permissões", href: "/admin/permissions", color: "#a855f7" },
    { icon: KeyRound, title: "Chaves de API", description: "Emitir, rotacionar e revogar credenciais externas", href: "/admin/api-keys", color: "#f59e0b" },
  ];

  const searchResults = useFuseSearch(quickLinks, ['title', 'description'], searchQuery, { ...SEARCH_PRESETS.commands, limit: 20 });
  const filteredLinks = searchResults.map(r => r.item);
  const seo = useSEO();

   return (
     <PageShell title="Painel Administrativo">
       <PageWrapper pageName="Painel Administrativo">
         <SEOHead {...seo} />
         <div className="min-h-screen bg-background">
           <header className="px-4 md:px-6 py-6">
             <div className="flex items-center gap-3">
               <div className="p-2 rounded-xl bg-primary/10">
                 <Settings className="h-6 w-6 text-primary" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold">Painel Administrativo</h1>
                 <p className="text-muted-foreground">Gerenciamento centralizado da plataforma</p>
               </div>
             </div>
           </header>
 
           <main className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
             <Tabs value={activeTab} onValueChange={setActiveTab}>
            <AdminTabsList />

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Usuários", value: stats.users, color: "#6366f1", icon: Users },
                  { label: "Departamentos", value: stats.departments, color: "#10b981", icon: Building2 },
                  { label: "Recompensas", value: stats.rewards, color: "#f59e0b", icon: ShoppingBag },
                  { label: "Perguntas", value: stats.questions, color: "#ec4899", icon: HelpCircle },
                  { label: "Trilhas", value: stats.trails, color: "#8b5cf6", icon: BookOpen },
                ].map((stat, index) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                    <Card className="border-border/50"><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}><stat.icon className="w-4 h-4" style={{ color: stat.color }} /></div><div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div></div></CardContent></Card>
                  </motion.div>
                ))}
              </div>
              <Card className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div><CardTitle>Acesso Rápido</CardTitle><CardDescription>Navegue para outras áreas administrativas</CardDescription></div>
                    <div className="relative w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" /></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                      {filteredLinks.map((link, index) => (
                        <motion.div key={link.href} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: index * 0.03 }}>
                          <QuickLink {...link} />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="metrics"><AdminMetricsDashboard /></TabsContent>
            <TabsContent value="users"><UsersManager /></TabsContent>
            <TabsContent value="departments"><DepartmentsManager /></TabsContent>
            <TabsContent value="organization"><OrganizationSettings /></TabsContent>
            <TabsContent value="alerts"><AdminAlertsPanel /></TabsContent>
            <TabsContent value="pdi-alerts"><PDIAlertsPanel /></TabsContent>
            <TabsContent value="history"><AdminChangeHistory /></TabsContent>
            <TabsContent value="leagues"><LeaguesManager /></TabsContent>
            <TabsContent value="goals"><GoalsManager /></TabsContent>
            <TabsContent value="surveys"><SurveyCreator /></TabsContent>
            <TabsContent value="feedback"><FeedbackCycleManager /></TabsContent>
            <TabsContent value="announcements"><AnnouncementPublisher /></TabsContent>
            <TabsContent value="celebrations"><CelebrationManager /></TabsContent>
            <TabsContent value="mood"><MoodAnalytics /></TabsContent>
            <TabsContent value="positions"><PositionsManager /></TabsContent>
            <TabsContent value="penalties"><PenaltyRulesManager /></TabsContent>
            <TabsContent value="ninebox"><NineBoxMatrix /></TabsContent>
            <TabsContent value="pdi"><DevelopmentPlanManager /></TabsContent>
            <TabsContent value="enps"><ENPSDashboard /></TabsContent>
            <TabsContent value="ip-whitelist"><IpWhitelistManager /></TabsContent>
            <TabsContent value="rbac"><RBACDashboard /></TabsContent>
            <TabsContent value="password-reset"><PasswordResetApprovalPanel /></TabsContent>
             </Tabs>
           </main>
         </div>
       </PageWrapper>
     </PageShell>
   );
}

export default function AdminPanel() {
  return <ProtectedRoute requiredRole="admin"><AdminPanelContent /></ProtectedRoute>;
}
