import type { Meta, StoryObj } from '@storybook/react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Loader2, RefreshCw, Sparkles } from 'lucide-react';

const meta: Meta = {
  title: 'Feedback/Loading States',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Estados de carregamento e skeletons para feedback visual durante operações assíncronas.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

// Spinners
export const Spinners: StoryObj = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs text-muted-foreground">Default</p>
      </div>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-xs text-muted-foreground">Muted</p>
      </div>
      <div className="text-center">
        <RefreshCw className="h-6 w-6 animate-spin text-success" />
        <p className="mt-2 text-xs text-muted-foreground">Success</p>
      </div>
      <div className="text-center">
        <Sparkles className="h-6 w-6 animate-pulse text-xp" />
        <p className="mt-2 text-xs text-muted-foreground">XP Pulse</p>
      </div>
    </div>
  ),
};

// Full page loader
export const FullPageLoader: StoryObj = {
  render: () => (
    <div className="flex h-64 w-full flex-col items-center justify-center gap-4 rounded-lg border bg-background">
      <div className="relative">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
      </div>
      <p className="animate-pulse text-muted-foreground">Carregando sua jornada...</p>
    </div>
  ),
};

// Skeleton card
export const SkeletonCard: StoryObj = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </CardContent>
    </Card>
  ),
};

// Skeleton list
export const SkeletonList: StoryObj = {
  render: () => (
    <div className="w-96 space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  ),
};

// Skeleton stats
export const SkeletonStats: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <Skeleton className="mx-auto h-8 w-8 rounded" />
              <Skeleton className="mx-auto h-6 w-16" />
              <Skeleton className="mx-auto h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};

// Skeleton table
export const SkeletonTable: StoryObj = {
  render: () => (
    <div className="w-full rounded-lg border">
      <div className="flex gap-4 border-b bg-muted/50 p-4">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4 border-b p-4 last:border-0">
          <Skeleton className="h-4 w-8" />
          <div className="flex flex-1 items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  ),
};

// Loading button states
export const LoadingButtons: StoryObj = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-70" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </button>
      <button className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium opacity-70" disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
        Salvando...
      </button>
      <button className="inline-flex items-center gap-2 rounded-md bg-success px-4 py-2 text-sm font-medium text-success-foreground opacity-70" disabled>
        <RefreshCw className="h-4 w-4 animate-spin" />
        Sincronizando...
      </button>
    </div>
  ),
};

// Progress loading
export const ProgressLoading: StoryObj = {
  render: () => (
    <div className="w-80 space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Carregando dados...</span>
          <span>45%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[45%] animate-pulse bg-primary" />
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm">Processando conquistas...</p>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-muted via-primary/30 to-muted" 
            style={{ backgroundSize: '200% 100%' }} />
        </div>
      </div>
    </div>
  ),
};

// Skeleton dashboard
export const SkeletonDashboard: StoryObj = {
  render: () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="mx-auto mb-2 h-10 w-10 rounded-lg" />
              <Skeleton className="mx-auto h-6 w-20" />
              <Skeleton className="mx-auto mt-1 h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-2">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  ),
};
