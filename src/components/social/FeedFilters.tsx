import { Activity, Filter, Zap, Trophy, Star, Gift, Flame, CheckCircle, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type ActivityType = "all" | "xp_gained" | "level_up" | "quest_completed" | "kudos_given" | "kudos_received" | "achievement_unlocked" | "streak_updated";
export type PeriodType = "today" | "week" | "month" | "all" | "custom";

export const activityTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "Todas", icon: Activity, color: "text-primary" },
  xp_gained: { label: "XP Ganho", icon: Zap, color: "text-yellow-500" },
  level_up: { label: "Level Up", icon: Trophy, color: "text-purple-500" },
  quest_completed: { label: "Quests", icon: CheckCircle, color: "text-green-500" },
  kudos_given: { label: "Kudos Enviados", icon: Star, color: "text-amber-500" },
  kudos_received: { label: "Kudos Recebidos", icon: Gift, color: "text-pink-500" },
  achievement_unlocked: { label: "Conquistas", icon: Trophy, color: "text-orange-500" },
  streak_updated: { label: "Streaks", icon: Flame, color: "text-red-500" },
};

export const periodConfig: Record<PeriodType, { label: string; getDays: () => number | null }> = {
  today: { label: "Hoje", getDays: () => 0 },
  week: { label: "Última semana", getDays: () => 7 },
  month: { label: "Último mês", getDays: () => 30 },
  all: { label: "Todo período", getDays: () => null },
  custom: { label: "Personalizado", getDays: () => null },
};

interface FeedFiltersProps {
  activityType: ActivityType;
  setActivityType: (type: ActivityType) => void;
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
  customDateRange: { from: Date | undefined; to: Date | undefined };
  setCustomDateRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  filteredCount: number;
}

export function FeedFilters({ activityType, setActivityType, period, setPeriod, customDateRange, setCustomDateRange, filteredCount }: FeedFiltersProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="w-4 h-4" />
          Filtros
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
              <SelectTrigger><SelectValue placeholder="Tipo de atividade" /></SelectTrigger>
              <SelectContent>
                {Object.entries(activityTypeConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <config.icon className={cn("w-4 h-4", config.color)} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
              <SelectTrigger><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                {Object.entries(periodConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Calendar className="w-4 h-4" />
                  {customDateRange.from
                    ? customDateRange.to
                      ? `${customDateRange.from.toLocaleDateString()} - ${customDateRange.to.toLocaleDateString()}`
                      : customDateRange.from.toLocaleDateString()
                    : "Selecionar datas"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={{ from: customDateRange.from, to: customDateRange.to }}
                  onSelect={(range) => setCustomDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {activityType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              {activityTypeConfig[activityType].label}
              <button onClick={() => setActivityType("all")} className="ml-1 hover:text-destructive">×</button>
            </Badge>
          )}
          <Badge variant="outline">{periodConfig[period].label}</Badge>
          <Badge variant="outline" className="bg-muted">{filteredCount} atividades</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
