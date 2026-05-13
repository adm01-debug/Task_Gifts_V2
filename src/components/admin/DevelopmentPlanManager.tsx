import { useState, useMemo } from "react";
import type { DevelopmentPlan } from "@/services/developmentPlanService";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText, Plus, Search, Filter, ChevronDown, ChevronRight,
  Clock, CheckCircle2, MoreVertical, Trash2, Eye, Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useDevelopmentPlans } from "@/hooks/useDevelopmentPlans";
import { useDeleteDevelopmentPlan } from "@/hooks/useDevelopmentPlans";
import { useProfiles } from "@/hooks/useProfiles";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
import { format } from "date-fns";
import { CreatePlanForm } from "./pdi/CreatePlanForm";
import { PlanDetailView, PlanDetailInline, STATUS_COLORS, STATUS_LABELS } from "./pdi/PlanDetailView";

export function DevelopmentPlanManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());

  const { data: plans, isLoading } = useDevelopmentPlans(undefined, statusFilter !== "all" ? statusFilter : undefined);
  const { data: profiles } = useProfiles();
  const deletePlan = useDeleteDevelopmentPlan();

  const searchableItems = useMemo(() => {
    return (plans || []).map(plan => {
      const profile = profiles?.find(p => p.id === plan.user_id);
      return { ...plan, _searchName: profile?.display_name || '', _searchEmail: (profile as any)?.email || '' };
    });
  }, [plans, profiles]);

  const searchResults = useFuseSearch(searchableItems, ['title', '_searchName', '_searchEmail'], searchQuery, { ...SEARCH_PRESETS.content, limit: 50 });
  const filteredPlans = searchResults.map(r => r.item);

  const toggleExpand = (planId: string) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) newExpanded.delete(planId);
    else newExpanded.add(planId);
    setExpandedPlans(newExpanded);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6 text-primary" />Planos de Desenvolvimento Individual (PDI)</h2>
          <p className="text-muted-foreground">Gerencie os planos de desenvolvimento dos colaboradores</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar planos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[200px]" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Novo PDI</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <CreatePlanForm 
                profiles={(profiles || []) as any} 
                onClose={() => setShowCreateDialog(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total de PDIs", value: plans?.length || 0, color: "#6366f1", icon: FileText },
          { label: "Ativos", value: plans?.filter((p) => p.status === "active").length || 0, color: "#3b82f6", icon: Clock },
          { label: "Concluídos", value: plans?.filter((p) => p.status === "completed").length || 0, color: "#10b981", icon: CheckCircle2 },
          { label: "Colaboradores", value: new Set(plans?.map((p) => p.user_id)).size, color: "#8b5cf6", icon: Users },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}><stat.icon className="w-4 h-4" style={{ color: stat.color }} /></div>
                  <div><p className="text-2xl font-bold">{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planos de Desenvolvimento</CardTitle>
          <CardDescription>{filteredPlans?.length || 0} planos encontrados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : filteredPlans?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum plano encontrado</div>
          ) : (
            <AnimatePresence>
              {filteredPlans?.map((plan, index) => {
                const profile = profiles?.find((p) => p.id === plan.user_id);
                const isExpanded = expandedPlans.has(plan.id);
                return (
                  <motion.div key={plan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: index * 0.02 }}>
                    <Collapsible open={isExpanded} onOpenChange={() => toggleExpand(plan.id)}>
                      <Card className="border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0">{isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</Button>
                            </CollapsibleTrigger>
                            <Avatar className="w-10 h-10"><AvatarImage src={profile?.avatar_url || ""} /><AvatarFallback>{profile?.display_name?.charAt(0)}</AvatarFallback></Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2"><h4 className="font-semibold truncate">{plan.title}</h4><Badge className={STATUS_COLORS[plan.status]}>{STATUS_LABELS[plan.status]}</Badge></div>
                              <p className="text-sm text-muted-foreground">{profile?.display_name} • Início: {format(new Date(plan.start_date), "dd/MM/yyyy")}{plan.target_date && ` • Meta: ${format(new Date(plan.target_date), "dd/MM/yyyy")}`}</p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedPlan(plan.id)}><Eye className="w-4 h-4 mr-2" />Ver Detalhes</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deletePlan.mutate(plan.id)}><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CollapsibleContent><PlanDetailInline planId={plan.id} /></CollapsibleContent>
                        </CardContent>
                      </Card>
                    </Collapsible>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </CardContent>
      </Card>

      <Dialog open={selectedPlan !== null} onOpenChange={() => setSelectedPlan(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedPlan && <PlanDetailView planId={selectedPlan} profiles={profiles || []} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
