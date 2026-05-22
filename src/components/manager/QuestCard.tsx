import { motion } from "framer-motion";
import { MoreHorizontal, Edit3, BarChart2, Users, Target, Eye, Trash2, Play, Pause, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Quest } from "@/services/questsService";

export const difficultyConfig = {
  easy: { label: "Fácil", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  medium: { label: "Médio", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  hard: { label: "Difícil", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  expert: { label: "Expert", color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export const statusConfig = {
  draft: { label: "Rascunho", color: "bg-muted text-muted-foreground" },
  active: { label: "Ativa", color: "bg-green-500/20 text-green-400" },
  archived: { label: "Arquivada", color: "bg-gray-500/20 text-gray-400" },
};

interface QuestCardProps {
  quest: Quest;
  index: number;
  onViewStats: (quest: Quest) => void;
  onArchive: (quest: Quest) => void;
  onActivate: (quest: Quest) => void;
  onDelete: (quest: Quest) => void;
}

export function QuestCard({ quest, index, onViewStats, onArchive, onActivate, onDelete }: QuestCardProps) {
  const navigate = useNavigate();
  const diffConfig = difficultyConfig[quest.difficulty as keyof typeof difficultyConfig] || difficultyConfig.medium;
  const statConfig = statusConfig[quest.status as keyof typeof statusConfig] || statusConfig.draft;
  const totalAssignments = quest.quest_assignments?.length || 0;
  const completedAssignments = quest.quest_assignments?.filter((a: any) => a.completed_at)?.length || 0;
  const stepsCount = quest.quest_steps?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-lg">
        <div className={`absolute inset-x-0 top-0 h-1 ${
          quest.status === "active" ? "bg-green-500" :
          quest.status === "draft" ? "bg-yellow-500" : "bg-gray-500"
        }`} />

        <div className="p-4">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-2xl shadow-sm"
            >
              {quest.icon}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-foreground line-clamp-1">{quest.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{quest.description}</p>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Opções da quest">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewStats(quest)}>
                      <BarChart2 className="mr-2 h-4 w-4" />
                      Ver Estatísticas
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/quest-builder?edit=${quest.id}`)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Editar Quest
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {quest.status === "active" ? (
                      <DropdownMenuItem onClick={() => onArchive(quest)}>
                        <Pause className="mr-2 h-4 w-4" />
                        Pausar / Arquivar
                      </DropdownMenuItem>
                    ) : quest.status === "draft" || quest.status === "archived" ? (
                      <DropdownMenuItem onClick={() => onActivate(quest)}>
                        <Play className="mr-2 h-4 w-4" />
                        Ativar Quest
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(quest)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir Quest
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statConfig.color}>{statConfig.label}</Badge>
                <Badge variant="outline" className={diffConfig.color}>{diffConfig.label}</Badge>
                <Badge variant="outline" className="border-purple-500/30 bg-purple-500/10 text-purple-400">
                  <Sparkles className="mr-1 h-3 w-3" />
                  {quest.xp_reward} XP
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Target className="h-4 w-4" />
                  <span>{stepsCount} etapas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{totalAssignments} participantes</span>
                </div>
                {completedAssignments > 0 && (
                  <div className="flex items-center gap-1 text-green-400">
                    <Eye className="h-4 w-4" />
                    <span>{completedAssignments} concluídos</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
