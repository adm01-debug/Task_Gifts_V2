import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, TrendingUp, TrendingDown, Users, Calendar, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMoodTracker } from "@/hooks/useMoodTracker";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingStateCard } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

const moodEmojis = ["😢", "😕", "😐", "🙂", "😄"];
const moodLabels = ["Muito mal", "Mal", "Neutro", "Bem", "Muito bem"];
const moodColors = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

export function MoodAnalytics() {
  const { todayMood, moodHistory: weeklyMoods, isLoading } = useMoodTracker();
  const [period, setPeriod] = useState("week");

  // Calculate average mood
  const avgMood = weeklyMoods.length > 0
    ? weeklyMoods.reduce((sum, m) => sum + m.mood_score, 0) / weeklyMoods.length
    : 0;

  // Calculate mood distribution
  const moodDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: weeklyMoods.filter((m) => m.mood_score === score).length,
    percentage: weeklyMoods.length > 0
      ? (weeklyMoods.filter((m) => m.mood_score === score).length / weeklyMoods.length) * 100
      : 0,
  }));

  // Calculate trend
  const recentMoods = weeklyMoods.slice(0, 3);
  const olderMoods = weeklyMoods.slice(3, 6);
  const recentAvg = recentMoods.length > 0
    ? recentMoods.reduce((sum, m) => sum + m.mood_score, 0) / recentMoods.length
    : 0;
  const olderAvg = olderMoods.length > 0
    ? olderMoods.reduce((sum, m) => sum + m.mood_score, 0) / olderMoods.length
    : 0;
  const trend = recentAvg - olderAvg;

  // Mock team data for demonstration
  const teamMoodData = {
    engineering: { avg: 3.8, participants: 12, total: 15 },
    sales: { avg: 4.2, participants: 8, total: 10 },
    marketing: { avg: 3.5, participants: 5, total: 6 },
    hr: { avg: 4.0, participants: 3, total: 4 },
  };

  if (isLoading) {
    return <LoadingStateCard message="Carregando análise de humor..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics de Humor</h2>
          <p className="text-muted-foreground">Acompanhe o bem-estar da equipe</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Humor Médio</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{moodEmojis[Math.round(avgMood) - 1] || "😐"}</span>
                    <span className="text-2xl font-bold">{avgMood.toFixed(1)}</span>
                  </div>
                </div>
                <Heart className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                  <div className="flex items-center gap-2">
                    {trend > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : trend < 0 ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                    <span className={`text-xl font-bold ${trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : ""}`}>
                      {trend > 0 ? "+" : ""}{trend.toFixed(1)}
                    </span>
                  </div>
                </div>
                <BarChart3 className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Registros</p>
                  <p className="text-2xl font-bold">{weeklyMoods.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Participação</p>
                  <p className="text-2xl font-bold">78%</p>
                </div>
                <Users className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Mood Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribuição de Humor</CardTitle>
          <CardDescription>Como a equipe está se sentindo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {moodDistribution.reverse().map((mood, index) => (
              <div key={mood.score} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24">
                  <span className="text-xl">{moodEmojis[mood.score - 1]}</span>
                  <span className="text-sm text-muted-foreground">{moodLabels[mood.score - 1]}</span>
                </div>
                <div className="flex-1">
                  <div className="h-6 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mood.percentage}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: moodColors[mood.score - 1] }}
                    />
                  </div>
                </div>
                <div className="w-16 text-right">
                  <span className="font-semibold">{mood.count}</span>
                  <span className="text-muted-foreground text-sm ml-1">({mood.percentage.toFixed(0)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Team Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Por Departamento</CardTitle>
          <CardDescription>Comparação entre equipes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(teamMoodData).map(([dept, data], index) => (
              <motion.div
                key={dept}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-medium capitalize">{dept}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.participants}/{data.total} participantes
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{moodEmojis[Math.round(data.avg) - 1]}</span>
                  <span className="text-lg font-bold">{data.avg.toFixed(1)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros Recentes</CardTitle>
          <CardDescription>Últimos registros de humor da equipe</CardDescription>
        </CardHeader>
        <CardContent>
          {weeklyMoods.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nenhum registro de humor ainda"
              compact
            />
          ) : (
            <div className="space-y-3">
              {weeklyMoods.slice(0, 10).map((mood, index) => (
                <motion.div
                  key={mood.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{moodEmojis[mood.mood_score - 1]}</span>
                    <div>
                      <p className="font-medium">{moodLabels[mood.mood_score - 1]}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(mood.entry_date), "dd/MM/yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  {mood.is_anonymous && (
                    <Badge variant="outline" className="text-xs">Anônimo</Badge>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
