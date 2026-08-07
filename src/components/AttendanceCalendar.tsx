import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AttendanceRecord } from "@/services/attendanceService";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isWeekend, 
  isSameMonth,
  addMonths,
  subMonths,
  parseISO,
  getDay,
  isToday,
  isFuture
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface AttendanceCalendarProps {
  records: AttendanceRecord[];
}

type DayStatus = 'punctual' | 'late' | 'absent' | 'weekend' | 'future' | 'today-pending';

interface DayInfo {
  date: Date;
  status: DayStatus;
  record?: AttendanceRecord;
}

const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const AttendanceCalendar = ({ records }: AttendanceCalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = getDay(monthStart);
    
    // Create padding for days before the month starts
    const paddingDays: DayInfo[] = Array(startDayOfWeek).fill(null).map((_, i) => ({
      date: new Date(monthStart.getTime() - (startDayOfWeek - i) * 24 * 60 * 60 * 1000),
      status: 'weekend' as DayStatus,
    }));

    const days: DayInfo[] = daysInMonth.map(date => {
      if (isWeekend(date)) {
        return { date, status: 'weekend' as DayStatus };
      }

      if (isFuture(date) && !isToday(date)) {
        return { date, status: 'future' as DayStatus };
      }

      // Find matching record
      const record = records.find(r => {
        const recordDate = parseISO(r.check_in);
        return isSameDay(recordDate, date);
      });

      if (record) {
        return {
          date,
          status: record.is_punctual ? 'punctual' as DayStatus : 'late' as DayStatus,
          record
        };
      }

      // Today without record yet
      if (isToday(date)) {
        return { date, status: 'today-pending' as DayStatus };
      }

      // Past workday without record = absent
      return { date, status: 'absent' as DayStatus };
    });

    return [...paddingDays, ...days];
  }, [currentMonth, records]);

  const handlePrevMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const getStatusStyles = (status: DayStatus) => {
    switch (status) {
      case 'punctual':
        return 'bg-success/20 text-success border-success/40 hover:bg-success/30';
      case 'late':
        return 'bg-warning/20 text-warning border-warning/40 hover:bg-warning/30';
      case 'absent':
        return 'bg-destructive/20 text-destructive border-destructive/40 hover:bg-destructive/30';
      case 'weekend':
        return 'bg-muted/30 text-muted-foreground/40 border-transparent cursor-default';
      case 'future':
        return 'bg-transparent text-muted-foreground/40 border-dashed border-border/50 cursor-default';
      case 'today-pending':
        return 'bg-primary/10 text-primary border-primary/40 animate-pulse';
      default:
        return 'bg-muted/50 text-muted-foreground border-transparent';
    }
  };

  const getStatusIcon = (status: DayStatus) => {
    switch (status) {
      case 'punctual':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'late':
        return <AlertCircle className="w-3 h-3" />;
      case 'absent':
        return <XCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (day: DayInfo) => {
    switch (day.status) {
      case 'punctual':
        return `Pontual - ${day.record ? format(parseISO(day.record.check_in), 'HH:mm') : ''}`;
      case 'late':
        return `Atrasado ${day.record?.late_minutes}min - ${day.record ? format(parseISO(day.record.check_in), 'HH:mm') : ''}`;
      case 'absent':
        return 'Ausente';
      case 'weekend':
        return 'Fim de semana';
      case 'future':
        return 'Dia futuro';
      case 'today-pending':
        return 'Aguardando check-in';
      default:
        return '';
    }
  };

  // Calculate month stats
  const monthStats = useMemo(() => {
    const workDays = calendarDays.filter(d => 
      !isWeekend(d.date) && 
      isSameMonth(d.date, currentMonth) && 
      !isFuture(d.date)
    );
    
    return {
      punctual: workDays.filter(d => d.status === 'punctual').length,
      late: workDays.filter(d => d.status === 'late').length,
      absent: workDays.filter(d => d.status === 'absent').length,
      pending: workDays.filter(d => d.status === 'today-pending').length,
      total: workDays.length
    };
  }, [calendarDays, currentMonth]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            Calendário de Ponto
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} aria-label="Mês anterior">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              disabled={isSameMonth(currentMonth, new Date())}
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div 
              key={day} 
              className={cn(
                "text-center text-xs font-medium py-2",
                (i === 0 || i === 6) ? "text-muted-foreground/50" : "text-muted-foreground"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day.date, currentMonth);
            const showTooltip = day.status !== 'future' && day.status !== 'weekend' && isCurrentMonth;
            
            const dayContent = (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.01 }}
                className={cn(
                  "aspect-square rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all",
                  getStatusStyles(day.status),
                  !isCurrentMonth && "opacity-30",
                  isToday(day.date) && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
              >
                <span className={cn(
                  "text-sm font-medium",
                  isToday(day.date) && "font-bold"
                )}>
                  {format(day.date, "d")}
                </span>
                {isCurrentMonth && getStatusIcon(day.status)}
              </motion.div>
            );

            if (showTooltip) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    {dayContent}
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-medium">{format(day.date, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
                    <p className="text-muted-foreground">{getStatusLabel(day)}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return dayContent;
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-success/20 border border-success/40 flex items-center justify-center">
              <CheckCircle2 className="w-2.5 h-2.5 text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Pontual ({monthStats.punctual})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-warning/20 border border-warning/40 flex items-center justify-center">
              <AlertCircle className="w-2.5 h-2.5 text-warning" />
            </div>
            <span className="text-xs text-muted-foreground">Atrasado ({monthStats.late})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/40 flex items-center justify-center">
              <XCircle className="w-2.5 h-2.5 text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">Ausente ({monthStats.absent})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-muted/30 border border-transparent" />
            <span className="text-xs text-muted-foreground">Fim de semana</span>
          </div>
        </div>

        {/* Monthly summary badges */}
        <div className="flex items-center justify-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {monthStats.total > 0 
              ? `${Math.round((monthStats.punctual / monthStats.total) * 100)}% pontualidade`
              : 'Sem registros'
            }
          </Badge>
          {monthStats.punctual > 0 && (
            <Badge className="bg-success/20 text-success border-success/40 text-xs">
              {monthStats.punctual} dias pontuais
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
