import { useState, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Brain, AlertTriangle, TrendingDown, Calendar, Target,
  Lightbulb, Clock, CheckCircle2, Meh, Sparkles, FileText, Award, Zap,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useProfiles } from "@/hooks/useProfiles";
import { useChurnPrediction } from "@/hooks/useChurnPrediction";
import { useDevelopmentPlans } from "@/hooks/useDevelopmentPlans";
import { useNineBoxEvaluations } from "@/hooks/useNineBox";
import { useGoals } from "@/hooks/useGoals";
import { BOX_LABELS } from "@/services/nineBoxService";
import { differenceInDays } from "date-fns";
import {
  UrgentAlertCard, CompactAlertCard,
  type CopilotAlert,
} from "@/components/copilot/CopilotAlertSection";
import { CopilotSuggestions } from "@/components/copilot/CopilotSuggestions";

interface CopilotSuggestion {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export function AICopilotDashboard() {
  const navigate = useNavigate();
  const { data: profiles } = useProfiles();
  const { predictions } = useChurnPrediction();
  const { data: plans } = useDevelopmentPlans();
  const { data: evaluations } = useNineBoxEvaluations();
  const { goals } = useGoals();
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  const alerts = useMemo<CopilotAlert[]>(() => {
    const generatedAlerts: CopilotAlert[] = [];

    predictions?.filter((p) => p.riskLevel === "high").forEach((prediction) => {
      const profile = profiles?.find((p) => p.id === prediction.userId);
      if (profile) {
        generatedAlerts.push({
          id: `churn-${prediction.userId}`, type: "urgent", icon: AlertTriangle,
          title: `${profile.display_name} com alto risco de saída`,
          description: `Risco de ${Math.round(prediction.riskScore * 100)}% baseado em engajamento e atividades recentes.`,
          userId: profile.id, userName: profile.display_name || "Colaborador",
          userAvatar: profile.avatar_url || undefined,
          actions: [{ label: "Agendar 1-on-1", onClick: () => navigate("/checkins"), variant: "default" }],
        });
      }
    });

    plans?.filter((p) => p.status === "active" && p.target_date && new Date(p.target_date) < new Date())
      .slice(0, 3).forEach((plan) => {
        const profile = profiles?.find((p) => p.id === plan.user_id);
        const daysOverdue = differenceInDays(new Date(), new Date(plan.target_date!));
        generatedAlerts.push({
          id: `pdi-overdue-${plan.id}`, type: "warning", icon: FileText,
          title: `PDI de ${profile?.display_name || "colaborador"} atrasado`,
          description: `"${plan.title}" está ${daysOverdue} dias atrasado.`,
          userId: profile?.id, userName: profile?.display_name || "Colaborador",
          userAvatar: profile?.avatar_url || undefined,
          actions: [{ label: "Ver PDI", onClick: () => navigate("/admin?tab=development"), variant: "outline" }],
        });
      });

    evaluations?.filter((e) => e.box_position <= 2).forEach((evaluation) => {
      const hasPDI = plans?.some((p) => p.user_id === evaluation.user_id && p.status === "active");
      if (!hasPDI) {
        const profile = profiles?.find((p) => p.id === evaluation.user_id);
        generatedAlerts.push({
          id: `lowperf-no-pdi-${evaluation.id}`, type: "warning", icon: Target,
          title: `${profile?.display_name || "Colaborador"} precisa de PDI`,
          description: `Avaliado como "${BOX_LABELS[evaluation.box_position]?.name}" sem plano ativo.`,
          userId: profile?.id, userName: profile?.display_name || "Colaborador",
          userAvatar: profile?.avatar_url || undefined,
          actions: [{ label: "Criar PDI", onClick: () => navigate("/admin?tab=development"), variant: "default" }],
        });
      }
    });

    goals?.filter((g) => {
      if (!g.due_date) return false;
      const daysUntilDue = differenceInDays(new Date(g.due_date), new Date());
      return daysUntilDue < 30 && daysUntilDue > 0 && (g.progress_percent || 0) < 50;
    }).slice(0, 2).forEach((goal) => {
      generatedAlerts.push({
        id: `okr-risk-${goal.id}`, type: "warning", icon: TrendingDown,
        title: `OKR "${goal.title}" em risco`,
        description: `Apenas ${goal.progress_percent || 0}% concluído com menos de 30 dias para o prazo.`,
        actions: [{ label: "Ver OKR", onClick: () => navigate("/goals"), variant: "outline" }],
      });
    });

    evaluations?.filter((e) => e.box_position >= 8).slice(0, 2).forEach((evaluation) => {
      const profile = profiles?.find((p) => p.id === evaluation.user_id);
      generatedAlerts.push({
        id: `hipo-${evaluation.id}`, type: "positive", icon: Award,
        title: `${profile?.display_name || "Colaborador"} é um Top Talent!`,
        description: `Avaliado como "${BOX_LABELS[evaluation.box_position]?.name}".`,
        userId: profile?.id, userName: profile?.display_name || "Colaborador",
        userAvatar: profile?.avatar_url || undefined,
        actions: [{ label: "Plano de Retenção", onClick: () => navigate("/admin?tab=development"), variant: "outline" }],
      });
    });

    return generatedAlerts.filter((a) => !dismissedAlerts.includes(a.id));
  }, [profiles, predictions, plans, evaluations, goals, dismissedAlerts, navigate]);

