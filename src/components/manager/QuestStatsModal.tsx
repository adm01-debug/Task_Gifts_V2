import { Users, Target, Sparkles, Coins, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { type Quest } from "@/services/questsService";

interface QuestStatsModalProps {
  quest: Quest | null;
  open: boolean;
  onClose: () => void;
}

export function QuestStatsModal({ quest, open, onClose }: QuestStatsModalProps) {
  if (!quest) return null;

  const totalAssignments = quest.quest_assignments?.length || 0;
  const completedAssignments = quest.quest_assignments?.filter(a => a.completed_at)?.length || 0;
  const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0;
  const stepsCount = quest.quest_steps?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">{quest.icon}</span>
            {quest.title}
          </DialogTitle>
          <DialogDescription>{quest.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 bg-primary/10 border-primary/20">
              <div className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                <span className="text-2xl font-bold">{totalAssignments}</span>
              </div>
              <p className="text-sm text-muted-foreground">Participantes</p>
            </Card>
            <Card className="p-4 bg-green-500/10 border-green-500/20">
              <div className="flex items-center gap-2 text-green-400">
                <Target className="h-5 w-5" />
                <span className="text-2xl font-bold">{completedAssignments}</span>
              </div>
              <p className="text-sm text-muted-foreground">Concluíram</p>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Taxa de Conclusão</span>
              <span className="text-sm font-medium">{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="h-3" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Sparkles className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{quest.xp_reward} XP</p>
                <p className="text-xs text-muted-foreground">Recompensa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Coins className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{quest.coin_reward} coins</p>
                <p className="text-xs text-muted-foreground">Recompensa</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium">{stepsCount} etapas</p>
                <p className="text-xs text-muted-foreground">Na trilha</p>
              </div>
            </div>
            {quest.deadline_days && (
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Clock className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{quest.deadline_days} dias</p>
                  <p className="text-xs text-muted-foreground">Prazo</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
