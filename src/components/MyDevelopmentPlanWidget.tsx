import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  Target,
  Plus,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  useMyDevelopmentPlans,
  useDevelopmentPlan,
  useUpdatePlanAction,
} from "@/hooks/useDevelopmentPlans";
import { ACTION_TYPES, PRIORITY_COLORS } from "@/services/developmentPlanService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Rascunho",
  active: "Ativo",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export function MyDevelopmentPlanWidget() {
  const { data: plans, isLoading } = useMyDevelopmentPlans();
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const activePlans = plans?.filter((p) => p.status === "active") || [];

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activePlans.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Meu Plano de Desenvolvimento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum PDI ativo no momento</p>
            <p className="text-xs mt-1">Seu gestor criará um plano quando necessário</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Meu Plano de Desenvolvimento
            </CardTitle>
            <Badge variant="secondary">{activePlans.length} ativo(s)</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {activePlans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isExpanded={expandedPlan === plan.id}
              onToggle={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PlanCard({
  plan,
  isExpanded,
  onToggle,
}: {
  plan: { id: string; title: string; status: string; start_date: string; target_date: string | null };
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: planDetail } = useDevelopmentPlan(plan.id);
  const updateAction = useUpdatePlanAction();

  const actions = planDetail?.actions || [];
  const completedActions = actions.filter((a) => a.status === "completed").length;
  const progressPercent = actions.length > 0 ? Math.round((completedActions / actions.length) * 100) : 0;

  const toggleActionComplete = (actionId: string, currentStatus: string) => {
    updateAction.mutate({
      id: actionId,
      status: currentStatus === "completed" ? "pending" : "completed",
    });
  };

  return (
    <Collapsible open={isExpanded} onOpenChange={onToggle}>
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer">
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm truncate">{plan.title}</h4>
                  <Badge className={`text-xs ${STATUS_COLORS[plan.status]}`}>
                    {STATUS_LABELS[plan.status]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={progressPercent} className="h-1.5 flex-1" />
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {completedActions}/{actions.length}
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
              {plan.target_date && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                  <Calendar className="w-3 h-3" />
                  Meta: {format(new Date(plan.target_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              )}

              {actions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">
                  Nenhuma ação definida ainda
                </p>
              ) : (
                <AnimatePresence>
                  {actions.map((action) => {
                    const typeInfo = ACTION_TYPES[action.action_type] || ACTION_TYPES.other;
                    const isCompleted = action.status === "completed";

                    return (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 shrink-0"
                          onClick={() => toggleActionComplete(action.id, action.status)}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : action.status === "in_progress" ? (
                            <Clock className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground" />
                          )}
                        </Button>

                        <span className="text-sm">{typeInfo.icon}</span>

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm truncate ${
                              isCompleted ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {action.title}
                          </p>
                        </div>

                        <Badge className={`text-[10px] ${PRIORITY_COLORS[action.priority]}`}>
                          {action.priority}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </CollapsibleContent>
        </CardContent>
      </Card>
    </Collapsible>
  );
}
