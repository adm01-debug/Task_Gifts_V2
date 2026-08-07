import type { Meta, StoryObj } from '@storybook/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Crown, Star, Trophy, Shield, Flame, 
  Medal, Zap, Target, Award, TrendingUp 
} from 'lucide-react';

const meta: Meta = {
  title: 'User/Avatar & Profile',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Componentes relacionados a usuário, avatar e perfil gamificado.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Avatar sizes
export const AvatarSizes: StoryObj = {
  render: () => (
    <div className="flex items-end gap-4">
      <Avatar className="h-8 w-8">
        <AvatarImage src="https://i.pravatar.cc/150?img=1" />
        <AvatarFallback>XS</AvatarFallback>
      </Avatar>
      <Avatar className="h-10 w-10">
        <AvatarImage src="https://i.pravatar.cc/150?img=2" />
        <AvatarFallback>SM</AvatarFallback>
      </Avatar>
      <Avatar className="h-12 w-12">
        <AvatarImage src="https://i.pravatar.cc/150?img=3" />
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarImage src="https://i.pravatar.cc/150?img=4" />
        <AvatarFallback>LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-24 w-24">
        <AvatarImage src="https://i.pravatar.cc/150?img=5" />
        <AvatarFallback>XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

// Avatar with rank indicator
export const AvatarWithRank: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      {[
        { color: 'bg-amber-500', icon: Crown, label: 'Ouro' },
        { color: 'bg-slate-400', icon: Shield, label: 'Prata' },
        { color: 'bg-amber-700', icon: Medal, label: 'Bronze' },
        { color: 'bg-purple-500', icon: Star, label: 'Platina' },
        { color: 'bg-cyan-400', icon: Trophy, label: 'Diamante' },
      ].map((rank, i) => (
        <div key={i} className="relative">
          <Avatar className="h-16 w-16 ring-2 ring-offset-2" style={{ '--tw-ring-color': rank.color.replace('bg-', '') } as React.CSSProperties}>
            <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 10}`} />
            <AvatarFallback>{rank.label[0]}</AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 ${rank.color} rounded-full p-1`}>
            <rank.icon className="h-4 w-4 text-white" />
          </div>
          <span className="mt-2 block text-center text-xs text-muted-foreground">{rank.label}</span>
        </div>
      ))}
    </div>
  ),
};

// Avatar with status
export const AvatarWithStatus: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      {[
        { status: 'Online', color: 'bg-success' },
        { status: 'Ausente', color: 'bg-warning' },
        { status: 'Ocupado', color: 'bg-destructive' },
        { status: 'Offline', color: 'bg-muted-foreground' },
      ].map((item, i) => (
        <div key={i} className="relative">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 20}`} />
            <AvatarFallback>U{i}</AvatarFallback>
          </Avatar>
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${item.color} ring-2 ring-background`} />
          <span className="mt-2 block text-center text-xs text-muted-foreground">{item.status}</span>
        </div>
      ))}
    </div>
  ),
};

// User Profile Card
export const ProfileCard: StoryObj = {
  render: () => (
    <Card className="w-80">
      <CardHeader className="relative pb-0">
        <div className="absolute right-4 top-4">
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
            <Crown className="mr-1 h-3 w-3" /> Nível 42
          </Badge>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-20 w-20 ring-4 ring-primary/20">
              <AvatarImage src="https://i.pravatar.cc/150?img=32" />
              <AvatarFallback>MS</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 rounded-full bg-primary p-1.5">
              <Flame className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
          <h3 className="mt-3 text-lg font-semibold">Maria Silva</h3>
          <p className="text-sm text-muted-foreground">Tech Lead • TI</p>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>XP para próximo nível</span>
              <span className="text-xp">2,450 / 3,000</span>
            </div>
            <Progress value={82} className="h-2" />
          </div>
          
          <div className="flex justify-around pt-2">
            <div className="text-center">
              <p className="text-2xl font-bold text-xp">12.5K</p>
              <p className="text-xs text-muted-foreground">XP Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coins">850</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-streak">28</p>
              <p className="text-xs text-muted-foreground">Streak</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-1 pt-2">
            <Badge variant="outline" className="text-xs">
              <Trophy className="mr-1 h-3 w-3 text-amber-500" /> Top 10
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Star className="mr-1 h-3 w-3 text-purple-500" /> Mentor
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Zap className="mr-1 h-3 w-3 text-blue-500" /> Ativo
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

// Mini Profile
export const MiniProfile: StoryObj = {
  render: () => (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <Avatar className="h-10 w-10">
        <AvatarImage src="https://i.pravatar.cc/150?img=45" />
        <AvatarFallback>JP</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-medium">João Pedro</p>
        <p className="text-xs text-muted-foreground">Desenvolvedor Sr.</p>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="flex items-center text-xp">
          <Zap className="mr-1 h-4 w-4" /> 8.2K
        </span>
        <Badge variant="secondary" className="text-xs">Lv 35</Badge>
      </div>
    </div>
  ),
};

// Leaderboard Entry
export const LeaderboardEntry: StoryObj = {
  render: () => (
    <div className="space-y-2 w-96">
      {[
        { pos: 1, name: 'Ana Costa', xp: 15420, trend: 'up', badge: 'gold' },
        { pos: 2, name: 'Carlos Lima', xp: 14850, trend: 'up', badge: 'silver' },
        { pos: 3, name: 'Julia Santos', xp: 13200, trend: 'down', badge: 'bronze' },
        { pos: 4, name: 'Pedro Alves', xp: 12100, trend: 'same', badge: null },
        { pos: 5, name: 'Marina Reis', xp: 11500, trend: 'up', badge: null },
      ].map((user) => (
        <div 
          key={user.pos} 
          className={`flex items-center gap-3 rounded-lg border p-3 ${
            user.pos <= 3 ? 'bg-primary/5 border-primary/20' : 'bg-card'
          }`}
        >
          <span className={`w-6 text-center font-bold ${
            user.pos === 1 ? 'text-amber-500' : 
            user.pos === 2 ? 'text-slate-400' : 
            user.pos === 3 ? 'text-amber-700' : 'text-muted-foreground'
          }`}>
            #{user.pos}
          </span>
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://i.pravatar.cc/150?img=${user.pos + 50}`} />
            <AvatarFallback>{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-xp">{user.xp.toLocaleString()} XP</span>
            {user.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
            {user.trend === 'down' && <TrendingUp className="h-4 w-4 rotate-180 text-destructive" />}
          </div>
        </div>
      ))}
    </div>
  ),
};

// Team Avatar Group
export const TeamAvatarGroup: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Time pequeno:</p>
        <div className="flex -space-x-2">
          {[1, 2, 3].map((i) => (
            <Avatar key={i} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 60}`} />
              <AvatarFallback>U{i}</AvatarFallback>
            </Avatar>
          ))}
        </div>
      </div>
      
      <div>
        <p className="mb-2 text-sm text-muted-foreground">Time médio com contador:</p>
        <div className="flex -space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <Avatar key={i} className="h-8 w-8 border-2 border-background">
              <AvatarImage src={`https://i.pravatar.cc/150?img=${i + 70}`} />
              <AvatarFallback>U{i}</AvatarFallback>
            </Avatar>
          ))}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
            +5
          </div>
        </div>
      </div>
    </div>
  ),
};
