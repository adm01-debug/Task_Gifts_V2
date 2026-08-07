import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComboHistory } from "@/hooks/useCombo";
import { COMBO_TIERS } from "@/services/comboService";
import { Area, AreaChart, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const chartConfig = {
  multiplier: {
    label: "Multiplicador",
    color: "hsl(var(--primary))",
  },
};

export function ComboHistory() {
  const { data: history, isLoading } = useComboHistory(7);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Histórico de Combos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data - fill missing days with 1.0x
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split("T")[0];
  });

  const chartData = last7Days.map((date) => {
    const combo = history?.find((c) => c.combo_date === date);
    const multiplier = combo?.max_multiplier_reached ?? 1.0;
    const tier = COMBO_TIERS.find(
      (t, i) =>
        multiplier >= t.multiplier &&
        (i === COMBO_TIERS.length - 1 || multiplier < COMBO_TIERS[i + 1].multiplier)
    );

    return {
      date,
      displayDate: format(parseISO(date), "EEE", { locale: ptBR }),
      multiplier,
      actions: combo?.actions_count ?? 0,
      bonusXp: combo?.total_bonus_xp ?? 0,
      tierLabel: tier?.label ?? "Normal",
      tierColor: tier?.color ?? "text-muted-foreground",
    };
  });

  // Calculate stats
  const maxMultiplier = Math.max(...chartData.map((d) => d.multiplier));
  const avgMultiplier = chartData.reduce((acc, d) => acc + d.multiplier, 0) / chartData.length;
  const totalBonusXp = chartData.reduce((acc, d) => acc + d.bonusXp, 0);
  const daysWithCombo = chartData.filter((d) => d.multiplier > 1).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card variant="subtle" className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flame className="h-5 w-5 text-orange-500" />
            Histórico de Combos - Últimos 7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <motion.div
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg p-3 border border-orange-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Zap className="h-3 w-3" />
                Máximo
              </div>
              <p className="text-xl font-bold text-orange-500">{maxMultiplier.toFixed(1)}x</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg p-3 border border-blue-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3 w-3" />
                Média
              </div>
              <p className="text-xl font-bold text-blue-500">{avgMultiplier.toFixed(1)}x</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-lg p-3 border border-amber-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Flame className="h-3 w-3" />
                Dias com Combo
              </div>
              <p className="text-xl font-bold text-amber-500">{daysWithCombo}/7</p>
            </motion.div>

            <motion.div
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <TrendingUp className="h-3 w-3" />
                XP Bônus
              </div>
              <p className="text-xl font-bold text-green-500">+{totalBonusXp}</p>
            </motion.div>
          </div>

          {/* Area Chart */}
          <ChartContainer config={chartConfig} className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="comboGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="hsl(25, 95%, 53%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="displayDate"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  domain={[1, 3.5]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                  tickFormatter={(value) => `${value}x`}
                />
                <Tooltip
                  content={
                    <ChartTooltipContent
                      formatter={(value, name, item) => (
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-foreground">
                            {Number(value).toFixed(1)}x
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {item.payload.actions} ações • +{item.payload.bonusXp} XP bônus
                          </span>
                          <span className={`text-xs font-medium ${item.payload.tierColor}`}>
                            {item.payload.tierLabel}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="multiplier"
                  stroke="hsl(25, 95%, 53%)"
                  strokeWidth={2}
                  fill="url(#comboGradient)"
                  animationDuration={1000}
                  dot={{
                    fill: "hsl(25, 95%, 53%)",
                    strokeWidth: 2,
                    stroke: "hsl(var(--background))",
                    r: 4,
                  }}
                  activeDot={{
                    fill: "hsl(25, 95%, 53%)",
                    strokeWidth: 3,
                    stroke: "hsl(var(--background))",
                    r: 6,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Tier Legend */}
          <div className="flex flex-wrap gap-2 justify-center pt-2 border-t border-border/50">
            {COMBO_TIERS.slice(1).map((tier) => (
              <div
                key={tier.label}
                className={`flex items-center gap-1 text-xs ${tier.color}`}
              >
                <div className={`w-2 h-2 rounded-full ${tier.bgColor}`} />
                <span>{tier.multiplier}x {tier.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
