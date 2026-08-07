import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = {
  title: 'Foundations/Spacing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Sistema de espaçamento e grid do design system.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const SpacingScale: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Escala de Espaçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { name: '0.5', size: '0.125rem', px: '2px' },
          { name: '1', size: '0.25rem', px: '4px' },
          { name: '2', size: '0.5rem', px: '8px' },
          { name: '3', size: '0.75rem', px: '12px' },
          { name: '4', size: '1rem', px: '16px' },
          { name: '5', size: '1.25rem', px: '20px' },
          { name: '6', size: '1.5rem', px: '24px' },
          { name: '8', size: '2rem', px: '32px' },
          { name: '10', size: '2.5rem', px: '40px' },
          { name: '12', size: '3rem', px: '48px' },
          { name: '16', size: '4rem', px: '64px' },
        ].map((spacing) => (
          <div key={spacing.name} className="flex items-center gap-4">
            <div className="w-20 text-sm text-muted-foreground">
              <span className="font-mono">{spacing.name}</span>
            </div>
            <div 
              className="h-4 bg-primary rounded"
              style={{ width: spacing.size }}
            />
            <div className="text-sm">
              <span className="text-muted-foreground">{spacing.size}</span>
              <span className="text-muted-foreground/60 ml-2">({spacing.px})</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  ),
};

export const PaddingExamples: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Exemplos de Padding</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="bg-muted rounded-lg">
              <div className="p-2 bg-primary/20 rounded">p-2</div>
            </div>
            <p className="text-xs text-muted-foreground text-center">8px</p>
          </div>
          <div className="space-y-2">
            <div className="bg-muted rounded-lg">
              <div className="p-4 bg-primary/20 rounded">p-4</div>
            </div>
            <p className="text-xs text-muted-foreground text-center">16px</p>
          </div>
          <div className="space-y-2">
            <div className="bg-muted rounded-lg">
              <div className="p-6 bg-primary/20 rounded">p-6</div>
            </div>
            <p className="text-xs text-muted-foreground text-center">24px</p>
          </div>
          <div className="space-y-2">
            <div className="bg-muted rounded-lg">
              <div className="p-8 bg-primary/20 rounded">p-8</div>
            </div>
            <p className="text-xs text-muted-foreground text-center">32px</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const GapExamples: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Exemplos de Gap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">gap-2 (8px)</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 bg-primary/80 rounded flex items-center justify-center text-primary-foreground font-medium">
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">gap-4 (16px)</p>
          <div className="flex gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 bg-primary/80 rounded flex items-center justify-center text-primary-foreground font-medium">
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">gap-6 (24px)</p>
          <div className="flex gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="w-12 h-12 bg-primary/80 rounded flex items-center justify-center text-primary-foreground font-medium">
                {i}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const GridLayouts: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Layouts de Grid</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">2 Colunas</p>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                Col {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">3 Colunas</p>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                Col {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">4 Colunas</p>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-muted rounded-lg flex items-center justify-center text-muted-foreground font-medium">
                Col {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Responsivo (1-2-4 colunas)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-primary/20 rounded-lg flex items-center justify-center font-medium">
                Responsivo {i}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ContainerWidths: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Larguras de Container</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {[
          { name: 'max-w-sm', width: '24rem', px: '384px' },
          { name: 'max-w-md', width: '28rem', px: '448px' },
          { name: 'max-w-lg', width: '32rem', px: '512px' },
          { name: 'max-w-xl', width: '36rem', px: '576px' },
          { name: 'max-w-2xl', width: '42rem', px: '672px' },
          { name: 'max-w-3xl', width: '48rem', px: '768px' },
          { name: 'max-w-4xl', width: '56rem', px: '896px' },
        ].map((container) => (
          <div key={container.name} className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono">{container.name}</span>
              <span className="text-muted-foreground">({container.px})</span>
            </div>
            <div 
              className="h-8 bg-primary/20 rounded"
              style={{ maxWidth: container.width, width: '100%' }}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  ),
};

export const BorderRadius: StoryObj = {
  render: () => (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Border Radius</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-none" />
            <p className="text-sm font-medium">none</p>
            <p className="text-xs text-muted-foreground">0px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-sm" />
            <p className="text-sm font-medium">sm</p>
            <p className="text-xs text-muted-foreground">2px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded" />
            <p className="text-sm font-medium">default</p>
            <p className="text-xs text-muted-foreground">4px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-md" />
            <p className="text-sm font-medium">md</p>
            <p className="text-xs text-muted-foreground">6px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-lg" />
            <p className="text-sm font-medium">lg</p>
            <p className="text-xs text-muted-foreground">8px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-xl" />
            <p className="text-sm font-medium">xl</p>
            <p className="text-xs text-muted-foreground">12px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-2xl" />
            <p className="text-sm font-medium">2xl</p>
            <p className="text-xs text-muted-foreground">16px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-3xl" />
            <p className="text-sm font-medium">3xl</p>
            <p className="text-xs text-muted-foreground">24px</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary mx-auto rounded-full" />
            <p className="text-sm font-medium">full</p>
            <p className="text-xs text-muted-foreground">9999px</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};
