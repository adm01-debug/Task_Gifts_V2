import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Star, Trophy, Zap, ArrowRight, MoreHorizontal, Heart, MessageCircle, Share } from 'lucide-react';

const meta: Meta = {
  title: 'Layout/Cards',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Variações de cards para diferentes contextos.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const BasicCard: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Card Básico</CardTitle>
        <CardDescription>Descrição opcional do card</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Conteúdo do card com informações relevantes para o usuário.
        </p>
      </CardContent>
      <CardFooter>
        <Button>Ação Principal</Button>
      </CardFooter>
    </Card>
  ),
};

export const QuestCard: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Completar Treinamento</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">Fácil</Badge>
                <span className="text-xs text-muted-foreground">2 dias restantes</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Complete o módulo de onboarding para desbloquear sua primeira conquista.
        </p>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span className="font-medium">75%</span>
          </div>
          <Progress value={75} className="h-2" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-1 text-xp">
            <Zap className="w-4 h-4" />
            <span className="font-medium">+150 XP</span>
          </div>
          <div className="flex items-center gap-1 text-coins">
            <Star className="w-4 h-4" />
            <span className="font-medium">+50 Coins</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">
          Continuar Quest
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardFooter>
    </Card>
  ),
};

export const UserCard: StoryObj = {
  render: () => (
    <Card className="w-full max-w-sm">
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-20 h-20 mb-4">
            <AvatarImage src="https://i.pravatar.cc/150?img=1" />
            <AvatarFallback>MC</AvatarFallback>
          </Avatar>
          <h3 className="text-lg font-semibold">Maria Costa</h3>
          <p className="text-sm text-muted-foreground">Product Designer</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              Nível 12
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-xp">2,450</p>
              <p className="text-xs text-muted-foreground">XP</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-coins">890</p>
              <p className="text-xs text-muted-foreground">Coins</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">15</p>
              <p className="text-xs text-muted-foreground">Conquistas</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="justify-center gap-2">
        <Button variant="outline" size="sm">Ver Perfil</Button>
        <Button size="sm">Enviar Kudos</Button>
      </CardFooter>
    </Card>
  ),
};

export const StatsCard: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">XP Total</p>
              <p className="text-3xl font-bold text-xp">12,450</p>
              <p className="text-xs text-xp/80 mt-1">+350 esta semana</p>
            </div>
            <div className="w-12 h-12 bg-xp/20 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-xp" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Coins</p>
              <p className="text-3xl font-bold text-coins">3,890</p>
              <p className="text-xs text-coins/80 mt-1">+120 esta semana</p>
            </div>
            <div className="w-12 h-12 bg-coins/20 rounded-full flex items-center justify-center">
              <Star className="w-6 h-6 text-coins" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ranking</p>
              <p className="text-3xl font-bold">#3</p>
              <p className="text-xs text-primary mt-1">↑ 2 posições</p>
            </div>
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const SocialCard: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://i.pravatar.cc/150?img=3" />
            <AvatarFallback>JS</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">João Silva</p>
            <p className="text-xs text-muted-foreground">há 2 horas</p>
          </div>
          <Badge variant="outline" className="text-xp border-xp">
            +100 XP
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">
          🎉 Acabei de completar a trilha de Liderança! Foi uma jornada incrível de aprendizado. 
          Agradeço a todos que me ajudaram nessa conquista!
        </p>
        <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-sm">Conquista Desbloqueada</p>
            <p className="text-xs text-muted-foreground">Líder Nato</p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex items-center gap-4 w-full">
          <Button variant="ghost" size="sm" className="gap-2">
            <Heart className="w-4 h-4" />
            <span>24</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>8</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 ml-auto">
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  ),
};

export const CompactCard: StoryObj = {
  render: () => (
    <div className="space-y-2 max-w-md">
      {[
        { icon: Trophy, title: 'Primeira Vitória', xp: 50, color: 'text-yellow-500' },
        { icon: Star, title: 'Colecionador', xp: 100, color: 'text-purple-500' },
        { icon: Zap, title: 'Velocista', xp: 75, color: 'text-blue-500' },
      ].map((item, i) => (
        <Card key={i} className="hover:bg-muted/50 transition-colors cursor-pointer">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">Conquista desbloqueada</p>
              </div>
              <Badge variant="secondary" className="text-xp">
                +{item.xp} XP
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

export const GlassCard: StoryObj = {
  render: () => (
    <div className="p-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white">Glass Card</CardTitle>
          <CardDescription className="text-white/70">
            Card com efeito de vidro para fundos coloridos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-white/90">
            Perfeito para overlays e destaque de conteúdo premium.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary">Saiba Mais</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};
