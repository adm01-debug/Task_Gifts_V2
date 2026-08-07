import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Inbox, Search, Trophy, Target, Users, FileX, 
  WifiOff, ServerCrash, AlertTriangle, RefreshCw,
  Plus, Sparkles, Rocket, Gift
} from 'lucide-react';

const meta: Meta = {
  title: 'Feedback/Empty & Error States',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Estados vazios e de erro para orientar usuários quando não há dados ou algo deu errado.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Generic empty state
export const EmptyGeneric: StoryObj = {
  render: () => (
    <Card className="w-96">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum item encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Não há dados para exibir no momento.
        </p>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" /> Adicionar novo
        </Button>
      </CardContent>
    </Card>
  ),
};

// Empty search results
export const EmptySearch: StoryObj = {
  render: () => (
    <Card className="w-96">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Nenhum resultado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua busca por "gamificação" não retornou resultados.
        </p>
        <Button variant="outline" className="mt-4">
          Limpar filtros
        </Button>
      </CardContent>
    </Card>
  ),
};

// Empty achievements
export const EmptyAchievements: StoryObj = {
  render: () => (
    <Card className="w-96">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="relative mb-4">
          <div className="rounded-full bg-amber-100 p-4 dark:bg-amber-900/30">
            <Trophy className="h-8 w-8 text-amber-500" />
          </div>
          <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold">Nenhuma conquista ainda</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Complete tarefas e desafios para ganhar suas primeiras conquistas!
        </p>
        <Button className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600">
          <Target className="mr-2 h-4 w-4" /> Ver desafios
        </Button>
      </CardContent>
    </Card>
  ),
};

// Empty team
export const EmptyTeam: StoryObj = {
  render: () => (
    <Card className="w-96">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <Users className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Sua equipe está vazia</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Convide membros para começar a colaborar e competir juntos.
        </p>
        <Button className="mt-4">
          <Plus className="mr-2 h-4 w-4" /> Convidar membros
        </Button>
      </CardContent>
    </Card>
  ),
};

// Empty rewards
export const EmptyRewards: StoryObj = {
  render: () => (
    <Card className="w-96">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="relative mb-4">
          <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900/30">
            <Gift className="h-8 w-8 text-purple-500" />
          </div>
        </div>
        <h3 className="text-lg font-semibold">Nenhuma recompensa resgatada</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Você tem <span className="font-bold text-coins">850 coins</span> disponíveis!
        </p>
        <Button className="mt-4" variant="outline">
          <Rocket className="mr-2 h-4 w-4" /> Explorar loja
        </Button>
      </CardContent>
    </Card>
  ),
};

// Error - Connection lost
export const ErrorConnection: StoryObj = {
  render: () => (
    <Card className="w-96 border-destructive/50">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <WifiOff className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Sem conexão</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Verifique sua conexão com a internet e tente novamente.
        </p>
        <Button variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
        </Button>
      </CardContent>
    </Card>
  ),
};

// Error - Server error
export const ErrorServer: StoryObj = {
  render: () => (
    <Card className="w-96 border-destructive/50">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-4">
          <ServerCrash className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-lg font-semibold">Erro no servidor</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Algo deu errado do nosso lado. Nossa equipe já foi notificada.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Recarregar
          </Button>
          <Button variant="ghost">Reportar</Button>
        </div>
      </CardContent>
    </Card>
  ),
};

// Error - Not found
export const ErrorNotFound: StoryObj = {
  render: () => (
    <Card className="w-96">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <FileX className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Página não encontrada</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          O conteúdo que você procura não existe ou foi movido.
        </p>
        <Button className="mt-4">Voltar ao início</Button>
      </CardContent>
    </Card>
  ),
};

// Warning state
export const WarningState: StoryObj = {
  render: () => (
    <Card className="w-96 border-warning/50 bg-warning/5">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-4 rounded-full bg-warning/20 p-4">
          <AlertTriangle className="h-8 w-8 text-warning" />
        </div>
        <h3 className="text-lg font-semibold">Atenção necessária</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Sua sessão expira em 5 minutos. Salve seu trabalho.
        </p>
        <div className="mt-4 flex gap-2">
          <Button>Renovar sessão</Button>
          <Button variant="ghost">Salvar e sair</Button>
        </div>
      </CardContent>
    </Card>
  ),
};

// Empty with illustration placeholder
export const EmptyWithIllustration: StoryObj = {
  render: () => (
    <Card className="w-[480px]">
      <CardContent className="flex flex-col items-center py-12 text-center">
        <div className="mb-6 flex h-48 w-48 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="text-center">
            <Rocket className="mx-auto h-16 w-16 text-primary/60" />
            <p className="mt-2 text-xs text-muted-foreground">Ilustração</p>
          </div>
        </div>
        <h3 className="text-xl font-semibold">Pronto para começar?</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Este é um ótimo momento para criar seu primeiro projeto e começar sua jornada de gamificação.
        </p>
        <Button size="lg" className="mt-6">
          <Sparkles className="mr-2 h-4 w-4" /> Criar primeiro projeto
        </Button>
      </CardContent>
    </Card>
  ),
};
