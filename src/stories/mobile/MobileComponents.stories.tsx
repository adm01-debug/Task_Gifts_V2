import type { Meta, StoryObj } from "@storybook/react";
import { PullToRefresh } from "@/components/mobile/PullToRefresh";
import { SwipeableCard } from "@/components/mobile/SwipeableCard";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { NetworkStatusBar } from "@/components/mobile/NetworkStatusBar";
import { SwipeableListItem } from "@/components/mobile/SwipeableListItem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Trash2, Star, Bell } from "lucide-react";

const meta: Meta = {
  title: "Mobile/Components",
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        component: "Componentes otimizados para mobile com gestos nativos e feedback tátil.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const PullToRefreshDemo: Story = {
  render: () => (
    <div className="h-[500px] bg-background">
      <PullToRefresh
        onRefresh={async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }}
      >
        <div className="p-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pull to Refresh</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Arraste para baixo para atualizar o conteúdo. 
                Funciona com feedback tátil em dispositivos compatíveis.
              </p>
            </CardContent>
          </Card>
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Item {i}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </PullToRefresh>
    </div>
  ),
};

export const SwipeableCardDemo: Story = {
  render: () => (
    <div className="p-4 space-y-4 bg-background min-h-[400px]">
      <p className="text-sm text-muted-foreground mb-4">
        Arraste os cards para esquerda ou direita para revelar ações
      </p>
      
      <SwipeableCard
        leftActions={[
          {
            action: "complete",
            icon: <Check className="h-5 w-5" />,
            label: "Completar",
            color: "bg-success",
            onAction: () => console.log("Complete!"),
          },
        ]}
        rightActions={[
          {
            action: "delete",
            icon: <Trash2 className="h-5 w-5" />,
            label: "Excluir",
            color: "bg-destructive",
            onAction: () => console.log("Delete!"),
          },
        ]}
      >
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium">Quest: Completar 3 tarefas</h4>
            <p className="text-sm text-muted-foreground">+100 XP • 2/3 completas</p>
          </CardContent>
        </Card>
      </SwipeableCard>

      <SwipeableCard
        leftActions={[
          {
            action: "custom",
            icon: <Star className="h-5 w-5" />,
            label: "Favoritar",
            color: "bg-warning",
            onAction: () => console.log("Favorite!"),
          },
        ]}
        rightActions={[
          {
            action: "custom",
            icon: <Bell className="h-5 w-5" />,
            label: "Lembrar",
            color: "bg-primary",
            onAction: () => console.log("Remind!"),
          },
        ]}
      >
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium">Trilha de Liderança</h4>
            <p className="text-sm text-muted-foreground">8/12 módulos • 67% concluído</p>
          </CardContent>
        </Card>
      </SwipeableCard>
    </div>
  ),
};

export const SwipeableListDemo: Story = {
  render: () => (
    <div className="bg-background min-h-[400px]">
      <div className="p-4">
        <h3 className="font-semibold mb-2">Lista com Swipe</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Arraste itens para revelar ações rápidas
        </p>
      </div>
      
      <div className="divide-y divide-border">
        {["Tarefa 1", "Tarefa 2", "Tarefa 3"].map((task, i) => (
          <SwipeableListItem
            key={i}
            leftAction={{
              icon: <Check className="h-5 w-5" />,
              label: "Concluir",
              color: "bg-success",
              onAction: () => console.log(`Complete ${task}`),
            }}
            rightAction={{
              icon: <Trash2 className="h-5 w-5" />,
              label: "Excluir",
              color: "bg-destructive",
              onAction: () => console.log(`Delete ${task}`),
            }}
          >
            <div className="p-4 bg-card">
              <h4 className="font-medium">{task}</h4>
              <p className="text-sm text-muted-foreground">Descrição da tarefa</p>
            </div>
          </SwipeableListItem>
        ))}
      </div>
    </div>
  ),
};

export const NetworkStatusDemo: Story = {
  render: () => (
    <div className="relative h-[200px] bg-background">
      <NetworkStatusBar position="top" />
      <div className="p-4 pt-12">
        <p className="text-muted-foreground">
          A barra de status aparece automaticamente quando há problemas de conexão
          ou requisições lentas.
        </p>
      </div>
    </div>
  ),
};

export const BottomNavDemo: Story = {
  render: () => (
    <div className="relative h-[600px] bg-background">
      <div className="p-4 pb-20">
        <h3 className="font-semibold mb-2">Mobile Bottom Navigation</h3>
        <p className="text-muted-foreground">
          Navegação fixa na parte inferior com ícones e labels.
          Destaque visual para item ativo e badges para notificações.
        </p>
      </div>
      <MobileBottomNav />
    </div>
  ),
};
