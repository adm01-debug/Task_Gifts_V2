import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Plus, Pencil, Trash2, Users, ChevronDown, ChevronUp, Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/useDepartments";
import { useProfiles } from "@/hooks/useProfiles";
import { useAllTeamMembers, useAssignDepartment, useRemoveDepartmentMember, useSetDepartmentManager } from "@/hooks/useAdminUsers";
import type { Department } from "@/services/departmentsService";
import { DepartmentMembersList } from "./departments/DepartmentMembersList";
import { DepartmentFormDialog, DeleteConfirmDialog, AddMemberDialog } from "./departments/DepartmentDialogs";

interface DepartmentFormData {
  name: string;
  description: string;
  color: string;
}

const emptyForm: DepartmentFormData = { name: "", description: "", color: "#6366f1" };

export function DepartmentsManager() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Department | null>(null);
  const [formData, setFormData] = useState<DepartmentFormData>(emptyForm);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [addMemberDialog, setAddMemberDialog] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [removingMemberIds, setRemovingMemberIds] = useState<Set<string>>(new Set());
  const [togglingManagerIds, setTogglingManagerIds] = useState<Set<string>>(new Set());

  const { data: departments, isLoading } = useDepartments();
  const { data: profiles } = useProfiles();
  const { data: allTeamMembers } = useAllTeamMembers();
  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();
  const assignDepartment = useAssignDepartment();
  const removeMember = useRemoveDepartmentMember();
  const setManager = useSetDepartmentManager();

  const deptMembersMap = useMemo(() => {
    const map = new Map<string, Array<{ memberId: string; userId: string; isManager: boolean; profile: { id: string; display_name: string | null; email: string | null; level: number; xp: number; avatar_url?: string | null } | undefined }>>();
    allTeamMembers?.forEach((tm) => {
      const profile = profiles?.find((p) => p.id === tm.user_id);
      const existing = map.get(tm.department_id) || [];
      existing.push({ memberId: tm.id, userId: tm.user_id, isManager: tm.is_manager, profile });
      map.set(tm.department_id, existing);
    });
    return map;
  }, [allTeamMembers, profiles]);

  const handleCreate = () => { setEditingDept(null); setFormData(emptyForm); setDialogOpen(true); };
  const handleEdit = (dept: Department) => { setEditingDept(dept); setFormData({ name: dept.name, description: dept.description || "", color: dept.color || "#6366f1" }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error("Nome é obrigatório"); return; }
    try {
      if (editingDept) { await updateDept.mutateAsync({ id: editingDept.id, updates: formData }); toast.success("Departamento atualizado"); }
      else { await createDept.mutateAsync(formData); toast.success("Departamento criado"); }
      setDialogOpen(false);
    } catch { toast.error("Erro ao salvar departamento"); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try { await deleteDept.mutateAsync(deleteConfirm.id); toast.success("Departamento excluído"); setDeleteConfirm(null); }
    catch { toast.error("Erro ao excluir departamento"); }
  };

  const toggleExpanded = (deptId: string) => {
    setExpandedDepts((prev) => { const next = new Set(prev); if (next.has(deptId)) next.delete(deptId); else next.add(deptId); return next; });
  };

  const handleAddMember = async () => {
    if (!addMemberDialog || !selectedUserId) return;
    try { await assignDepartment.mutateAsync({ userId: selectedUserId, departmentId: addMemberDialog }); toast.success("Membro adicionado"); setAddMemberDialog(null); setSelectedUserId(""); }
    catch { toast.error("Erro ao adicionar membro"); }
  };

  const handleRemoveMember = useCallback(async (memberId: string) => {
    setRemovingMemberIds(prev => new Set(prev).add(memberId));
    try { await removeMember.mutateAsync(memberId); toast.success("Membro removido"); }
    catch { toast.error("Erro ao remover membro"); }
    finally { setRemovingMemberIds(prev => { const next = new Set(prev); next.delete(memberId); return next; }); }
  }, [removeMember]);

  const handleToggleManager = useCallback(async (memberId: string, isCurrentlyManager: boolean) => {
    setTogglingManagerIds(prev => new Set(prev).add(memberId));
    try { await setManager.mutateAsync({ memberId, isManager: !isCurrentlyManager }); toast.success(isCurrentlyManager ? "Gestor removido" : "Gestor definido"); }
    catch { toast.error("Erro ao atualizar gestor"); }
    finally { setTogglingManagerIds(prev => { const next = new Set(prev); next.delete(memberId); return next; }); }
  }, [setManager]);

  const getAvailableUsers = (deptId: string) => {
    const deptMembers = deptMembersMap.get(deptId) || [];
    const memberUserIds = new Set(deptMembers.map((m) => m.userId));
    return profiles?.filter((p) => !memberUserIds.has(p.id)) || [];
  };

  if (isLoading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Departamentos</h2>
          <Badge variant="secondary">{departments?.length || 0}</Badge>
        </div>
        <Button onClick={handleCreate} className="gap-2"><Plus className="w-4 h-4" />Novo Departamento</Button>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {departments?.map((dept, index) => {
            const members = deptMembersMap.get(dept.id) || [];
            const managers = members.filter((m) => m.isManager);
            const isExpanded = expandedDepts.has(dept.id);

            return (
              <motion.div key={dept.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ delay: index * 0.03 }}>
                <Card className="border-l-4 overflow-hidden" style={{ borderLeftColor: dept.color || "#6366f1" }}>
                  <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(dept.id)}>
                    <CollapsibleTrigger asChild>
                      <CardContent className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${dept.color || "#6366f1"}20` }}>
                              <Building2 className="w-5 h-5" style={{ color: dept.color || "#6366f1" }} />
                            </div>
                            <div>
                              <h3 className="font-semibold">{dept.name}</h3>
                              {dept.description && <p className="text-sm text-muted-foreground line-clamp-1">{dept.description}</p>}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">{members.length}</span></div>
                            {managers.length > 0 && <Badge variant="outline" className="text-xs gap-1"><Crown className="w-3 h-3 text-amber-500" />{managers.length} gestor{managers.length > 1 ? "es" : ""}</Badge>}
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(dept); }}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(dept); }} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                              {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <DepartmentMembersList
                        members={members}
                        onAddMember={() => setAddMemberDialog(dept.id)}
                        onRemoveMember={handleRemoveMember}
                        onToggleManager={handleToggleManager}
                        removingMemberIds={removingMemberIds}
                        togglingManagerIds={togglingManagerIds}
                      />
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {departments?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">Nenhum departamento cadastrado</p>
              <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2"><Plus className="w-4 h-4" />Criar primeiro departamento</Button>
            </CardContent>
          </Card>
        )}
      </div>

      <DepartmentFormDialog open={dialogOpen} onOpenChange={setDialogOpen} editingDept={editingDept} formData={formData} setFormData={setFormData} onSave={handleSave} isSaving={createDept.isPending || updateDept.isPending} />
      <DeleteConfirmDialog department={deleteConfirm} onClose={() => setDeleteConfirm(null)} onDelete={handleDelete} />
      <AddMemberDialog open={!!addMemberDialog} onClose={() => setAddMemberDialog(null)} selectedUserId={selectedUserId} setSelectedUserId={setSelectedUserId} availableUsers={addMemberDialog ? getAvailableUsers(addMemberDialog) : []} onAdd={handleAddMember} isAdding={assignDepartment.isPending} />
    </div>
  );
}
