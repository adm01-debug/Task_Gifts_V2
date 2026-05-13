import { useState } from "react";
import { motion } from "framer-motion";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Target,
  Sparkles,
  Info,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCompetencies } from "@/hooks/useCompetencies";
import { useAuth } from "@/hooks/useAuth";

interface CompetencyRadarProps {
  userId?: string;
  showDetails?: boolean;
  compact?: boolean;
}

// CustomTooltip must be a simple function (not a component receiving refs)
// recharts internally passes refs to tooltip content components
const renderCustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = Math.round((data.value / data.maxValue) * 100);
    const status =
      percentage >= 70
        ? { label: "Excelente", color: "text-green-400" }
        : percentage >= 40
        ? { label: "Em Desenvolvimento", color: "text-yellow-400" }
        : { label: "Gap Identificado", color: "text-red-400" };

    return (
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{data.icon}</span>
          <span className="font-semibold text-foreground">{data.area}</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Nível:</span>
            <span className="font-bold text-foreground">
              {data.value}/{data.maxValue}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-muted-foreground">Status:</span>
            <span className={`text-sm font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CompetencyBar = ({
  area,
  value,
  maxValue,
  icon,
  index,
}: {
  area: string;
  value: number;
  maxValue: number;
  icon: string;
  index: number;
}) => {
  const percentage = Math.round((value / maxValue) * 100);
  const isGap = percentage < 40;
  const isStrong = percentage >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className="group"
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-medium text-foreground">{area}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground">{percentage}%</span>
          {isGap && <TrendingDown className="w-3 h-3 text-red-400" />}
          {isStrong && <TrendingUp className="w-3 h-3 text-green-400" />}
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ delay: index * 0.1 + 0.2, duration: 0.5, ease: "easeOut" }}
          className={`h-full rounded-full ${
            isGap
              ? "bg-gradient-to-r from-red-500 to-red-400"
              : isStrong
              ? "bg-gradient-to-r from-green-500 to-emerald-400"
              : "bg-gradient-to-r from-primary to-primary/70"
          }`}
        />
      </div>
    </motion.div>
  );
};

const LoadingSkeleton = ({ compact }: { compact?: boolean }) => (
  <div className={`space-y-4 ${compact ? "" : "p-6"}`}>
    <Skeleton className={`${compact ? "h-40" : "h-64"} w-full rounded-lg`} />
    <div className="space-y-2">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export function CompetencyRadar({
  userId,
  showDetails = true,
  compact = false,
}: CompetencyRadarProps) {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  const { data: competencies, isLoading, error } = useCompetencies(targetUserId);
  const [showBars, setShowBars] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton compact={compact} />;
  }

  if (error || !competencies) {
    return (
      <Card className="p-6 text-center">
        <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">
          Erro ao carregar competências. Tente novamente.
        </p>
      </Card>
    );
  }

  // Calculate overall stats
  const avgCompetency = Math.round(
    competencies.reduce((acc, c) => acc + c.value, 0) / competencies.length
  );
  const gaps = competencies.filter((c) => c.value < 40);
  const strengths = competencies.filter((c) => c.value >= 70);

  // Transform data for recharts
  const chartData = competencies.map((c) => ({
    ...c,
    fullMark: c.maxValue,
  }));

  return (
    <Card
      className={`bg-card/50 backdrop-blur-sm border-border/50 overflow-hidden ${
        compact ? "p-4" : "p-6"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Brain className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className={`font-bold text-foreground ${compact ? "text-base" : "text-lg"}`}>
              Radar de Competências
            </h2>
            {!compact && (
              <p className="text-sm text-muted-foreground">
                Mapeamento de habilidades e gaps
              </p>
            )}
          </div>
        </div>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBars(!showBars)}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                {showBars ? "Radar" : "Barras"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alternar visualização</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-3 mb-4"
      >
        <div className="text-center p-3 rounded-lg bg-background/50">
          <Target className="w-5 h-5 mx-auto text-primary" />
          <p className="text-xl font-bold text-foreground mt-1">{avgCompetency}%</p>
          <p className="text-xs text-muted-foreground">Média Geral</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-green-500/10">
          <TrendingUp className="w-5 h-5 mx-auto text-green-400" />
          <p className="text-xl font-bold text-green-400 mt-1">{strengths.length}</p>
          <p className="text-xs text-muted-foreground">Pontos Fortes</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-red-500/10">
          <TrendingDown className="w-5 h-5 mx-auto text-red-400" />
          <p className="text-xl font-bold text-red-400 mt-1">{gaps.length}</p>
          <p className="text-xs text-muted-foreground">Gaps</p>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {showBars ? (
          <div className="space-y-3 py-4">
            {competencies.map((competency, index) => (
              <CompetencyBar
                key={competency.area}
                {...competency}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className={compact ? "h-48" : "h-72"}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.3}
                />
                <PolarAngleAxis
                  dataKey="area"
                  tick={{
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: compact ? 10 : 12,
                  }}
                  tickLine={false}
                />
                <PolarRadiusAxis
                  angle={30}
                  domain={[0, 100]}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  tickCount={5}
                  axisLine={false}
                />
                <Radar
                  name="Competência"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  strokeWidth={2}
                  dot={{
                    r: 4,
                    fill: "hsl(var(--primary))",
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                  }}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
                <Tooltip content={renderCustomTooltip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </motion.div>

      {/* Gaps and Strengths Details */}
      {showDetails && !compact && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/30"
        >
          {/* Strengths */}
          {strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-400 flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4" />
                Pontos Fortes
              </h4>
              <div className="space-y-2">
                {strengths.map((s) => (
                  <motion.div
                    key={s.area}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10"
                  >
                    <span>{s.icon}</span>
                    <span className="text-sm text-foreground">{s.area}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto bg-green-500/20 text-green-400 border-green-500/30"
                    >
                      {s.value}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4" />
                Gaps de Desenvolvimento
              </h4>
              <div className="space-y-2">
                {gaps.map((g) => (
                  <motion.div
                    key={g.area}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 p-2 rounded-lg bg-red-500/10"
                  >
                    <span>{g.icon}</span>
                    <span className="text-sm text-foreground">{g.area}</span>
                    <Badge
                      variant="outline"
                      className="ml-auto bg-red-500/20 text-red-400 border-red-500/30"
                    >
                      {g.value}%
                    </Badge>
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                Complete trilhas e quests relacionadas para desenvolver estas competências.
              </p>
            </div>
          )}

          {/* No gaps or strengths yet */}
          {gaps.length === 0 && strengths.length === 0 && (
            <div className="col-span-2 text-center py-4">
              <Target className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Continue completando atividades para desenvolver suas competências!
              </p>
            </div>
          )}
        </motion.div>
      )}
    </Card>
  );
}