import { useState, useMemo, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Users, Search, Filter, ChevronLeft, ChevronRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AllSelectItem } from "@/components/ui/all-select-item";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useProfiles } from "@/hooks/useProfiles";
import { useDepartments } from "@/hooks/useDepartments";
import { type AppRole } from "@/hooks/useRBAC";
import { useDebounce } from "@/hooks/useDebounce";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";
import {
  useAllUserRoles, useAssignRole, useRemoveRole, useAssignDepartment,
  useRemoveDepartmentMember, useAllTeamMembers, useBulkAssignRole,
  useBulkRemoveRole, useBulkAssignDepartment, useBulkRemoveFromDepartments,
} from "@/hooks/useAdminUsers";
import {
  roleConfig, AssignRoleDialog, AssignDeptDialog, RemoveRoleConfirm,
  BulkAssignRoleDialog, BulkAssignDeptDialog, BulkRemoveRoleConfirm, BulkRemoveDeptsConfirm,
} from "./users";
import { UserRow } from "./users/UserRow";
import { BulkActionsBar } from "./users/BulkActionsBar";

const ITEMS_PER_PAGE = 10;

export function UsersManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [roleDialogUser, setRoleDialogUser] = useState<string | null>(null);
  const [deptDialogUser, setDeptDialogUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<AppRole>("employee");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [removeRoleConfirm, setRemoveRoleConfirm] = useState<{ userId: string; role: AppRole } | null>(null);
  const [removingDeptMemberId, setRemovingDeptMemberId] = useState<string | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [bulkRoleDialog, setBulkRoleDialog] = useState(false);
  const [bulkDeptDialog, setBulkDeptDialog] = useState(false);
  const [bulkRole, setBulkRole] = useState<AppRole>("employee");
  const [bulkDept, setBulkDept] = useState<string>("");
  const [bulkRemoveRoleConfirm, setBulkRemoveRoleConfirm] = useState<AppRole | null>(null);
  const [bulkRemoveDeptsConfirm, setBulkRemoveDeptsConfirm] = useState(false);

  const { data: profiles, isLoading: profilesLoading } = useProfiles();
  const { data: departments } = useDepartments();
  const { data: allRoles } = useAllUserRoles();
  const { data: allTeamMembers } = useAllTeamMembers();
  const assignRole = useAssignRole();
  const removeRole = useRemoveRole();
  const assignDepartment = useAssignDepartment();
  const removeDepartmentMember = useRemoveDepartmentMember();
  const bulkAssignRole = useBulkAssignRole();
  const bulkRemoveRole = useBulkRemoveRole();
  const bulkAssignDepartment = useBulkAssignDepartment();
  const bulkRemoveFromDepartments = useBulkRemoveFromDepartments();

  const userRolesMap = useMemo(() => {
    const map = new Map<string, AppRole[]>();
    allRoles?.forEach((r) => {
      const existing = map.get(r.user_id) || [];
      existing.push(r.role);
      map.set(r.user_id, existing);
    });
    return map;
  }, [allRoles]);

  const userDeptMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string; isManager: boolean }[]>();
    allTeamMembers?.forEach((tm) => {
      const dept = departments?.find((d) => d.id === tm.department_id);
      if (dept) {
        const existing = map.get(tm.user_id) || [];
        existing.push({ id: tm.id, name: dept.name, isManager: tm.is_manager });
        map.set(tm.user_id, existing);
      }
    });
    return map;
  }, [allTeamMembers, departments]);

  const searchResults = useFuseSearch(profiles || [], ['display_name', 'email'], debouncedSearchQuery, { ...SEARCH_PRESETS.loose, limit: 100 });
  const filteredUsers = searchResults.map(r => r.item).filter((user) => {
    const userRoles = userRolesMap.get(user.id) || [];
    const matchesRole = filterRole === "all" || userRoles.includes(filterRole as AppRole);
    const userDepts = userDeptMap.get(user.id) || [];
    const matchesDept = filterDepartment === "all" || userDepts.some((d) => d.name === filterDepartment);
    return matchesRole && matchesDept;
  });

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleSelectAll = useCallback(() => {
    setSelectedUsers(selectedUsers.length === paginatedUsers.length ? [] : paginatedUsers.map((u) => u.id));
  }, [selectedUsers.length, paginatedUsers]);

  const handleSelectUser = useCallback((userId: string) => {
    setSelectedUsers((prev) => prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]);
  }, []);

  const handleAssignRole = useCallback(async () => {
    if (!roleDialogUser) return;
    try {
      await assignRole.mutateAsync({ userId: roleDialogUser, role: selectedRole });
      toast.success(`Role ${roleConfig[selectedRole].label} atribuído`);
      setRoleDialogUser(null);
    } catch { toast.error("Erro ao atribuir role"); }
  }, [roleDialogUser, selectedRole, assignRole]);

  const handleRemoveRole = useCallback(async () => {
    if (!removeRoleConfirm) return;
    try {
      await removeRole.mutateAsync(removeRoleConfirm);
      toast.success("Role removido");
      setRemoveRoleConfirm(null);
    } catch { toast.error("Erro ao remover role"); }
  }, [removeRoleConfirm, removeRole]);

  const handleAssignDepartment = useCallback(async () => {
    if (!deptDialogUser || !selectedDept) return;
    try {
      await assignDepartment.mutateAsync({ userId: deptDialogUser, departmentId: selectedDept });
      toast.success("Usuário adicionado ao departamento");
      setDeptDialogUser(null);
      setSelectedDept("");
    } catch { toast.error("Erro ao adicionar ao departamento"); }
  }, [deptDialogUser, selectedDept, assignDepartment]);

  const handleRemoveDepartmentMember = useCallback(async (memberId: string) => {
    setRemovingDeptMemberId(memberId);
    try {
      await removeDepartmentMember.mutateAsync(memberId);
      toast.success("Removido do departamento");
    } catch { toast.error("Erro ao remover do departamento"); }
    finally { setRemovingDeptMemberId(null); }
  }, [removeDepartmentMember]);

  if (profilesLoading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (<Skeleton key={i} className="h-16 w-full" />))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou email..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-10" />
            </div>
            <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[150px]"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <AllSelectItem label="Todos os Roles" />
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Gestor</SelectItem>
                <SelectItem value="employee">Colaborador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterDepartment} onValueChange={(v) => { setFilterDepartment(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px]"><Building2 className="w-4 h-4 mr-2" /><SelectValue placeholder="Departamento" /></SelectTrigger>
              <SelectContent>
                <AllSelectItem label="Todos os Deptos" />
                {departments?.map((dept) => (<SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Badge variant="secondary" className="py-2">{filteredUsers.length} usuário{filteredUsers.length !== 1 ? "s" : ""}</Badge>
          </div>
        </CardContent>
      </Card>

      {selectedUsers.length > 0 && (
        <BulkActionsBar
          selectedCount={selectedUsers.length}
          onClear={() => setSelectedUsers([])}
          onBulkAssignRole={() => setBulkRoleDialog(true)}
          onBulkAssignDept={() => setBulkDeptDialog(true)}
          onBulkRemoveRole={(role) => setBulkRemoveRoleConfirm(role)}
          onBulkRemoveDepts={() => setBulkRemoveDeptsConfirm(true)}
          isPendingAssignRole={bulkAssignRole.isPending}
          isPendingAssignDept={bulkAssignDepartment.isPending}
          isPendingRemoveRole={bulkRemoveRole.isPending}
          isPendingRemoveDepts={bulkRemoveFromDepartments.isPending}
        />
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-0">
          <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Usuários</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/30 text-sm font-medium text-muted-foreground">
            <div className="col-span-1 flex items-center">
              <Checkbox checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0} onCheckedChange={handleSelectAll} />
            </div>
            <div className="col-span-3">Usuário</div>
            <div className="col-span-2">Roles</div>
            <div className="col-span-2">Departamentos</div>
            <div className="col-span-2">Stats</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>
          <AnimatePresence mode="popLayout">
            {paginatedUsers.map((user, index) => {
              const userToRow = {
                id: user.id,
                display_name: user.display_name,
                email: (user as any).email || "",
                avatar_url: user.avatar_url,
                level: user.level,
                streak: (user as any).streak || 0,
                coins: user.coins
              };
              return (
                <UserRow
                  key={user.id}
                  user={userToRow}
                  index={index}
                  isSelected={selectedUsers.includes(user.id)}
                  onSelect={handleSelectUser}
                  userRoles={userRolesMap.get(user.id) || []}
                  userDepts={userDeptMap.get(user.id) || []}
                  onAssignRole={(id) => { setRoleDialogUser(id); setSelectedRole("employee"); }}
                  onAssignDept={(id) => { setDeptDialogUser(id); setSelectedDept(""); }}
                  onRemoveRole={(userId, role) => setRemoveRoleConfirm({ userId, role })}
                  onRemoveDeptMember={handleRemoveDepartmentMember}
                  removingDeptMemberId={removingDeptMemberId}
                />
              );
            })}
          </AnimatePresence>
          {paginatedUsers.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum usuário encontrado</p>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Página {currentPage} de {totalPages}</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <AssignRoleDialog open={!!roleDialogUser} onClose={() => setRoleDialogUser(null)} selectedRole={selectedRole} onRoleChange={setSelectedRole} onAssign={handleAssignRole} isPending={assignRole.isPending} />
      <AssignDeptDialog open={!!deptDialogUser} onClose={() => setDeptDialogUser(null)} selectedDept={selectedDept} onDeptChange={setSelectedDept} departments={departments || []} onAssign={handleAssignDepartment} isPending={assignDepartment.isPending} />
      <RemoveRoleConfirm open={!!removeRoleConfirm} onClose={() => setRemoveRoleConfirm(null)} role={removeRoleConfirm?.role || null} onConfirm={handleRemoveRole} />
      <BulkAssignRoleDialog open={bulkRoleDialog} onClose={() => setBulkRoleDialog(false)} selectedCount={selectedUsers.length} role={bulkRole} onRoleChange={setBulkRole} onAssign={async () => { try { const result = await bulkAssignRole.mutateAsync({ userIds: selectedUsers, role: bulkRole }); toast.success(`Role atribuído para ${result.successful} usuário(s)`); setBulkRoleDialog(false); setSelectedUsers([]); } catch { toast.error("Erro ao atribuir roles"); } }} isPending={bulkAssignRole.isPending} />
      <BulkAssignDeptDialog open={bulkDeptDialog} onClose={() => setBulkDeptDialog(false)} selectedCount={selectedUsers.length} dept={bulkDept} onDeptChange={setBulkDept} departments={departments || []} onAssign={async () => { try { const result = await bulkAssignDepartment.mutateAsync({ userIds: selectedUsers, departmentId: bulkDept }); toast.success(`${result.successful} usuário(s) adicionado(s) ao departamento`); setBulkDeptDialog(false); setBulkDept(""); setSelectedUsers([]); } catch { toast.error("Erro ao adicionar ao departamento"); } }} isPending={bulkAssignDepartment.isPending} />
      <BulkRemoveRoleConfirm open={!!bulkRemoveRoleConfirm} onClose={() => setBulkRemoveRoleConfirm(null)} role={bulkRemoveRoleConfirm} selectedCount={selectedUsers.length} onConfirm={async () => { if (!bulkRemoveRoleConfirm) return; try { const result = await bulkRemoveRole.mutateAsync({ userIds: selectedUsers, role: bulkRemoveRoleConfirm }); toast.success(`Role removido de ${result.successful} usuário(s)`); setBulkRemoveRoleConfirm(null); setSelectedUsers([]); } catch { toast.error("Erro ao remover roles"); } }} />
      <BulkRemoveDeptsConfirm open={bulkRemoveDeptsConfirm} onClose={setBulkRemoveDeptsConfirm} selectedCount={selectedUsers.length} onConfirm={async () => { try { const result = await bulkRemoveFromDepartments.mutateAsync(selectedUsers); toast.success(`${result.successful} usuário(s) removido(s) dos departamentos`); setBulkRemoveDeptsConfirm(false); setSelectedUsers([]); } catch { toast.error("Erro ao remover dos departamentos"); } }} />
    </div>
  );
}
