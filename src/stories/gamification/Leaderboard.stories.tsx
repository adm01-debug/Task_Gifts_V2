import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus } from "lucide-react";

const meta: Meta = {
  title: "Gamification/Leaderboard",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Componentes de ranking e leaderboard para competições gamificadas.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

interface LeaderboardEntry {
  rank: number;
  previousRank: number;
  name: string;
  avatar?: string;
  department: string;
  xp: number;
  level: number;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, previousRank: 2, name: "Ana Silva", department: "Vendas", xp: 15420, level: 25 },
  { rank: 2, previousRank: 1, name: "Carlos Santos", department: "TI", xp: 14890, level: 24 },
  { rank: 3, previousRank: 3, name: "Maria Oliveira", department: "RH", xp: 13750, level: 23 },
  { rank: 4, previousRank: 6, name: "João Pedro", department: "Marketing", xp: 12400, level: 21 },
  { rank: 5, previousRank: 4, name: "Lucia Ferreira", department: "Financeiro", xp: 11800, level: 20 },
];

const RankChange = ({ current, previous }: { current: number; previous: number }) => {
  const diff = previous - current;
  if (diff > 0) return <TrendingUp className="h-4 w-4 text-success" />;
  if (diff < 0) return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
};

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="w-5 text-center font-bold text-muted-foreground">{rank}</span>;
};

// Full Leaderboard
const Leaderboard = ({ entries, title }: { entries: LeaderboardEntry[]; title: string }) => (
  <Card className="w-96">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-coins" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2">
      {entries.map((entry) => (
        <div 
          key={entry.rank}
          className={`flex items-center gap-3 p-3 rounded-lg ${
            entry.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : 'hover:bg-muted/50'
          } transition-colors`}
        >
          <div className="w-8 flex justify-center">
            <RankBadge rank={entry.rank} />
          </div>
          <Avatar className={`h-10 w-10 ${entry.rank === 1 ? 'ring-2 ring-yellow-500' : ''}`}>
            <AvatarImage src={entry.avatar} />
            <AvatarFallback>{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{entry.name}</div>
            <div className="text-xs text-muted-foreground">{entry.department}</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xp">{entry.xp.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Nível {entry.level}</div>
          </div>
          <RankChange current={entry.rank} previous={entry.previousRank} />
        </div>
      ))}
    </CardContent>
  </Card>
);

export const WeeklyLeaderboard: Story = {
  render: () => <Leaderboard entries={mockLeaderboard} title="Ranking Semanal" />,
};

export const MonthlyLeaderboard: Story = {
  render: () => <Leaderboard entries={mockLeaderboard} title="Ranking Mensal" />,
};

// Top 3 Podium
const Podium = ({ entries }: { entries: LeaderboardEntry[] }) => {
  const top3 = entries.slice(0, 3);
  const [first, second, third] = [top3[0], top3[1], top3[2]];

  return (
    <div className="flex items-end justify-center gap-4 p-6">
      {/* Second Place */}
      <div className="text-center">
        <Avatar className="h-16 w-16 mx-auto mb-2 ring-2 ring-gray-400">
          <AvatarImage src={second?.avatar} />
          <AvatarFallback>{second?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="font-medium text-sm">{second?.name}</div>
        <div className="text-xs text-muted-foreground mb-2">{second?.xp.toLocaleString()} XP</div>
        <div className="w-20 h-24 bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg flex items-center justify-center">
          <span className="text-3xl font-bold text-white">2</span>
        </div>
      </div>

      {/* First Place */}
      <div className="text-center">
        <Crown className="h-8 w-8 mx-auto mb-1 text-yellow-500" />
        <Avatar className="h-20 w-20 mx-auto mb-2 ring-4 ring-yellow-500">
          <AvatarImage src={first?.avatar} />
          <AvatarFallback>{first?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="font-bold">{first?.name}</div>
        <div className="text-xs text-muted-foreground mb-2">{first?.xp.toLocaleString()} XP</div>
        <div className="w-24 h-32 bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg flex items-center justify-center">
          <span className="text-4xl font-bold text-white">1</span>
        </div>
      </div>

      {/* Third Place */}
      <div className="text-center">
        <Avatar className="h-14 w-14 mx-auto mb-2 ring-2 ring-amber-600">
          <AvatarImage src={third?.avatar} />
          <AvatarFallback>{third?.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="font-medium text-sm">{third?.name}</div>
        <div className="text-xs text-muted-foreground mb-2">{third?.xp.toLocaleString()} XP</div>
        <div className="w-18 h-16 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-lg flex items-center justify-center">
          <span className="text-2xl font-bold text-white">3</span>
        </div>
      </div>
    </div>
  );
};

export const TopPodium: Story = {
  render: () => <Podium entries={mockLeaderboard} />,
};

// Department Leaderboard
const departmentData = [
  { name: "Vendas", totalXp: 125000, members: 12, avgXp: 10416 },
  { name: "TI", totalXp: 98000, members: 8, avgXp: 12250 },
  { name: "Marketing", totalXp: 87000, members: 10, avgXp: 8700 },
  { name: "RH", totalXp: 65000, members: 5, avgXp: 13000 },
];

const DepartmentLeaderboard = () => (
  <Card className="w-96">
    <CardHeader className="pb-2">
      <CardTitle className="flex items-center gap-2">
        <Trophy className="h-5 w-5 text-primary" />
        Ranking por Departamento
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {departmentData.map((dept, i) => (
        <div key={dept.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
            {i + 1}
          </div>
          <div className="flex-1">
            <div className="font-medium">{dept.name}</div>
            <div className="text-xs text-muted-foreground">{dept.members} membros</div>
          </div>
          <div className="text-right">
            <div className="font-bold text-xp">{dept.totalXp.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">~{dept.avgXp.toLocaleString()}/pessoa</div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export const DepartmentRanking: Story = {
  render: () => <DepartmentLeaderboard />,
};

// Mini Leaderboard Widget
const MiniLeaderboard = ({ entries }: { entries: LeaderboardEntry[] }) => (
  <div className="w-64 p-4 rounded-xl bg-card border space-y-3">
    <div className="flex items-center justify-between">
      <span className="font-semibold text-sm">Top 5</span>
      <Trophy className="h-4 w-4 text-coins" />
    </div>
    {entries.slice(0, 5).map((entry) => (
      <div key={entry.rank} className="flex items-center gap-2">
        <span className="w-4 text-xs font-bold text-muted-foreground">{entry.rank}</span>
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">{entry.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <span className="flex-1 text-sm truncate">{entry.name}</span>
        <span className="text-xs font-medium text-xp">{(entry.xp / 1000).toFixed(1)}k</span>
      </div>
    ))}
  </div>
);

export const MiniWidget: Story = {
  render: () => <MiniLeaderboard entries={mockLeaderboard} />,
};
