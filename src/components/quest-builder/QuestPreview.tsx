import { motion } from "framer-motion";
import { Target, Clock, Users, Coins, Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface QuestStep {
  id: string;
  title: string;
  description: string;
  xpReward: number;
}

interface QuestPreviewProps {
  title: string;
  description: string;
  icon: string;
  difficulty: string;
  xpReward: number;
  coinReward: number;
  deadlineDays: number | null;
  maxParticipants: number | null;
  tags: string[];
  steps: QuestStep[];
}

const difficultyConfig = {
  easy: { label: "Fácil", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Médio", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  hard: { label: "Difícil", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  expert: { label: "Expert", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export function QuestPreview({
  title,
  description,
  icon,
  difficulty,
  xpReward,
  coinReward,
  deadlineDays,
  maxParticipants,
  tags,
  steps,
}: QuestPreviewProps) {
  const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card/95 to-card/90 p-6 shadow-xl"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-6 flex items-start gap-4">
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 text-4xl shadow-lg"
          >
            {icon || "📚"}
          </motion.div>
          
          <div className="flex-1">
            <h3 className="text-xl font-bold text-foreground">
              {title || "Título da Quest"}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {description || "Descrição da quest aparecerá aqui..."}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-4 flex flex-wrap gap-3">
          <Badge variant="outline" className={config.color}>
            <Target className="mr-1 h-3 w-3" />
            {config.label}
          </Badge>
          
          <Badge variant="outline" className="border-purple-500/30 bg-purple-500/20 text-purple-400">
            <Sparkles className="mr-1 h-3 w-3" />
            {xpReward} XP
          </Badge>
          
          <Badge variant="outline" className="border-yellow-500/30 bg-yellow-500/20 text-yellow-400">
            <Coins className="mr-1 h-3 w-3" />
            {coinReward} coins
          </Badge>
          
          {deadlineDays && (
            <Badge variant="outline" className="border-blue-500/30 bg-blue-500/20 text-blue-400">
              <Clock className="mr-1 h-3 w-3" />
              {deadlineDays} dias
            </Badge>
          )}
          
          {maxParticipants && (
            <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/20 text-cyan-400">
              <Users className="mr-1 h-3 w-3" />
              Máx. {maxParticipants}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.map((tag, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
              >
                #{tag}
              </motion.span>
            ))}
          </div>
        )}

        {/* Progress preview */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium text-foreground">0/{steps.length || 1} etapas</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>

        {/* Steps preview */}
        {steps.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-foreground">Etapas da Trilha</h4>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{step.title || `Etapa ${index + 1}`}</p>
                    {step.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">{step.description}</p>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    +{step.xpReward} XP
                  </Badge>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {steps.length === 0 && (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Adicione etapas para criar uma trilha de aprendizado
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
