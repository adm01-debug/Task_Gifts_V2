import { useState } from "react";
import { Plus, Trash2, Circle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  useDevelopmentPlan,
  useUpdateDevelopmentPlan,
  useCreatePlanAction,
  useUpdatePlanAction,
  useDeletePlanAction,
  useCompetencies,
} from "@/hooks/useDevelopmentPlans";
import { ACTION_TYPES, PRIORITY_COLORS } from "@/services/developmentPlanService";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-blue-100 text-blue-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const ACTION_STATUS_ICONS: Record<string, React.ElementType> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export { STATUS_COLORS, STATUS_LABELS, ACTION_STATUS_ICONS };

interface PlanDetailViewProps {
  planId: string;
  profiles: { id: string; display_name: string | null; avatar_url: string | null }[];
}

export function PlanDetailView({ planId, profiles }: PlanDetailViewProps) {
  const { data: plan, isLoading } = useDevelopmentPlan(planId);
  const updatePlan = useUpdateDevelopmentPlan();

  if (isLoading || !plan) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const profile = profiles.find((p) => p.id === plan.user_id);
  const completedActions = plan.actions?.filter((a) => a.status === "completed").length || 0;
  const totalActions = plan.actions?.length || 0;
  const progressPercent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{plan.title}</DialogTitle>
        <DialogDescription>PDI de {profile?.display_name}</DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-6">
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-12 h-12">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progresso Geral</span>
                  <span className="text-sm text-muted-foreground">{completedActions}/{totalActions} ações</span>
                </div>
                <Progress value={progressPercent} />
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{progressPercent}%</p>
                <Badge className={STATUS_COLORS[plan.status]}>{STATUS_LABELS[plan.status]}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <Label className="min-w-fit">Status:</Label>
          <Select
            value={plan.status}
            onValueChange={(status) => updatePlan.mutate({ id: planId, status: status as "draft" | "active" | "completed" | "cancelled" })}
          >
            <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PlanDetailInline planId={planId} />
      </div>
    </>
  );
}

export function PlanDetailInline({ planId }: { planId: string }) {
  const { data: plan, isLoading } = useDevelopmentPlan(planId);
  const [showAddAction, setShowAddAction] = useState(false);
  const createAction = useCreatePlanAction();
  const updateAction = useUpdatePlanAction();
  const deleteAction = useDeletePlanAction();

  const [newAction, setNewAction] = useState({
    title: "", description: "", action_type: "learning", priority: "medium", due_date: "",
  });

  const handleAddAction = async () => {
    if (!newAction.title) return;
    await createAction.mutateAsync({
      plan_id: planId,
      title: newAction.title,
      description: newAction.description || undefined,
      action_type: newAction.action_type,
      priority: newAction.priority,
      due_date: newAction.due_date || undefined,
    });
    setNewAction({ title: "", description: "", action_type: "learning", priority: "medium", due_date: "" });
    setShowAddAction(false);
  };

  if (isLoading) return <div className="mt-4 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-4">
      {plan?.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}

      <div className="flex items-center justify-between">
        <h5 className="font-medium text-sm">Ações ({plan?.actions?.length || 0})</h5>
        <Button size="sm" variant="outline" onClick={() => setShowAddAction(!showAddAction)}>
          <Plus className="w-3 h-3 mr-1" />Ação
        </Button>
      </div>

      {showAddAction && (
        <Card className="p-3 bg-muted/30">
          <div className="space-y-3">
            <Input placeholder="Título da ação..." value={newAction.title} onChange={(e) => setNewAction({ ...newAction, title: e.target.value })} />
            <div className="grid grid-cols-3 gap-2">
              <Select value={newAction.action_type} onValueChange={(v) => setNewAction({ ...newAction, action_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ACTION_TYPES).map(([key, { label, icon }]) => (
                    <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newAction.priority} onValueChange={(v) => setNewAction({ ...newAction, priority: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
              <Input type="date" value={newAction.due_date} onChange={(e) => setNewAction({ ...newAction, due_date: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setShowAddAction(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleAddAction} disabled={!newAction.title}>Adicionar</Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {plan?.actions?.map((action) => {
          const StatusIcon = ACTION_STATUS_ICONS[action.status];
          const typeInfo = ACTION_TYPES[action.action_type] || ACTION_TYPES.other;

          return (
            <div key={action.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group">
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0"
                onClick={() => updateAction.mutate({ id: action.id, status: action.status === "completed" ? "pending" : "completed" })}>
                <StatusIcon className={`w-4 h-4 ${action.status === "completed" ? "text-green-500" : "text-muted-foreground"}`} />
              </Button>
              <span className="text-sm">{typeInfo.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${action.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{action.title}</p>
                {action.due_date && <p className="text-xs text-muted-foreground">{format(new Date(action.due_date), "dd/MM/yyyy")}</p>}
              </div>
              <Badge className={`text-xs ${PRIORITY_COLORS[action.priority]}`}>{action.priority}</Badge>
              <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteAction.mutate(action.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
