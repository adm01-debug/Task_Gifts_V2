import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";
import { Zap, Trophy, Star, Coins, Play, Check } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Botões interativos com variantes para diferentes contextos de gamificação.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
      description: "Variante visual do botão",
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      description: "Tamanho do botão",
    },
    disabled: {
      control: "boolean",
      description: "Estado desabilitado",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Completar Missão",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Zap className="mr-2 h-4 w-4" />
        Ganhar XP
      </>
    ),
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="default">
        <Trophy className="mr-2 h-4 w-4" />
        Default
      </Button>
      <Button variant="secondary">
        <Star className="mr-2 h-4 w-4" />
        Secondary
      </Button>
      <Button variant="outline">
        <Coins className="mr-2 h-4 w-4" />
        Outline
      </Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="icon">
        <Play className="h-4 w-4" />
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  args: {
    disabled: true,
    children: (
      <>
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Processando...
      </>
    ),
  },
};

export const GamificationCTAs: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
        <Zap className="mr-2 h-4 w-4" />
        Resgatar Recompensa (+50 XP)
      </Button>
      <Button className="bg-gradient-to-r from-success to-emerald-400 hover:opacity-90">
        <Check className="mr-2 h-4 w-4" />
        Completar Quest
      </Button>
      <Button className="bg-gradient-to-r from-coins to-amber-400 hover:opacity-90 text-background">
        <Coins className="mr-2 h-4 w-4" />
        Comprar Item (100 Coins)
      </Button>
    </div>
  ),
};
