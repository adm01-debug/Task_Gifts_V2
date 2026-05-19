import { motion } from "framer-motion";
import { Target, Plus, TrendingUp, Calendar, CheckCircle2, Clock, AlertCircle, Shield, Zap, Sparkles, ChevronRight, Share2, Layers, Star } from "lucide-react";
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
import { cn } from "@/lib/utils";

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

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed": 
      return { 
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />, 
        color: "text-emerald-500", 
        bgColor: "bg-emerald-500/10", 
        label: "Operação Finalizada" 
      };
    case "at_risk": 
      return { 
        icon: <AlertCircle className="h-4 w-4 text-red-500" />, 
        color: "text-red-500", 
        bgColor: "bg-red-500/10", 
        label: "Estado Crítico" 
      };
    default: 
      return { 
        icon: <Clock className="h-4 w-4 text-amber-500" />, 
        color: "text-amber-500", 
        bgColor: "bg-amber-500/10", 
        label: "Em Execução" 
      };
  }
};

const getPriorityConfig = (priority: string) => {
  switch (priority) {
    case "high": 
      return { 
        label: "PRIORIDADE ALTA", 
        variant: "destructive" as const,
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.2)]"
      };
    case "medium": 
      return { 
        label: "PRIORIDADE MÉDIA", 
        variant: "default" as const,
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.2)]"
      };
    default: 
      return { 
        label: "PRIORIDADE BAIXA", 
        variant: "secondary" as const,
        glow: ""
      };
  }
};

export function GoalCard({ goal, selectedGoal, setSelectedGoal, newKeyResult, setNewKeyResult, onAddKeyResult, onUpdateGoal, onDeleteGoal }: GoalCardProps) {
  const status = getStatusConfig(goal.status);
  const priority = getPriorityConfig(goal.priority);
  const isCompleted = goal.status === "completed";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }} 
      animate={{ opacity: 1, y: 0, scale: 1 }} 
      whileHover={{ y: -8 }}
      className="group"
    >
      <Card className={cn(
        "relative overflow-hidden border border-white/5 bg-[#0A0C10] transition-all duration-500",
        isCompleted ? "shadow-[0_0_30px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20" : "shadow-2xl ring-1 ring-white/5",
        priority.glow
      )}>
        {/* Animated Scanline Effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
          <motion.div 
            animate={{ y: ["0%", "200%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-full h-1/2 bg-gradient-to-b from-transparent via-white/5 to-transparent"
          />
        </div>

        {/* Background Decorative Element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        <CardHeader className="pb-4 relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex items-center gap-2">
                <div className={cn("p-1.5 rounded-lg", status.bgColor)}>
                  {status.icon}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-[0.2em]", status.color)}>
                  {status.label}
                </span>
              </div>
              <CardTitle className="text-xl font-black italic uppercase tracking-tighter truncate text-white group-hover:text-primary transition-colors">
                {goal.title}
              </CardTitle>
            </div>
            <Badge variant={priority.variant} className="text-[8px] font-black tracking-widest uppercase py-0.5 px-2 rounded-sm whitespace-nowrap">
              {priority.label}
            </Badge>
          </div>
          {goal.description && (
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed mt-2 line-clamp-2 uppercase tracking-wide">
              {goal.description}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-6 relative z-10">
          {/* Tactical Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1.5">
                <Layers className="w-3 h-3" /> Sincronização
              </span>
              <span className="text-lg font-black italic tracking-tighter text-white">{goal.progress_percent}%</span>
            </div>
            <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress_percent}%` }}
                transition={{ duration: 1, ease: "circOut" }}
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  isCompleted ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-primary"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {goal.due_date && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Protocolo Prazo</span>
                  <span className="text-[10px] font-bold text-white uppercase">{format(new Date(goal.due_date), "dd MMM yyyy", { locale: ptBR })}</span>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Incentivos</span>
                <span className="text-[10px] font-bold text-white uppercase flex items-center gap-1">
                  +{goal.xp_reward} <span className="text-primary">XP</span> | +{goal.coin_reward} <span className="text-amber-500">TOKENS</span>
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                <Target className="w-3 h-3" /> Key Results
              </h4>
              <Dialog open={selectedGoal === goal.id} onOpenChange={(open) => setSelectedGoal(open ? goal.id : null)}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest hover:bg-white/5 text-primary">
                    <Plus className="h-3 w-3 mr-1" /> Anexar KR
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0A0C10] border-white/10 rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-white">Novo Key Result</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Objetivo Mensurável</Label>
                      <Input 
                        value={newKeyResult.title} 
                        onChange={(e) => setNewKeyResult({ ...newKeyResult, title: e.target.value } as typeof newKeyResult)} 
                        placeholder="Ex: Aumentar eficiência em 20%" 
                        className="bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Meta</Label>
                        <Input 
                          type="number" 
                          value={newKeyResult.target_value} 
                          onChange={(e) => setNewKeyResult({ ...newKeyResult, target_value: Number(e.target.value) } as typeof newKeyResult)} 
                          className="bg-white/5 border-white/10 rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unidade</Label>
                        <Input 
                          value={newKeyResult.unit} 
                          onChange={(e) => setNewKeyResult({ ...newKeyResult, unit: e.target.value } as typeof newKeyResult)} 
                          placeholder="%" 
                          className="bg-white/5 border-white/10 rounded-xl"
                        />
                      </div>
                    </div>
                    <Button onClick={() => onAddKeyResult(goal.id)} className="w-full h-12 rounded-xl font-black uppercase tracking-widest">
                      Autorizar Registro
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {goal.key_results && goal.key_results.length > 0 ? (
              <div className="space-y-3">
                {goal.key_results.map((kr: KeyResult) => {
                  const krProgress = (kr.current_value / kr.target_value) * 100;
                  return (
                    <div key={kr.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 group/kr">
                      <div className="flex justify-between items-start gap-3 mb-2">
                        <span className="text-[10px] font-bold text-white uppercase tracking-tight group-hover/kr:text-primary transition-colors truncate">
                          {kr.title}
                        </span>
                        <span className="text-[10px] font-black italic text-slate-400 whitespace-nowrap">
                          {kr.current_value}<span className="text-[8px] mx-0.5 text-slate-600">/</span>{kr.target_value} {kr.unit}
                        </span>
                      </div>
                      <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${krProgress}%` }}
                          className="absolute inset-y-0 left-0 bg-primary/60 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
                <Target className="w-8 h-8 text-slate-700 mb-2 opacity-30" />
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Nenhum Key Result Vinculado</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/5">
            {!isCompleted && (
              <Button 
                variant="outline" 
                className="flex-1 h-12 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-500 font-black uppercase tracking-widest text-[9px] hover:bg-emerald-500 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20" 
                onClick={() => onUpdateGoal({ goalId: goal.id, updates: { status: "completed", progress_percent: 100 } })}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> Finalizar Missão
              </Button>
            )}
            <Button 
              variant="ghost" 
              className="h-12 px-4 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 font-black uppercase tracking-widest text-[8px] transition-all" 
              onClick={() => onDeleteGoal(goal.id)}
            >
              Abortar
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

