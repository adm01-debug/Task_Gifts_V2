import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = {
  title: 'Foundations/Colors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Paleta de cores e tokens do design system.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

const ColorSwatch = ({ name, className, textClass = 'text-foreground' }: { name: string; className: string; textClass?: string }) => (
  <div className="space-y-2">
    <div className={`h-16 rounded-lg border ${className}`} />
    <p className={`text-sm font-medium ${textClass}`}>{name}</p>
  </div>
);

export const BrandColors: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Cores da Marca</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <ColorSwatch name="Primary" className="bg-primary" />
          <ColorSwatch name="Primary Foreground" className="bg-primary-foreground border-2" />
          <ColorSwatch name="Secondary" className="bg-secondary" />
          <ColorSwatch name="Secondary Foreground" className="bg-secondary-foreground" />
        </div>
      </CardContent>
    </Card>
  ),
};

export const GamificationColors: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Cores de Gamificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">XP & Coins</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-xp" />
              <p className="text-sm font-medium">XP (Success)</p>
              <p className="text-xs text-muted-foreground">Experiência, conquistas</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-coins" />
              <p className="text-sm font-medium">Coins (Warning)</p>
              <p className="text-xs text-muted-foreground">Moedas, recompensas</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Raridades</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gradient-to-r from-slate-400 to-slate-500" />
              <p className="text-sm font-medium">Comum</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gradient-to-r from-green-400 to-green-500" />
              <p className="text-sm font-medium">Incomum</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gradient-to-r from-blue-400 to-blue-500" />
              <p className="text-sm font-medium">Raro</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gradient-to-r from-purple-400 to-purple-500" />
              <p className="text-sm font-medium">Épico</p>
            </div>
            <div className="space-y-2">
              <div className="h-12 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500" />
              <p className="text-sm font-medium">Lendário</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const SemanticColors: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Cores Semânticas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-destructive" />
            <p className="text-sm font-medium">Destructive</p>
            <p className="text-xs text-muted-foreground">Erros, exclusão</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-xp" />
            <p className="text-sm font-medium">Success</p>
            <p className="text-xs text-muted-foreground">Confirmação, sucesso</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-coins" />
            <p className="text-sm font-medium">Warning</p>
            <p className="text-xs text-muted-foreground">Atenção, aviso</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 rounded-lg bg-blue-500" />
            <p className="text-sm font-medium">Info</p>
            <p className="text-xs text-muted-foreground">Informação</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const NeutralColors: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Cores Neutras</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Backgrounds</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-background border-2" />
              <p className="text-sm font-medium">Background</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-muted" />
              <p className="text-sm font-medium">Muted</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-card border" />
              <p className="text-sm font-medium">Card</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-popover border" />
              <p className="text-sm font-medium">Popover</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Foregrounds</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-foreground" />
              <p className="text-sm font-medium">Foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-muted-foreground" />
              <p className="text-sm font-medium">Muted Foreground</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-accent" />
              <p className="text-sm font-medium">Accent</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-border" />
              <p className="text-sm font-medium">Border</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const Gradients: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Gradientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-r from-primary to-primary/60" />
            <p className="text-sm font-medium">Primary Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-r from-xp to-xp/60" />
            <p className="text-sm font-medium">XP Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-r from-coins to-coins/60" />
            <p className="text-sm font-medium">Coins Gradient</p>
          </div>
          <div className="space-y-2">
            <div className="h-24 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
            <p className="text-sm font-medium">Celebration Gradient</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Rank Gradients</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-gradient-to-r from-amber-300 to-yellow-500" />
              <p className="text-sm font-medium">Gold</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-gradient-to-r from-slate-300 to-slate-400" />
              <p className="text-sm font-medium">Silver</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700" />
              <p className="text-sm font-medium">Bronze</p>
            </div>
            <div className="space-y-2">
              <div className="h-16 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500" />
              <p className="text-sm font-medium">Diamond</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const OpacityScale: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Escala de Opacidade</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10].map((opacity) => (
              <div key={opacity} className="space-y-1 text-center">
                <div 
                  className="h-12 rounded bg-primary" 
                  style={{ opacity: opacity / 100 }}
                />
                <p className="text-xs text-muted-foreground">{opacity}%</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};
