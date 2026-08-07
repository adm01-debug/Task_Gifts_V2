import { useState } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  RefreshCw,
  Download,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useEngagementSnapshots, useGenerateSnapshot } from "@/hooks/useENPS";
import { useDepartments } from "@/hooks/useDepartments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ENPSTrendChart() {
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [dataPoints, setDataPoints] = useState<string>("12");
  
  const { data: snapshots, isLoading } = useEngagementSnapshots(
    selectedDepartment || undefined,
    parseInt(dataPoints)
  );
  const { data: departments } = useDepartments();
  const generateSnapshot = useGenerateSnapshot();

  // Prepare chart data
  const chartData = snapshots
    ?.map((s) => ({
      date: format(new Date(s.snapshot_date), "dd/MM", { locale: ptBR }),
      fullDate: format(new Date(s.snapshot_date), "dd/MM/yyyy", { locale: ptBR }),
      enps: s.enps_score || 0,
      mood: s.mood_avg ? Math.round(s.mood_avg * 20) : 0, // Scale 1-5 to 0-100
      participation: s.participation_rate || 0,
      punctuality: s.punctuality_rate || 0,
      training: s.training_completion_rate || 0,
    }))
    .reverse() || [];

  // Calculate trend
  const calculateTrend = () => {
    if (chartData.length < 2) return { trend: "same", value: 0 };
    const latest = chartData[chartData.length - 1]?.enps || 0;
    const previous = chartData[chartData.length - 2]?.enps || 0;
    const diff = latest - previous;
    return {
      trend: diff > 0 ? "up" : diff < 0 ? "down" : "same",
      value: Math.abs(diff),
    };
  };

  const trendInfo = calculateTrend();
  const latestScore = chartData[chartData.length - 1]?.enps || 0;
  const avgScore =
    chartData.length > 0
      ? Math.round(chartData.reduce((sum, d) => sum + d.enps, 0) / chartData.length)
      : 0;

  // Get score classification
  const getScoreClass = (score: number) => {
    if (score >= 50) return { label: "Excelente", color: "text-green-500", bg: "bg-green-500/20" };
    if (score >= 0) return { label: "Bom", color: "text-yellow-500", bg: "bg-yellow-500/20" };
    return { label: "Crítico", color: "text-red-500", bg: "bg-red-500/20" };
  };

  const scoreClass = getScoreClass(latestScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Tendências eNPS
          </h3>
          <p className="text-muted-foreground text-sm">
            Evolução histórica do engajamento
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Todos departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {departments?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dataPoints} onValueChange={setDataPoints}>
            <SelectTrigger className="w-[130px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 períodos</SelectItem>
              <SelectItem value="12">12 períodos</SelectItem>
              <SelectItem value="24">24 períodos</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => generateSnapshot.mutate({ departmentId: selectedDepartment || undefined })}
            disabled={generateSnapshot.isPending}
          >
            <RefreshCw className={`w-4 h-4 ${generateSnapshot.isPending ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Score Atual</p>
                  <p className="text-3xl font-bold">{latestScore}</p>
                </div>
                <div className={`p-3 rounded-xl ${scoreClass.bg}`}>
                  {trendInfo.trend === "up" ? (
                    <TrendingUp className={`w-6 h-6 ${scoreClass.color}`} />
                  ) : trendInfo.trend === "down" ? (
                    <TrendingDown className={`w-6 h-6 ${scoreClass.color}`} />
                  ) : (
                    <Minus className={`w-6 h-6 ${scoreClass.color}`} />
                  )}
                </div>
              </div>
              <Badge className={`mt-2 ${scoreClass.bg} ${scoreClass.color} border-0`}>
                {scoreClass.label}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Média do Período</p>
                  <p className="text-3xl font-bold">{avgScore}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {chartData.length} snapshots
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Variação</p>
                  <p className={`text-3xl font-bold ${
                    trendInfo.trend === "up" ? "text-green-500" : 
                    trendInfo.trend === "down" ? "text-red-500" : ""
                  }`}>
                    {trendInfo.trend === "up" ? "+" : trendInfo.trend === "down" ? "-" : ""}
                    {trendInfo.value}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${
                  trendInfo.trend === "up" ? "bg-green-500/20" : 
                  trendInfo.trend === "down" ? "bg-red-500/20" : "bg-muted"
                }`}>
                  {trendInfo.trend === "up" ? (
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  ) : trendInfo.trend === "down" ? (
                    <TrendingDown className="w-6 h-6 text-red-500" />
                  ) : (
                    <Minus className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                vs período anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Participação Média</p>
                  <p className="text-3xl font-bold">
                    {chartData.length > 0
                      ? Math.round(chartData.reduce((sum, d) => sum + d.participation, 0) / chartData.length)
                      : 0}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Taxa de resposta
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Evolução do eNPS</CardTitle>
          <CardDescription>Score ao longo do tempo com zonas de referência</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Carregando dados...
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-[350px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEnps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis domain={[-100, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(label) => `Data: ${label}`}
                  />
                  {/* Reference lines for zones */}
                  <ReferenceLine y={50} stroke="#10b981" strokeDasharray="5 5" label={{ value: "Excelente (50+)", fill: "#10b981", fontSize: 10 }} />
                  <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: "Neutro (0)", fill: "#f59e0b", fontSize: 10 }} />
                  <ReferenceLine y={-50} stroke="#ef4444" strokeDasharray="5 5" />
                  <Area
                    type="monotone"
                    dataKey="enps"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorEnps)"
                    name="eNPS Score"
                    dot={{ fill: "#6366f1", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#6366f1" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Multi-metric Chart */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Comparativo de Métricas</CardTitle>
          <CardDescription>eNPS, Mood, Participação e outros indicadores</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nenhum dado disponível
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="enps" name="eNPS" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="mood" name="Humor (%)" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="participation" name="Participação (%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="punctuality" name="Pontualidade (%)" stroke="#ec4899" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="training" name="Treinamentos (%)" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}