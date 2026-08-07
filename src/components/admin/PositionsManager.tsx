import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit, Trash2, Briefcase, ListTodo, Users, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePositions, useCreatePosition, useUpdatePosition, useDeletePosition, useTaskTemplates, useCreateTaskTemplate, useUpdateTaskTemplate, useDeleteTaskTemplate, useUserPositions, useAssignUserPosition, useRemoveUserPosition } from "@/hooks/usePositions";
import { useDepartments } from "@/hooks/useDepartments";
import { useProfiles } from "@/hooks/useProfiles";
import { useAuth } from "@/hooks/useAuth";
import { Position, PositionTaskTemplate } from "@/services/positionsService";
import { PositionFormDialog } from "@/components/positions/PositionFormDialog";
import { TaskTemplateFormDialog } from "@/components/positions/TaskTemplateFormDialog";
import { AssignmentsTab } from "@/components/admin/positions/AssignmentsTab";

export const PositionsManager = () => {
  const { user } = useAuth();
  const { data: positions = [], isLoading: loadingPositions } = usePositions();
  const { data: departments = [] } = useDepartments();
  const { data: taskTemplates = [] } = useTaskTemplates();
  const { data: userPositions = [] } = useUserPositions();
  const { data: profiles = [] } = useProfiles();
  
  const createPosition = useCreatePosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();
  const createTemplate = useCreateTaskTemplate();
  const updateTemplate = useUpdateTaskTemplate();
  const deleteTemplate = useDeleteTaskTemplate();
  const assignPosition = useAssignUserPosition();
  const removeUserPosition = useRemoveUserPosition();
  
  const [activeTab, setActiveTab] = useState("positions");
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<PositionTaskTemplate | null>(null);
  
  // Form states
  const [positionForm, setPositionForm] = useState({ name: "", description: "", department_id: "", level: 1, is_active: true });
  const [templateForm, setTemplateForm] = useState({
    position_id: "", title: "", description: "", frequency: "daily", priority: "medium",
    expected_duration_minutes: 60, xp_reward: 50, coin_reward: 25, xp_penalty_late: 25,
    xp_penalty_rework: 50, deadline_hours: 24, is_active: true
  });
  const [assignForm, setAssignForm] = useState({ user_id: "", position_id: "", is_primary: true });

  const handleSavePosition = async () => {
    if (!positionForm.name) return;
    
    const data = {
      ...positionForm,
      department_id: positionForm.department_id || null
    };
    
    if (editingPosition) {
      await updatePosition.mutateAsync({ id: editingPosition.id, updates: data });
    } else {
      await createPosition.mutateAsync(data);
    }
    
    setIsPositionDialogOpen(false);
    setEditingPosition(null);
    setPositionForm({ name: "", description: "", department_id: "", level: 1, is_active: true });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.title || !templateForm.position_id) return;
    
    const data = {
      ...templateForm,
      created_by: user?.id
    };
    
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.id, updates: data });
    } else {
      await createTemplate.mutateAsync(data);
    }
    
    setIsTemplateDialogOpen(false);
    setEditingTemplate(null);
    setTemplateForm({
      position_id: "", title: "", description: "", frequency: "daily", priority: "medium",
      expected_duration_minutes: 60, xp_reward: 50, coin_reward: 25, xp_penalty_late: 25,
      xp_penalty_rework: 50, deadline_hours: 24, is_active: true
    });
  };

  const handleAssignPosition = async () => {
    if (!assignForm.user_id || !assignForm.position_id) return;
    
    await assignPosition.mutateAsync({ userId: assignForm.user_id, positionId: assignForm.position_id, isPrimary: assignForm.is_primary });
    setIsAssignDialogOpen(false);
    setAssignForm({ user_id: "", position_id: "", is_primary: true });
  };

  const openEditPosition = (position: Position) => {
    setEditingPosition(position);
    setPositionForm({
      name: position.name,
      description: position.description || "",
      department_id: position.department_id || "",
      level: position.level,
      is_active: position.is_active
    });
    setIsPositionDialogOpen(true);
  };

  const openEditTemplate = (template: PositionTaskTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      position_id: template.position_id,
      title: template.title,
      description: template.description || "",
      frequency: template.frequency,
      priority: template.priority,
      expected_duration_minutes: template.expected_duration_minutes || 60,
      xp_reward: template.xp_reward,
      coin_reward: template.coin_reward,
      xp_penalty_late: template.xp_penalty_late,
      xp_penalty_rework: template.xp_penalty_rework,
      deadline_hours: template.deadline_hours || 24,
      is_active: template.is_active
    });
    setIsTemplateDialogOpen(true);
  };

  const priorityColors: Record<string, string> = {
    low: "bg-green-500/20 text-green-400",
    medium: "bg-yellow-500/20 text-yellow-400",
    high: "bg-orange-500/20 text-orange-400",
    critical: "bg-red-500/20 text-red-400"
  };

  const frequencyLabels: Record<string, string> = {
    daily: "Diária",
    weekly: "Semanal",
    monthly: "Mensal"
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Cargos, Funções e Tarefas</CardTitle>
                <CardDescription>
                  Gerencie cargos da empresa e vincule tarefas rotineiras a cada função
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="positions" className="gap-2">
            <Briefcase className="h-4 w-4" />
            Cargos ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2">
            <ListTodo className="h-4 w-4" />
            Tarefas ({taskTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <Users className="h-4 w-4" />
            Vínculos ({userPositions.length})
          </TabsTrigger>
        </TabsList>

        {/* CARGOS TAB */}
        <TabsContent value="positions" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Cargos da Empresa</CardTitle>
                <Button onClick={() => { setEditingPosition(null); setPositionForm({ name: "", description: "", department_id: "", level: 1, is_active: true }); setIsPositionDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Cargo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <AnimatePresence>
                  <div className="space-y-3">
                    {positions.map((position, index) => (
                      <motion.div
                        key={position.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Briefcase className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{position.name}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {position.departments?.name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3" />
                                  {position.departments.name}
                                </span>
                              )}
                              <span>Nível {position.level}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={position.is_active ? "default" : "secondary"}>
                            {position.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                          <Button variant="ghost" size="icon" onClick={() => openEditPosition(position)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deletePosition.mutate(position.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAREFAS TAB */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Tarefas por Cargo</CardTitle>
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => { setEditingTemplate(null); setTemplateForm({ position_id: "", title: "", description: "", frequency: "daily", priority: "medium", expected_duration_minutes: 60, xp_reward: 50, coin_reward: 25, xp_penalty_late: 25, xp_penalty_rework: 50, deadline_hours: 24, is_active: true }); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Tarefa
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingTemplate ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
                      <DialogDescription>Configure a tarefa e suas recompensas/penalidades</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label>Cargo *</Label>
                        <Select value={templateForm.position_id} onValueChange={(v) => setTemplateForm({ ...templateForm, position_id: v })}>
                          <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                          <SelectContent>
                            {positions.map((p) => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label>Título da Tarefa *</Label>
                        <Input value={templateForm.title} onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })} placeholder="Ex: Atualizar pipeline de vendas" />
                      </div>
                      <div className="col-span-2">
                        <Label>Descrição</Label>
                        <Textarea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Detalhes da tarefa..." />
                      </div>
                      <div>
                        <Label>Frequência</Label>
                        <Select value={templateForm.frequency} onValueChange={(v) => setTemplateForm({ ...templateForm, frequency: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Diária</SelectItem>
                            <SelectItem value="weekly">Semanal</SelectItem>
                            <SelectItem value="monthly">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Prioridade</Label>
                        <Select value={templateForm.priority} onValueChange={(v) => setTemplateForm({ ...templateForm, priority: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Baixa</SelectItem>
                            <SelectItem value="medium">Média</SelectItem>
                            <SelectItem value="high">Alta</SelectItem>
                            <SelectItem value="critical">Crítica</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Prazo (horas)</Label>
                        <Input type="number" value={templateForm.deadline_hours} onChange={(e) => setTemplateForm({ ...templateForm, deadline_hours: parseInt(e.target.value) || 24 })} />
                      </div>
                      <div>
                        <Label>Duração Estimada (min)</Label>
                        <Input type="number" value={templateForm.expected_duration_minutes} onChange={(e) => setTemplateForm({ ...templateForm, expected_duration_minutes: parseInt(e.target.value) || 60 })} />
                      </div>
                      <div>
                        <Label>XP Recompensa</Label>
                        <Input type="number" value={templateForm.xp_reward} onChange={(e) => setTemplateForm({ ...templateForm, xp_reward: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Moedas Recompensa</Label>
                        <Input type="number" value={templateForm.coin_reward} onChange={(e) => setTemplateForm({ ...templateForm, coin_reward: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Penalidade Atraso (XP)</Label>
                        <Input type="number" value={templateForm.xp_penalty_late} onChange={(e) => setTemplateForm({ ...templateForm, xp_penalty_late: parseInt(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <Label>Penalidade Retrabalho (XP)</Label>
                        <Input type="number" value={templateForm.xp_penalty_rework} onChange={(e) => setTemplateForm({ ...templateForm, xp_penalty_rework: parseInt(e.target.value) || 0 })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Cancelar</Button>
                      <Button onClick={handleSaveTemplate} disabled={createTemplate.isPending || updateTemplate.isPending}>
                        {editingTemplate ? "Salvar" : "Criar"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {taskTemplates.map((template, index) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <ListTodo className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{template.title}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>{template.positions?.name || "Sem cargo"}</span>
                            <span>•</span>
                            <span>{frequencyLabels[template.frequency]}</span>
                            <Badge className={priorityColors[template.priority]} variant="outline">
                              {template.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-green-400">+{template.xp_reward} XP / +{template.coin_reward} 🪙</p>
                          <p className="text-red-400">-{template.xp_penalty_late} atraso / -{template.xp_penalty_rework} retrab.</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => openEditTemplate(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteTemplate.mutate(template.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <AssignmentsTab
            userPositions={userPositions}
            positions={positions}
            profiles={profiles}
            onAssign={async (data) => {
              await assignPosition.mutateAsync({ userId: data.user_id, positionId: data.position_id, isPrimary: data.is_primary });
            }}
            onRemove={(id) => removeUserPosition.mutate(id)}
            isAssigning={assignPosition.isPending}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
