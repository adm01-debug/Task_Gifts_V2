import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, CheckCircle, Info, Eye, EyeOff, Search } from 'lucide-react';
import { useState } from 'react';

const meta: Meta = {
  title: 'Accessibility/Patterns',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Padrões de acessibilidade para componentes interativos.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const FocusStates: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Estados de Foco</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Use Tab para navegar entre os elementos e ver os estados de foco.
        </p>
        <div className="flex flex-wrap gap-4">
          <Button>Botão Primário</Button>
          <Button variant="secondary">Secundário</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div className="grid gap-4 max-w-sm">
          <Input placeholder="Campo de texto focável" />
          <Input type="email" placeholder="Email" />
        </div>
      </CardContent>
    </Card>
  ),
};

export const FormLabels: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Labels Acessíveis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Nome Completo</Label>
          <Input id="name" placeholder="Digite seu nome" />
          <p className="text-xs text-muted-foreground">
            Labels associados via htmlFor/id
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input id="email" type="email" placeholder="seu@email.com" required />
          <p className="text-xs text-muted-foreground">
            Campos obrigatórios marcados visualmente
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bio">Biografia</Label>
          <Input id="bio" placeholder="Conte sobre você" aria-describedby="bio-hint" />
          <p id="bio-hint" className="text-xs text-muted-foreground">
            Máximo de 200 caracteres. Texto de ajuda conectado via aria-describedby.
          </p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ErrorMessages: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Mensagens de Erro</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="error-email">Email</Label>
          <Input 
            id="error-email" 
            type="email" 
            placeholder="seu@email.com"
            className="border-destructive focus-visible:ring-destructive"
            aria-invalid="true"
            aria-describedby="email-error"
          />
          <p id="email-error" className="text-sm text-destructive flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4" />
            Por favor, insira um email válido
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="success-field">Campo Válido</Label>
          <div className="relative">
            <Input 
              id="success-field"
              className="border-xp pr-10"
              defaultValue="valor@valido.com"
              aria-describedby="field-success"
            />
            <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-xp" />
          </div>
          <p id="field-success" className="text-sm text-xp flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Email válido
          </p>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">Dica de Acessibilidade</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Use aria-invalid e aria-describedby para conectar campos a suas mensagens de erro.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const PasswordToggle: StoryObj = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Campo de Senha Acessível</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Input 
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Digite sua senha"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Botão com aria-label descritivo para screen readers
            </p>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const CheckboxGroups: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Grupos de Checkbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Notificações</legend>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="email-notif" />
              <Label htmlFor="email-notif" className="font-normal">
                Notificações por email
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="push-notif" defaultChecked />
              <Label htmlFor="push-notif" className="font-normal">
                Notificações push
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="sms-notif" disabled />
              <Label htmlFor="sms-notif" className="font-normal text-muted-foreground">
                Notificações SMS (indisponível)
              </Label>
            </div>
          </div>
        </fieldset>

        <p className="text-xs text-muted-foreground">
          Use fieldset e legend para agrupar checkboxes relacionados
        </p>
      </CardContent>
    </Card>
  ),
};

export const RadioGroups: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Grupos de Radio</CardTitle>
      </CardHeader>
      <CardContent>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium mb-3">Selecione seu plano</legend>
          <RadioGroup defaultValue="pro" aria-label="Planos disponíveis">
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="free" id="free" />
              <Label htmlFor="free" className="flex-1 cursor-pointer">
                <span className="font-medium">Gratuito</span>
                <span className="block text-sm text-muted-foreground">Recursos básicos</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 border-primary bg-primary/5">
              <RadioGroupItem value="pro" id="pro" />
              <Label htmlFor="pro" className="flex-1 cursor-pointer">
                <span className="font-medium">Pro</span>
                <span className="block text-sm text-muted-foreground">Todos os recursos</span>
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
              <RadioGroupItem value="enterprise" id="enterprise" />
              <Label htmlFor="enterprise" className="flex-1 cursor-pointer">
                <span className="font-medium">Enterprise</span>
                <span className="block text-sm text-muted-foreground">Suporte dedicado</span>
              </Label>
            </div>
          </RadioGroup>
        </fieldset>
      </CardContent>
    </Card>
  ),
};

export const SkipLinks: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Skip Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Skip links permitem usuários de teclado pular para o conteúdo principal.
          Pressione Tab para ver o link de skip.
        </p>
        
        <div className="relative border rounded-lg overflow-hidden">
          <a 
            href="#main-content-demo"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
          >
            Pular para o conteúdo principal
          </a>
          
          <div className="bg-muted p-4 border-b">
            <p className="text-sm font-medium">Header (navegação)</p>
          </div>
          
          <div id="main-content-demo" className="p-4" tabIndex={-1}>
            <p className="text-sm">Conteúdo principal da página</p>
          </div>
        </div>

        <pre className="p-4 bg-muted rounded-lg text-xs overflow-x-auto">
{`<a href="#main-content" 
   className="sr-only focus:not-sr-only ...">
  Pular para o conteúdo principal
</a>`}
        </pre>
      </CardContent>
    </Card>
  ),
};

export const SearchWithLabel: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Campo de Busca Acessível</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search" className="sr-only">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              id="search"
              type="search"
              placeholder="Buscar..."
              className="pl-10"
              aria-label="Buscar no sistema"
            />
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Label visualmente oculto (sr-only) mas disponível para screen readers,
          com aria-label adicional para contexto.
        </p>
      </CardContent>
    </Card>
  ),
};
