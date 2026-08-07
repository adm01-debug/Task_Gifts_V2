import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';

const meta: Meta = {
  title: 'Layout/Containers',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Containers e layouts estruturais.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const FlexLayouts: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Flex Layouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">flex justify-between</p>
          <div className="flex justify-between p-4 bg-muted rounded-lg">
            <div className="w-16 h-16 bg-primary/80 rounded flex items-center justify-center text-primary-foreground">1</div>
            <div className="w-16 h-16 bg-primary/80 rounded flex items-center justify-center text-primary-foreground">2</div>
            <div className="w-16 h-16 bg-primary/80 rounded flex items-center justify-center text-primary-foreground">3</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">flex justify-center gap-4</p>
          <div className="flex justify-center gap-4 p-4 bg-muted rounded-lg">
            <div className="w-16 h-16 bg-xp/80 rounded flex items-center justify-center text-xp-foreground">1</div>
            <div className="w-16 h-16 bg-xp/80 rounded flex items-center justify-center text-xp-foreground">2</div>
            <div className="w-16 h-16 bg-xp/80 rounded flex items-center justify-center text-xp-foreground">3</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">flex-col items-center gap-2</p>
          <div className="flex flex-col items-center gap-2 p-4 bg-muted rounded-lg">
            <div className="w-full max-w-xs h-12 bg-coins/80 rounded flex items-center justify-center text-coins-foreground">Header</div>
            <div className="w-full max-w-md h-24 bg-coins/60 rounded flex items-center justify-center text-coins-foreground">Content</div>
            <div className="w-full max-w-xs h-12 bg-coins/80 rounded flex items-center justify-center text-coins-foreground">Footer</div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const GridLayouts: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Grid Layouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">grid grid-cols-3 gap-4</p>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-20 bg-primary/20 rounded-lg flex items-center justify-center font-medium">
                {i}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">grid grid-cols-4 (1 span 2)</p>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-2 h-20 bg-xp/20 rounded-lg flex items-center justify-center font-medium">
              col-span-2
            </div>
            <div className="h-20 bg-xp/20 rounded-lg flex items-center justify-center font-medium">3</div>
            <div className="h-20 bg-xp/20 rounded-lg flex items-center justify-center font-medium">4</div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Dashboard layout</p>
          <div className="grid grid-cols-4 grid-rows-2 gap-4 h-48">
            <div className="col-span-3 bg-coins/20 rounded-lg flex items-center justify-center font-medium">
              Main Content
            </div>
            <div className="row-span-2 bg-coins/30 rounded-lg flex items-center justify-center font-medium">
              Sidebar
            </div>
            <div className="col-span-3 bg-coins/10 rounded-lg flex items-center justify-center font-medium">
              Footer
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const SeparatorExamples: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Separators</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Horizontal</p>
          <div className="space-y-4">
            <p>Conteúdo acima</p>
            <Separator />
            <p>Conteúdo abaixo</p>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Vertical</p>
          <div className="flex h-10 items-center gap-4">
            <span>Item 1</span>
            <Separator orientation="vertical" />
            <span>Item 2</span>
            <Separator orientation="vertical" />
            <span>Item 3</span>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Com texto</p>
          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OU</span>
            <Separator className="flex-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ScrollAreaExample: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Scroll Area</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 w-full rounded-md border p-4">
          <div className="space-y-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <p className="font-medium">Item {i + 1}</p>
                <p className="text-sm text-muted-foreground">
                  Conteúdo scrollável com estilo customizado
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  ),
};

export const ResizablePanels: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Painéis Redimensionáveis</CardTitle>
      </CardHeader>
      <CardContent>
        <ResizablePanelGroup direction="horizontal" className="min-h-[300px] rounded-lg border">
          <ResizablePanel defaultSize={25} minSize={15}>
            <div className="flex h-full items-center justify-center p-6 bg-muted/50">
              <span className="font-medium">Sidebar</span>
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={75}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={70}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-medium">Conteúdo Principal</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30}>
                <div className="flex h-full items-center justify-center p-6 bg-muted/30">
                  <span className="font-medium">Painel Inferior</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </CardContent>
    </Card>
  ),
};

export const StackedLayout: StoryObj = {
  render: () => (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Stacked Layout</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-primary/20 rounded-t-lg border-b-0 rounded-b-none">
            <p className="font-medium">Header</p>
          </div>
          <div className="p-4 bg-muted/50 rounded-none -mt-4">
            <p className="font-medium">Content Area</p>
            <p className="text-sm text-muted-foreground mt-2">
              Elementos empilhados com espaçamento consistente
            </p>
          </div>
          <div className="p-4 bg-primary/10 rounded-b-lg rounded-t-none -mt-4">
            <p className="font-medium">Footer</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const AspectRatios: StoryObj = {
  render: () => (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle>Aspect Ratios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="aspect-square bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium">1:1</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">aspect-square</p>
          </div>
          <div className="space-y-2">
            <div className="aspect-video bg-xp/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium">16:9</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">aspect-video</p>
          </div>
          <div className="space-y-2">
            <div className="aspect-[4/3] bg-coins/20 rounded-lg flex items-center justify-center">
              <span className="text-sm font-medium">4:3</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">aspect-[4/3]</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};
