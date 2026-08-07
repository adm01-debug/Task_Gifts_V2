import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface MetricCardProps {
  title: string;
  value: number | null;
  target: number;
  unit?: string;
  prefix?: string;
  trend?: number | null;
  icon: React.ElementType;
  description?: string;
  inverse?: boolean;
  loading?: boolean;
}

export function MetricCard({ 
  title, value, target, unit = '', prefix = '', trend, icon: Icon, description, inverse = false, loading = false 
}: MetricCardProps) {
  const hasValue = value !== null;
  const isOnTarget = hasValue && (inverse ? value <= target : value >= target);
  const progress = hasValue 
    ? (inverse 
      ? Math.min(100, (target / Math.max(value, 0.1)) * 100)
      : Math.min(100, (value / Math.max(target, 1)) * 100))
    : 0;

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
        <CardContent className="pt-6 space-y-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-full">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-lg ${hasValue ? (isOnTarget ? 'bg-success/10' : 'bg-warning/10') : 'bg-muted/30'}`}>
              <Icon className={`w-5 h-5 ${hasValue ? (isOnTarget ? 'text-success' : 'text-warning') : 'text-muted-foreground'}`} />
            </div>
            {trend !== undefined && trend !== null && (
              <Badge 
                variant="outline" 
                className={trend >= 0 
                  ? (inverse ? 'border-destructive/50 text-destructive' : 'border-success/50 text-success')
                  : (inverse ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive')
                }
              >
                {trend >= 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}%
              </Badge>
            )}
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {hasValue ? (
              <p className="text-3xl font-bold">
                {prefix}{typeof value === 'number' && value >= 1000 ? value.toLocaleString('pt-BR') : value}{unit}
              </p>
            ) : (
              <p className="text-lg text-muted-foreground/70 italic">Não disponível</p>
            )}
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Meta: {prefix}{target}{unit}</span>
              {hasValue ? (
                <span className={isOnTarget ? 'text-success' : 'text-warning'}>{isOnTarget ? '✓ Atingida' : 'Em progresso'}</span>
              ) : (
                <span className="text-muted-foreground/60">Requer integração</span>
              )}
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
