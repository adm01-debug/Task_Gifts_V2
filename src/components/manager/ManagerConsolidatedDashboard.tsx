import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  FileText,
  Grid3X3,
  Brain,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfiles } from "@/hooks/useProfiles";
import { useNineBoxEvaluations } from "@/hooks/useNineBox";
import { useDevelopmentPlans } from "@/hooks/useDevelopmentPlans";
import { useChurnPrediction } from "@/hooks/useChurnPrediction";
import { BOX_LABELS } from "@/services/nineBoxService";

export function ManagerConsolidatedDashboard() {
  const { data: profiles } = useProfiles();
  const { data: evaluations } = useNineBoxEvaluations();
  const { data: plans } = useDevelopmentPlans();
  const { predictions } = useChurnPrediction();

  // Calculate stats
  const totalTeam = profiles?.length || 0;
  const activePlans = plans?.filter((p) => p.status === "active").length || 0;
  const evaluatedUsers = new Set(evaluations?.map((e) => e.user_id)).size;
  const highRiskUsers = predictions?.filter((p) => p.riskLevel === "high").length || 0;

  // Get recent evaluations
  const recentEvaluations = evaluations?.slice(0, 5) || [];

  // Get overdue PDIs
  const overduePlans = plans?.filter((p) => {
    if (p.status !== "active" || !p.target_date) return false;
    return new Date(p.target_date) < new Date();
  }) || [];

  // Get 9-Box distribution
  const boxDistribution: Record<number, number> = {};
  evaluations?.forEach((e) => {
    boxDistribution[e.box_position] = (boxDistribution[e.box_position] || 0) + 1;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          Painel Consolidado de Gestão
        </h2>
        <p className="text-muted-foreground">
          Visão 360° da sua equipe: 9-Box, PDI e Predição de Churn
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total da Equipe</p>
                  <p className="text-3xl font-bold">{totalTeam}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/20">
                  <Users className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avaliados 9-Box</p>
                  <p className="text-3xl font-bold">{evaluatedUsers}</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Grid3X3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalTeam > 0 ? Math.round((evaluatedUsers / totalTeam) * 100) : 0}% da equipe
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">PDIs Ativos</p>
                  <p className="text-3xl font-bold">{activePlans}</p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20">
                  <FileText className="w-6 h-6 text-green-500" />
                </div>
              </div>
              {overduePlans.length > 0 && (
                <p className="text-xs text-amber-500 mt-2">
                  {overduePlans.length} atrasado(s)
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Alto Risco</p>
                  <p className="text-3xl font-bold">{highRiskUsers}</p>
                </div>
                <div className="p-3 rounded-xl bg-red-500/20">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Risco de desligamento
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 9-Box Overview */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3X3 className="w-5 h-5 text-purple-500" />
              Distribuição 9-Box
            </CardTitle>
            <CardDescription>Visão geral da matriz de talentos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((box) => {
                const count = boxDistribution[box] || 0;
                const label = BOX_LABELS[box];
                return (
                  <div
                    key={box}
                    className={`p-2 rounded-lg text-center ${label.color} bg-opacity-20`}
                  >
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{label.name}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* High Risk Users */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="w-5 h-5 text-red-500" />
              Predição de Churn
            </CardTitle>
            <CardDescription>Colaboradores com risco de desligamento</CardDescription>
          </CardHeader>
          <CardContent>
            {predictions?.filter((p) => p.riskLevel === "high").length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>Nenhum colaborador em risco alto</p>
              </div>
            ) : (
              <div className="space-y-3">
                {predictions
                  ?.filter((p) => p.riskLevel === "high")
                  .slice(0, 4)
                  .map((prediction, index) => {
                    const profile = profiles?.find((p) => p.id === prediction.userId);
                    return (
                      <div
                        key={prediction.userId || index}
                        className="flex items-center gap-3 p-2 rounded-lg bg-red-500/10 border border-red-500/20"
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={profile?.avatar_url || ""} />
                          <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{profile?.display_name}</p>
                          <p className="text-xs text-muted-foreground">
                            Risco: {Math.round(prediction.riskScore * 100)}%
                          </p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Alto
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Evaluations */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Avaliações Recentes
            </CardTitle>
            <CardDescription>Últimas avaliações 9-Box realizadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvaluations.map((evaluation) => {
                const profile = profiles?.find((p) => p.id === evaluation.user_id);
                const label = BOX_LABELS[evaluation.box_position];
                return (
                  <div
                    key={evaluation.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{profile?.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {evaluation.evaluation_period}
                      </p>
                    </div>
                    <Badge className={`text-xs ${label.color}`}>{label.name}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Overdue PDIs */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              PDIs que Precisam de Atenção
            </CardTitle>
            <CardDescription>Planos atrasados ou próximos do vencimento</CardDescription>
          </CardHeader>
          <CardContent>
            {overduePlans.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>Todos os PDIs estão em dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {overduePlans.slice(0, 4).map((plan) => {
                  const profile = profiles?.find((p) => p.id === plan.user_id);
                  return (
                    <div
                      key={plan.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={profile?.avatar_url || ""} />
                        <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{plan.title}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {profile?.display_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-500">
                        Atrasado
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}