import { useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, Filter, Calendar, Target, TrendingUp, TrendingDown, Star, AlertTriangle, Sparkles,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useNineBoxEvaluations, useNineBoxPeriods } from "@/hooks/useNineBox";
import { useProfiles } from "@/hooks/useProfiles";
import { useDepartments } from "@/hooks/useDepartments";
import { BOX_LABELS } from "@/services/nineBoxService";
import { CreateEvaluationForm } from "./ninebox/CreateEvaluationForm";
import { BoxDetailView } from "./ninebox/BoxDetailView";

const BOX_COLORS: Record<number, string> = {
  1: "bg-red-500/20 border-red-500/40 hover:bg-red-500/30",
  2: "bg-orange-400/20 border-orange-400/40 hover:bg-orange-400/30",
  3: "bg-yellow-500/20 border-yellow-500/40 hover:bg-yellow-500/30",
  4: "bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30",
  5: "bg-blue-400/20 border-blue-400/40 hover:bg-blue-400/30",
  6: "bg-green-400/20 border-green-400/40 hover:bg-green-400/30",
  7: "bg-purple-400/20 border-purple-400/40 hover:bg-purple-400/30",
  8: "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30",
  9: "bg-amber-400/20 border-amber-400/40 hover:bg-amber-400/30",
};

const getBoxIcon = (box: number) => {
  switch (box) {
    case 9: return Star;
    case 8: return TrendingUp;
    case 7: return Sparkles;
    case 6: return TrendingUp;
    case 5: return Target;
    case 4: return AlertTriangle;
    case 3: return Target;
    case 2: return TrendingDown;
    case 1: return AlertTriangle;
    default: return Target;
  }
};

export function NineBoxMatrix() {
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedBox, setSelectedBox] = useState<number | null>(null);

  const { data: evaluations } = useNineBoxEvaluations(
    selectedDepartment !== "all" ? selectedDepartment : undefined,
    selectedPeriod || undefined
  );
  const { data: periods } = useNineBoxPeriods();
  const { data: profiles } = useProfiles();
  const { data: departments } = useDepartments();

  const evaluationsByBox: Record<number, typeof evaluations> = {};
  for (let i = 1; i <= 9; i++) {
    evaluationsByBox[i] = evaluations?.filter((e) => e.box_position === i) || [];
  }

  const renderBox = (box: number, row: number, col: number) => {
    const people = evaluationsByBox[box] || [];
    const Icon = getBoxIcon(box);
    const label = BOX_LABELS[box];

    return (
      <motion.div key={box} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: (row * 3 + col) * 0.05 }}
        className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer min-h-[140px] ${BOX_COLORS[box]}`} onClick={() => setSelectedBox(box)}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2"><Icon className="w-4 h-4 text-foreground/70" /><span className="text-xs font-semibold text-foreground/80">{label.name}</span></div>
          <Badge variant="secondary" className="text-xs">{people.length}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mb-2 line-clamp-1">{label.description}</p>
        <div className="flex flex-wrap gap-1">
          {people.slice(0, 5).map((evaluation) => {
             const profile = profiles?.find((p) => p.id === evaluation.user_id);
            return (
              <TooltipProvider key={evaluation.id}>
                <Tooltip>
                  <TooltipTrigger>
                    <Avatar className="w-6 h-6 border-2 border-background">
                      <AvatarImage src={profile?.avatar_url || ""} />
                      <AvatarFallback className="text-[10px]">{profile?.display_name?.charAt(0) || "?"}</AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent><p>{profile?.display_name}</p><p className="text-xs text-muted-foreground">P: {evaluation.performance_score}% | Pot: {evaluation.potential_score}%</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          {people.length > 5 && <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium">+{people.length - 5}</div>}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" />Matriz 9-Box</h2>
          <p className="text-muted-foreground">Avalie desempenho e potencial da sua equipe</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Departamento" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todos</SelectItem>{departments?.map((dept) => <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]"><Calendar className="w-4 h-4 mr-2" /><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent><SelectItem value="">Todos</SelectItem>{periods?.map((period) => <SelectItem key={period} value={period}>{period}</SelectItem>)}</SelectContent>
          </Select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Avaliação</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <CreateEvaluationForm 
                profiles={profiles || []} 
                onClose={() => setShowCreateDialog(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Distribuição de Talentos</CardTitle><CardDescription>{evaluations?.length || 0} avaliações no período selecionado</CardDescription></CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground whitespace-nowrap">POTENCIAL →</div>
            <div className="ml-4">
              <div className="grid grid-cols-3 gap-3">
                {renderBox(7, 0, 0)}{renderBox(8, 0, 1)}{renderBox(9, 0, 2)}
                {renderBox(4, 1, 0)}{renderBox(5, 1, 1)}{renderBox(6, 1, 2)}
                {renderBox(1, 2, 0)}{renderBox(2, 2, 1)}{renderBox(3, 2, 2)}
              </div>
              <div className="text-center mt-4 text-sm font-medium text-muted-foreground">DESEMPENHO →</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 md:grid-cols-5 gap-2">
            {Object.entries(BOX_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center gap-2 text-xs"><div className={`w-3 h-3 rounded ${label.color}`} /><span className="text-muted-foreground truncate">{label.name}</span></div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={selectedBox !== null} onOpenChange={() => setSelectedBox(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedBox && <BoxDetailView box={selectedBox} evaluations={evaluationsByBox[selectedBox] || []} profiles={profiles || []} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
