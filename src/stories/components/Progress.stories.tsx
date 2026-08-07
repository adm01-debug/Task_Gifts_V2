import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/components/ui/progress";
import { Zap, Target, BookOpen, Trophy } from "lucide-react";

const meta: Meta<typeof Progress> = {
  title: "Components/Progress",
  component: Progress,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Barras de progresso para XP, quests e metas com animações de gamificação.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100 },
      description: "Valor do progresso (0-100)",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 60,
    className: "w-[300px]",
  },
};

export const XPBar: Story = {
  render: () => (
    <div className="w-[400px] space-y-2">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-full bg-xp/20">
            <Zap className="h-4 w-4 text-xp" />
          </div>
          <span className="font-semibold">Nível 15</span>
        </div>
        <span className="text-sm text-muted-foreground">2,450 / 3,000 XP</span>
      </div>
      <div className="relative">
        <Progress value={82} className="h-4" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        550 XP para o próximo nível
      </p>
    </div>
  ),
};

export const QuestProgress: Story = {
  render: () => (
    <div className="w-[350px] space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Completar 5 tarefas</span>
          </div>
          <span className="text-sm font-semibold">3/5</span>
        </div>
        <Progress value={60} className="h-2" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Estudar por 2 horas</span>
          </div>
          <span className="text-sm font-semibold">1.5h/2h</span>
        </div>
        <Progress value={75} className="h-2" />
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-rank-gold" />
            <span className="text-sm font-medium">Top 10 do ranking</span>
          </div>
          <span className="text-sm font-semibold text-success">✓ Completo</span>
        </div>
        <Progress value={100} className="h-2 [&>div]:bg-success" />
      </div>
    </div>
  ),
};

export const TrailProgress: Story = {
  render: () => (
    <div className="w-[400px] p-4 rounded-lg bg-card border border-border space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <BookOpen className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h4 className="font-semibold">Trilha de Liderança</h4>
          <p className="text-sm text-muted-foreground">8 de 12 módulos completos</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <Progress value={67} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>67% concluído</span>
          <span className="text-xp font-medium">+800 XP disponíveis</span>
        </div>
      </div>
      
      <div className="flex gap-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full ${
              i < 8 ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>
    </div>
  ),
};

export const ProgressSizes: Story = {
  render: () => (
    <div className="w-[300px] space-y-6">
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Extra Small (h-1)</span>
        <Progress value={70} className="h-1" />
      </div>
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Small (h-2)</span>
        <Progress value={70} className="h-2" />
      </div>
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Medium (h-3)</span>
        <Progress value={70} className="h-3" />
      </div>
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Large (h-4)</span>
        <Progress value={70} className="h-4" />
      </div>
      <div className="space-y-2">
        <span className="text-sm text-muted-foreground">Extra Large (h-6)</span>
        <Progress value={70} className="h-6" />
      </div>
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => (
    <div className="w-[300px] space-y-4">
      <div className="space-y-1">
        <span className="text-sm">Default (Primary)</span>
        <Progress value={60} className="h-3" />
      </div>
      <div className="space-y-1">
        <span className="text-sm">Success</span>
        <Progress value={100} className="h-3 [&>div]:bg-success" />
      </div>
      <div className="space-y-1">
        <span className="text-sm">Warning</span>
        <Progress value={40} className="h-3 [&>div]:bg-warning" />
      </div>
      <div className="space-y-1">
        <span className="text-sm">Destructive</span>
        <Progress value={20} className="h-3 [&>div]:bg-destructive" />
      </div>
      <div className="space-y-1">
        <span className="text-sm">XP Gradient</span>
        <Progress value={80} className="h-3 [&>div]:bg-gradient-to-r [&>div]:from-xp [&>div]:to-primary" />
      </div>
    </div>
  ),
};
