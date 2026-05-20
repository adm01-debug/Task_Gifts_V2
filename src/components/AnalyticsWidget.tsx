import { motion } from "framer-motion";
import { TrendingUp, Users, Target, Zap, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useNavigate } from "react-router-dom";
import { useLeaderboard } from "@/hooks/useProfiles";
import { Skeleton } from "@/components/ui/skeleton";
import { RechartsTooltipProps, RechartsTooltipPayloadItem } from "@/types/charts";

// Tooltip content function - avoids forwardRef warning from recharts
const renderCustomTooltip = ({ active, payload, label }: RechartsTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-lg p-3 border border-border">
        <p className="font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry: RechartsTooltipPayloadItem, i: number) => (
          <p key={i} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AnalyticsWidget = () => {
  const navigate = useNavigate();
  const { data: profiles = [], isLoading: profilesLoading } = useLeaderboard(50);

  const isLoading = profilesLoading;

  // Calculate real metrics from profiles
  const totalUsers = profiles.length;
  const activeUsers = profiles.filter(p => p.xp > 0).length;
  const totalXp = profiles.reduce((sum, p) => sum + p.xp, 0);
  const totalQuests = profiles.reduce((sum, p) => sum + p.quests_completed, 0);
  const engagementRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
  const avgQuestsPerUser = totalUsers > 0 ? Math.round(totalQuests / totalUsers) : 0;

  // Build XP data from top users
  const topUsers = profiles.slice(0, 7);
  const engagementData = topUsers.map((p, i) => ({
    day: p.display_name?.substring(0, 3) || `U${i + 1}`,
    xp: p.xp,
    quests: p.quests_completed,
  }));

  // Group users by level ranges for team data
  const levelGroups = [
    { team: "Lv 1-5", score: profiles.filter(p => p.level >= 1 && p.level <= 5).reduce((s, p) => s + p.xp, 0) },
    { team: "Lv 6-10", score: profiles.filter(p => p.level >= 6 && p.level <= 10).reduce((s, p) => s + p.xp, 0) },
    { team: "Lv 11-20", score: profiles.filter(p => p.level >= 11 && p.level <= 20).reduce((s, p) => s + p.xp, 0) },
    { team: "Lv 21-50", score: profiles.filter(p => p.level >= 21 && p.level <= 50).reduce((s, p) => s + p.xp, 0) },
    { team: "Lv 50+", score: profiles.filter(p => p.level > 50).reduce((s, p) => s + p.xp, 0) },
  ].filter(g => g.score > 0);

  const metrics = [
    { label: "Usuários Ativos", value: activeUsers.toString(), change: totalUsers > 0 ? `${totalUsers} total` : "0", positive: true, icon: Users },
    { label: "Taxa de Engajamento", value: `${engagementRate}%`, change: activeUsers > 0 ? "+ativo" : "-", positive: engagementRate > 50, icon: TrendingUp },
    { label: "Quests/Usuário", value: avgQuestsPerUser.toString(), change: `${totalQuests} total`, positive: avgQuestsPerUser > 0, icon: Target },
    { label: "XP Distribuído", value: totalXp >= 1000 ? `${(totalXp / 1000).toFixed(1)}K` : totalXp.toString(), change: "+acumulado", positive: true, icon: Zap },
  ];

  if (isLoading) {
    return (
      <div className="bg-card/80 rounded-2xl border border-border/60 overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Skeleton variant="glow" shape="card" className="w-8 h-8 rounded-lg" />
            <div className="space-y-1">
              <Skeleton variant="shimmer" className="h-4 w-24" />
              <Skeleton variant="shimmer" className="h-3 w-16" />
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3 border-b border-border">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-xl bg-muted/30 space-y-2">
              <div className="flex justify-between">
                <Skeleton variant="shimmer" shape="circle" className="w-4 h-4" />
                <Skeleton variant="shimmer" shape="pill" className="w-10 h-3" />
              </div>
              <Skeleton variant="glow" className="h-6 w-3/4" />
              <Skeleton variant="shimmer" className="h-2 w-1/2" />
            </div>
          ))}
        </div>
        <div className="p-4">
          <Skeleton variant="shimmer" className="h-4 w-1/3 mb-3" />
          <div className="flex items-end gap-2 h-32">
            {[40, 60, 30, 80, 50, 90, 70].map((h, i) => (
              <Skeleton key={i} variant="glow" className="flex-1 rounded-t-md" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl overflow-hidden shadow-xs border-border/60 bg-card/80"
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <div>
              <h3 className="font-bold">Analytics</h3>
              <p className="text-xs text-muted-foreground">Dados em tempo real</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate("/analytics")}
            className="text-xs text-primary font-medium"
          >
            Ver detalhes →
          </motion.button>
        </div>
      </div>

      {/* Mini metrics */}
      <div className="p-4 grid grid-cols-2 gap-3 border-b border-border">
        {metrics.map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="p-3 rounded-xl bg-muted/30"
          >
            <div className="flex items-center justify-between mb-1">
              <metric.icon className="w-4 h-4 text-muted-foreground" />
              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${
                metric.positive ? "text-success" : "text-destructive"
              }`}>
                {metric.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {metric.change}
              </div>
            </div>
            <p className="text-lg font-bold">{metric.value}</p>
            <p className="text-[10px] text-muted-foreground">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      {engagementData.length > 0 && (
        <div className="p-4">
          <p className="text-sm font-medium mb-3">Top Usuários por XP</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={engagementData}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="day" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis hide />
                <Tooltip content={renderCustomTooltip} />
                <Area
                  type="monotone"
                  dataKey="xp"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#xpGradient)"
                  name="XP"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Level Distribution */}
      {levelGroups.length > 0 && (
        <div className="p-4 border-t border-border">
          <p className="text-sm font-medium mb-3">XP por Nível</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelGroups} layout="vertical">
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="team" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  width={50}
                />
                <Tooltip content={renderCustomTooltip} />
                <Bar
                  dataKey="score"
                  fill="hsl(var(--secondary))"
                  radius={[0, 4, 4, 0]}
                  name="XP Total"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
};
