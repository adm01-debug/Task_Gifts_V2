import { motion } from "framer-motion";
import { Activity, Users, Zap, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AnalyticsStats {
  totalLogs: number;
  logsLastHour: number;
  logsToday: number;
  uniqueUsersToday: number;
  questsCompletedToday: number;
}

interface AnalyticsStatsCardsProps {
  stats: AnalyticsStats;
}

export function AnalyticsStatsCards({ stats }: AnalyticsStatsCardsProps) {
  const items = [
    { icon: Activity, value: stats.totalLogs, label: "Total de Ações", colorClass: "bg-primary/10 text-primary" },
    { icon: Clock, value: stats.logsLastHour, label: "Última Hora", colorClass: "bg-success/10 text-success" },
    { icon: TrendingUp, value: stats.logsToday, label: "Hoje", colorClass: "bg-warning/10 text-warning" },
    { icon: Users, value: stats.uniqueUsersToday, label: "Usuários Ativos", colorClass: "bg-info/10 text-info" },
    { icon: Zap, value: stats.questsCompletedToday, label: "Quests Completas", colorClass: "bg-accent/10 text-accent-foreground" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="grid grid-cols-2 md:grid-cols-5 gap-4"
    >
      {items.map((item) => (
        <Card key={item.label} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.colorClass.split(" ")[0]}`}>
                <item.icon className={`w-5 h-5 ${item.colorClass.split(" ")[1]}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{item.value}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </motion.div>
  );
}
