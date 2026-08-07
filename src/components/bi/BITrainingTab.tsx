import { BookOpen, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CustomTooltip, CHART_COLORS } from "./BIChartComponents";

interface BITrainingTabProps {
  completionTrend: Array<{ month: string; completed: number; started: number; abandoned: number }> | undefined;
  metrics: {
    completedTrails?: number;
    trainingCompletionRate?: number;
    totalEnrollments?: number;
    totalUsers?: number;
    avgTrainingHours?: number;
    totalQuestsCompleted?: number;
  } | undefined;
}

export function BITrainingTab({ completionTrend, metrics }: BITrainingTabProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <SectionErrorBoundary sectionName="Tendência Conclusão">
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Taxa de Conclusão
            </CardTitle>
            <CardDescription>Evolução mensal de treinamentos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={completionTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="completed" name="Concluídas" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ fill: CHART_COLORS[0] }} />
                <Line type="monotone" dataKey="started" name="Iniciadas" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ fill: CHART_COLORS[1] }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      <SectionErrorBoundary sectionName="Stats Treinamento">
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-chart-2" />
              Métricas de Treinamento
            </CardTitle>
            <CardDescription>Indicadores de aprendizagem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Trilhas Concluídas</span>
                <span className="font-bold">{metrics?.completedTrails || 0}</span>
              </div>
              <Progress value={(metrics?.trainingCompletionRate || 0)} className="h-2" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Matrículas Totais</span>
                <span className="font-bold">{metrics?.totalEnrollments || 0}</span>
              </div>
              <Progress value={Math.min(100, ((metrics?.totalEnrollments || 0) / (metrics?.totalUsers || 1)) * 100)} className="h-2" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Horas Médias de Treino</span>
                <span className="font-bold">{(metrics?.avgTrainingHours || 0).toFixed(1)}h</span>
              </div>
              <Progress value={Math.min(100, ((metrics?.avgTrainingHours || 0) / 20) * 100)} className="h-2" />
            </div>
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-primary">{metrics?.totalQuestsCompleted || 0}</p>
                  <p className="text-xs text-muted-foreground">Quests Feitas</p>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <p className="text-2xl font-bold text-chart-2">
                    {metrics?.totalUsers ? ((metrics?.totalQuestsCompleted || 0) / metrics.totalUsers).toFixed(1) : 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Média/Usuário</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </SectionErrorBoundary>
    </div>
  );
}
