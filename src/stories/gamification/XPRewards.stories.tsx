import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap, Flame, Award, Target } from "lucide-react";

const meta: Meta = {
  title: "Gamification/XP & Rewards",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Componentes de gamificação para XP, recompensas e progressão.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// XP Progress Bar with shimmer effect
const XPProgressBar = ({ current, max, level }: { current: number; max: number; level: number }) => (
  <div className="w-80 space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-muted-foreground">Nível {level}</span>
      <span className="text-sm font-bold text-xp">{current.toLocaleString()} / {max.toLocaleString()} XP</span>
    </div>
    <div className="relative h-4 rounded-full bg-muted overflow-hidden">
      <div 
        className="h-full bg-gradient-xp rounded-full transition-all duration-500 animate-xp-shimmer"
        style={{ width: `${(current / max) * 100}%` }}
      />
    </div>
    <p className="text-xs text-muted-foreground text-center">
      Faltam {(max - current).toLocaleString()} XP para o próximo nível
    </p>
  </div>
);

export const XPBar: Story = {
  render: () => (
    <div className="space-y-6">
      <XPProgressBar current={2450} max={5000} level={12} />
      <XPProgressBar current={4800} max={5000} level={12} />
      <XPProgressBar current={500} max={5000} level={1} />
    </div>
  ),
};

// Coin Display
const CoinDisplay = ({ amount, change }: { amount: number; change?: number }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-coins/10 border border-coins/20">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-coins to-yellow-600 flex items-center justify-center animate-coin-shine">
      <span className="text-white font-bold text-sm">$</span>
    </div>
    <div>
      <span className="font-bold text-coins text-lg">{amount.toLocaleString()}</span>
      {change && (
        <span className={`ml-2 text-sm ${change > 0 ? 'text-success' : 'text-destructive'}`}>
          {change > 0 ? '+' : ''}{change}
        </span>
      )}
    </div>
  </div>
);

export const Coins: Story = {
  render: () => (
    <div className="space-y-4">
      <CoinDisplay amount={1250} />
      <CoinDisplay amount={3500} change={100} />
      <CoinDisplay amount={850} change={-50} />
    </div>
  ),
};

// Streak Counter
const StreakCounter = ({ days, isActive }: { days: number; isActive: boolean }) => (
  <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
    isActive ? 'bg-streak/10 border-streak/30' : 'bg-muted/50 border-border'
  }`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      isActive ? 'bg-streak animate-streak-pulse' : 'bg-muted'
    }`}>
      <Flame className={`h-5 w-5 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
    </div>
    <div>
      <div className={`text-2xl font-bold ${isActive ? 'text-streak' : 'text-muted-foreground'}`}>
        {days} dias
      </div>
      <div className="text-xs text-muted-foreground">
        {isActive ? 'Sequência ativa!' : 'Sequência perdida'}
      </div>
    </div>
  </div>
);

export const Streaks: Story = {
  render: () => (
    <div className="space-y-4">
      <StreakCounter days={15} isActive={true} />
      <StreakCounter days={7} isActive={true} />
      <StreakCounter days={0} isActive={false} />
    </div>
  ),
};

// Achievement Unlock Animation
const AchievementUnlock = ({ name, description, rarity, xp, coins }: {
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  xp: number;
  coins: number;
}) => {
  const rarityColors = {
    common: "from-gray-400 to-gray-600",
    rare: "from-blue-400 to-blue-600",
    epic: "from-purple-400 to-purple-600",
    legendary: "from-amber-400 to-orange-600",
  };

  return (
    <Card className="w-80 overflow-hidden animate-level-up">
      <div className={`h-2 bg-gradient-to-r ${rarityColors[rarity]}`} />
      <CardContent className="p-4 text-center">
        <div className={`w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br ${rarityColors[rarity]} flex items-center justify-center`}>
          <Trophy className="h-8 w-8 text-white" />
        </div>
        <Badge variant="outline" className="mb-2 capitalize">{rarity}</Badge>
        <h3 className="font-bold text-lg">{name}</h3>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <div className="flex justify-center gap-4">
          <span className="text-sm font-medium text-xp">+{xp} XP</span>
          <span className="text-sm font-medium text-coins">+{coins} coins</span>
        </div>
      </CardContent>
    </Card>
  );
};

export const AchievementUnlocks: Story = {
  render: () => (
    <div className="space-y-4">
      <AchievementUnlock 
        name="Primeiro Login" 
        description="Faça seu primeiro acesso na plataforma"
        rarity="common"
        xp={50}
        coins={25}
      />
      <AchievementUnlock 
        name="Maratonista" 
        description="Complete 10 treinamentos seguidos"
        rarity="epic"
        xp={500}
        coins={250}
      />
      <AchievementUnlock 
        name="Lenda Viva" 
        description="Alcance o nível máximo"
        rarity="legendary"
        xp={5000}
        coins={2500}
      />
    </div>
  ),
};

// Level Up Card
const LevelUpCard = ({ newLevel, title, perks }: {
  newLevel: number;
  title: string;
  perks: string[];
}) => (
  <Card className="w-80 bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30 animate-level-up">
    <CardContent className="p-6 text-center">
      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{newLevel}</span>
      </div>
      <h2 className="text-2xl font-bold mb-1">Level Up!</h2>
      <p className="text-lg text-primary font-medium mb-4">{title}</p>
      <div className="space-y-2 text-left">
        {perks.map((perk, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-coins" />
            <span>{perk}</span>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export const LevelUp: Story = {
  render: () => (
    <LevelUpCard 
      newLevel={15}
      title="Especialista"
      perks={[
        "Multiplicador de XP +10%",
        "Acesso a quests exclusivas",
        "Novo avatar desbloqueado",
      ]}
    />
  ),
};

// Reward Card
const RewardCard = ({ title, description, cost, icon: Icon, available }: {
  title: string;
  description: string;
  cost: number;
  icon: typeof Trophy;
  available: boolean;
}) => (
  <Card className={`w-64 ${!available ? 'opacity-50' : 'hover:shadow-lg transition-shadow'}`}>
    <CardContent className="p-4 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>
      <div className="flex items-center justify-center gap-1">
        <span className="font-bold text-coins">{cost}</span>
        <span className="text-sm text-muted-foreground">coins</span>
      </div>
    </CardContent>
  </Card>
);

export const RewardShop: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4">
      <RewardCard 
        title="Day Off" 
        description="Ganhe um dia de folga extra"
        cost={5000}
        icon={Star}
        available={true}
      />
      <RewardCard 
        title="Vale Almoço" 
        description="Vale refeição de R$50"
        cost={1000}
        icon={Award}
        available={true}
      />
      <RewardCard 
        title="Mentoria VIP" 
        description="1h com executivo C-level"
        cost={10000}
        icon={Target}
        available={false}
      />
      <RewardCard 
        title="Boost XP" 
        description="2x XP por 24 horas"
        cost={500}
        icon={Zap}
        available={true}
      />
    </div>
  ),
};
