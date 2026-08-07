import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = {
  title: 'Foundations/Typography',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Sistema tipográfico e hierarquia de textos do design system.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const HeadingScale: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Escala de Títulos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">h1 - 2.25rem / 36px</p>
          <h1 className="text-4xl font-bold tracking-tight">Título Principal H1</h1>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">h2 - 1.875rem / 30px</p>
          <h2 className="text-3xl font-semibold tracking-tight">Subtítulo H2</h2>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">h3 - 1.5rem / 24px</p>
          <h3 className="text-2xl font-semibold">Seção H3</h3>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">h4 - 1.25rem / 20px</p>
          <h4 className="text-xl font-semibold">Subseção H4</h4>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">h5 - 1.125rem / 18px</p>
          <h5 className="text-lg font-medium">Card Title H5</h5>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">h6 - 1rem / 16px</p>
          <h6 className="text-base font-medium">Label H6</h6>
        </div>
      </CardContent>
    </Card>
  ),
};

export const BodyText: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Texto Corpo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Lead - text-xl</p>
          <p className="text-xl text-muted-foreground">
            Texto de destaque para introduções e resumos importantes.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Large - text-lg</p>
          <p className="text-lg">
            Texto grande para parágrafos de destaque e informações importantes.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Base - text-base (default)</p>
          <p className="text-base">
            Texto padrão para parágrafos e conteúdo geral da aplicação. Este é o tamanho mais usado.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Small - text-sm</p>
          <p className="text-sm">
            Texto pequeno para labels, legendas e informações secundárias.
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Extra Small - text-xs</p>
          <p className="text-xs">
            Texto muito pequeno para timestamps, badges e metadata.
          </p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const TextColors: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Cores de Texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Foreground (default)</p>
          <p className="text-foreground text-lg">Texto principal com máximo contraste</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Muted Foreground</p>
          <p className="text-muted-foreground text-lg">Texto secundário e descrições</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Primary</p>
          <p className="text-primary text-lg">Texto de destaque e links</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Success (XP)</p>
          <p className="text-xp text-lg">Texto de sucesso e XP</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Warning (Coins)</p>
          <p className="text-coins text-lg">Texto de atenção e coins</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Destructive</p>
          <p className="text-destructive text-lg">Texto de erro e ações destrutivas</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const TextWeights: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Pesos de Fonte</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Light (300)</p>
          <p className="font-light text-2xl">Texto com peso leve</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Normal (400)</p>
          <p className="font-normal text-2xl">Texto com peso normal</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Medium (500)</p>
          <p className="font-medium text-2xl">Texto com peso médio</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Semibold (600)</p>
          <p className="font-semibold text-2xl">Texto com peso semi-bold</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Bold (700)</p>
          <p className="font-bold text-2xl">Texto com peso bold</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Extrabold (800)</p>
          <p className="font-extrabold text-2xl">Texto com peso extra-bold</p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const TextStyles: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Estilos de Texto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tracking (Letter Spacing)</p>
          <div className="space-y-1">
            <p className="tracking-tighter text-lg">Tracking Tighter (-0.05em)</p>
            <p className="tracking-tight text-lg">Tracking Tight (-0.025em)</p>
            <p className="tracking-normal text-lg">Tracking Normal (0)</p>
            <p className="tracking-wide text-lg">Tracking Wide (0.025em)</p>
            <p className="tracking-wider text-lg">Tracking Wider (0.05em)</p>
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Leading (Line Height)</p>
          <div className="max-w-md space-y-3">
            <p className="leading-tight bg-muted/50 p-2 rounded">
              Leading Tight (1.25) - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <p className="leading-normal bg-muted/50 p-2 rounded">
              Leading Normal (1.5) - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <p className="leading-relaxed bg-muted/50 p-2 rounded">
              Leading Relaxed (1.625) - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Decorações</p>
          <div className="space-y-1">
            <p className="underline text-lg">Texto sublinhado</p>
            <p className="line-through text-lg">Texto riscado</p>
            <p className="italic text-lg">Texto itálico</p>
            <p className="uppercase text-lg">Texto maiúsculo</p>
            <p className="capitalize text-lg">texto capitalizado</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const NumbersAndData: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Números e Dados</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-4xl font-bold text-xp">2,450</p>
            <p className="text-sm text-muted-foreground">XP Total</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-4xl font-bold text-coins">1,234</p>
            <p className="text-sm text-muted-foreground">Coins</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-4xl font-bold text-primary">87%</p>
            <p className="text-sm text-muted-foreground">Progresso</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-4xl font-bold">#3</p>
            <p className="text-sm text-muted-foreground">Ranking</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Tabular Numbers (para alinhamento)</p>
          <div className="font-mono bg-muted/50 p-4 rounded-lg space-y-1">
            <p>1,234.56</p>
            <p>12,345.67</p>
            <p>123,456.78</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};
