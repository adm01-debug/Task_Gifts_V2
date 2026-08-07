import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Zap, Shield, Crown, Flame } from "lucide-react";

const meta: Meta<typeof Badge> = {
  title: "Components/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Badges para status, ranks e conquistas com variantes de gamificação.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
      description: "Variante visual do badge",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  ),
};

export const RankBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge className="bg-rank-bronze/20 text-rank-bronze border-rank-bronze/30">
        <Shield className="mr-1 h-3 w-3" />
        Bronze
      </Badge>
      <Badge className="bg-rank-silver/20 text-rank-silver border-rank-silver/30">
        <Shield className="mr-1 h-3 w-3" />
        Prata
      </Badge>
      <Badge className="bg-rank-gold/20 text-rank-gold border-rank-gold/30">
        <Crown className="mr-1 h-3 w-3" />
        Ouro
      </Badge>
      <Badge className="bg-rank-diamond/20 text-rank-diamond border-rank-diamond/30">
        <Star className="mr-1 h-3 w-3" />
        Diamante
      </Badge>
    </div>
  ),
};

export const AchievementRarity: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="bg-muted">Comum</Badge>
        <span className="text-sm text-muted-foreground">Drop rate: 50%</span>
      </div>
      <div className="flex items-center gap-4">
        <Badge className="bg-success/20 text-success border-success/30">Incomum</Badge>
        <span className="text-sm text-muted-foreground">Drop rate: 30%</span>
      </div>
      <div className="flex items-center gap-4">
        <Badge className="bg-primary/20 text-primary border-primary/30">Raro</Badge>
        <span className="text-sm text-muted-foreground">Drop rate: 15%</span>
      </div>
      <div className="flex items-center gap-4">
        <Badge className="bg-accent/20 text-accent border-accent/30">Épico</Badge>
        <span className="text-sm text-muted-foreground">Drop rate: 4%</span>
      </div>
      <div className="flex items-center gap-4">
        <Badge className="bg-gradient-to-r from-rank-gold to-amber-400 text-background">
          <Trophy className="mr-1 h-3 w-3" />
          Lendário
        </Badge>
        <span className="text-sm text-muted-foreground">Drop rate: 1%</span>
      </div>
    </div>
  ),
};

export const StatusBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge className="bg-success/20 text-success border-success/30">
        Completo
      </Badge>
      <Badge className="bg-warning/20 text-warning border-warning/30">
        Em Progresso
      </Badge>
      <Badge className="bg-muted text-muted-foreground">
        Pendente
      </Badge>
      <Badge variant="destructive">
        Expirado
      </Badge>
    </div>
  ),
};

export const GamificationBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge className="bg-xp/20 text-xp border-xp/30">
        <Zap className="mr-1 h-3 w-3" />
        +150 XP
      </Badge>
      <Badge className="bg-coins/20 text-coins border-coins/30">
        🪙 500 Coins
      </Badge>
      <Badge className="bg-streak/20 text-streak border-streak/30">
        <Flame className="mr-1 h-3 w-3" />
        7 Day Streak
      </Badge>
    </div>
  ),
};

export const LevelBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      {[1, 5, 10, 25, 50, 100].map((level) => (
        <Badge 
          key={level}
          className="bg-gradient-to-r from-primary to-accent text-primary-foreground px-3 py-1"
        >
          Nível {level}
        </Badge>
      ))}
    </div>
  ),
};
