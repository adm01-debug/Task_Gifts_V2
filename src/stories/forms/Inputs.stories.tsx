import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Lock, User, Eye, EyeOff, Search, AlertCircle } from "lucide-react";

const meta: Meta = {
  title: "Forms/Inputs",
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Componentes de formulário para entrada de dados.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

// Basic Inputs
export const TextInputs: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="default">Input Padrão</Label>
        <Input id="default" placeholder="Digite algo..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="disabled">Input Desabilitado</Label>
        <Input id="disabled" placeholder="Não editável" disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="error">Input com Erro</Label>
        <Input id="error" placeholder="Campo obrigatório" className="border-destructive" />
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> Este campo é obrigatório
        </p>
      </div>
    </div>
  ),
};

// Input with Icons
export const InputsWithIcons: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Label>Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="seu@email.com" type="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10 pr-10" placeholder="••••••••" type="password" />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Busca</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar..." />
        </div>
      </div>
    </div>
  ),
};

// Textarea
export const TextareaInput: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Label htmlFor="bio">Biografia</Label>
        <Textarea id="bio" placeholder="Conte um pouco sobre você..." rows={4} />
        <p className="text-xs text-muted-foreground text-right">0/500 caracteres</p>
      </div>
    </div>
  ),
};

// Select
export const SelectInput: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="space-y-2">
        <Label>Departamento</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Selecione um departamento" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ti">Tecnologia</SelectItem>
            <SelectItem value="rh">Recursos Humanos</SelectItem>
            <SelectItem value="vendas">Vendas</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="financeiro">Financeiro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  ),
};

// Checkboxes
export const Checkboxes: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms" className="text-sm">
          Aceito os termos e condições
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="newsletter" defaultChecked />
        <Label htmlFor="newsletter" className="text-sm">
          Receber newsletter semanal
        </Label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="disabled" disabled />
        <Label htmlFor="disabled" className="text-sm text-muted-foreground">
          Opção desabilitada
        </Label>
      </div>
    </div>
  ),
};

// Radio Groups
export const RadioGroups: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <Label>Frequência de notificações</Label>
      <RadioGroup defaultValue="daily">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="realtime" id="realtime" />
          <Label htmlFor="realtime">Tempo real</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="daily" id="daily" />
          <Label htmlFor="daily">Resumo diário</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="weekly" id="weekly" />
          <Label htmlFor="weekly">Resumo semanal</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="none" id="none" />
          <Label htmlFor="none">Desativar</Label>
        </div>
      </RadioGroup>
    </div>
  ),
};

// Switches
export const Switches: Story = {
  render: () => (
    <div className="w-80 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Notificações Push</Label>
          <p className="text-sm text-muted-foreground">Receber alertas no navegador</p>
        </div>
        <Switch defaultChecked />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label>Modo Escuro</Label>
          <p className="text-sm text-muted-foreground">Usar tema escuro</p>
        </div>
        <Switch />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-muted-foreground">Som de Notificações</Label>
          <p className="text-sm text-muted-foreground">Desabilitado pelo admin</p>
        </div>
        <Switch disabled />
      </div>
    </div>
  ),
};

// Complete Form
export const LoginForm: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader className="text-center">
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="email" className="pl-10" placeholder="seu@email.com" type="email" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Senha</Label>
            <a href="#" className="text-xs text-primary hover:underline">Esqueceu a senha?</a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input id="password" className="pl-10" placeholder="••••••••" type="password" />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="remember" />
          <Label htmlFor="remember" className="text-sm">Lembrar de mim</Label>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-3">
        <Button className="w-full">Entrar</Button>
        <p className="text-sm text-muted-foreground">
          Não tem conta? <a href="#" className="text-primary hover:underline">Cadastre-se</a>
        </p>
      </CardFooter>
    </Card>
  ),
};

export const ProfileForm: Story = {
  render: () => (
    <Card className="w-[450px]">
      <CardHeader>
        <CardTitle>Editar Perfil</CardTitle>
        <CardDescription>Atualize suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome</Label>
            <Input id="firstName" defaultValue="João" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome</Label>
            <Input id="lastName" defaultValue="Silva" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email2">Email</Label>
          <Input id="email2" type="email" defaultValue="joao.silva@empresa.com" />
        </div>
        <div className="space-y-2">
          <Label>Departamento</Label>
          <Select defaultValue="ti">
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ti">Tecnologia</SelectItem>
              <SelectItem value="rh">Recursos Humanos</SelectItem>
              <SelectItem value="vendas">Vendas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio2">Bio</Label>
          <Textarea id="bio2" placeholder="Conte um pouco sobre você..." rows={3} />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancelar</Button>
        <Button>Salvar alterações</Button>
      </CardFooter>
    </Card>
  ),
};
