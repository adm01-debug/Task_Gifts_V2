import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { rbacService } from "@/services/rbacService";
import type { AppRole } from "@/hooks/useRBAC";
import { useFuseSearch, SEARCH_PRESETS } from "@/hooks/useFuseSearch";

interface UserWithRoles {
  id: string;
  display_name: string | null;
  email: string | null;
  user_roles: Array<{ id: string; role: AppRole; created_at: string }>;
}

export function UserRolesTab({ searchTerm }: { searchTerm: string }) {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading: usersLoading } = useQuery<UserWithRoles[]>({
    queryKey: ["rbac-users-with-roles"],
    queryFn: () => rbacService.getUsersWithRoles() as Promise<UserWithRoles[]>,
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => rbacService.assignRoleToUser(userId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rbac-users-with-roles"] }); toast.success("Role atribuída!"); },
    onError: () => toast.error("Erro ao atribuir role"),
  });

  const removeMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AppRole }) => rbacService.removeRoleFromUser(userId, role),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["rbac-users-with-roles"] }); toast.success("Role removida!"); },
    onError: () => toast.error("Erro ao remover role"),
  });

  const searchResults = useFuseSearch(users, ['display_name', 'email'], searchTerm, { ...SEARCH_PRESETS.loose, limit: 50 });
  const filteredUsers = searchResults.map(r => r.item);

  if (usersLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuários e Roles</CardTitle>
        <CardDescription>Gerencie as roles atribuídas a cada usuário</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Usuário</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filteredUsers.map((user) => {
              interface UserRoleItem { role: string }
              const userRoles = user.user_roles?.map((r: UserRoleItem) => r.role) || [];
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-medium"><div className="flex items-center gap-2"><UserCog className="h-4 w-4 text-muted-foreground" />{user.display_name || "Sem nome"}</div></TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {userRoles.length > 0 ? userRoles.map((role: string) => (
                        <Badge key={role} variant={role === "admin" ? "default" : "secondary"} className="cursor-pointer" onClick={() => removeMutation.mutate({ userId: user.id, role: role as AppRole })}>
                          {role}<X className="h-3 w-3 ml-1" />
                        </Badge>
                      )) : <span className="text-xs text-muted-foreground">Sem roles</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Select onValueChange={(role) => assignMutation.mutate({ userId: user.id, role: role as AppRole })}>
                      <SelectTrigger className="w-[140px]"><SelectValue placeholder="Adicionar..." /></SelectTrigger>
                      <SelectContent>
                        {(["admin", "manager", "employee"] as AppRole[]).filter(role => !userRoles.includes(role)).map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
