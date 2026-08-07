import type { Meta, StoryObj } from "@storybook/react";
import { SkipLinks } from "@/components/accessibility/SkipLinks";
import { AccessibilitySettings } from "@/components/accessibility/AccessibilitySettings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const meta: Meta = {
  title: "Accessibility/Components",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Componentes de acessibilidade para navegação por teclado, configurações de preferências e conformidade WCAG 2.1.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const SkipLinksDemo: Story = {
  render: () => (
    <div className="min-h-[400px] bg-background">
      <SkipLinks />
      <div className="p-4">
        <p className="text-muted-foreground mb-4">
          Pressione <kbd className="px-2 py-1 bg-muted rounded text-xs">Tab</kbd> para
          revelar os skip links. Eles permitem navegação rápida por teclado.
        </p>
        
        <nav id="main-nav" className="p-4 bg-card rounded-lg mb-4">
          <h3 className="font-semibold">Navegação Principal</h3>
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm">Home</Button>
            <Button variant="ghost" size="sm">Metas</Button>
            <Button variant="ghost" size="sm">Trilhas</Button>
          </div>
        </nav>
        
        <main id="main-content" className="p-4 bg-card rounded-lg">
          <h3 className="font-semibold">Conteúdo Principal</h3>
          <p className="text-muted-foreground mt-2">
            Este é o conteúdo principal da página.
          </p>
        </main>
      </div>
    </div>
  ),
};

export const AccessibilitySettingsDemo: Story = {
  render: () => (
    <div className="p-6 bg-background min-h-[600px]">
      <h2 className="text-2xl font-bold mb-4">Configurações de Acessibilidade</h2>
      <p className="text-muted-foreground mb-6">
        Configure preferências de acessibilidade para melhorar sua experiência.
      </p>
      <AccessibilitySettings />
    </div>
  ),
};

export const KeyboardNavigation: Story = {
  render: () => (
    <div className="p-6 bg-background space-y-6">
      <h2 className="text-2xl font-bold">Navegação por Teclado</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Atalhos Globais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span>Navegar entre elementos</span>
            <kbd className="px-2 py-1 bg-muted rounded text-sm">Tab</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Navegar para trás</span>
            <div className="flex gap-1">
              <kbd className="px-2 py-1 bg-muted rounded text-sm">Shift</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-muted rounded text-sm">Tab</kbd>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span>Ativar elemento</span>
            <kbd className="px-2 py-1 bg-muted rounded text-sm">Enter</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span>Fechar modal/dropdown</span>
            <kbd className="px-2 py-1 bg-muted rounded text-sm">Esc</kbd>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Teste de Focus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Use Tab para navegar pelos botões abaixo. O foco deve ser claramente visível.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button>Botão 1</Button>
            <Button variant="secondary">Botão 2</Button>
            <Button variant="outline">Botão 3</Button>
            <Button variant="ghost">Botão 4</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ColorContrast: Story = {
  render: () => (
    <div className="p-6 bg-background space-y-6">
      <h2 className="text-2xl font-bold">Contraste de Cores (WCAG AA)</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="p-3 bg-background rounded">
                <span className="text-foreground">Foreground on Background</span>
              </div>
              <div className="p-3 bg-primary rounded">
                <span className="text-primary-foreground">Primary Foreground</span>
              </div>
              <div className="p-3 bg-secondary rounded">
                <span className="text-secondary-foreground">Secondary Foreground</span>
              </div>
              <div className="p-3 bg-muted rounded">
                <span className="text-muted-foreground">Muted Foreground</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="p-3 bg-success rounded">
                <span className="text-white">Success Text</span>
              </div>
              <div className="p-3 bg-warning rounded">
                <span className="text-white">Warning Text</span>
              </div>
              <div className="p-3 bg-destructive rounded">
                <span className="text-white">Destructive Text</span>
              </div>
              <div className="p-3 bg-accent rounded">
                <span className="text-accent-foreground">Accent Text</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};

export const ReducedMotion: Story = {
  render: () => (
    <div className="p-6 bg-background space-y-6">
      <h2 className="text-2xl font-bold">Reduced Motion</h2>
      <p className="text-muted-foreground">
        Quando "Reduce Motion" está ativado no sistema operacional ou nas configurações
        de acessibilidade, todas as animações são desabilitadas ou reduzidas.
      </p>
      
      <Card>
        <CardContent className="p-4 space-y-4">
          <p className="text-sm">
            Teste com animação (respeita <code>prefers-reduced-motion</code>):
          </p>
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-primary rounded-lg animate-pulse" />
            <div className="w-16 h-16 bg-accent rounded-lg animate-bounce" />
            <div className="w-16 h-16 bg-success rounded-lg animate-spin" />
          </div>
          <p className="text-xs text-muted-foreground">
            Se você ativou "Reduce Motion", as animações acima devem estar pausadas.
          </p>
        </CardContent>
      </Card>
    </div>
  ),
};
