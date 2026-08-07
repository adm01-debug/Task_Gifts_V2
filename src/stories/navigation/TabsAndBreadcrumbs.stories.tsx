import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { 
  Home, ChevronRight, Trophy, Target, BookOpen, 
  Users, Settings, Bell, User, LayoutDashboard,
  ChevronLeft, ChevronDown
} from "lucide-react";

const meta: Meta = {
  title: "Navigation/Tabs & Breadcrumbs",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Componentes de navegação: tabs, breadcrumbs e pagination.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Basic Tabs
export const BasicTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Conteúdo da visão geral aqui.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="analytics">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Gráficos e métricas aqui.</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="settings">
        <Card>
          <CardContent className="p-4">
            <p className="text-muted-foreground">Opções de configuração aqui.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Tabs with Icons
export const TabsWithIcons: Story = {
  render: () => (
    <Tabs defaultValue="quests" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="quests" className="gap-2">
          <Target className="h-4 w-4" />
          Quests
        </TabsTrigger>
        <TabsTrigger value="achievements" className="gap-2">
          <Trophy className="h-4 w-4" />
          Conquistas
        </TabsTrigger>
        <TabsTrigger value="training" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Treinamentos
        </TabsTrigger>
        <TabsTrigger value="team" className="gap-2">
          <Users className="h-4 w-4" />
          Equipe
        </TabsTrigger>
      </TabsList>
      <TabsContent value="quests">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Suas Quests Ativas</h3>
            <p className="text-muted-foreground">3 quests em andamento</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="achievements">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Conquistas Desbloqueadas</h3>
            <p className="text-muted-foreground">24 de 50 conquistas</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="training">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Trilhas de Aprendizado</h3>
            <p className="text-muted-foreground">5 treinamentos disponíveis</p>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="team">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">Sua Equipe</h3>
            <p className="text-muted-foreground">12 membros</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  ),
};

// Tabs with Badges
export const TabsWithBadges: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-[450px]">
      <TabsList>
        <TabsTrigger value="all">
          Todas
          <Badge variant="secondary" className="ml-2">42</Badge>
        </TabsTrigger>
        <TabsTrigger value="active">
          Ativas
          <Badge className="ml-2 bg-success">12</Badge>
        </TabsTrigger>
        <TabsTrigger value="completed">
          Concluídas
          <Badge variant="outline" className="ml-2">28</Badge>
        </TabsTrigger>
        <TabsTrigger value="expired">
          Expiradas
          <Badge variant="destructive" className="ml-2">2</Badge>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  ),
};

// Vertical Tabs
export const VerticalTabs: Story = {
  render: () => (
    <div className="flex gap-4 w-[500px]">
      <Tabs defaultValue="profile" orientation="vertical" className="flex gap-4">
        <TabsList className="flex-col h-auto">
          <TabsTrigger value="profile" className="w-full justify-start gap-2">
            <User className="h-4 w-4" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="notifications" className="w-full justify-start gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="w-full justify-start gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full justify-start gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>
        <div className="flex-1">
          <TabsContent value="profile">
            <Card>
              <CardContent className="p-4">Configurações de perfil</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notifications">
            <Card>
              <CardContent className="p-4">Preferências de notificação</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="dashboard">
            <Card>
              <CardContent className="p-4">Personalização do dashboard</CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="settings">
            <Card>
              <CardContent className="p-4">Configurações gerais</CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  ),
};

// Breadcrumbs
export const BasicBreadcrumb: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink href="#">Treinamentos</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbPage>Liderança 101</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

export const BreadcrumbWithIcons: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#" className="flex items-center gap-1">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href="#" className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            Quests
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            Sprint de Produtividade
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  ),
};

// Pagination
const Pagination = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2">
    <Button variant="outline" size="icon" disabled={current === 1}>
      <ChevronLeft className="h-4 w-4" />
    </Button>
    {Array.from({ length: Math.min(5, total) }, (_, i) => {
      const page = i + 1;
      return (
        <Button
          key={page}
          variant={page === current ? "default" : "outline"}
          size="icon"
          className="w-10"
        >
          {page}
        </Button>
      );
    })}
    {total > 5 && (
      <>
        <span className="px-2 text-muted-foreground">...</span>
        <Button variant="outline" size="icon" className="w-10">
          {total}
        </Button>
      </>
    )}
    <Button variant="outline" size="icon" disabled={current === total}>
      <ChevronRight className="h-4 w-4" />
    </Button>
  </div>
);

export const PaginationExample: Story = {
  render: () => (
    <div className="space-y-4">
      <Pagination current={1} total={10} />
      <Pagination current={3} total={10} />
      <Pagination current={10} total={10} />
    </div>
  ),
};

// Step Navigation
const StepNavigation = ({ steps, current }: { steps: string[]; current: number }) => (
  <div className="flex items-center gap-2">
    {steps.map((step, i) => (
      <div key={step} className="flex items-center">
        <div className={`flex items-center gap-2 px-3 py-2 rounded-full ${
          i < current ? 'bg-success/10 text-success' :
          i === current ? 'bg-primary text-primary-foreground' :
          'bg-muted text-muted-foreground'
        }`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium ${
            i < current ? 'bg-success text-white' :
            i === current ? 'bg-primary-foreground text-primary' :
            'bg-muted-foreground/20'
          }`}>
            {i < current ? '✓' : i + 1}
          </span>
          <span className="text-sm font-medium">{step}</span>
        </div>
        {i < steps.length - 1 && (
          <div className={`w-8 h-0.5 mx-2 ${i < current ? 'bg-success' : 'bg-muted'}`} />
        )}
      </div>
    ))}
  </div>
);

export const StepNav: Story = {
  render: () => (
    <div className="space-y-8">
      <StepNavigation steps={["Dados", "Verificação", "Conclusão"]} current={0} />
      <StepNavigation steps={["Dados", "Verificação", "Conclusão"]} current={1} />
      <StepNavigation steps={["Dados", "Verificação", "Conclusão"]} current={2} />
    </div>
  ),
};
