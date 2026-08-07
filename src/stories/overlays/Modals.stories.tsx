import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, AlertTriangle, Settings, Plus, Trash2, Star, Gift } from "lucide-react";

const meta: Meta = {
  title: "Overlays/Modals",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Componentes de overlay: modais, dialogs, sheets e alerts.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Basic Dialog
export const BasicDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Abrir Dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Faça alterações no seu perfil aqui. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" defaultValue="João Silva" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue="@joaosilva" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Salvar alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Alert Dialog
export const ConfirmationDialog: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2 className="h-4 w-4 mr-2" />
          Excluir conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Tem certeza absoluta?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Isso excluirá permanentemente sua conta
            e removerá seus dados de nossos servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive hover:bg-destructive/90">
            Sim, excluir conta
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// Sheet (Slide-over)
export const SideSheet: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Configurações
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configurações</SheetTitle>
          <SheetDescription>
            Ajuste suas preferências e configurações da conta.
          </SheetDescription>
        </SheetHeader>
        <div className="py-6 space-y-6">
          <div className="space-y-2">
            <Label>Idioma</Label>
            <Select defaultValue="pt">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tema</Label>
            <Select defaultValue="system">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Claro</SelectItem>
                <SelectItem value="dark">Escuro</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Fuso Horário</Label>
            <Select defaultValue="brt">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brt">Brasília (GMT-3)</SelectItem>
                <SelectItem value="utc">UTC</SelectItem>
                <SelectItem value="pst">Pacific (GMT-8)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter>
          <Button className="w-full">Salvar configurações</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
};

// Create Quest Modal
export const CreateQuestModal: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Quest
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Criar Nova Quest
          </DialogTitle>
          <DialogDescription>
            Defina os detalhes da quest para sua equipe.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="questTitle">Título da Quest</Label>
            <Input id="questTitle" placeholder="Ex: Sprint de Produtividade" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="questDesc">Descrição</Label>
            <Textarea id="questDesc" placeholder="Descreva o objetivo da quest..." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Fácil</SelectItem>
                  <SelectItem value="medium">Médio</SelectItem>
                  <SelectItem value="hard">Difícil</SelectItem>
                  <SelectItem value="legendary">Lendário</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Prazo (dias)</Label>
              <Input id="deadline" type="number" defaultValue="7" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="xpReward">Recompensa XP</Label>
              <Input id="xpReward" type="number" defaultValue="200" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="coinReward">Recompensa Coins</Label>
              <Input id="coinReward" type="number" defaultValue="100" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>Criar Quest</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Achievement Unlock Modal
export const AchievementModal: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogContent className="sm:max-w-sm text-center">
        <div className="py-6">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center animate-level-up">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <Badge className="mb-3 bg-purple-500">Épico</Badge>
          <DialogHeader className="text-center">
            <DialogTitle className="text-2xl">Conquista Desbloqueada!</DialogTitle>
            <DialogDescription className="text-base">
              Maratonista
            </DialogDescription>
          </DialogHeader>
          <p className="text-muted-foreground mt-2 mb-4">
            Complete 10 treinamentos em uma semana
          </p>
          <div className="flex justify-center gap-6 py-4 border-y">
            <div className="text-center">
              <span className="block text-2xl font-bold text-xp">+500</span>
              <span className="text-sm text-muted-foreground">XP</span>
            </div>
            <div className="text-center">
              <span className="block text-2xl font-bold text-coins">+250</span>
              <span className="text-sm text-muted-foreground">Coins</span>
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-center">
          <Button className="px-8">Incrível!</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Send Kudos Modal
export const SendKudosModal: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Star className="h-4 w-4 mr-2" />
          Enviar Kudos
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-warning" />
            Enviar Kudos
          </DialogTitle>
          <DialogDescription>
            Reconheça um colega por seu trabalho incrível!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Para quem?</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um colega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ana">Ana Silva</SelectItem>
                <SelectItem value="carlos">Carlos Santos</SelectItem>
                <SelectItem value="maria">Maria Oliveira</SelectItem>
                <SelectItem value="pedro">Pedro Costa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <div className="flex flex-wrap gap-2">
              {["Trabalho em Equipe", "Inovação", "Liderança", "Ajuda", "Dedicação"].map((cat) => (
                <Badge key={cat} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="kudosMessage">Mensagem</Label>
            <Textarea id="kudosMessage" placeholder="Por que essa pessoa merece reconhecimento?" rows={3} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline">Cancelar</Button>
          <Button>
            <Star className="h-4 w-4 mr-2" />
            Enviar Kudos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

// Reward Claim Modal
export const ClaimRewardModal: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Gift className="h-4 w-4 mr-2" />
          Resgatar Recompensa
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm text-center">
        <DialogHeader className="text-center pt-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-coins to-yellow-600 flex items-center justify-center">
            <Gift className="h-8 w-8 text-white" />
          </div>
          <DialogTitle>Day Off Extra</DialogTitle>
          <DialogDescription>
            Ganhe um dia de folga para usar quando quiser!
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center justify-center gap-2 text-lg">
            <span className="font-bold text-coins">5.000</span>
            <span className="text-muted-foreground">coins</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Você tem <span className="font-bold text-foreground">7.250</span> coins disponíveis
          </p>
        </div>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline">Voltar</Button>
          <Button>Confirmar Resgate</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
