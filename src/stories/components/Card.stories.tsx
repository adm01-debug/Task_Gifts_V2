import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Zap, Target, Clock, Users } from "lucide-react";

const meta: Meta<typeof Card> = {
  title: "Components/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Cards para exibir conteúdo estruturado como quests, conquistas e métricas.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">Card content with any elements you need.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const QuestCard: Story = {
  render: () => (
    <Card className="w-[350px] border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            <Target className="mr-1 h-3 w-3" />
            Quest Diária
          </Badge>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            6h restantes
          </span>
        </div>
        <CardTitle className="text-lg mt-2">Completar 3 Tarefas</CardTitle>
        <CardDescription>Finalize três tarefas do seu backlog hoje</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">2/3</span>
          </div>
          <Progress value={66} className="h-2" />
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1 text-sm">
            <Zap className="h-4 w-4 text-xp" />
            <span className="font-semibold text-xp">+100 XP</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-coins font-semibold">+25 🪙</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Completar Quest</Button>
      </CardFooter>
    </Card>
  ),
};

export const AchievementCard: Story = {
  render: () => (
    <Card className="w-[350px] border-rank-gold/30 bg-gradient-to-br from-card to-rank-gold/10">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-rank-gold to-amber-400 flex items-center justify-center mb-2">
          <Trophy className="h-8 w-8 text-background" />
        </div>
        <Badge className="mx-auto bg-rank-gold/20 text-rank-gold border-rank-gold/30">
          Lendário
        </Badge>
        <CardTitle className="mt-2">Mestre das Quests</CardTitle>
        <CardDescription>Complete 100 quests no total</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex justify-center gap-6">
          <div>
            <p className="text-2xl font-bold text-xp">+500</p>
            <p className="text-xs text-muted-foreground">XP</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-coins">+100</p>
            <p className="text-xs text-muted-foreground">Coins</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const StatsCard: Story = {
  render: () => (
    <Card className="w-[200px]">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="h-4 w-4 text-primary" />
          </div>
          <CardDescription>Colaboradores</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">1,234</p>
        <p className="text-xs text-success flex items-center gap-1">
          ↑ 12% este mês
        </p>
      </CardContent>
    </Card>
  ),
};

export const GlassCard: Story = {
  render: () => (
    <div className="p-8 bg-gradient-to-br from-primary/30 to-accent/30 rounded-lg">
      <Card className="w-[350px] backdrop-blur-xl bg-background/30 border-white/10">
        <CardHeader>
          <CardTitle className="text-foreground">Glassmorphism Card</CardTitle>
          <CardDescription>Efeito de vidro fosco para overlays</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80">
            Usado em modais, tooltips e elementos flutuantes para criar profundidade visual.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};
