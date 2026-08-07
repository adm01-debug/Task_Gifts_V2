import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Target } from "lucide-react";

// StatCard component
export const StatCard = ({
  icon: Icon, label, value, subValue, change, changeType, color, delay, loading = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subValue?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  color: string;
  delay: number;
  loading?: boolean;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Card className="relative overflow-hidden p-5 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${color}10 0%, transparent 50%)` }} />
      <div className="relative">
        {loading ? (
          <div className="space-y-3"><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="h-8 w-20" /><Skeleton className="h-4 w-24" /></div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}20` }}><Icon className="w-5 h-5" style={{ color }} /></div>
              {change && (
                <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${changeType === "positive" ? "bg-green-500/10 text-green-400" : changeType === "negative" ? "bg-red-500/10 text-red-400" : "bg-muted text-muted-foreground"}`}>
                  {change}
                </div>
              )}
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-foreground">{value}</p>
              {subValue && <p className="text-sm text-muted-foreground mt-0.5">{subValue}</p>}
              <p className="text-sm text-muted-foreground mt-1">{label}</p>
            </div>
          </>
        )}
      </div>
    </Card>
  </motion.div>
);

// ChartCard wrapper
export const ChartCard = ({
  title, subtitle, children, action, delay = 0, loading = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  delay?: number;
  loading?: boolean;
}) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4 }}>
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {loading ? (
        <div className="h-72 space-y-4 p-4">
          <div className="flex items-end justify-between h-full gap-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end gap-2">
                <Skeleton className="w-full" style={{ height: `${Math.random() * 50 + 30}%` }} />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ) : children}
    </Card>
  </motion.div>
);

// Custom tooltip
export const EngagementCustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number | string; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>{entry.name}: {entry.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

// Struggling areas section
export function StrugglingAreasSection({ strugglingAreas, loading }: {
  strugglingAreas: Array<{ name: string; dropRate: number; difficulty: string }> | undefined;
  loading: boolean;
}) {
  return (
    <>
      <ChartCard title="Áreas com Alto Abandono" subtitle="Quests com taxa de abandono ≥ 20%" delay={0.1} loading={loading}>
        <div className="space-y-4">
          {(strugglingAreas || []).length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma área crítica identificada. Excelente!</p>
          ) : (
            strugglingAreas?.map((area, index) => (
              <motion.div key={area.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + index * 0.05 }} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-destructive" /><h4 className="font-semibold text-foreground">{area.name}</h4></div>
                    <p className="text-sm text-muted-foreground">Taxa de abandono: <span className="text-destructive font-medium">{area.dropRate}%</span></p>
                  </div>
                  <Badge variant="outline" className={area.difficulty === "Expert" ? "border-red-500/50 text-red-500" : area.difficulty === "Difícil" ? "border-orange-500/50 text-orange-500" : "border-yellow-500/50 text-yellow-500"}>{area.difficulty}</Badge>
                </div>
                <div className="mt-3"><Progress value={100 - area.dropRate} className="h-2" /></div>
                <div className="mt-3 p-3 rounded bg-muted/50"><p className="text-xs text-muted-foreground"><strong>Recomendação:</strong> Considere dividir em módulos menores ou adicionar materiais de apoio.</p></div>
              </motion.div>
            ))
          )}
        </div>
      </ChartCard>

      <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-border/50">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Recomendações de Melhoria</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: "📚", title: "Conteúdo", text: "Divida quests longas em módulos de 15-20 minutos para melhorar retenção." },
            { icon: "🎮", title: "Gamificação", text: "Adicione checkpoints com recompensas parciais para manter motivação." },
            { icon: "👥", title: "Social", text: "Implemente mentorias para quests de alta dificuldade." },
            { icon: "📊", title: "Feedback", text: "Colete feedback após cada módulo para identificar pontos de fricção." },
          ].map((r) => (
            <div key={r.title} className="p-4 rounded-lg bg-background/50">
              <h4 className="font-medium text-foreground mb-2">{r.icon} {r.title}</h4>
              <p className="text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}
