import type { Meta, StoryObj } from "@storybook/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Bell, Trophy, Star, MessageSquare, Calendar, 
  CheckCircle2, AlertCircle, Info, Zap, Gift,
  UserPlus, BookOpen, Target, X
} from "lucide-react";

const meta: Meta = {
  title: "Feedback/Notifications",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Sistema de notificações para feedback visual e alertas.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Toast Notifications
interface ToastProps {
  type: "success" | "error" | "warning" | "info" | "xp" | "achievement";
  title: string;
  description?: string;
}

const toastConfig = {
  success: { icon: CheckCircle2, bg: "bg-success", iconColor: "text-success" },
  error: { icon: AlertCircle, bg: "bg-destructive", iconColor: "text-destructive" },
  warning: { icon: AlertCircle, bg: "bg-warning", iconColor: "text-warning" },
  info: { icon: Info, bg: "bg-primary", iconColor: "text-primary" },
  xp: { icon: Zap, bg: "bg-xp", iconColor: "text-xp" },
  achievement: { icon: Trophy, bg: "bg-coins", iconColor: "text-coins" },
};

const Toast = ({ type, title, description }: ToastProps) => {
  const config = toastConfig[type];
  const Icon = config.icon;

  return (
    <div className="w-80 flex items-start gap-3 p-4 rounded-lg bg-card border shadow-lg animate-slide-in-right">
      <div className={`w-8 h-8 rounded-full ${config.bg}/20 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${config.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <button className="text-muted-foreground hover:text-foreground">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

export const SuccessToast: Story = {
  render: () => <Toast type="success" title="Tarefa concluída!" description="Você ganhou +50 XP" />,
};

export const ErrorToast: Story = {
  render: () => <Toast type="error" title="Erro ao salvar" description="Tente novamente mais tarde" />,
};

export const XPToast: Story = {
  render: () => <Toast type="xp" title="+100 XP" description="Bônus de sequência ativado!" />,
};

export const AchievementToast: Story = {
  render: () => <Toast type="achievement" title="Conquista Desbloqueada!" description="Maratonista - Complete 10 treinamentos" />,
};

export const AllToasts: Story = {
  render: () => (
    <div className="space-y-3">
      <Toast type="success" title="Tarefa concluída!" description="Você ganhou +50 XP" />
      <Toast type="error" title="Erro ao salvar" description="Tente novamente mais tarde" />
      <Toast type="warning" title="Atenção" description="Sua sessão expira em 5 minutos" />
      <Toast type="info" title="Nova funcionalidade" description="Confira as novidades do mês" />
      <Toast type="xp" title="+100 XP" description="Bônus de sequência ativado!" />
      <Toast type="achievement" title="Conquista Desbloqueada!" description="Maratonista - Complete 10 treinamentos" />
    </div>
  ),
};

// Notification Center Item
interface NotificationItemProps {
  icon: typeof Bell;
  iconBg: string;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  action?: { label: string; onClick: () => void };
}

const NotificationItem = ({ 
  icon: Icon, iconBg, title, description, time, unread, action 
}: NotificationItemProps) => (
  <div className={`flex items-start gap-3 p-4 border-b last:border-0 ${
    unread ? 'bg-primary/5' : ''
  }`}>
    <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center flex-shrink-0`}>
      <Icon className="h-5 w-5 text-white" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm ${unread ? 'font-semibold' : ''}`}>{title}</p>
        {unread && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />}
      </div>
      <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-muted-foreground">{time}</span>
        {action && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs">
            {action.label}
          </Button>
        )}
      </div>
    </div>
  </div>
);

// Notification Center
const NotificationCenter = () => (
  <Card className="w-96">
    <div className="flex items-center justify-between p-4 border-b">
      <h3 className="font-semibold">Notificações</h3>
      <Badge>3 novas</Badge>
    </div>
    <div className="max-h-96 overflow-auto">
      <NotificationItem
        icon={Trophy}
        iconBg="bg-coins"
        title="Conquista Desbloqueada!"
        description="Você completou 'Primeiro Login' e ganhou 50 XP"
        time="Agora"
        unread
      />
      <NotificationItem
        icon={Star}
        iconBg="bg-warning"
        title="Novo Kudos Recebido"
        description="Ana Silva te enviou um kudos: 'Excelente apresentação!'"
        time="5 min atrás"
        unread
        action={{ label: "Ver kudos", onClick: () => {} }}
      />
      <NotificationItem
        icon={Target}
        iconBg="bg-primary"
        title="Quest Disponível"
        description="Nova quest semanal: Complete 5 treinamentos"
        time="1h atrás"
        unread
      />
      <NotificationItem
        icon={Calendar}
        iconBg="bg-accent"
        title="Lembrete de Check-in"
        description="Não esqueça de fazer seu check-in de 1:1 amanhã"
        time="3h atrás"
      />
      <NotificationItem
        icon={BookOpen}
        iconBg="bg-success"
        title="Treinamento Concluído"
        description="Parabéns! Você completou 'Liderança 101'"
        time="Ontem"
      />
    </div>
    <div className="p-3 border-t">
      <Button variant="ghost" size="sm" className="w-full">
        Ver todas as notificações
      </Button>
    </div>
  </Card>
);

export const NotificationCenterPanel: Story = {
  render: () => <NotificationCenter />,
};

// Inline Alerts
interface AlertProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const alertConfig = {
  success: { icon: CheckCircle2, bg: "bg-success/10", border: "border-success/30", text: "text-success" },
  error: { icon: AlertCircle, bg: "bg-destructive/10", border: "border-destructive/30", text: "text-destructive" },
  warning: { icon: AlertCircle, bg: "bg-warning/10", border: "border-warning/30", text: "text-warning" },
  info: { icon: Info, bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
};

const Alert = ({ type, title, description, action }: AlertProps) => {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <div className={`w-80 flex items-start gap-3 p-4 rounded-lg ${config.bg} border ${config.border}`}>
      <Icon className={`h-5 w-5 ${config.text} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className={`font-medium text-sm ${config.text}`}>{title}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {action && (
          <Button variant="link" size="sm" className={`h-auto p-0 mt-2 ${config.text}`}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
};

export const Alerts: Story = {
  render: () => (
    <div className="space-y-3">
      <Alert 
        type="success" 
        title="Perfil atualizado com sucesso!" 
        description="Suas alterações foram salvas."
      />
      <Alert 
        type="error" 
        title="Falha ao carregar dados" 
        description="Verifique sua conexão e tente novamente."
        action={{ label: "Tentar novamente", onClick: () => {} }}
      />
      <Alert 
        type="warning" 
        title="Sua senha expira em 7 dias" 
        description="Atualize sua senha para manter o acesso."
        action={{ label: "Atualizar senha", onClick: () => {} }}
      />
      <Alert 
        type="info" 
        title="Nova versão disponível" 
        description="Atualize para ter acesso às novas funcionalidades."
      />
    </div>
  ),
};

// Activity Feed Notification
const ActivityFeedItem = ({ 
  avatar, name, action, target, time, xp 
}: {
  avatar?: string;
  name: string;
  action: string;
  target: string;
  time: string;
  xp?: number;
}) => (
  <div className="flex items-start gap-3 p-3">
    <Avatar className="h-8 w-8">
      <AvatarImage src={avatar} />
      <AvatarFallback>{name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
    </Avatar>
    <div className="flex-1 min-w-0">
      <p className="text-sm">
        <span className="font-medium">{name}</span>
        <span className="text-muted-foreground"> {action} </span>
        <span className="font-medium">{target}</span>
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">{time}</span>
        {xp && <Badge variant="outline" className="text-xs text-xp">+{xp} XP</Badge>}
      </div>
    </div>
  </div>
);

export const ActivityFeed: Story = {
  render: () => (
    <Card className="w-80">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Atividade Recente</h3>
      </div>
      <div className="divide-y">
        <ActivityFeedItem 
          name="João Silva"
          action="completou a quest"
          target="Mentor do Mês"
          time="2 min"
          xp={200}
        />
        <ActivityFeedItem 
          name="Maria Santos"
          action="subiu para"
          target="Nível 15"
          time="15 min"
        />
        <ActivityFeedItem 
          name="Pedro Oliveira"
          action="enviou kudos para"
          target="Ana Costa"
          time="1h"
          xp={10}
        />
        <ActivityFeedItem 
          name="Lucia Ferreira"
          action="desbloqueou"
          target="Badge Maratonista"
          time="2h"
        />
      </div>
    </Card>
  ),
};
