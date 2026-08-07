import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  target?: number;
  current?: number;
  color?: string;
}

export const KPICard = ({ title, value, subtitle, icon, trend, target, current, color = "primary" }: KPICardProps) => {
  const progress = target && current ? (current / target) * 100 : undefined;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="card-interactive h-full">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className={`p-2.5 rounded-xl bg-${color}/10`}>
              {icon}
            </div>
            {trend !== undefined && (
              <Badge 
                variant={trend >= 0 ? "default" : "destructive"}
                className="text-xs"
              >
                {trend >= 0 ? "+" : ""}{trend}%
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground/70">{subtitle}</p>
            )}
          </div>
          {progress !== undefined && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Meta: {target}</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={Math.min(progress, 100)} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const CustomTooltip = ({ active, payload, label }: { 
  active?: boolean; 
  payload?: Array<{ name: string; value: number | string; color?: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((entry, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">
              {typeof entry.value === 'number' ? entry.value.toLocaleString('pt-BR') : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(142, 76%, 36%)",
  "hsl(48, 96%, 53%)",
  "hsl(280, 65%, 60%)"
];