  const suggestions = useMemo<CopilotSuggestion[]>(() => {
    const s: CopilotSuggestion[] = [];
    const inactiveMembers = profiles?.filter((p) => differenceInDays(new Date(), new Date(p.updated_at)) > 14).length || 0;
    if (inactiveMembers > 0) {
      s.push({ id: "inactive-members", icon: Calendar, title: "Agende 1-on-1 com membros inativos", description: `${inactiveMembers} membro(s) sem interação há mais de 14 dias.`, priority: "high" });
    }
    const activePlans = plans?.filter((p) => p.status === "active").length || 0;
    const completedPlans = plans?.filter((p) => p.status === "completed").length || 0;
    const completionRate = activePlans + completedPlans > 0 ? Math.round((completedPlans / (activePlans + completedPlans)) * 100) : 0;
    if (completionRate < 50) {
      s.push({ id: "pdi-completion", icon: Target, title: "Melhore a taxa de conclusão de PDIs", description: `Taxa atual: ${completionRate}%.`, priority: "medium" });
    }
    const totalProfiles = profiles?.length || 0;
    const evaluatedCount = new Set(evaluations?.map((e) => e.user_id)).size;
    const coveragePercent = totalProfiles > 0 ? Math.round((evaluatedCount / totalProfiles) * 100) : 0;
    if (coveragePercent < 80) {
      s.push({ id: "ninebox-coverage", icon: Brain, title: "Complete as avaliações 9-Box", description: `Apenas ${coveragePercent}% da equipe foi avaliada.`, priority: "medium" });
    }
    const highPerformers = evaluations?.filter((e) => e.box_position >= 7).length || 0;
    if (highPerformers > 0) {
      s.push({ id: "develop-hipos", icon: Sparkles, title: "Desenvolva seus High Potentials", description: `${highPerformers} colaborador(es) de alto potencial.`, priority: "low" });
    }
    return s;
  }, [profiles, plans, evaluations]);

  const dismissAlert = (alertId: string) => setDismissedAlerts((prev) => [...prev, alertId]);

  const urgentAlerts = alerts.filter((a) => a.type === "urgent");
  const warningAlerts = alerts.filter((a) => a.type === "warning");
  const positiveAlerts = alerts.filter((a) => a.type === "positive");

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
          <Brain className="w-8 h-8 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            IA Copilot
          </h2>
          <p className="text-muted-foreground">Alertas inteligentes e sugestões personalizadas</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Zap className="w-3 h-3" />
          {alerts.length} alertas ativos
        </Badge>
      </div>

      {urgentAlerts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-red-500 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            URGENTE - Ação Imediata Necessária
          </h3>
          <div className="space-y-2">
            <AnimatePresence>
              {urgentAlerts.map((alert) => (
                <UrgentAlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-500">
              <Clock className="w-5 h-5" />
              Atenção Necessária
            </CardTitle>
            <CardDescription>Itens que requerem acompanhamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {warningAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-green-500" />
                      <p>Tudo em ordem!</p>
                    </div>
                  ) : (
                    warningAlerts.map((alert) => (
                      <CompactAlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-green-500">
              <Award className="w-5 h-5" />
              Boas Notícias
            </CardTitle>
            <CardDescription>Destaques positivos da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-3">
                <AnimatePresence>
                  {positiveAlerts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Meh className="w-10 h-10 mx-auto mb-2" />
                      <p>Aguardando destaques...</p>
                    </div>
                  ) : (
                    positiveAlerts.map((alert) => (
                      <CompactAlertCard key={alert.id} alert={alert} onDismiss={dismissAlert} />
                    ))
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <CopilotSuggestions suggestions={suggestions} />
    </div>
  );
}
