import { motion } from "framer-motion";
import { Target, Plus, TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Goal, KeyResult } from "@/types/goals";

interface GoalCardProps {
  goal: Goal;
  selectedGoal: string | null;
  setSelectedGoal: (id: string | null) => void;
  newKeyResult: { title: string; target_value: number; metric_type: "percentage" | "number" | "currency" | "boolean"; unit: string };
  setNewKeyResult: (v: { title: string; target_value: number; metric_type: "percentage" | "number" | "currency" | "boolean"; unit: string }) => void;
  onAddKeyResult: (goalId: string) => void;
  onUpdateGoal: (params: { goalId: string; updates: Partial<Goal> }) => void;
  onDeleteGoal: (id: string) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "at_risk": return <AlertCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const getPriorityColor = (priority: string): "destructive" | "default" | "secondary" => {
  switch (priority) {
    case "high": return "destructive";
    case "medium": return "default";
    default: return "secondary";
  }
};

export function GoalCard({ goal, selectedGoal, setSelectedGoal, newKeyResult, setNewKeyResult, onAddKeyResult, onUpdateGoal, onDeleteGoal }: GoalCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="group">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(goal.status)}
              <CardTitle className="text-lg">{goal.title}</CardTitle>
            </div>
            <Badge variant={getPriorityColor(goal.priority)}>
              {goal.priority === "high" ? "Alta" : goal.priority === "medium" ? "Média" : "Baixa"}
            </Badge>
          </div>
          {goal.description && <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Progresso</span><span className="font-medium">{goal.progress_percent}%</span></div>
              <Progress value={goal.progress_percent} className="h-2" />
            </div>
            {goal.due_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Prazo: {format(new Date(goal.due_date), "dd MMM yyyy", { locale: ptBR })}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">{goal.xp_reward} XP + {goal.coin_reward} moedas</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Key Results</span>
                <Dialog open={selectedGoal === goal.id} onOpenChange={(open) => setSelectedGoal(open ? goal.id : null)}>
                  <DialogTrigger asChild><Button variant="ghost" size="sm"><Plus className="h-4 w-4 mr-1" />Adicionar</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Novo Key Result</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label>Título</Label><Input value={newKeyResult.title} onChange={(e) => setNewKeyResult({ ...newKeyResult, title: e.target.value } as typeof newKeyResult)} placeholder="Ex: Aumentar vendas em 20%" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Meta</Label><Input type="number" value={newKeyResult.target_value} onChange={(e) => setNewKeyResult({ ...newKeyResult, target_value: Number(e.target.value) } as typeof newKeyResult)} /></div>
                        <div><Label>Unidade</Label><Input value={newKeyResult.unit} onChange={(e) => setNewKeyResult({ ...newKeyResult, unit: e.target.value } as typeof newKeyResult)} placeholder="%" /></div>
                      </div>
                      <Button onClick={() => onAddKeyResult(goal.id)} className="w-full">Criar Key Result</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {goal.key_results && goal.key_results.length > 0 ? (
                <div className="space-y-2">
                  {goal.key_results.map((kr: KeyResult) => (
                    <div key={kr.id} className="flex items-center gap-2 text-sm">
                      <div className="flex-1">
                        <div className="flex justify-between"><span className="truncate">{kr.title}</span><span className="text-muted-foreground">{kr.current_value}/{kr.target_value} {kr.unit}</span></div>
                        <Progress value={(kr.current_value / kr.target_value) * 100} className="h-1 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (<p className="text-sm text-muted-foreground">Nenhum key result definido</p>)}
            </div>
            <div className="flex gap-2 pt-2">
              {goal.status !== "completed" && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onUpdateGoal({ goalId: goal.id, updates: { status: "completed", progress_percent: 100 } })}>
                  <CheckCircle2 className="h-4 w-4 mr-1" />Concluir
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onDeleteGoal(goal.id)}>Excluir</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
