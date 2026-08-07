import { motion } from "framer-motion";
import { Building2, Target } from "lucide-react";
import { PieChart as PieChartIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart as RechartsPieChart,
  Pie,
} from "recharts";
import { CustomTooltip, CHART_COLORS } from "./BIChartComponents";

interface BIDepartmentsTabProps {
  deptData: Array<{
    name: string;
    funcionarios: number;
    xpTotal: number;
    nivelMedio: number;
    pontualidade: number;
    quests: number;
    score: number;
  }>;
  radarData: Array<Record<string, unknown>>;
}

export function BIDepartmentsTab({ deptData, radarData }: BIDepartmentsTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <SectionErrorBoundary sectionName="Comparativo Departamentos">
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Comparativo de Departamentos
              </CardTitle>
              <CardDescription>Métricas por área</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="funcionarios" name="Funcionários" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quests" name="Quests" fill={CHART_COLORS[1]} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nivelMedio" name="Nível Médio" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>

        <SectionErrorBoundary sectionName="Score Departamentos">
          <Card className="card-base">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-chart-2" />
                Score por Departamento
              </CardTitle>
              <CardDescription>Pontuação geral por área</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RechartsPieChart>
                  <Pie
                    data={deptData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="score"
                  >
                    {deptData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </SectionErrorBoundary>
      </div>

      <SectionErrorBoundary sectionName="Radar Competências">
        <Card className="card-base">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-chart-3" />
              Radar de Competências
            </CardTitle>
            <CardDescription>Análise multidimensional por departamento</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="departamento" stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
                <Radar name="Produtividade" dataKey="produtividade" stroke={CHART_COLORS[0]} fill={CHART_COLORS[0]} fillOpacity={0.3} />
                <Radar name="Engajamento" dataKey="engajamento" stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} fillOpacity={0.3} />
                <Radar name="Treinamento" dataKey="treinamento" stroke={CHART_COLORS[2]} fill={CHART_COLORS[2]} fillOpacity={0.3} />
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </SectionErrorBoundary>

      {/* Department Table */}
      <SectionErrorBoundary sectionName="Tabela Departamentos">
        <Card className="card-base">
          <CardHeader>
            <CardTitle>Ranking de Departamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">Posição</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Departamento</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Funcionários</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">XP Total</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Nível Médio</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Pontualidade</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {[...deptData].sort((a, b) => b.score - a.score).map((dept, index) => (
                    <motion.tr 
                      key={dept.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="p-3"><Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge></td>
                      <td className="p-3 font-medium">{dept.name}</td>
                      <td className="p-3 text-right">{dept.funcionarios}</td>
                      <td className="p-3 text-right">{(dept.xpTotal * 1000).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-right">{dept.nivelMedio.toFixed(1)}</td>
                      <td className="p-3 text-right">
                        <span className={dept.pontualidade >= 90 ? 'text-green-500' : dept.pontualidade >= 70 ? 'text-yellow-500' : 'text-red-500'}>
                          {dept.pontualidade}%
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold">{dept.score}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </SectionErrorBoundary>
    </div>
  );
}
