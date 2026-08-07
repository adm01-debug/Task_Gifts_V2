import { motion } from "framer-motion";
import { Activity, Clock, TrendingUp } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RechartsTooltipProps, RechartsTooltipPayloadItem } from "@/types/charts";

const CustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-xl">
        <p className="font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry: RechartsTooltipPayloadItem, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface AnalyticsChartTabsProps {
  hourlyData: Array<Record<string, unknown>>;
  dailyData: Array<Record<string, unknown>>;
  categoryColors: Record<string, string>;
  categoryLabels: Record<string, string>;
}

export function AnalyticsChartTabs({ hourlyData, dailyData, categoryColors, categoryLabels }: AnalyticsChartTabsProps) {
  return (
    <Tabs defaultValue="hourly" className="space-y-6">
      <TabsList className="bg-muted/50">
        <TabsTrigger value="hourly" className="gap-2"><Clock className="w-4 h-4" />Por Hora (24h)</TabsTrigger>
        <TabsTrigger value="daily" className="gap-2"><TrendingUp className="w-4 h-4" />Por Dia (7d)</TabsTrigger>
      </TabsList>

      <TabsContent value="hourly" className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />Atividade por Hora (Últimas 24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData}>
                    <defs>
                      {Object.entries(categoryColors).map(([cat, color]) => (
                        <linearGradient key={cat} id={`color${cat}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={11} interval={2} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.entries(categoryColors).map(([cat, color]) => (
                      <Area key={cat} type="monotone" dataKey={cat} name={categoryLabels[cat]} stroke={color} fill={`url(#color${cat})`} stackId="1" />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="daily" className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Atividade por Dia (Últimos 7 dias)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {Object.entries(categoryColors).map(([cat, color]) => (
                      <Bar key={cat} dataKey={cat} name={categoryLabels[cat]} fill={color} radius={[2, 2, 0, 0]} stackId="stack" />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>
    </Tabs>
  );
}
