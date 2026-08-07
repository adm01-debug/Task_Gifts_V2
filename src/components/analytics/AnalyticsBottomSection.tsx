import { motion } from "framer-motion";
import { Activity, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ActivityItem {
  category: string;
  label: string;
  count: number;
  color: string;
}

interface ActiveUser {
  userId: string;
  count: number;
  profile?: { display_name: string | null; email: string | null } | undefined;
}

interface AnalyticsBottomSectionProps {
  activityByType: ActivityItem[];
  mostActiveUsers: ActiveUser[];
}

export function AnalyticsBottomSection({ activityByType, mostActiveUsers }: AnalyticsBottomSectionProps) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Atividade por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activityByType.map((item, index) => (
              <motion.div key={item.category} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.05 }} className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: item.color }} initial={{ width: 0 }} animate={{ width: `${(item.count / Math.max(...activityByType.map((a) => a.count))) * 100}%` }} transition={{ delay: 0.5 + index * 0.05, duration: 0.5 }} />
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" />Usuários Mais Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mostActiveUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada</p>
            ) : (
              mostActiveUsers.map((user, index) => (
                <motion.div key={user.userId} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + index * 0.05 }} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
                    index === 0 ? "bg-gradient-to-br from-warning to-warning/70" :
                    index === 1 ? "bg-gradient-to-br from-muted-foreground to-muted-foreground/70" :
                    index === 2 ? "bg-gradient-to-br from-amber-700 to-amber-700/70" :
                    "bg-gradient-to-br from-primary to-primary/70"
                  )}>{index + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.profile?.display_name || "Usuário"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.profile?.email || user.userId.slice(0, 8)}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{user.count} ações</Badge>
                </motion.div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
