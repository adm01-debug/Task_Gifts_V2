import {
  TrendingUp,
  Activity,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import { CustomTooltip, CHART_COLORS } from "./BIChartComponents";

interface BIOverviewTabProps {
  trendsData: Array<Record<string, unknown>>;
  engagementData: Array<Record<string, unknown>>;
  deptData: Array<Record<string, unknown>>;
}

export function BIOverviewTab({ trendsData, engagementData, deptData }: BIOverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <SectionErrorBoundary sectionName="Gráfico Evolução">
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Evolução Mensal
              </CardTitle>
              <CardDescription>Tendência dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={trendsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" />
                  <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="usuarios" name="Usuários" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="pontualidade" name="Pontualidade %" stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ fill: CHART_COLORS[1] }} />
                  <Line yAxisId="right" type="monotone" dataKey="adocao" name="Adoção %" stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ fill: CHART_COLORS[2] }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Engajamento Semanal">
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-chart-2" />
                Engajamento por Dia
              </CardTitle>
              <CardDescription>Atividade ao longo da semana</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={engagementData}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS[0]} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={CHART_COLORS[0]} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="atividade" name="Atividades" stroke={CHART_COLORS[0]} fillOpacity={1} fill="url(#colorActivity)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>

      <SectionErrorBoundary sectionName="Distribuição XP">
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              XP por Departamento
            </CardTitle>
            <CardDescription>Distribuição de pontos de experiência</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={deptData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" width={100} stroke="hsl(var(--muted-foreground))" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="xpTotal" name="XP (milhares)" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]}>
                  {deptData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </SectionErrorBoundary>
    </div>
  );
}
