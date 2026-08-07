import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Clock } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";

interface WeeklyTrendItem { week: string; rate: number; punctual: number; total: number }
interface CheckInTimeItem { day: string; time: number; displayTime: string; isPunctual: boolean }

interface AttendanceChartsProps {
  weeklyTrendData: WeeklyTrendItem[];
  checkInTimesData: CheckInTimeItem[];
  targetMinutes: number;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

export function AttendanceCharts({ weeklyTrendData, checkInTimesData, targetMinutes }: AttendanceChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/50 bg-card/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" />Tendência Semanal</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`${value}%`, 'Taxa de Pontualidade']} />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50">
        <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5 text-primary" />Horários de Check-in (Últimos 7 dias)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={checkInTimesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} domain={[420, 600]}
                  tickFormatter={(value) => { const h = Math.floor(value / 60); const m = value % 60; return `${h}:${m.toString().padStart(2, '0')}`; }} />
                <Tooltip contentStyle={tooltipStyle}
                  formatter={(_v: any, _n: any, props: any) => [props.payload?.displayTime || '', 'Horário']}
                  labelFormatter={(label) => `Dia: ${label}`} />
                {targetMinutes > 0 && (
                  <Line type="monotone" dataKey={() => targetMinutes} stroke="hsl(var(--destructive))" strokeDasharray="5 5" strokeWidth={2} dot={false} name="Limite" />
                )}
                <Bar dataKey="time" name="Check-in" radius={[4, 4, 0, 0]}>
                  {checkInTimesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isPunctual ? 'hsl(var(--success))' : 'hsl(var(--warning))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
