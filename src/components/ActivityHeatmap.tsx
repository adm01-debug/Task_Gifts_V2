import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flame, Calendar } from "lucide-react";
import { format, eachDayOfInterval, subDays, startOfWeek, getDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActivityData {
  date: string;
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityData[];
  title?: string;
  className?: string;
}

const DAYS_TO_SHOW = 365;
const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function getActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const levelColors = {
  0: "bg-muted/50",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};

const levelGlow = {
  0: "",
  1: "",
  2: "",
  3: "shadow-[0_0_4px_hsl(var(--primary)/0.3)]",
  4: "shadow-[0_0_8px_hsl(var(--primary)/0.5)]",
};

export function ActivityHeatmap({ 
  data, 
  title = "Atividade Anual",
  className 
}: ActivityHeatmapProps) {
  const today = new Date();
  const startDate = startOfWeek(subDays(today, DAYS_TO_SHOW - 1));
  
  const calendarData = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: today });
    const activityMap = new Map<string, number>();
    
    data.forEach((item) => {
      const dateKey = format(new Date(item.date), "yyyy-MM-dd");
      activityMap.set(dateKey, (activityMap.get(dateKey) || 0) + item.count);
    });
    
    // Group by weeks
    const weeks: { date: Date; count: number; dayOfWeek: number }[][] = [];
    let currentWeek: { date: Date; count: number; dayOfWeek: number }[] = [];
    
    days.forEach((day, index) => {
      const dateKey = format(day, "yyyy-MM-dd");
      const count = activityMap.get(dateKey) || 0;
      const dayOfWeek = getDay(day);
      
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      
      currentWeek.push({ date: day, count, dayOfWeek });
      
      if (index === days.length - 1) {
        weeks.push(currentWeek);
      }
    });
    
    return { weeks, activityMap };
  }, [data, startDate, today]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalActivities = data.reduce((sum, d) => sum + d.count, 0);
    const activeDays = new Set(data.filter(d => d.count > 0).map(d => format(new Date(d.date), "yyyy-MM-dd"))).size;
    
    // Find current streak
    let streak = 0;
    let checkDate = today;
    while (true) {
      const dateKey = format(checkDate, "yyyy-MM-dd");
      if (calendarData.activityMap.get(dateKey) || 0 > 0) {
        streak++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }
    
    // Find max in a day
    const maxInDay = data.reduce((max, d) => Math.max(max, d.count), 0);
    
    return { totalActivities, activeDays, streak, maxInDay };
  }, [data, calendarData.activityMap, today]);

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; index: number }[] = [];
    let lastMonth = -1;
    
    calendarData.weeks.forEach((week, weekIndex) => {
      const firstDay = week[0]?.date;
      if (firstDay) {
        const month = firstDay.getMonth();
        if (month !== lastMonth) {
          labels.push({ month: MONTHS[month], index: weekIndex });
          lastMonth = month;
        }
      }
    });
    
    return labels;
  }, [calendarData.weeks]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border border-border bg-card p-6",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">
              {stats.totalActivities} atividades em {stats.activeDays} dias
            </p>
          </div>
        </div>
        
        {/* Current streak */}
        {stats.streak > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Flame className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-primary">{stats.streak} dias</span>
          </div>
        )}
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Month labels */}
          <div className="flex mb-2 pl-8">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground"
                style={{
                  position: "relative",
                  left: `${label.index * 14}px`,
                  marginRight: i === monthLabels.length - 1 ? 0 : -14,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {WEEK_DAYS.map((day, i) => (
                <div
                  key={day}
                  className="h-3 flex items-center justify-end pr-1"
                  style={{ visibility: i % 2 === 1 ? "visible" : "hidden" }}
                >
                  <span className="text-[10px] text-muted-foreground">{day}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <TooltipProvider delayDuration={100}>
              <div className="flex gap-0.5">
                {calendarData.weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-0.5">
                    {/* Fill empty days at start of first week */}
                    {weekIndex === 0 &&
                      Array.from({ length: week[0]?.dayOfWeek || 0 }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-3 h-3" />
                      ))}
                    
                    {week.map((day, dayIndex) => {
                      const level = getActivityLevel(day.count);
                      const isToday = isSameDay(day.date, today);
                      
                      return (
                        <Tooltip key={dayIndex}>
                          <TooltipTrigger asChild>
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              transition={{ 
                                delay: (weekIndex * 7 + dayIndex) * 0.001,
                                type: "spring",
                                stiffness: 300,
                                damping: 20 
                              }}
                              whileHover={{ scale: 1.3, zIndex: 10 }}
                              className={cn(
                                "w-3 h-3 rounded-sm cursor-pointer transition-all",
                                levelColors[level],
                                levelGlow[level],
                                isToday && "ring-1 ring-foreground ring-offset-1 ring-offset-background"
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p className="font-medium">
                              {format(day.date, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                            <p className="text-muted-foreground">
                              {day.count === 0 
                                ? "Sem atividade" 
                                : `${day.count} atividade${day.count > 1 ? "s" : ""}`
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>Menos</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn(
                "w-3 h-3 rounded-sm",
                levelColors[level as 0 | 1 | 2 | 3 | 4]
              )}
            />
          ))}
          <span>Mais</span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Melhor dia: <span className="font-semibold text-foreground">{stats.maxInDay}</span> atividades
        </div>
      </div>
    </motion.div>
  );
}

// Hook to generate mock data for demo purposes
export function useActivityHeatmapData() {
  return useMemo(() => {
    const data: ActivityData[] = [];
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
      const date = subDays(today, i);
      // Random activity with higher probability for recent days
      const recentBonus = i < 30 ? 0.3 : i < 90 ? 0.15 : 0;
      const hasActivity = Math.random() < (0.4 + recentBonus);
      
      if (hasActivity) {
        const count = Math.floor(Math.random() * 12) + 1;
        data.push({
          date: format(date, "yyyy-MM-dd"),
          count,
        });
      }
    }
    
    return data;
  }, []);
}
