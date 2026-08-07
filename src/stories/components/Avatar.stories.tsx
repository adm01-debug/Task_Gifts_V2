import type { Meta, StoryObj } from "@storybook/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown, Shield, Star } from "lucide-react";

const meta: Meta<typeof Avatar> = {
  title: "Components/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: "Avatares de usuário com suporte a imagens, fallback e indicadores de rank.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="" alt="User" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs">XS</AvatarFallback>
      </Avatar>
      <Avatar className="h-10 w-10">
        <AvatarFallback className="text-sm">SM</AvatarFallback>
      </Avatar>
      <Avatar className="h-12 w-12">
        <AvatarFallback>MD</AvatarFallback>
      </Avatar>
      <Avatar className="h-16 w-16">
        <AvatarFallback className="text-lg">LG</AvatarFallback>
      </Avatar>
      <Avatar className="h-24 w-24">
        <AvatarFallback className="text-2xl">XL</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const WithRankBorder: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-rank-bronze p-0.5">
          <div className="h-full w-full rounded-full bg-background" />
        </div>
        <Avatar className="h-14 w-14 relative">
          <AvatarFallback className="bg-rank-bronze/20">BR</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rank-bronze">
          <Shield className="h-3 w-3 text-background" />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-rank-silver p-0.5">
          <div className="h-full w-full rounded-full bg-background" />
        </div>
        <Avatar className="h-14 w-14 relative">
          <AvatarFallback className="bg-rank-silver/20">SL</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rank-silver">
          <Shield className="h-3 w-3 text-background" />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rank-gold to-amber-400 p-0.5">
          <div className="h-full w-full rounded-full bg-background" />
        </div>
        <Avatar className="h-14 w-14 relative">
          <AvatarFallback className="bg-rank-gold/20">GD</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rank-gold">
          <Crown className="h-3 w-3 text-background" />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rank-diamond to-cyan-300 p-0.5 animate-pulse">
          <div className="h-full w-full rounded-full bg-background" />
        </div>
        <Avatar className="h-14 w-14 relative">
          <AvatarFallback className="bg-rank-diamond/20">DM</AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-rank-diamond">
          <Star className="h-3 w-3 text-background" />
        </div>
      </div>
    </div>
  ),
};

export const AvatarGroup: Story = {
  render: () => (
    <div className="flex -space-x-3">
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-primary text-primary-foreground">A</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-accent text-accent-foreground">B</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-success text-white">C</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-warning text-white">D</AvatarFallback>
      </Avatar>
      <Avatar className="border-2 border-background">
        <AvatarFallback className="bg-muted text-muted-foreground text-xs">+5</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const OnlineStatus: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarFallback>ON</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-success border-2 border-background" />
      </div>

      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarFallback>AW</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-warning border-2 border-background" />
      </div>

      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarFallback>OF</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-muted border-2 border-background" />
      </div>

      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarFallback>DN</AvatarFallback>
        </Avatar>
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-destructive border-2 border-background" />
      </div>
    </div>
  ),
};

export const LeaderboardAvatar: Story = {
  render: () => (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((position) => (
        <div key={position} className="flex items-center gap-3 p-2 rounded-lg bg-card">
          <span className={`w-6 text-center font-bold ${
            position === 1 ? "text-rank-gold" :
            position === 2 ? "text-rank-silver" :
            position === 3 ? "text-rank-bronze" :
            "text-muted-foreground"
          }`}>
            #{position}
          </span>
          <Avatar className="h-10 w-10">
            <AvatarFallback>U{position}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium text-sm">Usuário {position}</p>
            <p className="text-xs text-muted-foreground">Nível 15</p>
          </div>
          <span className="text-sm font-semibold text-xp">2,450 XP</span>
        </div>
      ))}
    </div>
  ),
};
