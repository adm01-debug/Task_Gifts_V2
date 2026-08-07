import type { Meta, StoryObj } from "@storybook/react";

const ColorSwatch = ({ 
  name, 
  variable, 
  description 
}: { 
  name: string; 
  variable: string; 
  description: string;
}) => (
  <div className="flex items-center gap-4 p-4 rounded-lg bg-card border border-border">
    <div 
      className="w-16 h-16 rounded-lg shadow-lg border border-border"
      style={{ backgroundColor: `hsl(var(${variable}))` }}
    />
    <div>
      <p className="font-semibold text-foreground">{name}</p>
      <code className="text-xs text-muted-foreground">{variable}</code>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
  </div>
);

const ColorPalette = () => (
  <div className="space-y-8 p-6">
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Cores Base</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorSwatch name="Background" variable="--background" description="Fundo principal da aplicação" />
        <ColorSwatch name="Foreground" variable="--foreground" description="Texto principal" />
        <ColorSwatch name="Card" variable="--card" description="Fundo de cards" />
        <ColorSwatch name="Muted" variable="--muted" description="Elementos secundários" />
        <ColorSwatch name="Border" variable="--border" description="Bordas e divisores" />
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Cores de Ação</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorSwatch name="Primary" variable="--primary" description="CTAs e ações principais" />
        <ColorSwatch name="Secondary" variable="--secondary" description="Ações secundárias" />
        <ColorSwatch name="Accent" variable="--accent" description="Destaques especiais" />
        <ColorSwatch name="Destructive" variable="--destructive" description="Ações destrutivas" />
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Cores de Feedback</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorSwatch name="Success" variable="--success" description="Feedback positivo" />
        <ColorSwatch name="Warning" variable="--warning" description="Alertas e avisos" />
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Cores de Gamificação</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorSwatch name="XP" variable="--xp" description="Pontos de experiência" />
        <ColorSwatch name="Coins" variable="--coins" description="Moedas virtuais" />
        <ColorSwatch name="Streak" variable="--streak" description="Sequências" />
      </div>
    </section>

    <section>
      <h2 className="text-2xl font-bold text-foreground mb-4">Cores de Rank</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ColorSwatch name="Bronze" variable="--rank-bronze" description="Rank inicial" />
        <ColorSwatch name="Silver" variable="--rank-silver" description="Rank intermediário" />
        <ColorSwatch name="Gold" variable="--rank-gold" description="Rank avançado" />
        <ColorSwatch name="Diamond" variable="--rank-diamond" description="Rank elite" />
      </div>
    </section>
  </div>
);

const meta: Meta = {
  title: "Design System/Colors",
  component: ColorPalette,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: "Paleta de cores do Task Gifts Design System com tokens semânticos para gamificação corporativa.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const AllColors: Story = {};
