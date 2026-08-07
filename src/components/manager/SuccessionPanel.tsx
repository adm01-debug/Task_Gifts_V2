import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, AlertTriangle, TrendingUp, Target, Crown, Shield, Clock, CheckCircle2, XCircle, Briefcase } from "lucide-react";
import { useCriticalPositions, useSuccessionManual, useSuccessionHealth } from "@/hooks/useSuccession";
import { CriticalPosition } from "@/services/successionService";
import { PositionsList } from "@/components/succession/PositionsList";
import { SuccessionPlanDetails } from "@/components/succession/SuccessionPlanDetails";

const getRiskColor = (risk: string) => {
  switch (risk) {
    case "critical": return "text-red-500 bg-red-500/10";
    case "at_risk": case "high": return "text-orange-500 bg-orange-500/10";
    case "medium": return "text-yellow-500 bg-yellow-500/10";
    default: return "text-green-500 bg-green-500/10";
  }
};

const getRiskIcon = (risk: string) => {
  switch (risk) {
    case "critical": return <XCircle className="h-4 w-4" />;
    case "at_risk": case "high": return <AlertTriangle className="h-4 w-4" />;
    case "medium": return <Clock className="h-4 w-4" />;
    default: return <CheckCircle2 className="h-4 w-4" />;
  }
};

const getReadinessColor = (readiness: string) => {
  switch (readiness) {
    case "ready_now": return "bg-green-500";
    case "ready_1_year": return "bg-blue-500";
    case "ready_2_years": return "bg-yellow-500";
    default: return "bg-gray-500";
  }
};

const getReadinessLabel = (readiness: string) => {
  switch (readiness) {
    case "ready_now": return "Pronto Agora";
    case "ready_1_year": return "1 Ano";
    case "ready_2_years": return "2 Anos";
    default: return "Em Desenvolvimento";
  }
};

export function SuccessionPanel() {
  const { data: criticalPositions, isLoading: loadingPositions } = useCriticalPositions();
  const { data: healthData, isLoading: loadingHealth } = useSuccessionHealth();
  const { plan, isLoading: loadingPlan, loadPlan, clear } = useSuccessionManual();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleViewPlan = async (position: CriticalPosition) => {
    await loadPlan(position.id);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => { setIsDialogOpen(false); clear(); };

  if (loadingPositions || loadingHealth) {
    return (<div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>);
  }

  const uncoveredPositions = healthData ? healthData.totalPositions - healthData.coveredPositions : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Posições Críticas", value: healthData?.criticalPositions || 0, icon: Briefcase, color: "primary" },
          { label: "Cobertas", value: healthData?.coveredPositions || 0, icon: Shield, color: "green-500" },
          { label: "Descobertas", value: uncoveredPositions, icon: AlertTriangle, color: "red-500" },
          { label: "Bench Strength", value: `${healthData?.benchStrength || 0}%`, icon: TrendingUp, color: "blue-500" },
        ].map((stat) => (
          <Card key={stat.label} className={`bg-gradient-to-br from-${stat.color}/10 to-${stat.color}/5`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${stat.color}/20`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" />Posições Críticas e Planos de Sucessão</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="critical">Críticas</TabsTrigger>
              <TabsTrigger value="uncovered">Descobertas</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <PositionsList positions={criticalPositions || []} onViewPlan={handleViewPlan} getRiskColor={getRiskColor} getRiskIcon={getRiskIcon} />
            </TabsContent>
            <TabsContent value="critical">
              <PositionsList positions={(criticalPositions || []).filter(p => p.riskLevel === "critical" || p.importance === "critical")} onViewPlan={handleViewPlan} getRiskColor={getRiskColor} getRiskIcon={getRiskIcon} />
            </TabsContent>
            <TabsContent value="uncovered">
              <PositionsList positions={(criticalPositions || []).filter(p => p.successorCount === 0)} onViewPlan={handleViewPlan} getRiskColor={getRiskColor} getRiskIcon={getRiskIcon} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" />Plano de Sucessão</DialogTitle>
          </DialogHeader>
          {loadingPlan ? (
            <div className="space-y-4 p-4"><Skeleton className="h-20 w-full" /><Skeleton className="h-40 w-full" /></div>
          ) : plan ? (
            <SuccessionPlanDetails plan={plan} getReadinessColor={getReadinessColor} getReadinessLabel={getReadinessLabel} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
