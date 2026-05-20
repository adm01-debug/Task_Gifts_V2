import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useGoals } from "@/hooks/useGoals";
import { Skeleton, SkeletonQuestList } from "@/components/ui/skeleton";
import { Target, Plus, ChevronRight, Trophy, Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const PRIORITY_CONFIG = {
  low: { label: "Baixa", color: "bg-green-500" },
  medium: { label: "Média", color: "bg-amber-500" },
  high: { label: "Alta", color: "bg-orange-500" },
  critical: { label: "Crítica", color: "bg-red-500" },
};

const TYPE_CONFIG = {
  personal: { label: "Pessoal", icon: "👤" },
  team: { label: "Equipe", icon: "👥" },
  company: { label: "Empresa", icon: "🏢" },
};

export function GoalsWidget() {
  const { goals, companyGoals, createGoal, isCreating, isLoading } = useGoals();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState<{
    title: string;
    description: string;
    goal_type: 'personal' | 'team' | 'company';
    priority: 'low' | 'medium' | 'high' | 'critical';
    due_date: string;
  }>({
    title: "",
    description: "",
    goal_type: "personal",
    priority: "medium",
    due_date: "",
  });

  const handleCreate = () => {
    if (!newGoal.title) return;
    
    createGoal({
      ...newGoal,
      due_date: newGoal.due_date || undefined,
    });
    setIsDialogOpen(false);
    setNewGoal({ title: "", description: "", goal_type: "personal", priority: "medium", due_date: "" });
  };

  const allGoals = [...goals, ...companyGoals.filter(g => !goals.find(pg => pg.id === g.id))];
  const activeGoals = allGoals.filter(g => g.status === 'active');
  const completedCount = allGoals.filter(g => g.status === 'completed').length;

  if (isLoading) {
    return (
      <Card className="bg-card/40 backdrop-blur-xl border-white/5 overflow-hidden shadow-2xl">
        <CardHeader className="flex-row items-center justify-between pb-2 bg-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent animate-pulse" />
          <div className="flex items-center gap-2 relative z-10">
            <Skeleton variant="glow" shape="card" className="h-5 w-5 rounded-md" />
            <Skeleton variant="shimmer" className="h-5 w-32" />
          </div>
          <Skeleton variant="shimmer" className="h-8 w-24 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center gap-4">
            <Skeleton variant="shimmer" className="h-4 w-20" />
            <Skeleton variant="shimmer" className="h-4 w-24" />
          </div>
          <SkeletonQuestList items={3} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Metas & OKRs</CardTitle>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título da meta"
                value={newGoal.title}
                onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newGoal.description}
                onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              <div className="grid grid-cols-2 gap-3">
                <Select 
                  value={newGoal.goal_type}
                  onValueChange={(value: 'personal' | 'team' | 'company') => 
                    setNewGoal(prev => ({ ...prev, goal_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.icon} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select 
                  value={newGoal.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                    setNewGoal(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                type="date"
                value={newGoal.due_date}
                onChange={(e) => setNewGoal(prev => ({ ...prev, due_date: e.target.value }))}
              />
              <Button 
                onClick={handleCreate} 
                disabled={isCreating || !newGoal.title}
                className="w-full"
              >
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span>{activeGoals.length} ativas</span>
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span>{completedCount} concluídas</span>
          </div>
        </div>

        <div className="space-y-3">
          {activeGoals.slice(0, 5).map((goal) => {
            const priorityConfig = PRIORITY_CONFIG[goal.priority];
            const typeConfig = TYPE_CONFIG[goal.goal_type];
            const isExpanded = expandedGoalId === goal.id;

            return (
              <motion.div
                key={goal.id}
                layout
                className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${priorityConfig.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{goal.title}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {typeConfig.icon} {typeConfig.label}
                      </Badge>
                    </div>
                    <Progress value={goal.progress_percent} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{goal.progress_percent}% concluído</span>
                      {goal.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(goal.due_date), "d MMM", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`} />
                </div>

                <AnimatePresence>
                  {isExpanded && goal.description && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t text-sm text-muted-foreground"
                    >
                      {goal.description}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {activeGoals.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma meta ativa</p>
              <p className="text-xs mt-1">Crie sua primeira meta!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
