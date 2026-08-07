import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Target, Clock, Users, Zap, CheckCircle2, 
  BookOpen, MessageSquare, Award, Star, Lock 
} from "lucide-react";

const meta: Meta = {
  title: "Gamification/Quests",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Cards e componentes de missões e quests gamificadas.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Quest Card
interface QuestProps {
  title: string;
  description: string;
  progress: number;
  total: number;
  xp: number;
  coins: number;
  difficulty: "easy" | "medium" | "hard" | "legendary";
  deadline?: string;
  icon: typeof Target;
  status: "active" | "completed" | "locked";
}

const difficultyConfig = {
  easy: { label: "Fácil", color: "bg-success text-success-foreground" },
  medium: { label: "Médio", color: "bg-warning text-warning-foreground" },
  hard: { label: "Difícil", color: "bg-destructive text-destructive-foreground" },
  legendary: { label: "Lendário", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
};

const QuestCard = ({ 
  title, description, progress, total, xp, coins, 
  difficulty, deadline, icon: Icon, status 
}: QuestProps) => {
  const percentage = (progress / total) * 100;
  const config = difficultyConfig[difficulty];

  return (
    <Card className={`w-80 ${status === 'locked' ? 'opacity-60' : ''} ${status === 'completed' ? 'border-success/50' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            status === 'completed' ? 'bg-success/20' : 'bg-primary/10'
          }`}>
            {status === 'locked' ? (
              <Lock className="h-5 w-5 text-muted-foreground" />
            ) : status === 'completed' ? (
              <CheckCircle2 className="h-5 w-5 text-success" />
            ) : (
              <Icon className="h-5 w-5 text-primary" />
            )}
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>
        <CardTitle className="text-lg mt-2">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        
        {status !== 'locked' && (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso</span>
                <span className="font-medium">{progress}/{total}</span>
              </div>
              <Progress value={percentage} className="h-2" />
            </div>

            {deadline && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Expira em {deadline}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex gap-3">
                <span className="text-sm font-medium text-xp">+{xp} XP</span>
                <span className="text-sm font-medium text-coins">+{coins} coins</span>
              </div>
              {status === 'completed' ? (
                <Badge variant="outline" className="text-success border-success">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completa
                </Badge>
              ) : (
                <Button size="sm" variant="ghost">Ver detalhes</Button>
              )}
            </div>
          </>
        )}

        {status === 'locked' && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            <Lock className="h-6 w-6 mx-auto mb-2" />
            Complete quests anteriores para desbloquear
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const ActiveQuest: Story = {
  render: () => (
    <QuestCard
      title="Mentor do Mês"
      description="Ajude 5 colegas respondendo dúvidas no fórum interno"
      progress={3}
      total={5}
      xp={200}
      coins={100}
      difficulty="medium"
      deadline="3 dias"
      icon={MessageSquare}
      status="active"
    />
  ),
};

export const CompletedQuest: Story = {
  render: () => (
    <QuestCard
      title="Primeiro Treinamento"
      description="Complete seu primeiro módulo de treinamento"
      progress={1}
      total={1}
      xp={50}
      coins={25}
      difficulty="easy"
      icon={BookOpen}
      status="completed"
    />
  ),
};

export const LockedQuest: Story = {
  render: () => (
    <QuestCard
      title="Campeão da Equipe"
      description="Lidere sua equipe ao primeiro lugar do ranking mensal"
      progress={0}
      total={1}
      xp={1000}
      coins={500}
      difficulty="legendary"
      icon={Award}
      status="locked"
    />
  ),
};

export const QuestList: Story = {
  render: () => (
    <div className="space-y-4">
      <QuestCard
        title="Primeiro Treinamento"
        description="Complete seu primeiro módulo de treinamento"
        progress={1}
        total={1}
        xp={50}
        coins={25}
        difficulty="easy"
        icon={BookOpen}
        status="completed"
      />
      <QuestCard
        title="Mentor do Mês"
        description="Ajude 5 colegas respondendo dúvidas no fórum"
        progress={3}
        total={5}
        xp={200}
        coins={100}
        difficulty="medium"
        deadline="3 dias"
        icon={MessageSquare}
        status="active"
      />
      <QuestCard
        title="Campeão da Equipe"
        description="Lidere sua equipe ao primeiro lugar"
        progress={0}
        total={1}
        xp={1000}
        coins={500}
        difficulty="legendary"
        icon={Award}
        status="locked"
      />
    </div>
  ),
};

// Daily Missions
interface DailyMissionProps {
  title: string;
  completed: boolean;
  xp: number;
  icon: typeof Target;
}

const DailyMission = ({ title, completed, xp, icon: Icon }: DailyMissionProps) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border ${
    completed ? 'bg-success/5 border-success/30' : 'bg-card'
  }`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
      completed ? 'bg-success' : 'bg-muted'
    }`}>
      {completed ? (
        <CheckCircle2 className="h-4 w-4 text-white" />
      ) : (
        <Icon className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
    <span className={`flex-1 text-sm ${completed ? 'line-through text-muted-foreground' : ''}`}>
      {title}
    </span>
    <span className={`text-sm font-medium ${completed ? 'text-muted-foreground' : 'text-xp'}`}>
      +{xp} XP
    </span>
  </div>
);

const DailyMissions = () => (
  <Card className="w-80">
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          Missões Diárias
        </CardTitle>
        <Badge variant="outline">3/5</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-2">
      <DailyMission title="Fazer check-in" completed={true} xp={10} icon={CheckCircle2} />
      <DailyMission title="Completar 1 tarefa" completed={true} xp={20} icon={Target} />
      <DailyMission title="Enviar um kudos" completed={true} xp={15} icon={Star} />
      <DailyMission title="Ler um anúncio" completed={false} xp={5} icon={BookOpen} />
      <DailyMission title="Participar de reunião" completed={false} xp={25} icon={Users} />
      <div className="pt-2 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Bônus ao completar todas:</span>
          <span className="font-medium text-xp">+50 XP</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const DailyMissionsCard: Story = {
  render: () => <DailyMissions />,
};

// Weekly Challenge
const WeeklyChallenge = () => (
  <Card className="w-80 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
    <CardHeader className="pb-2">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
          <Target className="h-5 w-5 text-white" />
        </div>
        <div>
          <Badge className="mb-1 bg-gradient-primary text-white">Desafio Semanal</Badge>
          <CardTitle className="text-lg">Sprint de Produtividade</CardTitle>
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Complete 20 tarefas esta semana para ganhar recompensas exclusivas!
      </p>
      
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span>Progresso</span>
          <span className="font-bold">14/20 tarefas</span>
        </div>
        <Progress value={70} className="h-3" />
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span>Termina em 3 dias</span>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t">
        <div className="text-center p-2 rounded-lg bg-card">
          <span className="block text-lg font-bold text-xp">500</span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>
        <div className="text-center p-2 rounded-lg bg-card">
          <span className="block text-lg font-bold text-coins">250</span>
          <span className="text-xs text-muted-foreground">Coins</span>
        </div>
        <div className="text-center p-2 rounded-lg bg-card">
          <Award className="h-6 w-6 mx-auto text-purple-500" />
          <span className="text-xs text-muted-foreground">Badge</span>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const WeeklyChallengeCard: Story = {
  render: () => <WeeklyChallenge />,
};
