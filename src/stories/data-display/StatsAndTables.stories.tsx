import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  TrendingUp, TrendingDown, Users, Target, Zap, 
  Trophy, BookOpen, CheckCircle2, Clock, MoreHorizontal 
} from "lucide-react";

const meta: Meta = {
  title: "Data Display/Stats & Tables",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Componentes para exibição de dados, estatísticas e tabelas.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Stat Cards
interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: typeof Users;
  color?: string;
}

const StatCard = ({ title, value, change, icon: Icon, color = "text-primary" }: StatCardProps) => (
  <Card className="w-64">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
              {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span>{change >= 0 ? '+' : ''}{change}% vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const StatCards: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <StatCard title="Usuários Ativos" value="1,234" change={12} icon={Users} />
      <StatCard title="Quests Completadas" value="456" change={8} icon={Target} />
      <StatCard title="XP Total Distribuído" value="45.2K" change={-3} icon={Zap} color="text-xp" />
      <StatCard title="Treinamentos" value="89" change={15} icon={BookOpen} color="text-success" />
    </div>
  ),
};

// Mini Stats
const MiniStat = ({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Users }) => (
  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  </div>
);

export const MiniStats: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <MiniStat label="Nível Atual" value="15" icon={Trophy} />
      <MiniStat label="XP Total" value="12,450" icon={Zap} />
      <MiniStat label="Quests Ativas" value="3" icon={Target} />
      <MiniStat label="Conquistas" value="24" icon={CheckCircle2} />
    </div>
  ),
};

// Progress Stats
const ProgressStat = ({ label, current, max, color }: { 
  label: string; current: number; max: number; color?: string 
}) => (
  <div className="space-y-2">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{current}/{max}</span>
    </div>
    <Progress value={(current / max) * 100} className={`h-2 ${color}`} />
  </div>
);

export const ProgressStats: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Progresso Mensal</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressStat label="Tarefas" current={45} max={60} />
        <ProgressStat label="Treinamentos" current={8} max={10} />
        <ProgressStat label="Kudos Enviados" current={12} max={15} />
        <ProgressStat label="Check-ins" current={20} max={22} />
      </CardContent>
    </Card>
  ),
};

// Simple Table
const tableData = [
  { name: "Ana Silva", department: "Vendas", xp: 15420, level: 25, status: "online" },
  { name: "Carlos Santos", department: "TI", xp: 14890, level: 24, status: "away" },
  { name: "Maria Oliveira", department: "RH", xp: 13750, level: 23, status: "online" },
  { name: "João Pedro", department: "Marketing", xp: 12400, level: 21, status: "offline" },
  { name: "Lucia Ferreira", department: "Financeiro", xp: 11800, level: 20, status: "online" },
];

const statusColors = {
  online: "bg-success",
  away: "bg-warning",
  offline: "bg-muted",
};

export const DataTable: Story = {
  render: () => (
    <Card className="w-[600px]">
      <CardHeader className="pb-2">
        <CardTitle>Colaboradores</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead className="text-right">XP</TableHead>
              <TableHead className="text-right">Nível</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableData.map((row) => (
              <TableRow key={row.name}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>{row.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusColors[row.status as keyof typeof statusColors]}`} />
                    </div>
                    <span className="font-medium">{row.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{row.department}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-xp">
                  {row.xp.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">{row.level}</TableCell>
                <TableCell>
                  <button className="p-1 hover:bg-muted rounded">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  ),
};

// Activity Timeline
const timelineData = [
  { time: "09:00", title: "Check-in realizado", desc: "+10 XP", icon: CheckCircle2, color: "text-success" },
  { time: "10:30", title: "Completou treinamento", desc: "Liderança 101 • +100 XP", icon: BookOpen, color: "text-primary" },
  { time: "14:00", title: "Quest finalizada", desc: "Mentor do Mês • +200 XP", icon: Target, color: "text-xp" },
  { time: "16:45", title: "Subiu de nível!", desc: "Nível 15 desbloqueado", icon: Trophy, color: "text-coins" },
];

export const ActivityTimeline: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Atividade de Hoje</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative space-y-4">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border" />
          {timelineData.map((item, i) => (
            <div key={i} className="flex gap-4 relative">
              <div className={`w-8 h-8 rounded-full bg-card border-2 border-border flex items-center justify-center z-10 ${item.color}`}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{item.title}</p>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ),
};

// Comparison Chart (simplified)
export const ComparisonStats: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Você vs Média</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {[
          { label: "XP Semanal", you: 450, avg: 320 },
          { label: "Tarefas", you: 12, avg: 10 },
          { label: "Treinamentos", you: 3, avg: 2 },
          { label: "Kudos", you: 5, avg: 4 },
        ].map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span className={item.you > item.avg ? "text-success" : "text-muted-foreground"}>
                {item.you > item.avg ? `+${Math.round((item.you / item.avg - 1) * 100)}%` : `${Math.round((item.you / item.avg - 1) * 100)}%`}
              </span>
            </div>
            <div className="flex gap-1 h-6">
              <div 
                className="bg-primary rounded-l" 
                style={{ width: `${(item.you / Math.max(item.you, item.avg)) * 50}%` }} 
              />
              <div 
                className="bg-muted rounded-r" 
                style={{ width: `${(item.avg / Math.max(item.you, item.avg)) * 50}%` }} 
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Você: {item.you}</span>
              <span>Média: {item.avg}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  ),
};
