import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, LineChart, Line,
} from "recharts";
import { Trophy, Target, Calendar, Award } from "lucide-react";

interface RarityDataItem {
  name: string;
  value: number;
  color: string;
}

interface DifficultyDataItem {
  name: string;
  value: number;
  color: string;
}

interface AchievementHistoryItem {
  month: string;
  displayMonth: string;
  count: number;
}

interface QuestStatsData {
  total: number;
  completed: number;
  inProgress: number;
  totalXpFromQuests: number;
}

interface PersonalStatsChartsProps {
  rarityData: RarityDataItem[];
  difficultyData: DifficultyDataItem[];
  achievementHistory: AchievementHistoryItem[] | undefined;
  questStats: QuestStatsData | null | undefined;
}

export function PersonalStatsCharts({ rarityData, difficultyData, achievementHistory, questStats }: PersonalStatsChartsProps) {
  return (
    <>
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-purple-500" />Conquistas por Raridade</CardTitle></CardHeader>
            <CardContent>
              {rarityData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={rarityData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                        {rarityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {rarityData.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span>{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma conquista desbloqueada ainda</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-green-500" />Quests por Dificuldade</CardTitle></CardHeader>
            <CardContent>
              {difficultyData.some((d) => d.value > 0) ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyData} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={60} />
                      <ChartTooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {difficultyData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma quest completada ainda</div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="md:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-500" />Conquistas ao Longo do Tempo</CardTitle></CardHeader>
            <CardContent>
              {achievementHistory && achievementHistory.length > 0 ? (
                <ChartContainer config={{ count: { label: "Conquistas", color: "hsl(var(--primary))" } }} className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={achievementHistory}>
                      <XAxis dataKey="displayMonth" />
                      <YAxis allowDecimals={false} />
                      <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => `Mês: ${value}`} />} />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">Nenhuma conquista desbloqueada ainda</div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {questStats && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-amber-500" />Resumo de Quests</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50"><div className="text-3xl font-bold text-primary">{questStats.total}</div><div className="text-sm text-muted-foreground">Total Atribuídas</div></div>
                <div className="text-center p-4 rounded-lg bg-green-500/10"><div className="text-3xl font-bold text-green-500">{questStats.completed}</div><div className="text-sm text-muted-foreground">Completadas</div></div>
                <div className="text-center p-4 rounded-lg bg-yellow-500/10"><div className="text-3xl font-bold text-yellow-500">{questStats.inProgress}</div><div className="text-sm text-muted-foreground">Em Progresso</div></div>
                <div className="text-center p-4 rounded-lg bg-purple-500/10"><div className="text-3xl font-bold text-purple-500">{questStats.totalXpFromQuests.toLocaleString()}</div><div className="text-sm text-muted-foreground">XP de Quests</div></div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </>
  );
}
