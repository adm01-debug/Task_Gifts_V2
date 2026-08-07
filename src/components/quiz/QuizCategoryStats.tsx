import { useCategoryStats } from "@/hooks/useQuizStats";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, Target, Clock, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

const COLORS = {
  high: "hsl(var(--chart-1))",
  medium: "hsl(var(--chart-3))",
  low: "hsl(var(--chart-5))",
};

function getAccuracyColor(rate: number) {
  if (rate >= 70) return COLORS.high;
  if (rate >= 40) return COLORS.medium;
  return COLORS.low;
}

export default function QuizCategoryStats() {
  const { data: stats, isLoading } = useCategoryStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = stats && stats.some(s => s.total_answers > 0);
  const totalAnswers = stats?.reduce((sum, s) => sum + s.total_answers, 0) || 0;
  const totalCorrect = stats?.reduce((sum, s) => sum + s.correct_answers, 0) || 0;
  const overallRate = totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0;

  const chartData = stats
    ?.filter(s => s.total_answers > 0)
    .map(s => ({
      name: s.category,
      taxa: s.accuracy_rate,
      respostas: s.total_answers,
      tempo: Math.round(s.avg_time_ms / 1000),
    })) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Estatísticas por Categoria
        </CardTitle>
        <CardDescription>
          Desempenho dos colaboradores por categoria de pergunta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-muted/50"
          >
            <p className="text-sm text-muted-foreground">Total de Respostas</p>
            <p className="text-2xl font-bold">{totalAnswers.toLocaleString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-lg bg-muted/50"
          >
            <p className="text-sm text-muted-foreground">Respostas Corretas</p>
            <p className="text-2xl font-bold text-green-500">{totalCorrect.toLocaleString()}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-lg bg-muted/50"
          >
            <p className="text-sm text-muted-foreground">Taxa de Acerto Geral</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{overallRate}%</p>
              {overallRate >= 70 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-4 rounded-lg bg-muted/50"
          >
            <p className="text-sm text-muted-foreground">Categorias Ativas</p>
            <p className="text-2xl font-bold">{stats?.length || 0}</p>
          </motion.div>
        </div>

        {/* Chart */}
        {hasData ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="h-64"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={120} 
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border rounded-lg p-3 shadow-lg">
                          <p className="font-medium">{data.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Taxa de Acerto: <span className="font-medium">{data.taxa}%</span>
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Respostas: <span className="font-medium">{data.respostas}</span>
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Tempo médio: <span className="font-medium">{data.tempo}s</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="taxa" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={index} fill={getAccuracyColor(entry.taxa)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <HelpCircle className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhuma resposta registrada ainda</p>
            <p className="text-sm">As estatísticas aparecerão conforme os quizzes forem jogados</p>
          </div>
        )}

        {/* Category Details */}
        {hasData && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Detalhes por Categoria</h4>
            <div className="grid gap-2">
              {stats?.filter(s => s.total_answers > 0).map((stat, idx) => (
                <motion.div
                  key={stat.category}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3">
                    <span 
                      className="w-2 h-8 rounded-full"
                      style={{ backgroundColor: getAccuracyColor(stat.accuracy_rate) }}
                    />
                    <div>
                      <p className="font-medium">{stat.category}</p>
                      <p className="text-xs text-muted-foreground">
                        {stat.question_count} pergunta{stat.question_count !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="font-medium">{stat.total_answers}</p>
                      <p className="text-xs text-muted-foreground">respostas</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{stat.correct_answers}</p>
                      <p className="text-xs text-muted-foreground">corretas</p>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <p 
                        className="text-lg font-bold"
                        style={{ color: getAccuracyColor(stat.accuracy_rate) }}
                      >
                        {stat.accuracy_rate}%
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
