import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Zap, Trophy, Bell } from 'lucide-react';

const meta: Meta = {
  title: 'Animations/CSS Animations',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Animações CSS nativas do Tailwind e customizadas.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const FadeAnimations: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Fade Animations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-center">
            <div className="h-24 bg-primary/20 rounded-lg flex items-center justify-center animate-fade-in">
              <p className="font-medium">Fade In</p>
            </div>
            <code className="text-xs text-muted-foreground">animate-fade-in</code>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-24 bg-primary/20 rounded-lg flex items-center justify-center animate-fade-out">
              <p className="font-medium">Fade Out</p>
            </div>
            <code className="text-xs text-muted-foreground">animate-fade-out</code>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const ScaleAnimations: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Scale Animations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-center">
            <div className="h-24 bg-xp/20 rounded-lg flex items-center justify-center animate-scale-in">
              <Star className="w-8 h-8 text-xp" />
            </div>
            <code className="text-xs text-muted-foreground">animate-scale-in</code>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-24 bg-xp/20 rounded-lg flex items-center justify-center animate-scale-out">
              <Star className="w-8 h-8 text-xp" />
            </div>
            <code className="text-xs text-muted-foreground">animate-scale-out</code>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const SlideAnimations: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Slide Animations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-center overflow-hidden">
            <div className="h-24 bg-coins/20 rounded-lg flex items-center justify-center animate-slide-in-right">
              <Zap className="w-8 h-8 text-coins" />
            </div>
            <code className="text-xs text-muted-foreground">animate-slide-in-right</code>
          </div>
          <div className="space-y-2 text-center overflow-hidden">
            <div className="h-24 bg-coins/20 rounded-lg flex items-center justify-center animate-slide-out-right">
              <Zap className="w-8 h-8 text-coins" />
            </div>
            <code className="text-xs text-muted-foreground">animate-slide-out-right</code>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const CombinedAnimations: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Animações Combinadas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2 text-center">
            <div className="h-24 bg-primary/20 rounded-lg flex items-center justify-center animate-enter">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <code className="text-xs text-muted-foreground">animate-enter</code>
            <p className="text-xs text-muted-foreground">(fade-in + scale-in)</p>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-24 bg-primary/20 rounded-lg flex items-center justify-center animate-exit">
              <Trophy className="w-8 h-8 text-primary" />
            </div>
            <code className="text-xs text-muted-foreground">animate-exit</code>
            <p className="text-xs text-muted-foreground">(fade-out + scale-out)</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const HoverEffects: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Efeitos de Hover</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2 text-center">
            <div className="h-24 bg-muted rounded-lg flex items-center justify-center hover-scale cursor-pointer">
              <Bell className="w-8 h-8" />
            </div>
            <code className="text-xs text-muted-foreground">hover-scale</code>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-24 bg-muted rounded-lg flex items-center justify-center transition-transform duration-200 hover:-translate-y-1 cursor-pointer">
              <Star className="w-8 h-8" />
            </div>
            <code className="text-xs text-muted-foreground">hover:-translate-y-1</code>
          </div>
          <div className="space-y-2 text-center">
            <div className="h-24 bg-muted rounded-lg flex items-center justify-center transition-all duration-200 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
              <Zap className="w-8 h-8" />
            </div>
            <code className="text-xs text-muted-foreground">hover:shadow-lg</code>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const LinkUnderline: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Link com Underline Animado</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="story-link">
            <a href="#" className="text-lg font-medium text-primary">
              Link com animação de underline
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            Use a classe <code className="bg-muted px-1 rounded">story-link</code> no container
          </p>
        </div>
      </CardContent>
    </Card>
  ),
};

export const PulseAnimation: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Pulse Animation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center animate-pulse">
              <Bell className="w-8 h-8 text-primary-foreground" />
            </div>
            <code className="text-xs text-muted-foreground">animate-pulse</code>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-destructive rounded-full flex items-center justify-center pulse">
              <span className="text-destructive-foreground font-bold">!</span>
            </div>
            <code className="text-xs text-muted-foreground">pulse</code>
          </div>
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 bg-xp rounded-full flex items-center justify-center animate-bounce">
              <Trophy className="w-8 h-8 text-xp-foreground" />
            </div>
            <code className="text-xs text-muted-foreground">animate-bounce</code>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const SpinAnimation: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Spin Animation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <div className="space-y-2 text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <code className="text-xs text-muted-foreground">animate-spin</code>
          </div>
          <div className="space-y-2 text-center">
            <Star className="w-16 h-16 text-coins animate-spin" style={{ animationDuration: '3s' }} />
            <code className="text-xs text-muted-foreground">spin (slow)</code>
          </div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const TransitionDurations: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Durações de Transição</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[75, 100, 150, 200, 300, 500, 700, 1000].map((duration) => (
            <div key={duration} className="flex items-center gap-4">
              <code className="w-32 text-sm text-muted-foreground">duration-{duration}</code>
              <div 
                className={`flex-1 h-8 bg-primary/20 rounded transition-all duration-${duration} hover:bg-primary hover:text-primary-foreground flex items-center justify-center cursor-pointer`}
                style={{ transitionDuration: `${duration}ms` }}
              >
                <span className="text-sm">Hover me ({duration}ms)</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  ),
};
