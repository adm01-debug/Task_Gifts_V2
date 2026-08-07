import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricData {
  label: string;
  icon: React.ElementType;
  current: number;
  previous: number;
  format: (v: number) => string;
  color: string;
  iconColor: string;
}

function calculateChange(current: number, previous: number): { value: number; trend: "up" | "down" | "same" } {
  if (previous === 0 && current === 0) return { value: 0, trend: "same" };
  if (previous === 0) return { value: 100, trend: "up" };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    trend: change > 0 ? "up" : change < 0 ? "down" : "same",
  };
}

function TrendIcon({ trend }: { trend: "up" | "down" | "same" }) {
  if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (trend === "down") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

interface WeeklyMetricCardsProps {
  metrics: MetricData[];
}

export function WeeklyMetricCards({ metrics }: WeeklyMetricCardsProps) {
  return (
    <motion.div
      key="cards"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-2 md:grid-cols-3 gap-3"
    >
      {metrics.map((metric, index) => {
        const change = calculateChange(metric.current, metric.previous);
        const Icon = metric.icon;

        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`relative p-3 rounded-lg bg-gradient-to-br ${metric.color} border border-border/30 hover:border-border/60 transition-colors`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 ${metric.iconColor}`} />
              <div className="flex items-center gap-1">
                <TrendIcon trend={change.trend} />
                <span className={`text-xs font-medium ${
                  change.trend === "up" ? "text-green-500" :
                  change.trend === "down" ? "text-red-500" :
                  "text-muted-foreground"
                }`}>
                  {change.value}%
                </span>
              </div>
            </div>
            <p className="text-lg font-bold">{metric.format(metric.current)}</p>
            <p className="text-xs text-muted-foreground">{metric.label}</p>

            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(100, metric.previous > 0
                    ? (metric.current / metric.previous) * 50
                    : metric.current > 0 ? 100 : 50)}%`
                }}
                transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                className={`h-full rounded-full ${
                  change.trend === "up" ? "bg-green-500" :
                  change.trend === "down" ? "bg-red-500" :
                  "bg-muted-foreground"
                }`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              anterior: {metric.format(metric.previous)}
            </p>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export { calculateChange, TrendIcon };
export type { MetricData };
